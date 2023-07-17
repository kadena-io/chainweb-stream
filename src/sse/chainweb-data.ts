import { writeFileSync } from 'fs';
import defaults from 'lodash/defaults.js'
import { fetchWithRetry, getResponse } from './http.js';
import config from '../config/index.js';
import { filterBlackListItems } from './utils.js';
import { isUndefined, TransactionType } from './types.js';
import Logger from '../logger.js';

const { dataHost } = config;

export async function getChainwebDataEvents(endpoint, name, minHeight, limit = 50, next = undefined, logger = new Logger('getChainwebDataEvents')) {
  const isAccount = endpoint.startsWith('account/');

  const paramObject = {
    ...(!isAccount && name ? { name } : null),
    ...(minHeight ? { minheight: minHeight } : null),
    ...(next ? { next } : null),
    limit,
  };  
  const params = new URLSearchParams(Object.entries(paramObject));

  const url = `${dataHost}/txs/${endpoint}?${params}`;

  const timeStart = Date.now();
  const rawRes = await fetchWithRetry(url, { logger });
  const elapsed = Date.now() - timeStart;

  const nextNext = rawRes.headers.get('chainweb-next');

  let response = await getResponse(rawRes);
  if (typeof response === "string") {
    logger.error(`${url} response="${response}" in ${elapsed} ms`);
    return { response: [], }; // TODO should this throw
  }

  logger.debug(`${url} ${rawRes.status} responseLength=${response.length} in ${elapsed} ms`);

  return { response, next: nextNext };
}

function getEndpointParams(type: TransactionType, filter) {
  if (type === "account") {
    return [`account/${filter}`, undefined];
  } else if (type === "event") {
    return ["events", filter];
  } else {
    throw new Error("Unsupported endpoint: "+type);
  }
}

interface SyncEventsOptions {
  type?: 'events' | 'accounts';
  limit?: number;
  totalLimit?: number;
  minHeight?: number;
  moduleHashBlacklist?: string[];
  callback?: () => {}; // TODO
}

const syncEventsFromChainwebDataDefaults = {
  type: 'events',
  limit: 50,
  moduleHashBlacklist: [],
  totalLimit: 100,
}

export async function syncEventsFromChainwebData(opts, logger = new Logger(syncEventsFromChainwebData)) {
  const {
    type,
    filter,
    limit,
    moduleHashBlacklist,
    totalLimit,
    minHeight,
    callback,
  } = defaults(opts, syncEventsFromChainwebDataDefaults);

  const completedResults = [];
  logger.debug(`syncEventsFromChainwebData minHeight=${minHeight}`);

  const resultPromises = [];
  let _next;
  const [endpoint, nameParam] = getEndpointParams(type, filter);
  while (completedResults.length < totalLimit ) {
    const { response, next } = await getChainwebDataEvents(endpoint, filter, minHeight, limit, _next, logger);
    let data = filterBlackListItems(response, moduleHashBlacklist);
    if (type === 'accounts') {
    }
    try {
      resultPromises.push(callback(data));
    } catch(e) {
      logger.warn("Callback error:", e);
    }
    completedResults.push(...data);
    if (completedResults.length > totalLimit || !next)
      break;
    _next = next;
  }

  try {
    writeFileSync(`junk/cw-data-${filter}-${Date.now()}.json`, JSON.stringify(completedResults));
  } catch(e) {
  }

  logger.debug('sync fetch finished. awaiting result processors', completedResults.length);
  try {
    await Promise.all(resultPromises);
  } catch(e) {
    logger.warn("Callback error:", e);
  }
  logger.debug('sync finished.');

  return completedResults;
}
