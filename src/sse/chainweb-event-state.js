import {
  getRedisUnconfirmedEvents,
  getRedisConfirmedEvents,
  getRedisOrphanedEvents,
  setRedisUnconfirmedEvents,
  setRedisConfirmedEvents,
  setRedisOrphanedEvents,
} from './redis/index.js';

function heightSorter(a, b) {
  // sort high to low heights
  return a.height < b.height ? 1 : -1;
}

function presentEvents(sources, options) {
  const { minHeight, maxHeight, limit } = options;

  const filterPredicates = [];
  if (minHeight) {
    filterPredicates.push(event => event.height >= minHeight);
  }
  if (maxHeight) {
    filterPredicates.push(event => event.height <= maxHeight);
  }

  const output = sources.reduce((out, arr) => {
    if (filterPredicates.length) {
      arr = arr.filter(event => filterPredicates.every(pred => pred(event)));
    }
    return out.concat(arr);
  }, []);

  if (options.sort) {
    output.sort(heightSorter);
  }
  return options.limit ? output.slice(0, limit) : output;
}

export default class ChainwebEventServiceState {
  unconfirmed = []
  confirmed = []
  orphaned = []

  constructor({ filter }) {
    this._filter = filter;
  }

  async load() {
    const [
      unconfirmed,
      confirmed,
      orphaned,
    ] = await Promise.all([
      getRedisConfirmedEvents(this._filter),
      getRedisUnconfirmedEvents(this._filter),
      getRedisOrphanedEvents(this._filter),
    ]);
    this.unconfirmed = unconfirmed ?? [];
    this.confirmed = confirmed ?? [];
    this.orphaned = orphaned ?? [];
  }

  async save() {
    await Promise.all([
      setRedisConfirmedEvents(this._filter, this.confirmed),
      setRedisUnconfirmedEvents(this._filter, this.unconfirmed),
      setRedisOrphanedEvents(this._filter, this.orphaned),
    ]);
  }

  get summary() {
    return `confirmed=${this.confirmed.length} unconfirmed=${this.unconfirmed.length} orphaned=${this.orphaned.length}`;
  }

  getAllEvents({ minHeight, maxHeight, limit } = {}) {
    return presentEvents(
      [this.unconfirmed, this.confirmed, this.orphaned],
      { minHeight, maxHeight, limit, sort: true },
    );
  }

  getConfirmedEvents({ minHeight, maxHeight, limit } = {}) {
    return presentEvents(
      [this.confirmed],
      { minHeight, maxHeight, limit, sort: false },
    );
  }

  getOrphanedEvents({ minHeight, maxHeight, limit } = {}) {
    return presentEvents(
      [this.orphaned],
      { minHeight, maxHeight, limit, sort: false },
    );
  }

  add(permanence, event) {
    this[permanence].push(event) // TODO change this to push in-place / sorted
  }


  eventExists(needle, collection) {
    if (!collection) {
      return this.eventExists(needle, this.unconfirmed) ||
        this.eventExists(needle, this.confirmed) ||
        this.eventExists(needle, this.orphaned);
    }
    const { height, requestKey, blockHash } = needle;
    let needleJson; // lazily create needle JSON - if needed only
    for(const event of collection) {
      if (event.height !== height || event.requestKey !== requestKey || event.blockHash !== blockHash) {
        // return early if basic stuff is different - save us a JSON.stringify
        continue;
      }
      if (event.height < height) {
        // we went past the needle event height, we can stop scanning
        // assumes collections are sorted(!)
        break;
      }
      if (!needleJson) {
        needleJson = JSON.stringify(needle);
      }
      // could figure out a better way to compare
      // but essentially we need most attributes to find duplicates
      // e.g. a safe transfer txn is 2x coin.TRANSFER w/ same everything except params
      if (needleJson === JSON.stringify(event)) {
        return true;
      }
    }
    return false;
  }

}
