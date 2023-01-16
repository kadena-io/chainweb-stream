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

function makeKey(base, type, suffix) {
  validateType('REDIS', 'type', type, 'string');
  validateType('REDIS', 'filter', suffix, 'string');
  return `${base}:${type}:${suffix}`;
}

export function getRedisConfirmedEvents(type, filter) {
  const key = makeKey(KEY_SUFFIX_CONFIRMED, type, filter);
  return getRedisKeyJSON(key);
}

export function setRedisConfirmedEvents(type, filter, events) {
  const key = makeKey(KEY_SUFFIX_CONFIRMED, type, filter);
  return setRedisKeyJSON(key, events);
}

export function getRedisUnconfirmedEvents(type, filter) {
  const key = makeKey(KEY_SUFFIX_UNCONFIRMED, type, filter);
  return getRedisKeyJSON(key);
}

export function setRedisUnconfirmedEvents(type, filter, events) {
  const key = makeKey(KEY_SUFFIX_UNCONFIRMED, type, filter);
  return setRedisKeyJSON(key, events);
}

export function getRedisOrphanedEvents(type, filter) {
  const key = makeKey(KEY_SUFFIX_ORPHANED, type, filter);
  return getRedisKeyJSON(key);
}

export function setRedisOrphanedEvents(type, filter, events) {
  const key = makeKey(KEY_SUFFIX_ORPHANED, type, filter);
  return setRedisKeyJSON(key, events);
}

export function getRedisLastState(type, filter) {
  const key = makeKey(KEY_SUFFIX_LAST_STATE, type, filter);
  return getRedisKeyJSON(key);
}

export function setRedisLastState(type, filter, state) {
  const key = makeKey(KEY_SUFFIX_LAST_STATE, type, filter);
  return setRedisKeyJSON(key, state);
}

export const clearRedis = _clearRedis; // In TS we will do `export clearRedis from './client`
