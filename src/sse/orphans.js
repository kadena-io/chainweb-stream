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

export function detectOrphan(event1, event2) {
  return event2;
}
