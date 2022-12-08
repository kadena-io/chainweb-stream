import { validateDefined, validateType } from './utils.js';
import ChainwebCutService from './chainweb-cut.js';
import { syncEventsFromChainwebData } from './chainweb-data.js';
import { config } from '../../config/index.js';
import {
  getRedisUnconfirmedEvents,
  getRedisConfirmedEvents,
  getRedisOrphanedEvents,
} from './redis/index.js';

const CONFIRMATION_HEIGHT = 6; // TODO in config
const DATA_STEP_INTERVAL = 15_000; // TODO in config
const SERVICE_STEP_INTERVAL = 30_000;

const CLASS_NAME = 'ChainwebEventService'

const EVENT_TYPES = ['confirmed', 'unconfirmed', 'orphaned'];

const { moduleHashBlacklist } = config;

function validateEventType(eventType) {
  if (!EVENT_TYPES.includes(eventType)) {
    throw new Error(`Expected one of [${EVENT_TYPES.join(', ')}] but received ${eventType}`);
  }
}

function eventTypeToCallbackSet(eventType) {
  validateEventType(eventType);
  return `_${eventType}Callbacks`;
}


function heightSorter(a, b) {
  // sort high to low heights
  return a.height < b.height ? 1 : -1;
}

function presentEvents(sources, options) {
  const { minHeight, maxHeight, limit } = options;

  const filterPredicates = [];
  if (minHeight) {
    filterPredicates.push(event => event.height >= minHeight);
  }
  if (maxHeight) {
    filterPredicates.push(event => event.height <= maxHeight);
  }

  const output = sources.reduce((out, arr) => {
    if (filterPredicates.length) {
      arr = arr.filter(event => filterPredicates.every(pred => pred(event)));
    }
    return out.concat(arr);
  }, []);

  if (options.sort) {
    output.sort(heightSorter);
  }
  return options.limit ? output.slice(0, limit) : output;
}

export default class ChainwebEventService {
  // events: unconfirmed, confirmed, orphaned
  unconfirmed = []
  confirmed = []
  orphaned = []

  running = false    // running state
  lastUpdateTime;

  _filter = null      // chainweb-data filter for this service, e.g "marmalade." or "coin."
  _minHeight = null  // initial min height setting
  _lastHeight = null  // last seen height

  _cut                // ChainwebCut service

  // callbacks for: confirmed/unconfirmed/orphaned events
  _confirmedCallbacks = new Set()
  _unconfirmedCallbacks = new Set()
  _orphanedCallbacks = new Set()

  constructor({ filter, minHeight, cut }) {
    validateType(CLASS_NAME, 'filter', filter, 'string');
    this._filter = filter;

    if (minHeight) {
      validateType(CLASS_NAME, 'minHeight', minHeight, 'number');
      this._minHeight = minHeight;
    }
    this._lastHeight = minHeight ? Math.max(0, minHeight - 1) : 0;

    if (cut) {
      validateInstanceOf(CLASS_NAME, 'cut', cut, ChainwebCutService);
      this._cut = cut;
    } else {
      this._cut = new ChainwebCutService();
    }
  }

  registerConfirmedCallback(callback) {
    return this._on('confirmed', callback);
  }

  unregisterConfirmedCallback(callback) {
    return this._off('confirmed', callback);
  }

  registerUnconfirmedCallback(callback) {
    return this._on('unconfirmed', callback);
  }

  unregisterUnconfirmedCallback(callback) {
    return this._off('unconfirmed', callback);
  }

  registerOrphanedCallback(callback) {
    return this._on('orphaned', callback);
  }

  unregisterOrphanedCallback(callback) {
    return this._off('orphaned', callback);
  }

  getAllEvents({ minHeight, maxHeight, limit } = {}) {
    return presentEvents(
      [this.unconfirmed, this.confirmed, this.orphaned],
      { minHeight, maxHeight, limit, sort: true },
    );
  }

  getConfirmedEvents({ minHeight, maxHeight, limit } = {}) {
    return presentEvents(
      [this.confirmed],
      { minHeight, maxHeight, limit, sort: false },
    );
  }

  getOrphanedEvents({ minHeight, maxHeight, limit } = {}) {
    return presentEvents(
      [this.orphaned],
      { minHeight, maxHeight, limit, sort: false },
    );
  }

  async start() {
    await this._loadState();
    this.running = true;
    this._cut.registerUpdateCallback(this._blockStep);
    if (!this._cut.running) {
      await this._cut.start();
    }
    try {
      await this._step();
    } catch(e) {
      console.error(e);
    }
    setTimeout(this._step, DATA_STEP_INTERVAL);
  }

  stop() {
    this.running = false;
    if (this._cut) {
      this._cut.unregisterUpdateCallback(this._blockStep);
    }
  }

  /*
   *  Fetch previous state from redis
   */
  async _loadState() {
    const [
      unconfirmed,
      confirmed,
      orphaned,
    ] = await Promise.all([
      getRedisConfirmedEvents(this._filter),
      getRedisUnconfirmedEvents(this._filter),
      getRedisOrphanedEvents(this._filter),
    ]);
    this.unconfirmed = unconfirmed ?? [];
    this.confirmed = confirmed ?? [];
    this.orphaned = orphaned ?? [];
  }

  _step = async () => {
    if (!this.running) {
      return;
    }
    try {
      const events = await syncEventsFromChainwebData({
        filter: this._filter,
        limit: 100,
        threads: 4,
        newestToOldest: true,
        moduleHashBlacklist,
      });
      this.lastUpdateTime = Date.now();
      for(const event of events) {
        await this._add(event);
      }
    } catch(e) {
      console.error(e);
    } finally {
      setTimeout(this._step, SERVICE_STEP_INTERVAL)
    }
  }

  _blockStep = async () => {
    if (this.unconfirmed.length) {
      for(const event of this.unconfirmed) {
        const classification = await this._classifyEvent(event);
        if (classification !== 'unconfirmed') {
          const uncIdx = this.unconfirmed.indexOf(event);
          this.unconfirmed.splice(uncIdx, 1);
          this._add(event);
        }
      }
    }
  }

  async _add(event) {
    const classification = await this._classifyEvent(event);
    validateEventType(classification);
    if (this[classification].includes(event)) {
      console.warn('Event already in ${classification}, not notifying');
      return
    }
    this[classification].push(event) // should we unshift instead? what is the preferable order
    // call callbacks
    const callbackSet = eventTypeToCallbackSet(classification);
    this._executeCallbacks(this[callbackSet], event);
  }

/*
 *  _classifyEvent(event) -> UNCONFIRMED | CONFIRMED | ORPHANED
 *    -> inspect event.height vs this.cut[chain].height vs CONFIRMATION_HEIGHT
 *      -> confirmationHeightPassed ? checkOrphaned
 *        -> UNCONFIRMED
 *        -> CONFIRMED
 *        -> ORPHANED
 *
 */

  async _classifyEvent(event) {
    const { height, chain, blockHash } = event;
    const lastChainHeight = this._cut.lastCut.hashes[chain];
    if (lastChainHeight - height < CONFIRMATION_HEIGHT) {
      return 'unconfirmed';
    }
    return 'confirmed'; // TODO
    // check orphaned
    // return confirmed
  }

  _on(type, callback) {
    validateType(CLASS_NAME, 'callback', callback, 'function');
    const set = eventTypeToCallbackSet(type);
    this[set].add(callback);
  }

  _off(type, callback) {
    validateType(CLASS_NAME, 'callback', callback, 'function');
    const set = eventTypeToCallbackSet(type);
    this[set].delete(callback);
  }

  async _executeCallbacks(callbackSet, data) {
    for(const callback of callbackSet) {
      try {
        const res = callback(data);
        if (res?.then) {
          // TODO if the promise never resolves we get stuck here
          // await with timeout? 
          // or not await at all?
          await res; 
        }
      } catch(e) {
        console.warn(`${CLASS_NAME} updateCallback error: ${e.message}`);
      }
    }
  }
}
