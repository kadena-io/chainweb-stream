import defaults from 'lodash/defaults.js';
import { config as defaultConfig } from '../../../config/index.js';
import { withRetries } from '../utils.js';
import { createClient } from 'redis';

const MAX_REDIS_FAILURES = 5; // TODO set via getter/setter and default from config?

export const KEY_SUFFIX_LAST_STATE = 'lastState';
export const KEY_SUFFIX_CONFIRMED = 'confirmedEvents';
export const KEY_SUFFIX_UNCONFIRMED = 'unconfirmedEvents';
export const KEY_SUFFIX_ORPHANED = 'orphanedEvents';

const ALL_KEYS = [
  KEY_SUFFIX_LAST_STATE,
  KEY_SUFFIX_UNCONFIRMED,
  KEY_SUFFIX_CONFIRMED,
  KEY_SUFFIX_ORPHANED,
];

const RESET_STATE = '';

let client;
let network;

export async function connect(runtimeConfig) {
  const config = defaults(runtimeConfig, defaultConfig);
  const { redisPassword } = config;
  network = config.network;

  const redisOptions = {
    // TODO hhost, port, etc
    socket: {
      reconnectStrategy: n => {
        if (n >= MAX_REDIS_FAILURES) {
          console.error('FATAL Too many redis connection failures');
          process.exit(1);
        }
        const timeout = Math.pow(n + 1, 2) * 1000; // n^s sec. -- 1, 4, 9, 16, etc
        console.warn(`Retrying after ${timeout} ms`);
        return timeout;
      }
    },
    ...(redisPassword ? { password: redisPassword } : null),
  };

  try {
    if (!network) {
      throw new Error("No network defined");
    }
    client = await withRetries(async () => {
      const client = createClient(redisOptions);
      await client.connect();
      return client;
    });
  } catch(e) {
    // No network or no redis: FATAL
    console.error(e);
    console.error(e.message);
    process.exit(1);
  }
  client.on('error', (err) => console.error('Redis Client Error', err));
}

export async function destroyClient() {
  try {
    if (client) {
      await client.disconnect(); // TODO quit is also available, what's the diff?
    }
  } catch(e) {
    console.error('Ignorable error while disconnecting from redis', e.message);
  }
  client = undefined;
}

export async function getRedisKeyJSON(key, defaultValue = []) {
  if (!client) {
    await connect();
  }
  if (!key.startsWith(network)) {
    key = `${network}:${key}`;
  }
  const value = await withRetries(() => client.get(key));
  try {
    return JSON.parse(value) ?? defaultValue;
  } catch(e) {
    console.warn(`Failed to parse ${key} as JSON: ${e.message}`);
    console.warn(`Value starts with: ${value?.slice(0, 64)}`);
  }
  return defaultValue
}

export async function setRedisKeyJSON(key, value) {
  if (!client) {
    await connect();
  }
  if (!key.startsWith(network)) {
    key = `${network}:${key}`;
  }
  if (value && typeof value === "object") {
    value = JSON.stringify(value);
  }
  console.warn('Writing', key, value?.length);
  await withRetries(() => client.set(key, value));
  return value;
}

export async function clearRedis() {
  // throws intentionally
  for(const key of ALL_KEYS) {
    await setRedisKeyJSON(key, RESET_STATE);
  }
  return { ok: 1 };
}