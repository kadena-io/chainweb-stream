import fetch, { Headers } from 'node-fetch';
import { config } from '../../config/index.js';
import { sleep } from './utils.js';

const { httpMaxRetries, httpRetryBackoffStep } = config;

export async function fetchWithRetry(url, opts = {}, tries = 0) {
  const { logger = console, ...fetchOpts } = opts ?? {};
  try {
    const method = opts?.method ?? 'GET';
    logger.debug(`${method} ${url}${tries ? ` [Retries: ${tries}]` : ''}`);
    const res = await fetch(url, fetchOpts);
    if (res.status >= 500) {
      const text = await res.text();
      throw text;
    }
    return res;
  } catch(e) {
    tries++;
    if (tries >= httpMaxRetries) {
      logger.error(`Caught ${e.message} - Retries exhausted\n${e.stack}`);
      throw e;
    }
    const timeout = httpRetryBackoffStep * Math.pow(tries, 2); // defaults 2*n^2 -- 2s, 8s, 18s, 32s, 50s, ...
    logger.warn(`Caught ${e.message}\nRetrying after ${timeout}ms`);
    await sleep(timeout);
    return fetchWithRetry(url, opts, tries);
  }
}

export async function postData(url = '', data = {}, logger = console) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    accept: 'application/json;blockheader-encoding=object',
  });

  const response = await fetchWithRetry(url, {
    method: 'POST',
    mode: 'no-cors',
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    headers,
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data),
    logger,
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
