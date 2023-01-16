import express from 'express';
import { eventRoute, accountRoute } from '../sse/index.js';
import { getRedisConfirmedEvents, clearRedis } from '../sse/redis/index.js';
import { config } from '../../config/index.js';

export const router = express.Router();

router.get('/stream/event/:eventType', eventRoute);

router.get('/stream/account/:address', accountRoute);

router.get('/status', async (request, response) => {
  response.json({ TODO: 1 });
});

// router.get('/clearKDAEvents', async (request, response) => {
//     const status = await clearRedis();
//   if (request.query.user === config.password) {
//     response.json({ status });
//   }
// });
