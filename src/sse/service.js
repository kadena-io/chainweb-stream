import every from 'lodash/every.js';
import { filterBlackListItems, sortEvents } from './utils.js';
import fetch from 'node-fetch';
import { config } from '../../config/index.js';

export async function syncEventsFromChainWeaverData(
  name,
  limit = 50,
  threads = 4,
  newestToOldest = false,
  moduleHashBlacklist = [],
) {
  let offset = 0;
  let promisedResults = [];
  let completedResults = [];
  let continueSync = true;

  while (continueSync) {
    for (let i = 0; i < threads; i++) {
      promisedResults.push(getChainWeaverDataEvents(name, offset, limit));
      offset = offset + limit;
    }

    completedResults = await Promise.all(promisedResults);
    // once a batch comes back empty, we're caught up
    continueSync = every(completedResults.map((v) => v.length >= limit));
  }

  completedResults = filterBlackListItems(completedResults, moduleHashBlacklist);

  sortEvents(completedResults, newestToOldest);

  return completedResults;
}

export async function getChainWeaverDataEvents(name, offset, limit = 50) {
  const rawRes = await fetch(
    `http://${config.dataHost}/txs/events\?name\=${name}\&limit\=${limit}\&offset\=${offset}`,
  );
  const response = await rawRes;

  if (response.ok) {
    const resJSON = await rawRes.json();
    return resJSON;
  } else {
    const resTEXT = await rawRes.text();
    return resTEXT;
  }
}
