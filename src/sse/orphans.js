import { getBlockHeaderBranch } from './chainweb-node.js';

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
  const hash = chainwebCut.hashes[chain].hash;

  const response = await getBlockHeaderBranch({ chain, hash, height });

  if (!response?.items?.length)
    return false;

  return response.items[0].hash !== blockHash;
}
