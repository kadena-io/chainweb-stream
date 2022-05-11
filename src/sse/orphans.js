import { getBlockHeaderBranch } from './service.js';

export function deleteOrphanEventsFromCache(orphanKeymap, kdaEventArray) {
  const filteredEvents = kdaEventArray.filter((event) => {
    if (
      orphanKeymap[event.requestKey] &&
      orphanKeymap[event.requestKey].blockHash === event.blockHash
    ) {
      return false;
    }

    return true;
  });

  return filteredEvents;
}

export async function isOrphan({ chain, height, blockHash }, chainwebCut) {
  const upper = chainwebCut.hashes[chain].hash;

  const response = await getBlockHeaderBranch({ chain, upper, height });

  return response.items[0].hash !== blockHash;
}
