import { rest } from 'msw';
import blocks, { updateData, cut, blockHeaderBranch } from './mockdata/chainweb';
import { config } from '../../config/index.js';

let count = 0;

export const handlers = [
  rest.get(`http://${config.dataHost}/txs/events`, (_req, res, ctx) => {
    if (count > 11) {
      return res(ctx.json(updateData()));
    } else {
      count++;
      return res(ctx.json(blocks()));
    }
  }),

  rest.get(`https://${config.chainwebHost}/chainweb/0.0/testnet04/cut`, (_req, res, ctx) => {
    return res(ctx.json(cut()));
  }),

  rest.post(
    `https://${config.chainwebHost}/chainweb/0.0/testnet04/chain/1/header/branch`,
    (_req, res, ctx) => {
      return res(ctx.json(blockHeaderBranch()));
    },
  ),
];
