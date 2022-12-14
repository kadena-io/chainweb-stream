import SSE from 'express-sse';
import { config } from '../../config/index.js';
import { isOrphan, deleteOrphanEventsFromCache } from './orphans.js';
import { getChainwebCut } from './chainweb-node.js';
import ChainwebEventService from './chainweb-event.js';

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
export let continueStreaming = false; // TODO 

let prevEventHeight = 0;
const { defaultFilter } = config;

const kdaEventsR = { kda: 'events' }; // await getRedisConfirmedEvents(defaultFilter);
const orphanEventsR = { kda: 'orphans' }; // await getRedisOrphanEvents(defaultFilter);

const cwEvents = new ChainwebEventService({ filter: defaultFilter });

await cwEvents.start();

export const sse = new SSE(
  { events: cwEvents.state.getConfirmedEvents(), },
  { initialEvent: 'k:init' },
);

// const getKdaEvents = async (prevKdaEvents, chainwebCut) => {
//   let newKdaEvents = [];
//   const orphanKeyMap = {};
// 
//   try {
//     const marmaladeEvents = await syncEventsFromChainwebData({
//       filter: 'marmalade.ledger',
//       limit: 100,
//       threads: 4,
//       newestToOldest: true,
//       moduleBlacklist: config.moduleHashBlacklist,
//     });
// 
//     if (prevKdaEvents.length === 0) {
//       newKdaEvents = marmaladeEvents;
//     }
// 
//     const orphanEventsR = await getRedisOrphanEvents(defaultFilter);
//     prevEventHeight = getPreviousEventHeight(prevKdaEvents, prevEventHeight);
// 
//     for (let index = 0; index < marmaladeEvents.length; index++) {
//       const event = marmaladeEvents[index];
// 
//       if (event.height > prevEventHeight) {
//         newKdaEvents.push(event);
//         prevEventHeight = event.height;
//       }
// 
//       for (let innerIndex = 0; innerIndex < marmaladeEvents.length; innerIndex++) {
//         const event2 = marmaladeEvents[innerIndex];
// 
//         if (
//           !orphanEventsR[event.requestKey] &&
//           event.requestKey === event2.requestKey &&
//           event.blockHash !== event2.blockHash
//         ) {
//           const [isEventOrphan, isEvent2Orphan] = await Promise.all([
//             isOrphan(event, chainwebCut),
//             isOrphan(event2, chainwebCut),
//           ]);
// 
//           if (isEventOrphan) {
//             orphanKeyMap[event.requestKey] = { ...event, isOrphan: true };
// 
//             if (!lowestOrphanBlockheight || lowestOrphanBlockheight > event.height) {
//               lowestOrphanBlockheight = event.height;
//             }
//           } else if (isEvent2Orphan) {
//             orphanKeyMap[event2.requestKey] = event2;
// 
//             if (!lowestOrphanBlockheight || lowestOrphanBlockheight > event2.height) {
//               lowestOrphanBlockheight = event2.height;
//             }
//           }
//         }
//       }
// 
//       marmaladeEvents.forEach(() => {
//         if (event.height < lowestOrphanBlockheight && event.height > highestNonOrphanBlockheight) {
//           highestNonOrphanBlockheight = event.height;
//         }
//       });
//     }
//   } catch (error) {
//     console.log(error);
//     sse.send({ message: 'something went wrong', type: error.type }, 'k:error');
//   }
// 
//   return { newKdaEvents, orphanKeyMap };
// };
// 
// export const updateClient = async (prevKdaEvents, chainwebCut) => {
//   try {
//     const { newKdaEvents, orphanKeyMap } = await getKdaEvents(prevKdaEvents, chainwebCut);
// 
//     const orphanlessKdaEvents = deleteOrphanEventsFromCache(orphanKeyMap, newKdaEvents);
// 
//     if (orphanlessKdaEvents.length > 0) {
//       sse.send(orphanlessKdaEvents, 'k:update');
//       await setRedisOrphanEvents(JSON.stringify(orphanlessKdaEvents));
//     }
// 
//     let orphansList = await getRedisOrphanEvents(defaultFilter);
//     if (orphansList.length > 0 || Object.keys(orphanKeyMap).length > 0) {
//       orphansList = { ...orphansList, ...orphanKeyMap };
//       await setRedisOrphanEvents(JSON.stringify(orphansList));
//       sse.send(orphansList, 'k:update:orphans');
//     }
// 
//     return { newKdaEvents, orphans: orphansList };
//   } catch (error) {
//     console.log({ error });
//     sse.send({ message: 'something went wrong', type: error.type }, 'k:error');
//   }
// };
// 
// const startStreamingUpdates = async () => {
//   while (continueStreaming) {
//     console.log("Starting update loop");
//     const kdaEventsR = await getRedisConfirmedEvents(defaultFilter);
//     const chainwebCut = await getChainwebCut();
// 
//     await updateClient(kdaEventsR, chainwebCut);
//     console.log("Update loop finished");
//     await sleep(60_000);
//   }
// 
//   return { message: 'Streaming stopped' };
// };
// 
// export const stopStreaming = function () {
//   continueStreaming = false;
// };
// 
// export const startStreaming = function () {
//   startStreamingUpdates().then((event) => {
//     console.log(event.message);
//   });
// };
