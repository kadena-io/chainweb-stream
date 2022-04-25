import { rest } from 'msw'
import blocks, { updateData } from './mockdata/chainweb'
import { config } from '../../config/index.js'

let count = 0

export const handlers = [
  rest.get(`http://${config.dataHost}/txs/events`, (_req, res, ctx) => {
    console.log(count)
    if (count > 11) {
      return res(ctx.json(updateData()))
    } else {
      count++
      return res(ctx.json(blocks()))
    }
  }),
]
