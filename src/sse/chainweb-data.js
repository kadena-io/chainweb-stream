import defaults from 'lodash/defaults.js'
import { fetchWithRetry, getResponse } from './http.js';
import { config } from '../../config/index.js';
import { filterBlackListItems, sortEvents } from './utils.js';
import { writeFileSync } from 'fs';

const { dataHost } = config;

export async function getChainwebDataEvents(name, offset, limit = 50, retry = 0) {
  const url = `http://${dataHost}/txs/events\?name\=${name}\&limit\=${limit}\&offset\=${offset}`;

  console.error(`GET ${url}`);
  const rawRes = await fetchWithRetry(url);

  const response = await getResponse(rawRes);
  console.log(`Got CW DataE o=${offset} l=${limit} len=${response.length}`);
  return response;
}

const syncEventsFromChainwebDataDefaults = {
  limit: 50,
  threads: 4,
  newestToOldest: false,
  moduleHashBlacklist: [],
  // totalLimit: 399, // DEBUG for quicker results
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
  } = defaults(opts, syncEventsFromChainwebDataDefaults);

  let offset = 0;
  let promisedResults = [];
  let completedResults = [];
  let continueSync = true;

  while (continueSync) {
    for (let i = 0; i < threads; i++) {
      promisedResults.push(getChainwebDataEvents(filter, offset, limit));
      offset = offset + limit;
    }
    console.log('batch pushed, end offset', offset);
    completedResults = await Promise.all(promisedResults);
    // once a batch comes back empty, we're caught up
    continueSync = completedResults.every((v) => v.length >= limit) &&
      ( totalLimit === 0  ||
        completedResults.reduce((total, results) => total + results.length, 0) <= totalLimit
      );
  }

  console.log('sync fetch finished');

  completedResults = filterBlackListItems(completedResults, moduleHashBlacklist);

  sortEvents(completedResults, newestToOldest);

  console.log('sync finished', completedResults.length);

  writeFileSync('sync-event-data.json', JSON.stringify(completedResults));

  return completedResults;
}

