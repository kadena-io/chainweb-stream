import { config } from '../../config/index.js';
import npmlog from 'npmlog';

// default log level: verbose
npmlog.level = 'verbose';

// Prefix timestamp in ISO format
Object.defineProperty(npmlog, 'heading', { get: () => { return new Date().toISOString() } })
npmlog.headingStyle = { bg: '', fg: 'white' }

const logLevelMappings = {
  "silly": "silly",
  "verbose": "verbose",
  "debug": "verbose", // for console.debug fallback compatibility
  "log": "info", // nice to have a .log convenience
  "info": "info",
  "warn": "warn",
  "error": "error",
};

// log level from config
if (config.log) {
  if (logLevelMappings[config.log]) {
    npmlog.level = config.log;
  } else {
    npmlog.warn('[LOGGER]', `Unknown log level: ${config.log}`);
  }
}

reportLogLevel();

function reportLogLevel() {
  npmlog.info('[LOGGER]', `Using log level: ${npmlog.level}`);
}

export function setLevel(newLevel) {
  npmlog.level = newLevel;
  reportLogLevel();
}

export default class Logger {
  constructor(...prefixes) {
    if (prefixes.length) {
      this.prefix = prefixes.map(word => `[${word}]`).join(' ');
    }
    for(const [from, to] of Object.entries(logLevelMappings)) {
      this[from] = (...args) => {
        npmlog[to](this.prefix, ...args);
      }
    }
  }
}
