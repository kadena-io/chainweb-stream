import SSE from 'express-sse';
import ChainwebEventService from './chainweb-event.js';
import Logger from './logger.js';
import ChainwebCutService from './chainweb-cut.js';
import { TransactionType, InitialEvent } from './types.js';
import config from '../config/index.js';

const { network, confirmationDepth, heartbeatInterval } = config;

let cut;

const defaultLimit = 25;
const maxLimit = 10000;

/*
 * Singleton service for SSE routing event filter requests
 */
const existing = {};

function concatTypeFilter(type, filter) {
  return `${type}:${filter}`;
}

export default class RouteService {
  type: TransactionType;
  filter: string;
  logger: Logger;

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
      { initialEvent: 'initial', pingInterval: heartbeatInterval, },
    );
    if (!cut) {
      cut = new ChainwebCutService();
    }
    this.eventService = new ChainwebEventService({ type, filter, cut, limit: defaultLimit });
    this.eventService.on('confirmed', event => this.sse.send(event), 'update');
    this.eventService.on('unconfirmed', event => this.sse.send(event), 'update');
    this.eventService.on('updateConfirmations', event => this.sse.send(event), 'update');
    this.logger = new Logger('EventRoute', type, filter);
    existing[concatTypeFilter(type, filter)] = this;
  }

  async init() {
    // resolve when enough data is available
    await this.eventService.init();
    // TODO handle limit depth?
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
    const initialEvent: InitialEvent = {
      config: {
        network,
        type: this.type,
        id: this.filter,
        maxConf: confirmationDepth,
        heartbeat: heartbeatInterval,
        v:  '0.0.2',
      },
      data: this.eventService.state.getAllEvents({ limit, minHeight }),
    };
    this.sse.updateInit(initialEvent);

    req.on('close', () => {
      this.connectionClosed();
    });
    return this.sse.init(req, res);
  }

  connectionClosed() {
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

  static get(type: TransactionType, filter) {
    return existing[concatTypeFilter(type, filter)] ?? new RouteService({ type, filter })
  }

  static route(type: TransactionType, filter) {
    return RouteService.get(type, filter).route;
  }
}

function parseParam(value, defaultValue = 0) {
  if (!value) {
    return defaultValue;
  }
  value = Number(value);
  if (!Number.isFinite(value)) {
    return defaultValue;
  }
  if (typeof defaultValue !== "undefined" && value > maxLimit) {
    return maxLimit;
  }
  return value;
}
