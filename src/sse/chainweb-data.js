import { fetchWithRetry, getResponse } from './http.js';
import { config } from '../../config/index.js';

const { dataHost } = config;

export async function getChainWebDataEvents(name, offset, limit = 50, retry = 0) {
  const url = `http://${dataHost}/txs/events\?name\=${name}\&limit\=${limit}\&offset\=${offset}`;

  console.error(`GET ${url}`);
  const rawRes = await fetchWithRetry(url);

  const response = await getResponse(rawRes);
  console.log(`Got CW DataE o=${offset} l=${limit} len=${response.length}`);
  return response;
}
