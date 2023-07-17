import config from '../config/index.js';
import { isOrphan } from './orphans.js';
import { getChainwebCut } from './chainweb-node.js';
import RouteService from './route-service.js';

const { eventsWhitelist } = config;

export const eventRoute = async (req, res) => {
  const { eventType } = req.params;
  const isModuleAllowed = eventsWhitelist.includes('*') || eventsWhitelist.includes(eventType);
  if (!isModuleAllowed) {
    return notFoundResponse(req, res);
  }
  return RouteService.route('event', eventType)(req, res);
}

export const accountRoute = async (req, res) => {
  const { address } = req.params;
  return RouteService.route('account', address)(req, res);
}

async function notFoundResponse(req, res) {
  res.status(404).send({ error: `Route ${req.url} does not exist. You may need to add this module or event to the events whitelist configuration value.` });
}

// RouteService.get('coin')
// RouteService.route('coin')
