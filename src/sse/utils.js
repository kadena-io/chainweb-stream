import filter from 'lodash/filter.js';
import flatten from 'lodash/flatten.js';
import defaults from 'lodash/defaults.js';

export function sortEvents(completedResults, newestToOldest = false) {
  completedResults.sort((event1, event2) =>
    newestToOldest ? event2.height - event1.height : event1.height - event2.height,
  );

  return completedResults;
}

export function filterBlackListItems(completedResults, moduleHashBlacklist) {
  return filter(flatten(completedResults), ({ moduleHash }) => {
    return !moduleHashBlacklist.includes(moduleHash);
  });
}

export function getPreviousEventHeight(prevKdaEvents = [], prevEventHeight) {
  prevKdaEvents.forEach((event) => {
    if (event.height > prevEventHeight) {
      prevEventHeight = event.height;
    }
  });

  return prevEventHeight;
}

export async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function summarizeChainwebCut(data) {
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

const DEFAULT_RETRY_OPTIONS = {
  maxAttempts: 5,
  timeoutFn: n => Math.pow(n, 2) * 1000,
};

export async function withRetries(fn, options) {
  const { maxAttempts, timeoutFn } = defaults(options, DEFAULT_RETRY_OPTIONS);
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
        console.error(`Skipping retries: the timeoutFn passed to withRetries did not return a positive number`);
        throw e;
      }
      console.warn(`withRetries: ${process.env.ENV} Retryable error (${attempts}/${maxAttempts}; retry in ${timeout}ms): ${e.message}`);
      await sleep(timeout);
      attempts++;
    }
  }
}

function isPositiveNumber(num) {
  return Number.isFinite(num) && num > 0;
}

function isNonNegativeNumber(num) {
  return Number.isFinite(num) && num >= 0;
}
