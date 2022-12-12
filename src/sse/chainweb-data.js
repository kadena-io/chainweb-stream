import defaults from 'lodash/defaults.js'
import { fetchWithRetry, getResponse } from './http.js';
import { config } from '../../config/index.js';
import { filterBlackListItems, sortEvents } from './utils.js';
import { writeFileSync } from 'fs';

const { dataHost } = config;

export async function getChainwebDataEvents(name, offset, limit = 50, logger) {
  const url = `http://${dataHost}/txs/events\?name\=${name}\&limit\=${limit}\&offset\=${offset}`;

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
  logger: console,
}

export async function syncEventsFromChainwebData(opts) {
  const {
    filter,
    limit,
    threads,
    newestToOldest,
    moduleHashBlacklist,
    totalLimit,
    untilHeight,
    logger,
  } = defaults(opts, syncEventsFromChainwebDataDefaults);

  let offset = 0;
  let promisedResults = [];
  let completedResults = [];
  let continueSync = true;

  while (continueSync) {
    for (let i = 0; i < threads; i++) {
      promisedResults.push(getChainwebDataEvents(filter, offset, limit, logger));
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

  writeFileSync('sync-event-data.json', JSON.stringify(completedResults));

  return completedResults;
}

