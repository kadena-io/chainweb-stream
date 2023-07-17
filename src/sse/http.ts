import { default as fetch, Headers, RequestInit } from 'node-fetch';
import config from '../config/index.js';
import { sleep } from './utils.js';
import Logger from '../logger.js';

const { httpMaxRetries, httpRetryBackoffStep } = config;

interface FetchWithRetryOptions extends RequestInit {
  logger?: Logger;
}

export async function fetchWithRetry(url: string, opts: FetchWithRetryOptions = {}, tries = 0) {
  const {
    logger = new Logger('Fetch'),
    ...fetchOpts
  } = opts ?? {};

  try {
    const method = opts?.method ?? 'GET';
    logger.debug(`${method} ${url}${tries ? ` [Retries: ${tries}]` : ''}`);
    const res = await fetch(url, fetchOpts);
    const { status } = res;
    if (status >= 400) {
      let text = '<Could not get response text>';
      try { // try/catch just in case/for robustness
        text = await res.text();
      } catch(e) {}
      const message = `${status} ${text}`;
      throw new Error(message);
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

export async function postData(url = '', data = {}, logger = new Logger()) {
  const headers = new Headers({
    'Content-Type': 'application/json',
    accept: 'application/json;blockheader-encoding=object',
  });

  const response = await fetchWithRetry(url, {
    method: 'POST',
    // mode: 'no-cors',
    // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
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
