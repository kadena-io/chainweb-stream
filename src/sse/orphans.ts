import { getBlockHeaderBranch } from './chainweb-node.js';
import Logger from '../logger.js';
import { ChainwebCutData, ChainwebBaseData } from './types.js';

export async function isOrphan({ chain, height, blockHash }: ChainwebBaseData, chainwebCut: ChainwebCutData, logger: Logger) {

  const hash = chainwebCut.hashes[chain].hash;

  const response = await getBlockHeaderBranch({ chain, hash, height, logger });

  if (!response?.items?.length)
    return false;

  return response.items[0].hash !== blockHash;
}
