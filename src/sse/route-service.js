import SSE from 'express-sse';
import ChainwebEventService from './chainweb-event.js';
import Logger from './logger.js';
import ChainwebCutService from './chainweb-cut.js';

let cut;

const defaultLimit = 100;

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
    this.eventService = new ChainwebEventService({ type, filter, cut });
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
    const limit = parseLimit(req.query.limit, defaultLimit);
    // (ab)use init event / updateInit to handle different initial query params
    // TODO handle limit intelligently - wait if we haven't reached that yet, etc
    // this is needed regardless to refresh initial data send to the latest data
    // TODO handle different permanence parameters, eg ?permanence=confirmed or =all 
    this.sse.updateInit(
      this.eventService.state.getConfirmedEvents({ limit }),
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
      this.logger.debug(`Connection closed. Open ${this.filter} connections: `, this.sse.listenerCount('data'));
    }, 1);
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

function parseLimit(limit, defaultLimit) {
  if (!limit) {
    return defaultLimit;
  }
  limit = Number(limit);
  if (!Number.isFinite(limit) || limit > defaultLimit) {
    return defaultLimit;
  }
  return limit;
}
