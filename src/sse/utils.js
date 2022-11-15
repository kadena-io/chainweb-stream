import filter from 'lodash/filter.js';
import flatten from 'lodash/flatten.js';

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
