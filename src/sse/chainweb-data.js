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

  const rawRes = await fetchWithRetry(url, { logger });

  const response = await getResponse(rawRes);
  logger.verbose(`Got CW DataE o=${offset} l=${limit} len=${response.length}`);
  return response;
}

const syncEventsFromChainwebDataDefaults = {
  limit: 50,
  threads: 4,
  newestToOldest: false,
  moduleHashBlacklist: [],
  // totalLimit: 399, // DEBUG for quicker results
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
    logger.verbose('batch pushed, end offset', offset);
    completedResults = await Promise.all(promisedResults);
    // once a batch comes back empty, we're caught up
    continueSync = completedResults.every((v) => v.length >= limit) &&
      ( totalLimit === 0  ||
        completedResults.reduce((total, results) => total + results.length, 0) <= totalLimit
      );
  }

  completedResults = filterBlackListItems(completedResults, moduleHashBlacklist);

  sortEvents(completedResults, newestToOldest);

  logger.verbose('sync finished', completedResults.length);

  return completedResults;
}

