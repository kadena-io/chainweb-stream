import { config } from '../../config/index.js';
import { isOrphan } from './orphans.js';
import { getChainwebCut } from './chainweb-node.js';
import RouteService from './route-service.js';

const availableModules = {
  'coin': 'coin',
  // 'marmalade': 'marmalade.ledger',
  'free.klaim': 'free.klaim',
  'free.klaim.KLAIM': 'free.klaim.KLAIM',
  'n_bd7f56c0bc111ea42026912c37ff5da89149d9dc.klaim': 'n_bd7f56c0bc111ea42026912c37ff5da89149d9dc.klaim',
  'n_bd7f56c0bc111ea42026912c37ff5da89149d9dc.klaim.KLAIM': 'n_bd7f56c0bc111ea42026912c37ff5da89149d9dc.klaim.KLAIM',
  'klaim': 'n_bd7f56c0bc111ea42026912c37ff5da89149d9dc.klaim',
};

export const eventRoute = async (req, res) => {
  const { eventType } = req.params;
  const filter = availableModules[eventType];
  if (!filter) {
    return notFoundResponse(req, res);
  }
  return RouteService.route('events', filter)(req, res);
}

export const accountRoute = async (req, res) => {
  const { address } = req.params;
  return RouteService.route('account', address)(req, res);
}

async function notFoundResponse(req, res) {
  res.status(404).send({ error: `Route ${req.url} does not exist` });
}


// RouteService.get('coin')
// RouteService.route('coin')
