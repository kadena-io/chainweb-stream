import every from 'lodash/every.js';
import { filterBlackListItems, sortEvents } from './utils.js';
import fetch, { Headers } from 'node-fetch';
import { config } from '../../config/index.js';

async function getResponse(rawRes) {
  const response = await rawRes;

  if (response.ok) {
    const resJSON = await rawRes.json();
    return resJSON;
  } else {
    const resTEXT = await rawRes.text();
    return resTEXT;
  }
}

async function postData(url = '', data = {}) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    accept: 'application/json;blockheader-encoding=object',
  });

  const response = await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    headers,
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data),
  });
  return response;
}

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

  return getResponse(rawRes);
}

export async function getChainwebCut() {
  const rawRes = await fetch(`https://${config.chainwebHost}/chainweb/0.0/testnet04/cut`);

  return getResponse(rawRes);
}

export async function getBlockHeaderBranch({ chain, upper, height, limit = 10 }) {
  const rawRes = await postData(
    `https://${config.chainwebHost}/chainweb/0.0/testnet04/chain/${chain}/header/branch?minheight=${height}&maxheight=${height}`,
    { lower: [], upper: [upper] },
  );

  return getResponse(rawRes);
}
