import { createHmac } from 'crypto'

const secret = 'kadena'

function createHash(text) {
  return createHmac('sha256', secret).update(text).digest('hex')
}

export default () => [
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
    blockHash: 'q7d-V3pD9vH2CENFvJ3F23Ki6YP2eVmSLXsZaGWpOOg',
    requestKey: 'rESWnPkxMZ_S_BQQIz995CkZ5K0vO7LXXM-iq73bens',
    params: [Array],
    name: 'marmalade.ledger.ACCOUNT_GUARD',
    idx: 7,
    chain: 1,
    moduleHash: createHash('send some more coins'),
  },
]
