import { rest } from 'msw'
import blocks from './mockdata/chainweb'
import { config } from '../../config/index.js'

export const handlers = [
  rest.get(`http://${config.dataHost}/txs/events`, (_req, res, ctx) => res(ctx.json(blocks()))),
]
