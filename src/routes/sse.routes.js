import express from 'express';
import { sse, kdaEvents } from '../sse/index.js';

export const router = express.Router();

router.get('/stream', sse.init);
router.get('/status', (request, response) => response.json({ kdaEvents }));
