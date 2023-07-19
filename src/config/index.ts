import 'dotenv/config';

export * from './constants.js';

type ConfigVars = 'network' | 'dataHost' | 'chainwebHost' |
  'port' | 'redisHost' | 'redisPassword' | 'confirmationDepth' |
  'heartbeatInterval' | 'eventsStepInterval' | 'chainwebCutUpdateInterval' | 'chainwebDataHeightUpdateInterval' | 'httpMaxRetries' | 'httpRetryBackoffStep' |
  'log' | 'logTimestamps' | 'logColors' | 'production' | 'moduleHashBlacklist' | 'eventsWhitelist';

interface ConfigSpecification {
  varName: ConfigVars;
  envName: string;
  numeric?: true;
  boolean?: true;
  isArray?: true;
  required?: true;
  defaultValue?: any;
  callback?: (...props: any[]) => any;
  typeHint?: string;
  description?: string;
}

export const configSpec: ConfigSpecification[] = [
  {
    varName: 'network',
    envName: 'NETWORK',
    required: true,
    description: 'Chainweb network to use. E.g. testnet04/mainnet01',
  },
  {
    varName: 'dataHost',
    envName: 'DATA_HOST',
    required: true,
    description: 'URL of chainweb-data host to connect to. E.g. http://localhost:7890',
  },
  {
    varName: 'chainwebHost',
    envName: 'CHAINWEB_HOST',
    required: true,
    description: 'URL of chainweb-node **service** host to connect to. E.g. http://localhost:6600'
  },
  {
    varName: 'port',
    envName: 'PORT',
    numeric: true,
    defaultValue: 4000,
    description: 'Port to listen on',
  },
  {
    varName: 'redisHost',
    envName: 'REDIS_HOST',
    defaultValue: 'localhost:6379',
    description: 'Redis server to use. host:port',
  },
  {
    varName: 'redisPassword',
    envName: 'REDIS_PASSWORD',
    defaultValue: '',
    description: 'Redis password',
  },
  {
    varName: 'confirmationDepth',
    envName: 'CONFIRMATION_DEPTH',
    numeric: true,
    defaultValue: 6,
    description: 'Depth at which to consider transactions finalized'
  },
  {
    varName: 'heartbeatInterval',
    envName: 'HEARTBEAT_INTERVAL',
    numeric: true,
    defaultValue: 25_000,
    description: 'Interval between heartbeat (ping) events',
  },
  {
    varName: 'eventsStepInterval',
    envName: 'EVENTS_STEP_INTERVAL',
    numeric: true,
    defaultValue: 10_000,
    description: 'Interval between new data checks against chainweb-data'
  },
  {
    varName: 'chainwebCutUpdateInterval',
    envName: 'CHAINWEB_CUT_UPDATE_INTERVAL',
    numeric: true,
    defaultValue: 15_000,
    description: 'Interval between getting chainweb-node cuts'
  },
  {
    varName: 'chainwebDataHeightUpdateInterval',
    envName: 'CHAINWEB_DATA_HEIGHT_UPDATE_INTERVAL',
    numeric: true,
    defaultValue: 30_000,
    description: "Interval between getting chainweb-data's latest heights"
  },
  {
    varName: 'log',
    envName: 'LOG',
    defaultValue: 'log',
    typeHint: 'error/warn/info/log/debug',
    description: 'Console log verbosity level'
  },
  {
    varName: 'logTimestamps',
    envName: 'LOG_TIMESTAMPS',
    boolean: true,
    defaultValue: true,
    description: 'Prefix console log rows with timestamp'
  },
  {
    varName: 'logColors',
    envName: 'LOG_COLORS',
    boolean: true,
    defaultValue: true,
    description: 'Color usage in console'
  },
  {
    varName: 'production',
    envName: 'NODE_ENV',
    callback: (nodeEnv) => isProduction(nodeEnv),
    typeHint: 'production/<anything else>',
    description: 'Environment',
  },
  {
    varName: 'moduleHashBlacklist',
    envName: 'MODULE_HASH_BLACKLIST',
    isArray: true,
    defaultValue: [],
    description: 'Modules to ignore while fetching events'
  },
  {
    varName: 'eventsWhitelist',
    envName: 'EVENTS_WHITELIST',
    isArray: true,
    defaultValue: ['*'],
    description: 'Module/Event allow list for /stream/event endpoint. Recommendation: set this strictly in public deployments',
  },
]

interface Config {
  // required
  dataHost: string;
  chainwebHost: string;
  network: string;
  // with default values, numeric
  port: number;
  confirmationDepth: number;
  eventsStepInterval: number;
  heartbeatInterval: number;
  chainwebCutUpdateInterval: number;
  chainwebDataHeightUpdateInterval: number;
  httpMaxRetries: number;
  httpRetryBackoffStep: number;
  // with default values, string
  log: string;
  redisHost: string;
  redisPassword: string;
  // bools
  logTimestamps: boolean;
  logColors: boolean;
  production: boolean;
  // with default values, string array
  moduleHashBlacklist: string[];
  eventsWhitelist: string[];
}

const config: Config = generateConfig(process.env, configSpec);

export default config;

export function generateConfig(env: NodeJS.ProcessEnv, configSpec: ConfigSpecification[]): Config {
  return Object.fromEntries(
    configSpec.map(({ varName, envName, numeric, boolean, isArray, defaultValue, required, callback }) => {
      // enforce default & required must be mutually exclusive
      if (required && defaultValue !== undefined) {
        die(`Config ${envName} cannot be required and have a defaultValue at the same time`);
      }
      // read env var, defaulting to defaultValue
      let value = env[envName] ?? defaultValue;
      // enforce required-ness
      if (required && value === undefined) {
        die(`Config ${envName} was required but not provided`);
      }
      // cast to numeric if needed, enforcing not NaN
      if (numeric) {
        const numericValue = Number(value);
        if (isNaN(numericValue)) {
          die(`Config ${envName} must be numeric but got a non-numeric value: ${value}`);
        }
        value = numericValue;
      }
      // cast to boolean if needed
      if (boolean) {
        value = parseBoolean(value);
      }
      if (isArray && !Array.isArray(value)) {
        value = value.split(/, ?/g);
      }
      if (callback) {
        value = callback(value);
      }
      return [varName, value];
    })
  ) as Config;
}

/*
 * Helpers
 */
function die(message) {
  console.error(`FATAL: ${message}`);
  process.exit(1);
}

function isProduction(NODE_ENV: string) {
  return NODE_ENV === 'production';
}

function parseBoolean(value: string | number | boolean): boolean {
  const strValue = String(value);
  return strValue !== "0" && strValue !== "false"
}
