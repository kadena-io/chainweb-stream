import 'dotenv/config';

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

type ConfigVars = 'network' | 'dataHost' | 'chainwebHost' |
  'port' | 'redisHost' | 'redisPassword' | 'confirmationHeight' |
  'eventsStepInterval' | 'chainwebCutUpdateInterval' | 'httpMaxRetries' | 'httpRetryBackoffStep' |
  'log' | 'production' | 'moduleHashBlacklist';

type ConfigSpecification = {
  varName: ConfigVars;
  envName: string;
  numeric?: boolean;
  isArray?: boolean;
  required?: boolean;
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
    varName: 'confirmationHeight',
    envName: 'CONFIRMATION_HEIGHT',
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
    varName: 'eventsStepInterval',
    envName: 'EVENTS_STEP_INTERVAL',
    numeric: true,
    defaultValue: 30_000,
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
  },
]

interface Config {
  // required
  dataHost: string;
  chainwebHost: string;
  network: string;
  // with default values, numeric
  port: number;
  confirmationHeight: number;
  eventsStepInterval: number;
  chainwebCutUpdateInterval: number;
  httpMaxRetries: number;
  httpRetryBackoffStep: number;
  // with default values, string
  log: string;
  redisHost: string;
  redisPassword: string;
  // bool, dev or prod
  production: boolean;
  // with default values, string array
  moduleHashBlacklist: string[];
}

const config: Config = generateConfig(process.env, configSpec);

export default config;

export function generateConfig(env: NodeJS.ProcessEnv, configSpec: ConfigSpecification[]): Config {
  return Object.fromEntries(
    configSpec.map(({ varName, envName, numeric, isArray, defaultValue, required, callback }) => {
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
interface Config {
  port: number;
  dataHost: string;
  chainwebHost: string;
  network: string;
  moduleHashBlacklist: string[];
  log: string;
  confirmationHeight: number;
  eventsStepInterval: number;
  redisHost: string;
  redisPassword: string;
}

/*
 * Default config includes module hash blacklist for now
export const config: Config = generateConfig();

function generateConfig(): Config {
  const config = {
    moduleHashBlacklist: [
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
  };

  // map required keys
  for (const [requireKey, configKey] of Object.entries(REQUIRE_KEYS)) {
    const envValue = process.env[requireKey];
    if (typeof envValue === "undefined") {
      die(`Required env var missing: ${requireKey}\nCopy .default.env to .env and set up the variables to your preference.`);
    }
    config[configKey] = envValue;
  }

  // map keys with default values
  for (const [envKey, [configKey, defaultValue]] of Object.entries(DEFAULT_KEYS)) {
    const envValue = process.env[envKey];
    config[configKey] = envValue ?? defaultValue;
  }

  // cast & enforce numeric keys
  for (const key of NUMERIC_KEYS) {
    const value = config[key];
    const intValue = parseInt(value, 10);
    if (!isNaN(intValue)) {
      config[key] = intValue;
      continue;
    }
    const floatValue = parseFloat(value);
    if (!isNaN(floatValue)) {
      config[key] = floatValue;
      continue;
    }
    die(`Numeric env var not parsable as number: ${key} value: ${value}`);
  }

  return config;
}

*/
