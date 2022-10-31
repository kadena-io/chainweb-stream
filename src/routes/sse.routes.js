import express from 'express';
import { sse, getRedisKdaEvents, clearRedisKDAEvents } from '../sse/index.js';
import { config } from '../../config/index.js';

export const router = express.Router();

router.get('/stream', sse.init);
router.get('/status', async (request, response) => {
  const kdaEvents = await getRedisKdaEvents();
  response.json({ kdaEvents });
});

router.get('/clearKDAEvents', async (request, response) => {
  if (request.query.user === config.password) {
    const status = await clearRedisKDAEvents();
    response.json({ status });
  }
});
