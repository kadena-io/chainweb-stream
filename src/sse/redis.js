import { config } from '../../config/index.js';
import { createClient } from 'redis';

const MAX_REDIS_FAILURES = 5;

const { redisPassword } = config;
const redisOptions = {
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
  }
};

if (redisPassword) {
  redisOptions.password = redisPassword;
}

let client;
try {
  client = createClient(redisOptions);
} catch(e) {
  console.error(e);
  console.error(e.message);
  process.exit(1);
}
client.on('error', (err) => console.error('Redis Client Error', err));

await client.connect();

export async function clearRedis() {
  try {
    await client.set('kdaEvents', JSON.stringify([]));
    return 'succes';
  } catch (error) {
    return { error };
  }
}

export async function getRedisConfirmedEvents() {
  const events = await client.get('kdaEvents');
  return JSON.parse(events) || [];
}

export async function getRedisOrphanEvents() {
  const events = await client.get('orphans');
  return JSON.parse(events) || [];
}
