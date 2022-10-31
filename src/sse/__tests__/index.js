import { afterEach, expect, test } from '@jest/globals';
import {
  sse,
  updateClient,
  getRedisKdaEvents,
  stopStreaming,
  getOrphansKdaEvents,
  highestNonOrphanBlockheight,
} from '../index.js';
import { server } from '../../mocks/server.js';
import { cut } from '../../mocks/mockdata/chainweb.js';

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
];

test('Expect client to receive 1 new events', async () => {
  const { newKdaEvents } = await updateClient(mockedEvents, cut());
  console.log('bnadkjndakjnkansdjlknaljkdnsa', newKdaEvents);
  expect(newKdaEvents.length).toBe(1);
});

test('Expect client to receive 0 events when same events after updateClient is called twice', async () => {
  await updateClient(mockedEvents, cut());
  const { newKdaEvents } = await updateClient(mockedEvents, cut());
  expect(newKdaEvents.length).toBe(0);
});

test('Expect client to receive 44 events when same events after updateClient is called three times', async () => {
  await updateClient(mockedEvents, cut());
  await updateClient(mockedEvents, cut());
  const { newKdaEvents } = await updateClient(mockedEvents, cut());
  expect(newKdaEvents.length).toBe(0);
});

test('Expect to have 2 orphans events', async () => {
  const { orphans } = await updateClient(mockedEvents, cut());
  expect(Object.keys(orphans).length).toBe(2);
  expect(orphans['C_cQLYkAFljw_wVazIQs59jBgtI7rdDg5qYIHaR8njU'].moduleHash).toEqual(
    'RHsfVNldp-N6YWmteIBt-PfdRTHcHaclu5bMLjsJM0E',
  );
});

test('Expect to have 2 orphans events  after updateClient is called twice', async () => {
  const { orphans } = await updateClient(mockedEvents, cut());
  expect(Object.keys(orphans).length).toBe(2);
  expect(orphans['C_cQLYkAFljw_wVazIQs59jBgtI7rdDg5qYIHaR8njU'].moduleHash).toEqual(
    'RHsfVNldp-N6YWmteIBt-PfdRTHcHaclu5bMLjsJM0E',
  );
});

test('Expect to have 2 orphans events not present in the kdaevents', async () => {
  const { newKdaEvents } = await updateClient(mockedEvents, cut());

  const foundEvents = newKdaEvents.find(
    (event) =>
      event.requestKey === 'C_cQLYkAFljw_wVazIQs59jBgtI7rdDg5qYIHaR8njU' &&
      event.blockHash === 'NmODdWJNOMDjIkyzxikGoUtBO6MxbFQ_-Mb3SV-nmmw',
  );

  expect(foundEvents).toBeUndefined();
});

test('Expect highestNonOrphanBlockheight to be 2083770', async () => {
  const { orphans, newKdaEvents } = await updateClient(mockedEvents, cut());
  expect(Object.keys(orphans).length).toBe(2);
  console.log(orphans);
  expect(highestNonOrphanBlockheight).toEqual(2083770);
});

afterEach(() => stopStreaming());
