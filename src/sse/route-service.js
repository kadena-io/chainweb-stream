import SSE from 'express-sse';
import ChainwebEventService from './chainweb-event.js';
import Logger from './logger.js';
import ChainwebCutService from './chainweb-cut.js';

let cut;

const defaultLimit = 25;

/*
 * Singleton service for SSE routing event filter requests
 */
const existing = {};

function concatTypeFilter(type, filter) {
  return `${type}:${filter}`;
}

export default class RouteService {
  inited = false;
  eventService = null;
  sse = null;

  constructor({ type, filter }) {
    if (existing[concatTypeFilter(type, filter)]) {
      return existing[concatTypeFilter(type, filter)];
    }
    this.type = type;
    this.filter = filter;
    this.sse = new SSE(
      [], // This produces [[]], can we make it send [] ? 
      { initialEvent: 'initial' },
    );
    if (!cut) {
      cut = new ChainwebCutService();
    }
    this.eventService = new ChainwebEventService({ type, filter, cut, limit: defaultLimit });
    this.eventService.on('confirmed', event => this.sse.send(event), 'update');
    this.logger = new Logger('EventRoute', type, filter);
    existing[concatTypeFilter(type, filter)] = this;
  }

  async init() {
    // resolve when enough data is available
    await this.eventService.init();
    // TODO handle limit depth
    this.eventService.start() // not awaiting intentionally
    this.inited = true;
  }

  route = async (req, res) => {
    if (!this.inited) {
      await this.init();
    }
    const limit = parseParam(req.query.limit, defaultLimit);
    const minHeight = parseParam(req.query.minHeight);
    // (ab)use init event / updateInit to handle different initial query params
    // TODO handle limit intelligently - wait if we haven't reached that yet, etc
    // this is needed regardless to refresh initial data send to the latest data
    // TODO handle different permanence parameters, eg ?permanence=confirmed or =all 
    this.sse.updateInit(
      this.eventService.state.getConfirmedEvents({ limit, minHeight }),
    );

    req.on('close', () => {
      this.connectionClosed();
    });
    // TODO bug here?
    // a new connection will send initialData to existing connections
    return this.sse.init(req, res);
  }

  connectionClosed() {
    // TODO for AccountService: stop/destroy when listeners = 0
    setTimeout(() => {
      const listeners = this.sse.listenerCount('data');
      this.logger.debug(`Connection closed. Open ${this.filter} connections: `, listeners);
      if (listeners === 0) {
        this.logger.log(`Last listener closed for ${this.filter}`);
        this.destroy();
      }
    }, 2000);
  }

  destroy() {
    this.eventService.stop()
    delete existing[concatTypeFilter(this.type, this.filter)];
  }
}

RouteService.get = (type, filter) => {
  return existing[concatTypeFilter(type, filter)] ?? new RouteService({ type, filter })
}

RouteService.route = (type, filter) => {
  return RouteService.get(type, filter).route;
}

function parseParam(value, defaultValue) {
  if (!value) {
    return defaultValue;
  }
  value = Number(value);
  if (!Number.isFinite(value) || (typeof defaultValue !== "undefined" && value > defaultValue)) {
    return defaultValue;
  }
  return value;
}
