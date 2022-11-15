import fetch, { Headers } from 'node-fetch';
import { config } from '../../config/index.js';
import { sleep } from './utils.js';

const { httpMaxRetries, httpRetryBackoffStep } = config;

export async function fetchWithRetry(url, opts = undefined, tries = 0) {
  try {
    const res = await fetch(url, opts);
    if (res.status >= 500) {
      const text = await res.text();
      throw text;
    }
    return res;
  } catch(e) {
    tries++;
    if (tries >= httpMaxRetries) {
      console.error(`Caught ${e.message} - Retries exhausted\n${e.stack}`);
      throw e;
    }
    const timeout = httpRetryBackoffStep * Math.pow(tries, 2); // defaults 2*n^2 -- 2s, 8s, 18s, 32s, 50s, ...
    console.error(`Caught ${e.message}\nRetrying after ${timeout}ms`);
    await sleep(timeout);
    return fetchWithRetry(url, opts, tries);
  }
}

export async function postData(url = '', data = {}, tries = 0) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    accept: 'application/json;blockheader-encoding=object',
  });

  console.error(`Posting to ${url} ${JSON.stringify(data)}`);

  const response = await fetchWithRetry(url, {
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

export async function getResponse(rawRes) {
  const response = await rawRes;

  if (response.ok) {
    const resJSON = await rawRes.json();
    return resJSON;
  } else {
    const resTEXT = await rawRes.text();
    return resTEXT;
  }
}
