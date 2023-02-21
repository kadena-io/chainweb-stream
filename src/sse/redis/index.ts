import {
  getRedisKeyJSON,
  setRedisKeyJSON,
  clearRedis as _clearRedis,
  KEY_SUFFIX_CONFIRMED,
  KEY_SUFFIX_UNCONFIRMED,
  KEY_SUFFIX_ORPHANED,
  KEY_SUFFIX_LAST_STATE,
} from './client';
import { TransactionType, GenericData, validateType } from '../types';

function makeKey(base, type: TransactionType, suffix) {
  validateType('REDIS', 'type', type, 'string');
  validateType('REDIS', 'filter', suffix, 'string');
  return `${base}:${type}:${suffix}`;
}

export function getRedisConfirmedEvents(type: TransactionType, filter: string) {
  const key = makeKey(KEY_SUFFIX_CONFIRMED, type, filter);
  return getRedisKeyJSON(key);
}

export function setRedisConfirmedEvents(type: TransactionType, filter: string, events: GenericData[]) {
  const key = makeKey(KEY_SUFFIX_CONFIRMED, type, filter);
  return setRedisKeyJSON(key, events);
}

export function getRedisUnconfirmedEvents(type: TransactionType, filter: string) {
  const key = makeKey(KEY_SUFFIX_UNCONFIRMED, type, filter);
  return getRedisKeyJSON(key);
}

export function setRedisUnconfirmedEvents(type: TransactionType, filter: string, events: GenericData[]) {
  const key = makeKey(KEY_SUFFIX_UNCONFIRMED, type, filter);
  return setRedisKeyJSON(key, events);
}

export function getRedisOrphanedEvents(type: TransactionType, filter: string) {
  const key = makeKey(KEY_SUFFIX_ORPHANED, type, filter);
  return getRedisKeyJSON(key);
}

export function setRedisOrphanedEvents(type: TransactionType, filter: string, events: GenericData[]) {
  const key = makeKey(KEY_SUFFIX_ORPHANED, type, filter);
  return setRedisKeyJSON(key, events);
}

// export function getRedisLastState(type: TransactionType, filter: string) {
//   const key = makeKey(KEY_SUFFIX_LAST_STATE, type, filter);
//   return getRedisKeyJSON(key);
// }
// 
// export function setRedisLastState(type: TransactionType, filter: string, state) {
//   const key = makeKey(KEY_SUFFIX_LAST_STATE, type, filter);
//   return setRedisKeyJSON(key, state);
// }

export const clearRedis = _clearRedis; // In TS we will do `export clearRedis from './client`
