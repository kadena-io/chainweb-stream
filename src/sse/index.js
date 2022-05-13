import SSE from 'express-sse';
import { config } from '../../config/index.js';
import { isOrphan, deleteOrphanEventsFromCache } from './orphans.js';
import { getChainwebCut, syncEventsFromChainWeaverData } from './service.js';
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

const getKdaEvents = async (prevKdaEvents, chainwebCut) => {
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

  for (let index = 0; index < marmaladeEvents.length; index++) {
    const event = marmaladeEvents[index];

    if (event.height > prevEventHeight) {
      newKdaEvents.push(event);
      prevEventHeight = event.height;
    } else if (event.height <= prevEventHeight) {
      oldKdaEvents.push(event);
    }

    for (let innerIndex = 0; innerIndex < marmaladeEvents.length; innerIndex++) {
      const event2 = marmaladeEvents[innerIndex];

      if (
        !orphans[event.requestKey] &&
        event.requestKey === event2.requestKey &&
        event.blockHash !== event2.blockHash
      ) {
        const [isEventOrphan, isEvent2Orphan] = await Promise.all([
          isOrphan(event, chainwebCut),
          isOrphan(event2, chainwebCut),
        ]);

        if (isEventOrphan) {
          orphanKeyMap[event.requestKey] = { ...event, isOrphan: true };

          if (!lowestOrphanBlockheight || lowestOrphanBlockheight > event.height) {
            lowestOrphanBlockheight = event.height;
          }
        } else if (isEvent2Orphan) {
          orphanKeyMap[event2.requestKey] = event2;

          if (!lowestOrphanBlockheight || lowestOrphanBlockheight > event2.height) {
            lowestOrphanBlockheight = event2.height;
          }
        }
      }
    }

    marmaladeEvents.forEach(() => {
      if (event.height < lowestOrphanBlockheight && event.height > highestNonOrphanBlockheight) {
        highestNonOrphanBlockheight = event.height;
      }
    });
  }

  return { oldKdaEvents, newKdaEvents, orphanKeyMap };
};

export const updateClient = async (prevKdaEvents, chainwebCut) => {
  try {
    const { newKdaEvents, orphanKeyMap, oldKdaEvents } = await getKdaEvents(
      prevKdaEvents,
      chainwebCut,
    );

    if (!initialEventsPoolCreated) {
      initialEventsPoolCreated = true;
      sse.send(oldKdaEvents, 'k:update');
      kdaEvents.push(...oldKdaEvents);
    }

    const orphanlessKdaEvents = deleteOrphanEventsFromCache(orphanKeyMap, newKdaEvents);
    console.log(kdaEvents.length, orphanlessKdaEvents);
    kdaEvents = [...deleteOrphanEventsFromCache(orphanKeyMap, kdaEvents), ...orphanlessKdaEvents];
    console.log(kdaEvents.length);

    if (Object.keys(orphanlessKdaEvents).length > 0) {
      sse.send(orphanlessKdaEvents, 'k:update');
    }

    orphans = { ...orphans, ...orphanKeyMap };
    console.log(orphans);

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
    const chainwebCut = await getChainwebCut();
    await updateClient(kdaEvents, chainwebCut);
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
