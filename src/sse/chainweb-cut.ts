import Logger from './logger.js';
import defaultConfig from '../config/index.js';
import { ChainwebCutData, ChainwebCutCallback, validateDefined, validateType } from './types.js';
import { getResponse, fetchWithRetry, postData } from './http.js';

const CLASS_NAME = 'ChainwebCutService'

export default class ChainwebCutService {
  logger = new Logger('CutService');
  lastCut: ChainwebCutData;
  hasCut: Promise<boolean>;
  lastUpdateTime;
  running = false;

  _config;
  _updateInterval;
  _intervalId;
  _updateCallbacks = new Set<ChainwebCutCallback>();
  _resolveFirstData: (gotData: boolean) => void;

  constructor(config = defaultConfig) {
    this.logger = new Logger('CutService');
    const { chainwebHost, network, chainwebCutUpdateInterval } = config;
    this._config = { chainwebHost, network };
    this._updateInterval = chainwebCutUpdateInterval;
  }

  async start() {
    if (this._intervalId) {
      throw new Error(`${CLASS_NAME}.start() called but it was already running`);
    }
    this.running = true;
    // TODO Should we do this with Timeouts and re-schedule after step()?
    // (that was we would factor delays in getting upstream data into our update timings)
    // OTOH this should be quick usually
    this._intervalId = setInterval(() => this._step(), this._updateInterval);
    this.hasCut = new Promise(resolve => this._resolveFirstData = resolve);
    await this._step();
    this.logger.verbose('Started');
  }

  stop() {
    if (!this._intervalId) {
      throw new Error(`${CLASS_NAME}.stop() called but it was not running`);
    }
    this.running = false;
    clearInterval(this._intervalId);
    this._intervalId = undefined;
    this.logger.verbose('Stopped');
  }

  registerUpdateCallback(fn) {
    validateType(CLASS_NAME, 'registerUpdateCallback', fn, 'function');
    this._updateCallbacks.add(fn);
  }

  unregisterUpdateCallback(fn) {
    validateType(CLASS_NAME, 'unregisterUpdateCallback', fn, 'function');
    if (this._updateCallbacks.has(fn)) {
      this._updateCallbacks.delete(fn);
      return;
    }
    this.logger.warn('Unregistering callback: not found; ignoring');
  }

  async _executeCallbacks(data = this.lastCut) {
    for(const callback of this._updateCallbacks) {
      try {
        const res = callback(data);
        if (res && typeof res.then === 'function') {
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

  async _step() {
    // Should we do this is there are no callbacks registered ? 
    // depends if this.lastCut is going to be used externally
    try {
      const newCut = await this._getCut();
      if (!this.lastCut) {
        this._resolveFirstData(true);
      }
      this.lastCut = newCut;
      this.lastUpdateTime = Date.now();
      // TODO should we register errorCallbacks in case getCut fails despite retries?
      this._executeCallbacks(newCut);
    } catch(e) {
      this.logger.warn(`Could not get cut: ${e.message}`);
      return;
    }
  }

  async _getCut(logger = this.logger) {
    const { chainwebHost, network } = this._config;
    const url = `${chainwebHost}/chainweb/0.0/${network}/cut`;
    const rawResponse = await fetchWithRetry(url, { logger });
    const response = await getResponse(rawResponse);
    return response;
  }
}
