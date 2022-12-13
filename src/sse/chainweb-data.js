import { writeFileSync } from 'fs';
import defaults from 'lodash/defaults.js'
import { fetchWithRetry, getResponse } from './http.js';
import { config } from '../../config/index.js';
import { filterBlackListItems, sortEvents } from './utils.js';

const { dataHost } = config;

export async function getChainwebDataEvents(name, minHeight, limit = 50, offset = 0, logger = console) {
  const params = new URLSearchParams({
    name,
    minheight: minHeight,
    limit,
    offset,
  });
  const url = `http://${dataHost}/txs/events?${params}`;

  const timeStart = Date.now();
  const rawRes = await fetchWithRetry(url, { logger });
  const elapsed = Date.now() - timeStart;

  const response = await getResponse(rawRes);
  if (typeof response === "string") {
    logger.error(`Got CW-Data "${name}" events error limit=${limit} offset=${offset} response="${response}" in ${elapsed} ms`);
    return []
  }
  logger.verbose(`Got CW-Data "${name}" events limit=${limit} offset=${offset} responseLength=${response.length} in ${elapsed} ms`);
  return response;
}

const syncEventsFromChainwebDataDefaults = {
  limit: 50,
  threads: 4,
  newestToOldest: false,
  moduleHashBlacklist: [],
  totalLimit: 0, // DEBUG for quicker results
}

export async function syncEventsFromChainwebData(opts, logger=console) {
  const {
    filter,
    limit,
    threads,
    newestToOldest,
    moduleHashBlacklist,
    totalLimit,
    minHeight,
  } = defaults(opts, syncEventsFromChainwebDataDefaults);

  let offset = 0;
  let promisedResults = [];
  let completedResults = [];
  let continueSync = true;

  logger.debug(`syncEventsFromChainwebData minHeight=${minHeight}`);

  while (continueSync) {
    for (let i = 0; i < threads; i++) {
      promisedResults.push(getChainwebDataEvents(filter, minHeight, limit, offset, logger));
      offset = offset + limit;
    }
    completedResults = await Promise.all(promisedResults);
    // logger.debug('Got', completedResults.reduce((num, arr) => num + arr.length, 0));
    // once a batch comes back empty, we're caught up
    continueSync = completedResults.every((v) => v.length >= limit) &&
      ( totalLimit === 0  ||
        completedResults.reduce((total, results) => total + results.length, 0) <= totalLimit
      );
  }

  writeFileSync(`cw-data-${filter}-${Date.now()}.json`, JSON.stringify(completedResults));

  completedResults = filterBlackListItems(completedResults, moduleHashBlacklist);

  sortEvents(completedResults, newestToOldest);

  logger.verbose('sync finished', completedResults.length);

  return completedResults;
}

