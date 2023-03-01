import 'dotenv/config'
import { server } from './src/mocks/server'
import { beforeAll, afterEach, afterAll } from '@jest/globals'

// Establish API mocking for all tests.
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
