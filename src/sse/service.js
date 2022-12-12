import fetch, { Headers } from 'node-fetch';
import every from 'lodash/every.js';
import defaults from 'lodash/defaults.js';
import { filterBlackListItems, sortEvents } from './utils.js';
import { config } from '../../config/index.js';
import { getChainwebDataEvents } from './chainweb-data.js';
import ChainwebCutService from './chainweb-cut.js';

const { chainwebHost, dataHost, network } = config;


/*
 * ChainwebEventService
 *
 * config:
 *  - filter
 *  - fromHeight
 *
 * .confirmed []
 * .unconfirmed []
 * .orphaned []
 *
 * ._lastHeight
 *
 * ._confirmedCallbacks Set
 * ._orphanedCallbacks Set
 * ._unconfirmedCallbacks Set
 *
 * constructor({ filter, fromHeight })
 *  - this.filter
 *  - this.lastHeight = fromHeight - 1
 *
 * init()
 *  get data from DB
 *    -> this.confirmed, orphaned
 *    -> db.unconfirmed -> this.add
 *
 * start()
 *  - init()
 *  - this.cut = new CutService()
 *  - this.cut.registerBlockCallback(this.blockStep)
 *  - setTimeout(this.step, SERVICE_STEP_INTERVAL)
 *    
 * _dataStep()
 *  try {
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
 *
 *  _blockStep()
 *  - if this.unconfirmed
 *    - foreach this.unconfirmed
 *      - if cut diff > $CONFIRMATION_HEIGHT
 *         -> isOrphanedBlock(header) ?
 *          -> orphaned
 *          -> confirmed
 *
 *  _add()
 *    -> this._classifyEvent() 
 *      -> this.addUnconfirmed
 *      -> this.addConfirmed
 *      -> this.addOrphaned
 *
 *  _classifyEvent(event) -> UNCONFIRMED | CONFIRMED | ORPHANED
 *    -> inspect event.height vs this.cut[chain].height vs CONFIRMATION_HEIGHT
 *      -> confirmationHeightPassed ? checkOrphaned
 *        -> UNCONFIRMED
 *        -> CONFIRMED
 *        -> ORPHANED
 *
 *  _addConfirmed()
 *
 *  _addUnconfirmed()
 *
 *  _addOrphaned()
 *
 */

/*
 * formerly in init:
 *    for all unconfirmed:
 *      - wait until $CONFIRMATION_ROUND elapsed
 *      - isBlockOrphaned()
 *        -> save orphaned
 *        -> move confirmed
 */
