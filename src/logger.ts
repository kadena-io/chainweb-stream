import npmlog from 'npmlog';
import config from './config/index.js';

const { log: logLevel, logTimestamps, logColors } = config;

const loggerPrefix = '[Logger]';

// default log level: verbose
npmlog.level = 'verbose';

// Prefix timestamp in ISO format by default.
// Turn off with LOG_TIMESTAMPS=0 if your logs are timestamped externally
if (logTimestamps) {
  Object.defineProperty(npmlog, 'heading', { get: () => { return new Date().toISOString() } })
}

if (!logColors) {
  npmlog.disableColor()
} else {
  npmlog.headingStyle = { bg: '', fg: 'white' }
}

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
if (logLevel) {
  if (logLevelMappings[logLevel]) {
    npmlog.level = logLevel;
  } else {
    npmlog.warn(loggerPrefix, `Unknown log level: ${logLevel}`);
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
