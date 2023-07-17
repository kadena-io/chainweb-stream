import { getChainwebDataEvents } from './chainweb-data.js';
import { validateType } from './types.js';
import Logger from '../logger.js';
import config from '../config/index.js';

const {
  chainwebDataHeightUpdateInterval: INTERVAL_MS,
} = config;

const CLASS_NAME = 'ChainwebDataHeightTracker';

type NumericCallback = (n: number) => void;

export default class ChainwebDataHeightTracker {
  private _maxHeight: number = -1;
  private _running: boolean = false;
  private _logger = new Logger('ChainwebDataHeightTracker');
  private _timeoutId: ReturnType<typeof setTimeout>
  private _callbacks = new Set<NumericCallback>();

  public start = () => {
    if (this._running) {
      throw new Error('ChainwebDataHeightTracker: Already running');
    }
    this._running = true;
    this._logger.log('Starting');
    this._step(); // schedules next run at the end
  }

  public stop = () => {
    if (!this._running) {
      throw new Error('ChainwebDataHeightTracker: Not running');
    }
    this._running = false;
    clearTimeout(this._timeoutId);
  }

  private _setTimeout() {
    this._timeoutId = setTimeout(this._step, INTERVAL_MS);
  }

  private _step = async () => {
    this._logger.debug('Querying');
    try {
      const { response: [latestTxn] } = (await getChainwebDataEvents(
        'events',
        'coin.TRANSFER',
        0,
        1
      )) ?? { response: [] };

      if (latestTxn?.height) {
        this.setMaxHeightMaybe(latestTxn.height);
        this._executeCallbacks();
      }
    } catch(e) {
      this._logger.error(e);
    }
    if (this._running) {
      this._setTimeout();
    }
  }

  public get maxHeight() {
    return this._maxHeight;
  }

  public setMaxHeightMaybe(value: number) {
    if (Number.isFinite(value)) {
      if (value > this._maxHeight) {
        this._logger.log(`New max height: ${value}`);
        this._maxHeight = value;
        return;
      } else if (value === this._maxHeight) {
        this._logger.log(`Max height unchanged: ${value}`);
      }
    }
    if(!Number.isFinite(value)) {
      this._logger.error(`Received non-finite max height value: ${value}`);
    }
  }

  async _executeCallbacks(data = this._maxHeight) {
    for(const callback of this._callbacks) {
      try {
        callback(data);
      } catch(e) {
        this._logger.warn(`${CLASS_NAME} updateCallback error: ${e.message}`);
      }
    }
  }

  registerUpdateCallback(fn: NumericCallback) {
    validateType(CLASS_NAME, 'registerCallback', fn, 'function');
    this._callbacks.add(fn);
  }

  unregisterUpdateCallback(fn: NumericCallback) {
    validateType(CLASS_NAME, 'unregisterCallback', fn, 'function');
    if (this._callbacks.has(fn)) {
      this._callbacks.delete(fn);
      return;
    }
    this._logger.warn('Unregistering callback: not found; ignoring');
  }
}
