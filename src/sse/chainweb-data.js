import { writeFileSync } from 'fs';
import defaults from 'lodash/defaults.js'
import { fetchWithRetry, getResponse } from './http.js';
import { config } from '../../config/index.js';
import { filterBlackListItems, sortEvents } from './utils.js';

const { dataHost } = config;

export async function getChainwebDataEvents(endpoint, name, minHeight, limit = 50, next = undefined, logger = console) {
  const params = new URLSearchParams({
    name,
    limit,
    ...(minHeight ? { minheight: minHeight } : null),
    ...(next ? { next } : null),
  });
  const url = `${dataHost}/txs/${endpoint}?${params}`;

  const timeStart = Date.now();
  const rawRes = await fetchWithRetry(url, { logger });
  const elapsed = Date.now() - timeStart;

  const nextNext = rawRes.headers.get('chainweb-next');

  const response = await getResponse(rawRes);
  if (typeof response === "string") {
    logger.error(`Got CW-Data "${name}" events error limit=${limit} fromNext=${next} nextNext=${nextNext} response="${response}" in ${elapsed} ms`);
    return []
  }
  logger.verbose(`Got CW-Data "${name}" events limit=${limit} fromNext=${next} nextNext=${nextNext} responseLength=${response.length} in ${elapsed} ms`);

  return { response, next: nextNext };
}

const syncEventsFromChainwebDataDefaults = {
  limit: 50,
  threads: 4,
  moduleHashBlacklist: [],
  totalLimit: Infinity,
}

export async function syncEventsFromChainwebData(opts, logger=console) {
  const {
    filter,
    limit,
    threads,
    moduleHashBlacklist,
    totalLimit,
    minHeight,
    callback,
  } = defaults(opts, syncEventsFromChainwebDataDefaults);

  const completedResults = [];
  logger.debug(`syncEventsFromChainwebData minHeight=${minHeight}`);

  const resultPromises = [];
  // TODO slow start with threads=1 if minHeight is set
  // most of the times there won't be updates, 1 thread enough to check
  let _next;
  while (completedResults.length < totalLimit ) {
    const { response, next } = await getChainwebDataEvents('events', filter, minHeight, limit, _next, logger);
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
    debugger;
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
