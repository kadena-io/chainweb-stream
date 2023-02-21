import filter from 'lodash/filter.js';
import flatten from 'lodash/flatten.js';
import defaults from 'lodash/defaults.js';
import { ChainwebCutData, ChainwebBaseData, isPositiveNumber, isNonNegativeNumber } from './types';
import Logger from './logger';

export function sortEvents(completedResults: ChainwebBaseData[], newestToOldest = false) {
  completedResults.sort((event1, event2) =>
    newestToOldest ? event2.height - event1.height : event1.height - event2.height,
  );

  return completedResults;
}

export function filterBlackListItems(completedResults: ChainwebBaseData[], moduleHashBlacklist: string[]) {
  return filter(flatten(completedResults), ({ moduleHash }) => {
    return !moduleHashBlacklist.includes(moduleHash);
  });
}

export function getPreviousEventHeight(prevKdaEvents: ChainwebBaseData[]  = [], prevEventHeight: number) {
  prevKdaEvents.forEach((event) => {
    if (event.height > prevEventHeight) {
      prevEventHeight = event.height;
    }
  });

  return prevEventHeight;
}

export async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface ChainwebCutSummary {
  instance: string;
  min: number;
  max: number;
  height: number;
}

export function summarizeChainwebCut(data: ChainwebCutData): ChainwebCutSummary {
  if (!data?.hashes) {
    return;
  }
  const { instance, hashes, height } = data;
  const [min, max] = Object.entries(hashes).reduce((out, [_, { height }]) => {
    if (out[0] > height)
      out[0] = height
    if (out[1] < height) {
      out[1] = height
    }
    return out;
  }, [Infinity, -Infinity]);
  return { instance, min, max, height };
}

interface WithRetriesOptions {
  timeoutFn?: (n: number) => number;
  maxAttempts?: number;
  logger?: Logger;
}

const DEFAULT_RETRY_OPTIONS: WithRetriesOptions = {
  maxAttempts: 5,
  timeoutFn: n => Math.pow(n, 2) * 1000,
};

export async function withRetries<T>(fn: (...props: any[]) => T, options: WithRetriesOptions): Promise<T> {
  const { maxAttempts, timeoutFn, logger } = defaults(options, DEFAULT_RETRY_OPTIONS);
  let attempts = 1;

  // maxAttempts > 0
  if (!isPositiveNumber(maxAttempts)) {
    throw new Error(`withRetries: expected positive maxAttempts, received ${maxAttempts}`);
  }

  // test first timeoutFn value
  // so as to fail deterministically if that is incorrect, instead of rely on fn() failing to trigger it
  const firstTimeout = timeoutFn(1);
  if (!isNonNegativeNumber(firstTimeout)) {
    throw new Error(`withRetries: timeoutFn expected to return positive number, received ${firstTimeout}`);
  }

  while(true) {
    try {
      return await fn();
    } catch(e) {
      if (attempts > maxAttempts) {
        throw e;
      }
      const timeout = timeoutFn(attempts);
      // timeout >= 0
      if (!isNonNegativeNumber(timeout)) {
        logger.error(`Skipping retries: the timeoutFn passed to withRetries did not return a positive number`);
        throw e;
      }
      logger.warn(`withRetries: ${process.env.ENV} Retryable error (${attempts}/${maxAttempts}; retry in ${timeout}ms): ${e.message}`);
      await sleep(timeout);
      attempts++;
    }
  }
}
