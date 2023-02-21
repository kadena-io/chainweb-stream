import { getResponse, fetchWithRetry, postData } from './http.js';
import { summarizeChainwebCut } from './utils.js';
import config from '../config/index.js';
import Logger from './logger.js';

const { chainwebHost, network } = config;

export async function getChainwebCut() {
  const rawRes = await fetchWithRetry(`${chainwebHost}/chainweb/0.0/${network}/cut`);
  const response = await getResponse(rawRes);
  const summary = summarizeChainwebCut(response);
  console.error('Got CW cut', JSON.stringify(summary));
  return response;
}

// small enough to cache here or should this go to redis as well?
// should we implement/find a LimitedMap that stores the last 100/1000 objects thrown at it?
const blockHeaderCache = {};

function makeBlockHeaderCacheKey(chain, hash, height) {
  return `${chain}:${height}:${hash}`
}

export async function getBlockHeaderBranch({ chain, hash, height, limit = 10, logger = new Logger('getBlockHeaderBranch') }) {
  if (!hash) {
    const cut = await getChainwebCut();
    hash = cut.hashes[chain].hash;
  }
  const cacheKey = makeBlockHeaderCacheKey(chain, hash, height);
  if (blockHeaderCache[cacheKey]) {
    // console.error('Returning cached block headers', cacheKey);
    return blockHeaderCache[cacheKey];
  }
  const rawRes = await postData(
    `${chainwebHost}/chainweb/0.0/${network}/chain/${chain}/header/branch?minheight=${height}&maxheight=${height}`,
    { lower: [], upper: [hash] },
    logger,
  );

  const response = await getResponse(rawRes);
  //logger.(`Block Header req c=${chain} height=${height} hash=${hash} got ${JSON.stringify(response)}`);
  blockHeaderCache[cacheKey] = response;

  return response;
}
