import { rest } from 'msw'
import blocks from './mockdata/chainweb'
import { config } from '../../config/index.js'

export const handlers = [
  rest.get(
    `http://${config.dataHost}/txs/events?name=marmalade&limit=100&offset=0`,
    (_req, res, ctx) => res(ctx.json(blocks)),
  ),
]
