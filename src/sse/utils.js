import filter from 'lodash/filter';
import flatten from 'lodash/flatten';
import { highestNonOrphanBlockheight, lowestOrphanBlockheight } from './index.js';

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

export function getPreviousEventHeight(prevKdaEvents, prevEventHeight) {
  prevKdaEvents.forEach((event) => {
    if (event.height > prevEventHeight) {
      prevEventHeight = event.height;
    }
  });

  return prevEventHeight;
}
