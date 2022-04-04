export const config = {
  port: process.env.PORT === 'production' ? process.env.PORT : process.env.PORT,
  origin:
    process.env.NODE_ENV === 'production' ? process.env.REMOTE_APP_URL : process.env.LOCAL_APP_URL,
}
