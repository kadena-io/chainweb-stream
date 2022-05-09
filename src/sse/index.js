import SSE from 'express-sse';
import { config } from '../../config/index.js';
import { detectOrphan, deleteOrphanEventsFromCache } from './orphans.js';
import { syncEventsFromChainWeaverData } from './service.js';
import { getPreviousEventHeight } from './utils.js';
// get latest data from db if needed

export let kdaEvents = [];
export let orphans = {};
export let lowestOrphanBlockheight;
export let highestNonOrphanBlockheight = 0;
export let continueStreaming = true;

let initialEventsPoolCreated = false;
let prevEventHeight = 0;

export const sse = new SSE({ kdaEvents, orphans }, { initialEvent: 'k:init' });

const getKdaEvents = async (prevKdaEvents) => {
  const newKdaEvents = [];
  const oldKdaEvents = [];
  const orphanKeyMap = {};

  const marmaladeEvents = await syncEventsFromChainWeaverData(
    'marmalade.',
    100,
    4,
    true,
    config.moduleHashBlacklist,
  );

  prevEventHeight = getPreviousEventHeight(prevKdaEvents, prevEventHeight);

  marmaladeEvents.forEach((event) => {
    if (event.height > prevEventHeight) {
      newKdaEvents.push(event);
      prevEventHeight = event.height;
    } else if (event.height <= prevEventHeight) {
      oldKdaEvents.push(event);
    }
    marmaladeEvents.forEach((event2) => {
      if (
        !orphans[event.requestKey] &&
        event.requestKey === event2.requestKey &&
        event.blockHash !== event2.blockHash
      ) {
        orphanKeyMap[event.requestKey] = detectOrphan(event, event2);

        if (!lowestOrphanBlockheight || lowestOrphanBlockheight > event.height) {
          lowestOrphanBlockheight = event.height;
        }
        return false;
      }
    });

    marmaladeEvents.forEach(() => {
      if (event.height < lowestOrphanBlockheight && event.height > highestNonOrphanBlockheight) {
        highestNonOrphanBlockheight = event.height;
      }
    });
  });

  return { oldKdaEvents, newKdaEvents, orphanKeyMap };
};

export const updateClient = async (prevKdaEvents) => {
  try {
    const { newKdaEvents, orphanKeyMap, oldKdaEvents } = await getKdaEvents(prevKdaEvents);

    if (!initialEventsPoolCreated) {
      initialEventsPoolCreated = true;
      sse.send(oldKdaEvents, 'k:update');
      kdaEvents.push(...oldKdaEvents);
    }
    kdaEvents.push(...newKdaEvents);

    kdaEvents = deleteOrphanEventsFromCache(orphanKeyMap, kdaEvents);

    sse.send(newKdaEvents, 'k:update');

    orphans = { ...orphans, ...orphanKeyMap };

    if (Object.keys(orphanKeyMap).length > 0) {
      sse.send(orphanKeyMap, 'k:update:orphans');
    }

    return { kdaEvents, newKdaEvents, orphans };
  } catch (error) {
    // TODO implement status codes
    sse.send({ message: 'something went wrong', type: error.type }, 'k:error');
    return { kdaEvents, prevKdaEvents, orphans };
  }
};

const startStreamingUpdates = async () => {
  while (continueStreaming) {
    await updateClient(kdaEvents, initialEventsPoolCreated);
    await new Promise((r) => setTimeout(r, 60000));
  }

  return { message: 'Streaming stopped' };
};

export const stopStreaming = function () {
  continueStreaming = false;
};

export const startStreaming = function () {
  startStreamingUpdates(kdaEvents).then((event) => {
    console.log(event.message);
  });
};
