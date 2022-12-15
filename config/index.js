import 'dotenv/config';

/*
 * Helpers
 */
function die(message) {
  console.error(`FATAL: ${message}`);
  process.exit(1);
}

function isProduction() {
  return process.env.NODE_ENV === 'production';
}

/*
 * Required/Defaulted key definitions
 */
const REQUIRE_KEYS = {
  PORT: 'port',
  [isProduction() ? 'REMOTE_APP_URL' : 'LOCAL_APP_URL']: 'origin',
  DATA_HOST: 'dataHost',
  CHAINWEB_HOST: 'chainwebHost',
  NETWORK: 'network',
};

const DEFAULT_KEYS = {
  HTTP_RETRY_BACKOFF_STEP: ['httpRetryBackoffStep', 2000],
  HTTP_MAX_RETRIES: ['httpMaxRetries', 2000],
  HTTP_MAX_RETRIES: ['httpMaxRetries', 2000],
  ESTATS_CHAINWEB_HOST: ['estatsChainwebHost', ''],
  REDIS_PASSWORD: ['redisPassword', ''],
  LOG: ['log', 'verbose'], // TODO change before prod
  CONFIRMATION_HEIGHT: ['confirmationHeight', 6],
  EVENTS_STEP_INTERVAL: ['eventsStepInterval', 30_000],
};

/*
 * Cast & enforce numeric for these keys
 */
const NUMERIC_KEYS = [
  'port',
  'httpRetryBackoffStep',
  'httpMaxRetries',
  'confirmationHeight',
  'eventsStepInterval',
];

/*
 * Default config includes module hash blacklist for now
 */
export const config = { // TODO default export ? 
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

/*
 * action!
 */
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
