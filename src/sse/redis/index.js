import {
  getRedisKeyJSON,
  setRedisKeyJSON,
  clearRedis as _clearRedis,
  KEY_SUFFIX_CONFIRMED,
  KEY_SUFFIX_UNCONFIRMED,
  KEY_SUFFIX_ORPHANED,
  KEY_SUFFIX_LAST_STATE,
} from './client.js';
import { validateType } from '../types.js';

function makeKey(base, suffix) {
  validateType('REDIS', 'filter', suffix, 'string');
  return `${base}:${suffix}`;
}

export function getRedisConfirmedEvents(filter) {
  const key = makeKey(KEY_SUFFIX_CONFIRMED, filter);
  return getRedisKeyJSON(key);
}

export function setRedisConfirmedEvents(filter, events) {
  const key = makeKey(KEY_SUFFIX_CONFIRMED, filter);
  return setRedisKeyJSON(key, events);
}

export function getRedisUnconfirmedEvents(filter) {
  const key = makeKey(KEY_SUFFIX_UNCONFIRMED, filter);
  return getRedisKeyJSON(key);
}

export function setRedisUnconfirmedEvents(filter, events) {
  const key = makeKey(KEY_SUFFIX_UNCONFIRMED, filter);
  return setRedisKeyJSON(key, events);
}

export function getRedisOrphanedEvents(filter) {
  const key = makeKey(KEY_SUFFIX_ORPHANED, filter);
  return getRedisKeyJSON(key);
}

export function setRedisOrphanedEvents(filter, events) {
  const key = makeKey(KEY_SUFFIX_ORPHANED, filter);
  return setRedisKeyJSON(key, events);
}

export function getRedisLastState(filter) {
  const key = makeKey(KEY_SUFFIX_LAST_STATE, filter);
  return getRedisKeyJSON(key);
}

export function setRedisLastState(filter, state) {
  const key = makeKey(KEY_SUFFIX_LAST_STATE, filter);
  return setRedisKeyJSON(key, state);
}

export const clearRedis = _clearRedis; // In TS we will do `export clearRedis from './client`
