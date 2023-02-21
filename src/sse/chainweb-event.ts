import { createHash } from 'crypto';
import Logger from './logger';
import {
  validateDefined,
  validateType,
  validateBlockPermanence,
  validateInstanceOf,
  TransactionType,
  BlockPermanenceState,
} from './types';
import ChainwebCutService from './chainweb-cut';
import { syncEventsFromChainwebData } from './chainweb-data';
import config from '../config/index';
import State from './chainweb-event-state';
import { isOrphan } from './orphans';

const CLASS_NAME = 'ChainwebEventService'

const {
  moduleHashBlacklist,
  confirmationHeight: CONFIRMATION_HEIGHT,
  eventsStepInterval: EVENTS_STEP_INTERVAL,
} = config;

function blockPermanenceToCallbackSet(blockPermanence) {
  validateBlockPermanence(blockPermanence as BlockPermanenceState);
  return `_${blockPermanence}Callbacks`;
}

interface ChainwebEventServiceConstructor {
  type: TransactionType;
  filter: string;
  cut: ChainwebCutService;
  minHeight?: number;
  limit?: number;
}

export default class ChainwebEventService {
  state: State;              // contains events[]: unconfirmed, confirmed, orphaned
  logger: Logger;
  _type: TransactionType;

  running = false     // running state
  lastUpdateTime;

  _filter = null      // chainweb-data filter for this service, e.g "marmalade." or "coin."
  _minHeight = null  // last seen height
  _limit = 100;
  

  _cut: ChainwebCutService  // ChainwebCut service

  // callbacks for: confirmed/unconfirmed/orphaned events
  _confirmedCallbacks = new Set()
  _unconfirmedCallbacks = new Set()
  _updateConfirmationsCallbacks = new Set()
  _orphanedCallbacks = new Set()

  constructor({ type, filter, minHeight, cut, limit }: ChainwebEventServiceConstructor) {
    const logPrefix = filter.endsWith('.') ? filter.slice(0, filter.length - 1) : filter;
    this.logger = new Logger('EventService', logPrefix);

    validateType(CLASS_NAME, type, filter, 'string');
    this._type = type;
    // TODO validate event type IF we keep this for multiple types, e.g. account & module
    this._filter = filter;
    if (limit) {
      this._limit = limit;
    }
    this.state = new State({ type, filter, logger: this.logger, });

    if (minHeight) {
      validateType(CLASS_NAME, 'minHeight', minHeight, 'number');
    }
    this._minHeight = minHeight ?? 0;

    if (cut) {
      validateInstanceOf(CLASS_NAME, 'cut', cut, ChainwebCutService);
      this._cut = cut;
    } else {
      this.logger.warn('Initializing new Cut service');
      this._cut = new ChainwebCutService();
    }
  }

  async init() {
    await this._loadState();
  }

  async start() {
    if (!this.state.confirmed.length) {
      await this.init();
    }
    this._cut.registerUpdateCallback(this._blockStep);
    if (!this._cut.running) {
      await this._cut.start();
    }
    this.running = true;
    this.logger.verbose(`Started with minHeight=${this._minHeight} cw=${JSON.stringify(this._cut.lastCut)}`);
    try {
      await this._step();
    } catch(e) {
      this.logger.error(e);
    }
    setTimeout(this._step, EVENTS_STEP_INTERVAL);
  }

  stop() {
    // TODO stop in progress operations?
    this.running = false;
    if (this._cut) {
      this._cut.unregisterUpdateCallback(this._blockStep);
    }
  }

  on(type, callback) {
    // implement onError?
    // if so, redact hostnames from errors
    validateType(CLASS_NAME, 'callback', callback, 'function');
    const set = blockPermanenceToCallbackSet(type);
    console.log(set);
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
    this.logger.log(`Loaded state minHeight=${this._minHeight} ${this.state.summary}`);
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
      // deduped new event count
      let updated = 0;

      // callback for syncEvents to stream data chunks
      const addEvents = async (events) => {
        this.lastUpdateTime = Date.now();
        for(const event of events) {
          if (await this._add(event)) {
            updated++;
          }
        }
      }

      const syncOptions = {
        type: this._type,
        filter: this._filter,
        limit: 100,
        totalLimit: 10000,
        moduleHashBlacklist,
        minHeight: this._minHeight,
        callback: addEvents,
      };

      await syncEventsFromChainwebData(syncOptions, this.logger);

      if (updated) {
        this._calcLastHeight();
        this.logger.log(`${updated} new events. New minHeight=${this._minHeight}`);
        await this._saveState();
      } else {
        this.logger.verbose('No updates');
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
        const { meta: { confirmations: prevConfirmations } } = event;
        const permanence = await this._classifyEvent(event);
        const { meta: { confirmations: nextConfirmations } } = event;
        if (permanence !== 'unconfirmed') {
          this.logger.verbose(event.requestKey, event.name, 'unconfirmed ->');
          this.state.remove('unconfirmed', event);
          this._add(event);
        } else if (prevConfirmations !== nextConfirmations) {
          this._executeCallbacks(this._updateConfirmationsCallbacks, event);
        }
      }
    }
  }

  async _add(event) {
    if (!event.meta?.id) {
      addEventID(event);
    }
    const permanence = await this._classifyEvent(event);
    validateBlockPermanence(permanence as BlockPermanenceState);
    const isNew = this.state.add(permanence, event);
    if (!isNew) {
      return false;
    }
    // this.logger.verbose(event.requestKey, event.name, permanence);
    // call callbacks
    const callbackSet = blockPermanenceToCallbackSet(permanence);
    this._executeCallbacks(this[callbackSet], event);
    return true;
  }

  async _classifyEvent(event) {
    const { height, chain, blockHash } = event;
    const lastChainHeight = this._cut.lastCut.hashes[chain].height;
    event.meta.confirmations = Math.max(0, Math.min(CONFIRMATION_HEIGHT, lastChainHeight - height));
    if (event.meta.confirmations < CONFIRMATION_HEIGHT) {
      return 'unconfirmed';
    }
    const isEventOrphaned = await isOrphan(event, this._cut.lastCut, this.logger);
    if (isEventOrphaned) {
      event.meta.confirmations = 0;
      event.meta.orphaned = true;
      return 'orphaned';
    }
    return 'confirmed';
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

function addEventID(event) {
  const { blockTime, meta, ...eventHash } = event;
  const eventHashStr = JSON.stringify(eventHash);
  const id = createHash('md5').update(eventHashStr).digest('hex');
  event.meta = event.meta ?? {};
  event.meta.id = id;
  return;
}
