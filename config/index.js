export const config = {
  port: process.env.PORT === 'production' ? process.env.PORT : process.env.PORT,
  origin:
    process.env.NODE_ENV === 'production' ? process.env.REMOTE_APP_URL : process.env.LOCAL_APP_URL,
  dataHost: process.env.NODE_ENV === 'production' ? process.env.DATA_HOST : process.env.DATA_HOST,
  chainwebHost:
    process.env.NODE_ENV === 'production' ? process.env.CHAINWEB_HOST : process.env.CHAINWEB_HOST,
  estatsChainwebHost:
    process.env.NODE_ENV === 'production'
      ? process.env.ESTATS_CHAINWEB_HOST
      : process.env.ESTATS_CHAINWEB_HOST,
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
