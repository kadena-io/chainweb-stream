import {
  getRedisKeyJSON,
  setRedisKeyJSON,
  clearRedis as _clearRedis,
  KEY_SUFFIX_CONFIRMED,
  KEY_SUFFIX_UNCONFIRMED,
  KEY_SUFFIX_ORPHANED,
  KEY_SUFFIX_LAST_STATE,
} from './client.js';

export function getRedisConfirmedEvents() {
  return getRedisKeyJSON(`${KEY_SUFFIX_CONFIRMED}`);
}

export function setRedisConfirmedEvents(events) {
  return setRedisKeyJSON(`${KEY_SUFFIX_CONFIRMED}`, events);
}

export function getRedisUnconfirmedEvents() {
  return getRedisKeyJSON(`${KEY_SUFFIX_UNCONFIRMED}`);
}

export function setRedisUnconfirmedEvents(events) {
  return setRedisKeyJSON(`${KEY_SUFFIX_UNCONFIRMED}`, events);
}

export function getRedisOrphanEvents() {
  return getRedisKeyJSON(`${KEY_SUFFIX_ORPHANED}`);
}

export function setRedisOrphanEvents(events) {
  return setRedisKeyJSON(`${KEY_SUFFIX_ORPHANED}`, events);
}

export function getRedisLastState() {
  return getRedisKeyJSON(`${KEY_SUFFIX_LAST_STATE}`);
}

export function setRedisLastState(state) {
  return setRedisKeyJSON(`${KEY_SUFFIX_LAST_STATE}`, state);
}

export const clearRedis = _clearRedis; // In TS we will do `export clearRedis from './client`
