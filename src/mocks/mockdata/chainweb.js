import { createHmac } from 'crypto';

const secret = 'kadena';

function createHash(text) {
  return createHmac('sha256', secret).update(text).digest('hex');
}

export let updateData = () => [
  {
    blockTime: '2022-04-03T22:56:00.87117Z',
    height: 2083909,
    blockHash: 'WEEDdWJNOMDjIkyzxikGoUtBO6MxbFQ_-Mb3SV-nmmw',
    requestKey: 'W_cERYkAFljw_wVazIQs59jBgtI7rdDg5qYIHaR8njU',
    params: [Array],
    name: 'marmalade.ledger.TOKEN',
    idx: 1,
    chain: 1,
    moduleHash: 'T4sfVNldp-NeYWmteIBt-PfdRTHcHaclu5bMLjsJM0E',
  },
];

export let blockHeaderBranch = () => {
  return {
    limit: 1,
    items: [
      {
        nonce: '17325273899139444115',
        creationTime: 1640412891290658,
        parent: 'Fr7xuMIqxloNdScCTfiGaccO05ftk7jeiwlQrqkQO10',
        adjacents: {
          12: 'WKeXN9ZyKEg3ZyezI8Kd8bpL7bsEiLcmraP8GuNlj5U',
          14: 'fqUTfdSi9djHfEPDgyaNx1Rr1bbg0CA1kWgvD_5-9FM',
          3: 'fw5darg841bUscBBCOT2WqT3_0OiB7pN92axvkPjd38',
        },
        target: 'NkMbDSI_3uUNcHXwWYrMzd_Hj1hLt4fQtQAAAAAAAAA',
        payloadHash: 'oPHVAaPWLH7oJmTV29kxojeTxv8UK4AHfCKoxulAq-I',
        chainId: 13,
        weight: '6LHJwgvQwxZfBgAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        height: 2266858,
        chainwebVersion: 'testnet04',
        epochStart: 1640411096476109,
        featureFlags: 0,
        hash: 'PmODdWJNOMDjIkyzxikGoUtBO6WRe4Q_-Mb3SV-nmmw',
      },
    ],
    next: null,
  };
};

export let cut = () => {
  return {
    hashes: {
      0: {
        height: 2192161,
        hash: 'B_NsXoBInWydBL4CNKPhnDVDrDpmUlwNd409yAw95_k',
      },
      1: {
        height: 2192162,
        hash: 'PmODdWJNOMDjIkyzxikGoUtBO6WRe4Q_-Mb3SV-nmmw',
      },
      2: {
        height: 2192162,
        hash: 'PaHhSDau9onMRciNAROTQIQ66QmQzZMgmYJlghIVA_Y',
      },
      3: {
        height: 2192162,
        hash: 'IL-lG1vml896fSoJPuzohlBVOA-MzllCQ8C-Ha-eRL8',
      },
      4: {
        height: 2192162,
        hash: 'BbWn3VxkcVvMbXbjdvmJBLWI21kH8Vvm5CMgpo1DrAo',
      },
      5: {
        height: 2192161,
        hash: 'lqlB2ifoJDP6D74tTmIpND9RL1a1_98uax4ueQAuE9A',
      },
      6: {
        height: 2192162,
        hash: 'deZagcaAS4FRqlEsg0fvwFQ59yKX-41uif0ki0vUJK0',
      },
      7: {
        height: 2192161,
        hash: 'ZjcBWcR5CYKUN2fZQXrQ3-bbCmhfhEUoUHUYh3nP2CI',
      },
      8: {
        height: 2192161,
        hash: '3eBfL5DFdzLMejw3QsKgHEbC0dvM1NLIcRBXcFxuCoE',
      },
      9: {
        height: 2192162,
        hash: 'TGE2PsAx4WybAqqxd1C-9WdrZVBRVlJOMeIst1Rkl3Y',
      },
      10: {
        height: 2192162,
        hash: 'DRs2GCV8Af0sQWMwQdtDNBKYX9o4rLBHfQuIG3meImg',
      },
      11: {
        height: 2192162,
        hash: 'zUNiTz74egVVfmTgFFdo-wWz_qm_qqvLRZWbSpCYoWw',
      },
      12: {
        height: 2192162,
        hash: 'vlRHWaO7Kg-a53nja26Si1jtdJ7tqHsDsfK8wahvT4k',
      },
      13: {
        height: 2192162,
        hash: 'ZxV48Gw9kSU2SK0KlFcEZ3mvqj7uYQS6iUS0ESSzLCw',
      },
      14: {
        height: 2192163,
        hash: 'N6pxCUG-XuXP-Glfdk_hrCTy2kaxYxzbN_l4u1e6eK8',
      },
      15: {
        height: 2192162,
        hash: 'Rq-6YZC-3IDT1wT8zZ5QZsPfNXeWJm4_RpiLh_N2H5A',
      },
      16: {
        height: 2192162,
        hash: 'eLkwQEwMk0wS_vP07vunKlYjxa9A6nWpoXWNw-Tx-MI',
      },
      17: {
        height: 2192162,
        hash: 'A-Dkc_MztI62aaxy6rgdcwltRpXeObJOpNuhQPWhgtY',
      },
      18: {
        height: 2192161,
        hash: 'WRy1es0hu2fs_HVpKEEjUao1-p6KpyEb5_oVA9VD7NI',
      },
      19: {
        height: 2192161,
        hash: '0q8pSaVoIhRzd4cXoZ_HXMn2f-xFzy0MxSKxhhLAYRI',
      },
    },
    origin: null,
    weight: 'pI3RbQFrAQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    height: 43843235,
    instance: 'testnet04',
    id: 'oJki4lWWP-Q-4gscTV_H1nlDOaXJfj3tXIotsAPakUU',
  };
};

export default () => [
  {
    blockTime: '2022-04-03T22:56:00.87117Z',
    height: 2083809,
    blockHash: 'RTEDdWJNOMDjIkyzxikGoUtBO6MxbFQ_-Mb3SV-nmmw',
    requestKey: 'Q_cERYkAFljw_wVazIQs59jBgtI7rdDg5qYIHaR8njU',
    params: [Array],
    name: 'marmalade.ledger.TOKEN',
    idx: 1,
    chain: 1,
    moduleHash: 'WHsfVNldp-NeYWmteIBt-PfdRTHcHaclu5bMLjsJM0E',
  },
  {
    blockTime: '2022-04-03T22:56:00.87117Z',
    height: 2083808,
    blockHash: 'NmODdWJNOMDjIkyzxikGoUtBO6MxbFQ_-Mb3SV-nmmw',
    requestKey: 'C_cQLYkAFljw_wVazIQs59jBgtI7rdDg5qYIHaR8njU',
    params: [Array],
    name: 'marmalade.ledger.TOKEN',
    idx: 1,
    chain: 1,
    moduleHash: 'RHsfVNldp-N6YWmteIBt-PfdRTHcHaclu5bMLjsJM0E',
  },
  {
    blockTime: '2022-04-03T22:56:00.87117Z',
    height: 2083808,
    blockHash: 'RmODdWJNOMDjIkyzxikGoUtBO6WRe4Q_-Mb3SV-nmmw',
    requestKey: 'C_cQLYkAFljw_wVazIQs59jBgtI7rdDg5qYIHaR8njU',
    params: [Array],
    name: 'marmalade.ledger.TOKEN',
    idx: 1,
    chain: 1,
    moduleHash: 'RHsfVNldp-N6YWmteIBt-PfdRTHcHaclu5bMLjsJM0E',
  },
  {
    blockTime: '2022-04-03T22:00:00.87117Z',
    height: 2083801,
    blockHash: 'TmODdWJNOMDjIkyzxikGoUtBO6MxbFQ_-Mb3SV-nmmR',
    requestKey: 'F_cQLYkAFljw_wVazIQs59jBgtI7rdDg5qYIHaR8njU',
    params: [Array],
    name: 'marmalade.ledger.TOKEN',
    idx: 1,
    chain: 1,
    moduleHash: 'RHsfVNldp-N6YWmteIBt-PfdRTHcHaclu5bMLjsJM0E',
  },
  {
    blockTime: '2022-04-03T22:00:00.87117Z',
    height: 2083801,
    blockHash: 'PmODdWJNOMDjIkyzxikGoUtBO6WRe4Q_-Mb3SV-nmmw',
    requestKey: 'F_cQLYkAFljw_wVazIQs59jBgtI7rdDg5qYIHaR8njU',
    params: [Array],
    name: 'marmalade.ledger.TOKEN',
    idx: 1,
    chain: 1,
    moduleHash: 'RHsfVNldp-N6YWmteIBt-PfdRTHcHaclu5bMLjsJM0E',
  },
  {
    blockTime: '2022-04-03T22:35:47.993891Z',
    height: 2083770,
    blockHash: 'mdekX5TsJ2cm9Oc6-Sw_Lh35dSsZZO2JV-12Of5_tX4',
    requestKey: 'HOt9JEYesXYkw3aALUrnI0GMOks0FK0MTOSuJRpwDJU',
    params: [Array],
    name: 'marmalade.ledger.TOKEN',
    idx: 1,
    chain: 1,
    moduleHash: createHash('send some kda'),
  },
  {
    blockTime: '2022-04-01T18:18:20.652786Z',
    height: 2077495,
    blockHash: 'q7d-V3pD9vH2CENFvJ3F23Ki6YP2eVmSLXsZaGWpOOg',
    requestKey: 'rESWnPkxMZ_S_BQQIz995CkZ5K0vO7LXXM-iq73bens',
    params: [Array],
    name: 'marmalade.ledger.BUY',
    idx: 1,
    chain: 1,
    moduleHash: createHash('send some coins'),
  },
  {
    blockTime: '2022-04-01T18:18:20.652786Z',
    height: 2077495,
    blockHash: 'q7d-V3pD9vH2CENFvJasdasKi6YP2eVmSLXsZaGWpOOg',
    requestKey: 'rESWnPkxMZ_S_BQQIz9aadckZ5K0vO7LXXM-iq73bens',
    params: [Array],
    name: 'marmalade.ledger.ACCOUNT_GUARD',
    idx: 7,
    chain: 1,
    moduleHash: createHash('send some more coins'),
  },
  {
    blockTime: '2022-04-03T22:35:47.993891Z',
    height: 2077395,
    blockHash: '12ekX5TsJ2em9Oc6-adsdasd-12Of5_tX4',
    requestKey: '2129JEYesXYkw3aALUrnI0GMOks0FK0MTOSuJRpwDJU',
    params: [Array],
    name: 'marmalade.ledger.TOKEN',
    idx: 1,
    chain: 1,
    moduleHash: createHash('send some kda'),
  },
  {
    blockTime: '2022-04-01T18:18:20.652786Z',
    height: 2077295,
    blockHash: 'q7d-eepD9vH2CasdsadJ3F23Ki6YP2eVmSLXsZaGWpOOg',
    requestKey: 'rESWnPkxMZ_S_BQQIz995CkZ5asdas7LXXM-iq73bens',
    params: [Array],
    name: 'marmalade.ledger.BUY',
    idx: 1,
    chain: 1,
    moduleHash: createHash('send some coins'),
  },
  {
    blockTime: '2022-04-01T18:18:20.652786Z',
    height: 2077195,
    blockHash: 'eeE-V3pD9asdssadCENFvJ3F23Ki6YP2eVmSLXsZaGWpOOg',
    requestKey: 'rESWnPkxMZasdsadBQQIz995CkZ5K0vO7LXXM-iq73bens',
    params: [Array],
    name: 'marmalade.ledger.ACCOUNT_GUARD',
    idx: 7,
    chain: 1,
    moduleHash: createHash('send some more coins'),
  },
];
