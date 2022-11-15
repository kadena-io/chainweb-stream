import { writeFileSync } from 'fs';
import every from 'lodash/every.js';
import { filterBlackListItems, sortEvents } from './utils.js';
import fetch, { Headers } from 'node-fetch';
import { config } from '../../config/index.js';
import { fetchWithRetry, postData, getResponse } from './http.js';
import { getChainWebDataEvents } from './chainweb-data.js';

const { chainwebHost, dataHost, network } = config;

export async function syncEventsFromChainWebData(
  name,
  limit = 50,
  threads = 4,
  newestToOldest = false,
  moduleHashBlacklist = [],
  totalLimit = 800,
) {
  let offset = 0;
  let promisedResults = [];
  let completedResults = [];
  let continueSync = true;

  while (continueSync) {
    for (let i = 0; i < threads; i++) {
      promisedResults.push(getChainWebDataEvents(name, offset, limit));
      offset = offset + limit;
    }
    console.log('batch pushed, end offset', offset);
    completedResults = await Promise.all(promisedResults);
    debugger;
    // once a batch comes back empty, we're caught up
    continueSync = every(completedResults.map((v) => v.length >= limit)) &&
      ( totalLimit > 0 ?
        completedResults.reduce((total, results) => total + results.length, 0) <= totalLimit
        : true );
  }

  console.log('sync fetch finished');

  completedResults = filterBlackListItems(completedResults, moduleHashBlacklist);

  sortEvents(completedResults, newestToOldest);

  console.log('sync finished', completedResults.length);

  writeFileSync('sync-event-data.json', JSON.stringify(completedResults));

  return completedResults;
}

