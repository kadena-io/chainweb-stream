import 'dotenv/config';

export * from './constants.js';

type ConfigVars = 'network' | 'dataHost' | 'chainwebHost' |
  'port' | 'redisHost' | 'redisPassword' | 'confirmationDepth' |
  'heartbeatInterval' | 'eventsStepInterval' | 'chainwebCutUpdateInterval' | 'httpMaxRetries' | 'httpRetryBackoffStep' |
  'log' | 'logTimestamps' | 'logColors' | 'production' | 'moduleHashBlacklist';

interface ConfigSpecification {
  varName: ConfigVars;
  envName: string;
  numeric?: true;
  boolean?: true;
  isArray?: true;
  required?: true;
  defaultValue?: any;
  callback?: (...props: any[]) => any;
}

const configSpec: ConfigSpecification[] = [
  {
    varName: 'network',
    envName: 'NETWORK',
    required: true,
  },
  {
    varName: 'dataHost',
    envName: 'DATA_HOST',
    required: true,
  },
  {
    varName: 'chainwebHost',
    envName: 'CHAINWEB_HOST',
    required: true,
  },
  {
    varName: 'port',
    envName: 'PORT',
    numeric: true,
    defaultValue: 4000,
  },
  {
    varName: 'redisHost',
    envName: 'REDIS_HOST',
    defaultValue: 'localhost:6379',
  },
  {
    varName: 'redisPassword',
    envName: 'REDIS_PASSWORD',
    defaultValue: '',
  },
  {
    varName: 'confirmationDepth',
    envName: 'CONFIRMATION_DEPTH',
    numeric: true,
    defaultValue: 6,
  },
  {
    varName: 'httpRetryBackoffStep',
    envName: 'HTTP_RETRY_BACKOFF_STEP',
    numeric: true,
    defaultValue: 2000,
  },
  {
    varName: 'httpMaxRetries',
    envName: 'HTTP_MAX_RETRIES',
    numeric: true,
    defaultValue: 6,
  },
  {
    varName: 'heartbeatInterval',
    envName: 'HEARTBEAT_INTERVAL',
    numeric: true,
    defaultValue: 25_000,
  },
  {
    varName: 'eventsStepInterval',
    envName: 'EVENTS_STEP_INTERVAL',
    numeric: true,
    defaultValue: 10_000,
  },
  {
    varName: 'chainwebCutUpdateInterval',
    envName: 'CHAINWEB_CUT_UPDATE_INTERVAL',
    numeric: true,
    defaultValue: 15_000,
  },
  {
    varName: 'log',
    envName: 'LOG',
    defaultValue: 'log',
  },
  {
    varName: 'logTimestamps',
    envName: 'LOG_TIMESTAMPS',
    boolean: true,
    defaultValue: true,
  },
  {
    varName: 'logColors',
    envName: 'LOG_COLORS',
    boolean: true,
    defaultValue: true,
  },
  {
    varName: 'production',
    envName: 'NODE_ENV',
    callback: (nodeEnv) => isProduction(nodeEnv),
  },
  {
    varName: 'moduleHashBlacklist',
    envName: 'MODULE_HASH_BLACKLIST',
    isArray: true,
    defaultValue: [
      'LKQj2snGFz7Y8iyYlSm3uIomEAYb0C9zXCkTIPtzkPU',
      'F7tD1QlT8dx8BGyyq-h22OECYS7C3FfcYaRyxt6D1YQ',
      'WSIFGtnAlLCHFcFEHaKGrGeAG4qnTsZRj9BdvzzGa6w',
      '4m9KUKUzbd9hVZoN9uIlJkxYaf1NTz9G7Pc9C9rKTo4',
      '_1rbpI8gnHqflwb-XqHsYEFBCrLNncLplikh9XFG-y8',
      'dhIGiZIWED2Rk6zIrJxG8DeQn8n7WDKg2b5cZD2w4CU',
      'cOJgr8s3j3p5Vk0AAqjdf1TzvWZlFsAiq4pMiOzUo1w',
      'HsePyFCyYUPEPJqG5VymbQkkI3gsPAQn218uWEF_dbs',
      'lWqEvH5U20apKfBn27HOBaW46vQlxhkiDtYHZ5KoYp0',
      'uvtUnp96w2KnxnneYa4kUN1kTvYSa8Ma33UDkQXV0NA',
      '78ngDzxXE8ZyHE-kFm2h7-6Xm8N8uwU_xd1fasO8gWU',
    ],
  }
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
        console.log(varName, value);
        value = parseBoolean(value);
        console.log(varName, value);
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
