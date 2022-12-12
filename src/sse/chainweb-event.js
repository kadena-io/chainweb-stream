import Logger from './logger.js';
import {
  validateDefined,
  validateType,
  validateBlockPermanence,
} from './types.js';
import ChainwebCutService from './chainweb-cut.js';
import { syncEventsFromChainwebData } from './chainweb-data.js';
import { config } from '../../config/index.js';
import State from './chainweb-event-state.js';

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

export default class ChainwebEventService {
  state;              // contains events[]: unconfirmed, confirmed, orphaned

  running = false     // running state
  lastUpdateTime;

  _filter = null      // chainweb-data filter for this service, e.g "marmalade." or "coin."
  _minHeight = null  // last seen height

  _cut                // ChainwebCut service

  // callbacks for: confirmed/unconfirmed/orphaned events
  _confirmedCallbacks = new Set()
  _unconfirmedCallbacks = new Set()
  _orphanedCallbacks = new Set()

  constructor({ filter, minHeight, cut }) {
    const logPrefix = filter.endsWith('.') ? filter.slice(0, filter.length - 1) : filter;
    this.logger = new Logger('EventService', logPrefix);

    validateType(CLASS_NAME, 'filter', filter, 'string');
    this._filter = filter;
    this.state = new State({ filter });

    if (minHeight) {
      validateType(CLASS_NAME, 'minHeight', minHeight, 'number');
    }
    this._minHeight = minHeight ?? 0;

    if (cut) {
      validateInstanceOf(CLASS_NAME, 'cut', cut, ChainwebCutService);
      this._cut = cut;
    } else {
      this._cut = new ChainwebCutService();
    }
  }

  async start() {
    await this._loadState();
    this.running = true;
    this._cut.registerUpdateCallback(this._blockStep);
    if (!this._cut.running) {
      await this._cut.start();
    }
    this.logger.verbose(`Started with minHeight=${this._minHeight}`);
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

  on(type, callback) {
    validateType(CLASS_NAME, 'callback', callback, 'function');
    const set = blockPermanenceToCallbackSet(type);
    this[set].add(callback);
  }

  off(type, callback) {
    validateType(CLASS_NAME, 'callback', callback, 'function');
    const set = blockPermanenceToCallbackSet(type);
    this[set].delete(callback);
  }

  /*
   * Private line
   */

  /*
   * Update minHeight
   */
  async _calcLastHeight() {
    // TODO IMPORTANT there is an edge case here where
    // if chain=8 is +2 blocks ahead of chain=3
    // we get an unconfirmed event from chain=8 and set minHeight + 1
    // we never see an event from chain=3 at minHeight-1 or minHeight
    // maybe check minHeight against confirmation height or Cut to see if we can move forward
    // but that isn't a guarrantee that cw-data has actually caught up to that state
    // we could always store lastSeenEvent - 2 as the minHeight and de-dupe
    const lastEvent = this.state.unconfirmed[0] ?? this.state.confirmed[0] ?? this.state.orphaned[0];
    if (lastEvent) {
      this._minHeight = lastEvent.height + 1;
    }
  }

  /*
   *  Fetch previous state from redis
   */
  async _loadState() {
    await this.state.load();
    this._calcLastHeight();
    // TODO minHeight improve?
    this.logger.info(`Loaded state minHeight=${this._minHeight} ${this.state.summary}`);
  }

  /*
   *  Save state to redis
   */
  async _saveState() {
    await this.state.save();
    this.logger.verbose(`Saved state minHeight=${this._minHeight} ${this.state.summary}`);
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
        minHeight: this._minHeight,
      }, this.logger);
      this.lastUpdateTime = Date.now();
      let updated = 0;
      for(const event of events) {
        updated += await this._add(event);
      }
      if (updated) {
        this._calcLastHeight();
        await this._saveState();
      }
    } catch(e) {
      this.logger.error(e);
    } finally {
      setTimeout(this._step, EVENTS_STEP_INTERVAL)
    }
  }
  
  _blockStep = async () => {
    if (this.state.unconfirmed.length) {
      for(const event of this.state.unconfirmed) {
        const permanence = await this._classifyEvent(event);
        if (permanence !== 'unconfirmed') {
          const uncIdx = this.state.unconfirmed.indexOf(event);
          this.state.unconfirmed.splice(uncIdx, 1);
          this._add(event);
        }
      }
    }
  }

  async _add(event) {
    const permanence = await this._classifyEvent(event);
    validateBlockPermanence(permanence);
    if (this.state.eventExists(event)) {
      this.logger.warn(`Event ${event.requestKey} ${event.name} already in ${permanence}, not notifying`);
      return 0;
    }
    this.state.add(permanence, event);
    // call callbacks
    const callbackSet = blockPermanenceToCallbackSet(permanence);
    this._executeCallbacks(this[callbackSet], event);
    return 1;
  }

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
