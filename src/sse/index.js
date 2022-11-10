import SSE from 'express-sse';
import { config } from '../../config/index.js';
import { isOrphan, deleteOrphanEventsFromCache } from './orphans.js';
import { getChainwebCut, syncEventsFromChainWebData } from './service.js';
import { getPreviousEventHeight } from './utils.js';
import { createClient } from 'redis';

// get latest data from db if needed

/**
 * When an event is issued by an orphan refresh the page are send the enitire cache to the page as a rehydrate
 *
 *
 * /local gets the bleeding edge events probability is lowest that something change
 *
 * First fill the cache
 * The call data specific events
 *
 *
 */
export let lowestOrphanBlockheight;
export let highestNonOrphanBlockheight = 0;
export let continueStreaming = true;

let prevEventHeight = 0;

const { redisPassword } = config;

const redisOptions = redisPassword ? { password: redisPassword } : {};
let client;
try {
  client = createClient(redisOptions);
} catch(e) {
  console.error(e);
  console.error(e.message);
  process.exit(1);
}
client.on('error', (err) => console.error('Redis Client Error', err));

await client.connect();

export async function clearRedisKDAEvents() {
  try {
    await client.set('kdaEvents', JSON.stringify([]));
    return 'succes';
  } catch (error) {
    return { error };
  }
}

export async function getRedisKdaEvents() {
  const events = await client.get('kdaEvents');
  return JSON.parse(events) || [];
}

export async function getOrphansKdaEvents() {
  const events = await client.get('orphans');
  return JSON.parse(events) || [];
}

const kdaEventsR = await getRedisKdaEvents();
const orphanEventsR = await getOrphansKdaEvents();

export const sse = new SSE(
  { kdaEvents: kdaEventsR, orphans: orphanEventsR },
  { initialEvent: 'k:init' },
);

const getKdaEvents = async (prevKdaEvents, chainwebCut) => {
  let newKdaEvents = [];
  const orphanKeyMap = {};

  try {
    const marmaladeEvents = await syncEventsFromChainWebData(
      'marmalade.',
      100,
      4,
      true,
      config.moduleHashBlacklist,
    );

    if (prevKdaEvents.length === 0) {
      newKdaEvents = marmaladeEvents;
    }

    const orphanEventsR = await getOrphansKdaEvents();
    prevEventHeight = getPreviousEventHeight(prevKdaEvents, prevEventHeight);

    for (let index = 0; index < marmaladeEvents.length; index++) {
      const event = marmaladeEvents[index];

      if (event.height > prevEventHeight) {
        newKdaEvents.push(event);
        prevEventHeight = event.height;
      }

      for (let innerIndex = 0; innerIndex < marmaladeEvents.length; innerIndex++) {
        const event2 = marmaladeEvents[innerIndex];

        if (
          !orphanEventsR[event.requestKey] &&
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
  } catch (error) {
    console.log(error);
    sse.send({ message: 'something went wrong', type: error.type }, 'k:error');
  }

  return { newKdaEvents, orphanKeyMap };
};

export const updateClient = async (prevKdaEvents, chainwebCut) => {
  try {
    const { newKdaEvents, orphanKeyMap } = await getKdaEvents(prevKdaEvents, chainwebCut);

    const orphanlessKdaEvents = deleteOrphanEventsFromCache(orphanKeyMap, newKdaEvents);

    if (orphanlessKdaEvents.length > 0) {
      sse.send(orphanlessKdaEvents, 'k:update');
      await client.set('kdaEvents', JSON.stringify(orphanlessKdaEvents));
    }

    let orphansList = await getOrphansKdaEvents();
    if (orphansList.length > 0 || Object.keys(orphanKeyMap).length > 0) {
      orphansList = { ...orphansList, ...orphanKeyMap };
      await client.set('orphans', JSON.stringify(orphansList));
      sse.send(orphansList, 'k:update:orphans');
    }

    return { newKdaEvents, orphans: orphansList };
  } catch (error) {
    // TODO implement status codes
    console.log({ error });
    sse.send({ message: 'something went wrong', type: error.type }, 'k:error');
  }
};

const startStreamingUpdates = async () => {
  while (continueStreaming) {
    const kdaEventsR = await getRedisKdaEvents();
    const chainwebCut = await getChainwebCut();

    await updateClient(kdaEventsR, chainwebCut);

    await new Promise((r) => setTimeout(r, 60000));
  }

  return { message: 'Streaming stopped' };
};

export const stopStreaming = function () {
  continueStreaming = false;
};

export const startStreaming = function () {
  startStreamingUpdates().then((event) => {
    console.log(event.message);
  });
};
