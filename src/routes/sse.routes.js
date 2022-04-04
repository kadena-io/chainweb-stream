import express from 'express'
import { sse } from '../sse/index.js'

export const router = express.Router()
export let clients = []
export let kdaEvents = []

router.get('/stream', sse.init)
router.get('/status', (request, response) => response.json({ clients, kdaEvents }))
