import Logger from '../logger.js';

import {
  getRedisConfirmedEvents,
  getRedisOrphanedEvents,
  getRedisUnconfirmedEvents,
  setRedisConfirmedEvents,
  setRedisOrphanedEvents,
  setRedisUnconfirmedEvents,
} from './redis/index.js';
import { GenericData, TransactionType } from './types.js';

type DataFilterPredicate = (data: GenericData) => boolean;

interface IGetEventOptions {
  minHeight?: number;
  maxHeight?: number;
  limit?: number;
}

interface IPresentEventOptions extends IGetEventOptions {
  sort?: boolean;
}

function heightSorter(a: GenericData, b: GenericData): 1 | -1 {
  // sort high to low heights
  return a.height < b.height ? 1 : -1;
}

function presentEvents(sources: GenericData[][], options: IPresentEventOptions): GenericData[] {
  const { minHeight, maxHeight, limit } = options;
  if (limit === 0) {
    // early return
    return [];
  }
  const filterPredicates: DataFilterPredicate[] = [];
  if (minHeight !== undefined) {
    filterPredicates.push((event) => event.height >= minHeight);
  }
  if (maxHeight !== undefined) {
    filterPredicates.push((event) => event.height <= maxHeight);
  }

  const output = sources.reduce((out, arr) => {
    if (filterPredicates.length) {
      // TODO if we have a limit set and a lot of data
      // we can save a bunch by returning up to limit from each arr
      arr = arr.filter((event) => filterPredicates.every((pred) => pred(event)));
    }
    return out.concat(arr);
  }, []);

  if (options.sort) {
    output.sort(heightSorter);
  }
  return options.limit !== undefined ? output.slice(0, limit) : output;
}

export default class ChainwebEventServiceState {
  private _type: TransactionType;
  private _filter: string;
  private _logger: Logger;

  public unconfirmed: GenericData[] = [];
  public confirmed: GenericData[] = [];
  public orphaned: GenericData[] = [];

  public constructor({ type, filter, logger }) {
    this._type = type;
    this._filter = filter;
    this._logger = logger;
  }

  public async load(): Promise<void> {
    const [unconfirmed, confirmed, orphaned] = await Promise.all([
      getRedisUnconfirmedEvents(this._type, this._filter),
      getRedisConfirmedEvents(this._type, this._filter),
      getRedisOrphanedEvents(this._type, this._filter),
    ]);
    this.unconfirmed = unconfirmed ?? [];
    this.confirmed = confirmed ?? [];
    this.orphaned = orphaned ?? [];
  }

  public async save(): Promise<void> {
    await Promise.all([
      setRedisConfirmedEvents(this._type, this._filter, this.confirmed),
      setRedisUnconfirmedEvents(this._type, this._filter, this.unconfirmed),
      setRedisOrphanedEvents(this._type, this._filter, this.orphaned),
    ]);
  }

  public get summary(): string {
    return `confirmed=${this.confirmed.length} unconfirmed=${this.unconfirmed.length} orphaned=${this.orphaned.length}`;
  }

  public getAllEvents({ minHeight, maxHeight, limit }: IGetEventOptions = {}): GenericData[] {
    return presentEvents([this.unconfirmed, this.confirmed, this.orphaned], {
      minHeight,
      maxHeight,
      limit,
      sort: true,
    });
  }

  public getConfirmedEvents({ minHeight, maxHeight, limit }: IGetEventOptions = {}): GenericData[] {
    return presentEvents([this.confirmed], { minHeight, maxHeight, limit, sort: false });
  }

  public getOrphanedEvents({ minHeight, maxHeight, limit }: IGetEventOptions = {}): GenericData[] {
    return presentEvents([this.orphaned], { minHeight, maxHeight, limit, sort: false });
  }

  /* add deduped and sorted */
  public add(permanence, event): boolean {
    const { height } = event;
    for (let idx = 0; idx < this[permanence].length; idx++) {
      const existing = this[permanence][idx];
      if (existing.height > height) {
        continue;
      }
      if (existing.height <= height) {
        // we can insert if we need to
        if (this._eventExists(event, this[permanence], idx)) {
          // this.logger.warn(`Event ${event.requestKey} ${event.name} already in ${permanence}, not notifying`);
          return false;
        }
        this[permanence].splice(idx, 0, event);
        return true;
      }
    }
    // fallback; no existing events OR pushing oldest event
    this[permanence].push(event);
    return true;
  }

  public remove(permanence, event): boolean {
    const idx = this.unconfirmed.indexOf(event);
    if (idx === -1) {
      this._logger.warn(
        `Could not find event ${event.name} ${event.requestKey} from ${permanence} while trying to remove it from ${permanence}`,
      );
      return false;
    }
    this[permanence].splice(idx, 1);
    return true;
  }

  private _eventExists(needle: GenericData, collection: GenericData[], startIdx = 0): boolean {
    const {
      height,
      requestKey,
      blockHash,
      meta: { id },
    } = needle;
    for (let idx = startIdx; idx < collection.length; idx++) {
      const event = collection[idx];
      if (
        event.meta.id !== id ||
        event.height !== height ||
        event.requestKey !== requestKey ||
        event.blockHash !== blockHash
      ) {
        // return early if basic stuff is different - save us a JSON.stringify
        continue;
      }
      if (event.height < height) {
        // we went past the needle event height, we can stop scanning
        // assumes collections are sorted(!)
        break;
      }
      if (event.meta.id === id) {
        return true;
      }
    }
    return false;
  }
}
