import { config as defaultConfig } from '../../config/index.js';
import { validateDefined, validateType } from './utils.js';
import { getResponse, fetchWithRetry, postData } from './http.js';

const CLASS_NAME = 'ChainwebCutService'

export default class ChainwebCutService {
  _config;
  _updateInterval;
  _intervalId;
  _updateCallbacks = new Set();
  lastCut;
  running = false;

  constructor(config = defaultConfig) {
    const { chainwebHost, network, updateInterval = 30_000 } = config;
    validateDefined(CLASS_NAME, 'chainwebHost', chainwebHost);
    validateDefined(CLASS_NAME, 'network', network);
    validateType(CLASS_NAME, 'updateInterval', updateInterval, 'number');
    this._config = { chainwebHost, network };
    this._updateInterval = updateInterval;
  }

  start() {
    if (this._intervalId) {
      throw new Error(`${CLASS_NAME}.start() called but it was already running`);
    }
    this.running = true;
    // TODO Should we do this with Timeouts and re-schedule after step()?
    // (that was we would factor delays in getting upstream data into our update timings)
    // OTOH this should be quick usually
    this._intervalId = setInterval(() => this._step(), this._updateInterval);
    this._step();
    console.log(`${CLASS_NAME} started`);
  }

  stop() {
    if (!this._intervalId) {
      throw new Error(`${CLASS_NAME}.stop() called but it was not running`);
    }
    this.running = false;
    clearInterval(this._intervalId);
    this._intervalId = undefined;
    console.log(`${CLASS_NAME} stopped`);
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
    console.warn('Unregistering callback: not found; ignoring');
  }

  async _executeCallbacks(data = this.lastCut) {
    for(const callback of this._updateCallbacks) {
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

  async _step() {
    // Should we do this is there are no callbacks registered ? 
    // depends if this.lastCut is going to be used externally
    try {
      this.lastCut = await this._getCut();
      // should we register errorCallbacks in case getCut fails despite retries?
    } catch(e) {
      console.warn(`${CLASS_NAME} could not get cut: ${e.message}`);
      return;
    }
    this._executeCallbacks(this.lastCut);
  }

  async _getCut() {
    const { chainwebHost, network } = this._config;
    const url = `https://${chainwebHost}/chainweb/0.0/${network}/cut`;
    const rawResponse = await fetchWithRetry(url);
    const response = await getResponse(rawResponse);
    // const summary = summarizeChainwebCut(response);
    return response;
  }
}

debugger;
