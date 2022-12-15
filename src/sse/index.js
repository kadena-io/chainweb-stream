import { config } from '../../config/index.js';
import { isOrphan, deleteOrphanEventsFromCache } from './orphans.js';
import { getChainwebCut } from './chainweb-node.js';
import RouteService from './route-service.js';

const availableModules = {
  'coin': 'coin',
  'marmalade': 'marmalade.ledger',
};

export const eventRoute = async (req, res) => {
  const { eventType } = req.params;
  const filter = availableModules[eventType];
  if (!filter) {
    return notFoundResponse(req, res);
  }
  return RouteService.route(filter)(req, res);
}

export const addressRoute = async (req, res) => {
  return notFoundResponse(req, res);
}

async function notFoundResponse(req, res) {
  res.status(404).send({ error: `Route ${req.url} does not exist` });
}


// RouteService.get('coin')
// RouteService.route('coin')
