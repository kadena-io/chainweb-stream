import { writeFileSync } from 'fs';
import defaults from 'lodash/defaults.js'
import { fetchWithRetry, getResponse } from './http.js';
import { config } from '../../config/index.js';
import { filterBlackListItems, sortEvents } from './utils.js';
import { isUndefined } from './types.js';

const { dataHost } = config;

export async function getChainwebDataEvents(endpoint, name, minHeight, limit = 50, next = undefined, logger = console) {
  const params = new URLSearchParams({
    ...(name ? { name } : null),
    ...(minHeight ? { minheight: minHeight } : null),
    ...(next ? { next } : null),
    limit,
  });
  const url = `${dataHost}/txs/${endpoint}?${params}`;

  const timeStart = Date.now();
  const rawRes = await fetchWithRetry(url, { logger });
  const elapsed = Date.now() - timeStart;

  const nextNext = rawRes.headers.get('chainweb-next');

  const response = await getResponse(rawRes);
  if (typeof response === "string") {
    logger.error(`${url} response="${response}" in ${elapsed} ms`);
    return []
  }
  // /txs/account returns .chainid
  // /txs/events returns .chain
  // make both appear in both types for now, decide how to handle later TODO
  response.map((elem, i, all) => {
    const hasChain = !isUndefined(elem.chain);
    const hasChainId = !isUndefined(elem.chainid);
    if (hasChain && !hasChainId)
      elem.chainid = elem.chain
    else if (!hasChain && hasChainId)
      elem.chain = elem.chainid
    else if (!hasChain && !hasChainId)
      throw new Error(`Unexpected element (no chain[id]) in index ${i}: ${JSON.stringify(all)}`);
    return elem;
  });
  logger.verbose(`${url} ${rawRes.status} responseLength=${response.length} in ${elapsed} ms`);

  return { response, next: nextNext };
}

function getEndpointParams(type, filter) {
  if (type === "account") {
    return [`account/${filter}`, undefined];
  } else if (type === "events") {
    return [type, filter];
  } else {
    throw new Error("Unsupported endpoint: "+type);
  }
}

const syncEventsFromChainwebDataDefaults = {
  type: 'events',
  limit: 50,
  moduleHashBlacklist: [],
  totalLimit: 100,
}

export async function syncEventsFromChainwebData(opts, logger=console) {
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
    const data = filterBlackListItems(response, moduleHashBlacklist);
    try {
      resultPromises.push(callback(data));
    } catch(e) {
      logger.warn("Callback error:", e);
    }
    completedResults.push(...data);
    if (completedResults.length > totalLimit || !next)
      break;
    _next = next;
    console.log('next', next);
  }

  try {
    writeFileSync(`junk/cw-data-${filter}-${Date.now()}.json`, JSON.stringify(completedResults));
  } catch(e) {
  }

  logger.verbose('sync fetch finished. awaiting result processors', completedResults.length);
  try {
    await Promise.all(resultPromises);
  } catch(e) {
    logger.warn("Callback error:", e);
  }
  logger.verbose('sync finished.');

  return completedResults;
}
