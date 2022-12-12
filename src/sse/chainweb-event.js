import Logger from './logger.js';
import {
  validateDefined,
  validateType,
  validateBlockPermanence,
} from './types.js';
import ChainwebCutService from './chainweb-cut.js';
import { syncEventsFromChainwebData } from './chainweb-data.js';
import { config } from '../../config/index.js';
import {
  getRedisUnconfirmedEvents,
  getRedisConfirmedEvents,
  getRedisOrphanedEvents,
  setRedisUnconfirmedEvents,
  setRedisConfirmedEvents,
  setRedisOrphanedEvents,
} from './redis/index.js';

const CLASS_NAME = 'ChainwebEventService'

const {
  moduleHashBlacklist,
  confirmationHeight: CONFIRMATION_HEIGHT,
  eventsStepInterval: EVENTS_STEP_INTERVAL,
} = config;

function blockPermanenceToCallbackSet(blockPermanence) {
  validateBlockPermanence(blockPermanence);
  return `_${blockPermanence}Callbacks`;
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
    this.logger = new Logger('EventService', filter);

    validateType(CLASS_NAME, 'filter', filter, 'string');
    this._filter = filter;

    if (minHeight) {
      validateType(CLASS_NAME, 'minHeight', minHeight, 'number');
      this._minHeight = minHeight;
    }
    this._lastHeight = minHeight ? Math.max(0, minHeight - 1) : 0;

    this.logger.verbose(`Started with lastHeight=${this._lastHeight} and${!cut?' no ':' '}Cut Service`);
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
      this.logger.error(e);
    }
    setTimeout(this._step, EVENTS_STEP_INTERVAL);
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
    this._calcLastHeight();
    // TODO lastHeight improve?
    this.logger.info(`Loaded state lastHeight=${this._lastHeight} confirmed=${confirmed.length} unconfirmed=${unconfirmed.length} orphaned=${orphaned.length}`);
  }

  /*
   * Update lastHeight
   */
  async _calcLastHeight() {
    // TODO IMPORTANT there is an edge case here where
    // if chain=8 is +2 blocks ahead of chain=3
    // we get an unconfirmed event from chain=8 and set lastHeight + 1
    // we never see an event from chain=3 at lastHeight-1 or lastHeight
    // maybe check lastHeight against confirmation height or Cut to see if we can move forward
    // but that isn't a guarrantee that cw-data has actually caught up to that state
    // we could always store lastSeenEvent - 2 as the lastHeight and de-dupe
    const lastEvent = this.unconfirmed[0] ?? this.confirmed[0] ?? this.orphaned[0];
    if (lastEvent) {
      this._lastHeight = lastEvent.height + 1;
    }
  }

  /*
   *  Save state to redis
   */
  async _saveState() {
    await Promise.all([
      setRedisConfirmedEvents(this._filter, this.confirmed),
      setRedisUnconfirmedEvents(this._filter, this.unconfirmed),
      setRedisOrphanedEvents(this._filter, this.orphaned),
    ]);
    this.logger.info(`Saved state lastHeight=${this._lastHeight} confirmed=${this.confirmed.length} unconfirmed=${this.unconfirmed.length} orphaned=${this.orphaned.length}`);
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
        minHeight: this._lastHeight,
      }, this.logger);
      this.lastUpdateTime = Date.now();
      for(const event of events) {
        await this._add(event);
      }
      if (events.length) {
        this._calcLastHeight();
        await this._saveState();
      }
    } catch(e) {
      this.logger.error(e);
    } finally {
      setTimeout(this._step, EVENTS_STEP_INTERVAL)
    }
  }
  
  _eventExists(needle, collection) {
    if (!collection) {
      return this._eventExists(needle, this.unconfirmed) ||
        this._eventExists(needle, this.confirmed) ||
        this._eventExists(needle, this.orphaned);
    }
    const { height, requestKey, blockHash } = needle;
    let needleJson; // lazily create needle JSON - if needed only
    for(const event of collection) {
      if (event.height !== height || event.requestKey !== requestKey || event.blockHash !== blockHash) {
        // return early if basic stuff is different - save us a JSON.stringify
        continue;
      }
      if (event.height < height) {
        // we went past the needle event height, we can stop scanning
        // assumes collections are sorted(!)
        break;
      }
      if (!needleJson) {
        needleJson = JSON.stringify(needle);
      }
      // could figure out a better way to compare
      // but essentially we need most attributes to find duplicates
      // e.g. a safe transfer txn is 2x coin.TRANSFER w/ same everything except params
      if (needleJson === JSON.stringify(event)) {
        return true;
      }
    }
    return false;
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
    validateBlockPermanence(classification);
    if (this._eventExists(event)) {
      this.logger.warn(`Event ${event.requestKey} ${event.name} already in ${classification}, not notifying`);
      return
    }
    this[classification].push(event) // TODO change this to push in-place (sorted)
    // call callbacks
    const callbackSet = blockPermanenceToCallbackSet(classification);
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
      debugger;
      return 'unconfirmed';
    }
    return 'confirmed'; // TODO
    // check orphaned
    // return confirmed
  }

  _on(type, callback) {
    validateType(CLASS_NAME, 'callback', callback, 'function');
    const set = blockPermanenceToCallbackSet(type);
    this[set].add(callback);
  }

  _off(type, callback) {
    validateType(CLASS_NAME, 'callback', callback, 'function');
    const set = blockPermanenceToCallbackSet(type);
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
        this.logger.warn(`${CLASS_NAME} updateCallback error: ${e.message}`);
      }
    }
  }
}
