import SSE from 'express-sse';
import ChainwebEventService from './chainweb-event.js';
import Logger from './logger.js';

const defaultLimit = 100;

/*
 * Singleton service for SSE routing event filter requests
 */
const existing = {};

export default class RouteService {
  inited = false;
  eventService = null;
  sse = null;

  constructor({ filter }) {
    if (existing[filter]) {
      return existing[filter];
    }
    this.filter = filter;
    this.sse = new SSE();
    this.eventService = new ChainwebEventService({ filter });
    this.eventService.on('confirmed', event => this.sse.send(event), 'update');
    this.logger = new Logger('EventRoute', filter);
    existing[filter] = this;
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
      [ this.eventService.state.getConfirmedEvents({ limit }) ],
      { initialEvent: 'initial' },
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
    delete existing[this.filter];
  }
}

RouteService.get = (filter) => {
  return existing[filter] ?? new RouteService({ filter })
}

RouteService.route = (filter) => {
  return RouteService.get(filter).route;
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
