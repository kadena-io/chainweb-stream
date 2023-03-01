import config from '../config/index.js';
import npmlog from 'npmlog';

const loggerPrefix = '[Logger]';

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
    npmlog.warn(loggerPrefix, `Unknown log level: ${config.log}`);
  }
}

reportLogLevel();

function reportLogLevel() {
  npmlog.info(loggerPrefix, `Using log level: ${npmlog.level}`);
}

export function setLevel(newLevel) {
  npmlog.level = newLevel;
  reportLogLevel();
}

export default class Logger {
  prefix = '';
  constructor(...prefixes) {
    if (prefixes.length) {
      this.prefix = prefixes.map(word => `[${word}]`).join(' ');
    }
  }
  silly(...args) {
    npmlog.silly(this.prefix, ...args);
  }
  verbose(...args) {
    npmlog.verbose(this.prefix, ...args);
  }
  debug(...args) {
    npmlog.verbose(this.prefix, ...args);
  }
  log(...args) {
    npmlog.info(this.prefix, ...args);
  }
  warn(...args) {
    npmlog.warn(this.prefix, ...args);
  }
  error(...args) {
    npmlog.error(this.prefix, ...args);
  }
}
