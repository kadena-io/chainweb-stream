import { afterEach, expect, test } from '@jest/globals'
import { sse, updateClient, kdaEvents, stopStreaming, orphans } from '../index.js'
import { server } from '../../mocks/server.js'

const mockedEvents = [
  {
    blockTime: '2022-01-03T22:56:00.87117Z',
    height: 2083808,
    blockHash: 'NmODdWJNOMDjekyzxikGoUtBO6MxbFQ_-Mb3SV-nmmw',
    requestKey: 'C_cQLYkAFljw_wVazIQs59jBgtI7rdDg5qYIHaR8njU',
    params: [Array],
    name: 'marmalade.ledger.TOKEN',
    idx: 1,
    chain: 1,
    moduleHash: 'PHsfVNldp-N6YWmteIBt-PfdRTHcHaclu5bMLjsJM0E',
  },
  {
    blockTime: '2022-01-03T22:35:47.993891Z',
    height: 2083770,
    blockHash: 'mdekX5TsJ2cm9Oce-Sw_Lh35dSsZZO2JV-12Of5_tX4',
    requestKey: 'HOt9JEYesXYkw3aALUrnI0GMOks0FK0MTOSuJRpwDJU',
    params: [Array],
    name: 'marmalade.ledger.TOKEN',
    idx: 1,
    chain: 1,
    moduleHash: 'PHsfVNldp-N6YWmteIBt-PfdRTHcHaclu5bMLjsJM0E',
  },
]

test('Expect client to receive 20 events', async () => {
  const { kdaEvents } = await updateClient(mockedEvents)
  expect(kdaEvents.length).toBe(28)
  expect(kdaEvents[0].moduleHash).toEqual('RHsfVNldp-N6YWmteIBt-PfdRTHcHaclu5bMLjsJM0E')
})

test('Expect to have 2 orphans events', async () => {
  const { orphans, newKdaEvents } = await updateClient(mockedEvents)
  console.log(newKdaEvents)
  expect(Object.keys(orphans).length).toBe(2)
  expect(orphans['C_cQLYkAFljw_wVazIQs59jBgtI7rdDg5qYIHaR8njU'].event.moduleHash).toEqual(
    'RHsfVNldp-N6YWmteIBt-PfdRTHcHaclu5bMLjsJM0E',
  )
})

afterEach(() => stopStreaming())
