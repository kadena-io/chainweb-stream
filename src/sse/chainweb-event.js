import { validateDefined, validateType } from './utils.js';
import ChainwebCutService from './chainweb-cut.js';

const DATA_STEP_INTERVAL = 15_000;

const CLASS_NAME = 'ChainwebEventService'

const EVENT_TYPES = ['confirmed', 'unconfirmed', 'orphaned'];

function validateEventType(eventType) {
  if (!EVENT_TYPES.includes(eventType)) {
    throw new Error(`Expected one of [${EVENT_TYPES.join(', ')}] but received ${eventType}`);
  }
}

function eventTypeToCallbackSet(eventType) {
  validateEventType(eventType);
  return `_${eventType}Callbacks`;
}

class ChainwebEventService {
  // events: unconfirmed, confirmed, orphaned
  unconfirmed = []
  confirmed = []
  orphaned = []

  _filter = null      // chainweb-data filter for this service, e.g "marmalade." or "coin."
  _fromHeight = null  // initial min height setting
  _lastHeight = null  // last seen height

  _running = false    // running state

  _cut                // ChainwebCut service

  // callbacks for: confirmed/unconfirmed/orphaned events
  _confirmedCallbacks = new Set()
  _unconfirmedCallbacks = new Set()
  _orphanedCallbacks = new Set()

  constructor({ filter, fromHeight, cut }) {
    validateType(CLASS_NAME, 'filter', filter, 'string');
    this._filter = filter;

    if (fromHeight) {
      validateType(CLASS_NAME, 'fromHeight', fromHeight, 'number');
      this._fromHeight = fromHeight;
    }
    this.lastHeight = fromHeight ? Math.max(0, fromHeight - 1) : 0;

    if (cut) {
      validateInstanceOf(CLASS_NAME, 'cut', cut, ChainwebCutService);
      this._cut = cut;
    } else {
      this._cut = new ChainwebCutService();
    }
  }

  async start() {
    await this._init();
    this._running = true;
    this._cut.registerUpdateCallback(this._blockStep);
    if (!this._cut.running) {
      this._cut.start();
    }
    this._step();
    setTimeout(this._step, DATA_STEP_INTERVAL);
  }

  stop() {
    this._running = false;
    if (this._cut) {
      this._cut.unregisterUpdateCallback(this._blockStep);
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

  async _init() {
    /*  get data from DB
     *    -> this.confirmed, orphaned
     *    -> db.unconfirmed -> this.add
     */
  }

  _step = async () => {
    // if !this.running
      // return;
 /*  try {
 *    events = await CWData.fetchEvents({
 *      fromHeight: this._lastHeight
 *    });
 *    for event of events:
 *      this.add(event);
 *  } catch {
 *
 *  } finally {
 *    setTimeout(this.step, SERVICE_STEP_INTERVAL)
 *  }
 */
  }

  _blockStep = () => {
    if (this.unconfirmed.length) {
      for(const event of this.unconfirmed) {
        const classification = this._classifyEvent(event);
        if (classification !== 'unconfirmed') {
          const uncIdx = this.unconfirmed.indexOf(event);
          this.unconfirmed.splice(uncIdx, 1);
          this._add(event);
        }
      }
    }
  }

  _add(event) {
    const classification = this._classifyEvent(event);
    validateEventType(classification);
    if (this[classification].includes(event)) {
      console.warn('Event already in ${classification}, not notifying');
      return
    }
    this[classification].push(event) // should we unshift instead? what is the preferable order
    // call callbacks
    const callbackSet = eventTypeToCallbackSet(classification);
    this._executeCallbacks(callbackSet, event);
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

