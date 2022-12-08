import express from 'express';
import { sse } from '../sse/index.js';
import { getRedisConfirmedEvents, clearRedis } from '../sse/redis/index.js';
import { config } from '../../config/index.js';

export const router = express.Router();

router.get('/stream', sse.init);
router.get('/status', async (request, response) => {
  const kdaEvents = await getRedisConfirmedEvents(config.defaultFilter);
  response.json({ kdaEvents });
});

router.get('/clearKDAEvents', async (request, response) => {
  if (request.query.user === config.password) {
    const status = await clearRedis();
    response.json({ status });
  }
});
