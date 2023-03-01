/*

BLOCKCHAIN CONFIGURATION FILE

  initalize all data for pact-lang-api kadena blockchain calls

  modify this file to interact with different
    chains, networks, contracts

  documentation:
    https://pact-language.readthedocs.io/en/stable/

  pact tutorials:
    https://pactlang.org/

*/

//chain that contract lives on
const chainId = '1'

//id of network version
const networkId = 'testnet04'

//network node
const node = 'api.testnet.chainweb.com'

//data host
const dataHost = 'data.testnet.chainweb.com:8080'

//unique contract name
const hftNamespace = 'marmalade'
const hftContractName = 'ledger'
const hftConstants = {}

//unique contract name
const manifestNamespace = 'kip'
const manifestContractName = 'token-manifest'
const manifestConstants = {}

//unique contract name
const gtpNamespace = 'marmalade'
const gtpContractName = 'guard-token-policy'
const gtpConstants = {}

//unique contract name
const fqpNamespace = 'marmalade'
const fqpContractName = 'fixed-quote-policy'
const fqpConstants = {}

//unique contract name
const fqrpNamespace = 'marmalade'
const fqrpContractName = 'fixed-quote-royalty-policy'
const fqrpConstants = {}

//unique gas station contract name
const gasStationName = 'memory-wall-gas-station'

//chainweb api host
const apiHost = `https://${node}`

//pact api host to send requests
const host = `https://${node}/chainweb/0.0/${networkId}/chain/${chainId}/pact`

//creation time for request
export const creationTime = () => Math.round(new Date().getTime() / 1000) - 15

export const globalConfig = {
  explorerURL: `https://explorer.chainweb.com/${networkId.slice(0, -2)}`,
  networkId: networkId,
  dataHost: dataHost,
  host: host,
  chainId: chainId,
  creationTime: creationTime,
  //gas price at lowest possible denomination
  gasPrice: 0.000001,
  //high gas limit for tx
  gasLimit: 100000,
  //time a tx lives in mempool since creationTime
  ttl: 28800,
  //sender === gas payer of the transaction
}

//JSON with all necessary blockchain call data
export const manifestAPI = {
  contractName: manifestContractName,
  gasStationName: gasStationName,
  namespace: manifestNamespace,
  contractAddress: `${manifestNamespace}.${manifestContractName}`,
  gasStationAddress: `${manifestNamespace}.${gasStationName}`,
  explorerURL: `https://explorer.chainweb.com/${networkId.slice(0, -2)}`,
  constants: manifestConstants,
  meta: {
    networkId: networkId,
    chainId: chainId,
    host: host,
    creationTime: creationTime,
    //gas price at lowest possible denomination
    gasPrice: globalConfig.gasPrice,
    //high gas limit for tx
    gasLimit: globalConfig.gasLimit,
    //time a tx lives in mempool since creationTime
    ttl: 28800,
    //sender === gas payer of the transaction
    //  set to our gas station account defined in memory-wall-gas-station.pact
    sender: 'mw-free-gas',
    //nonce here doesnt matter since the tx will never have the same hash
    nonce: 'some nonce that doesnt matter',
  },
}

//JSON with all necessary blockchain call data
export const hftAPI = {
  contractName: hftContractName,
  gasStationName: gasStationName,
  namespace: hftNamespace,
  contractAddress: `${hftNamespace}.${hftContractName}`,
  gasStationAddress: `${hftNamespace}.${gasStationName}`,
  explorerURL: `https://explorer.chainweb.com/${networkId.slice(0, -2)}`,
  constants: hftConstants,
  meta: {
    networkId: networkId,
    chainId: chainId,
    host: host,
    apiHost: apiHost,
    creationTime: creationTime,
    //gas price at lowest possible denomination
    gasPrice: globalConfig.gasPrice,
    //high gas limit for tx
    gasLimit: globalConfig.gasLimit,
    //time a tx lives in mempool since creationTime
    ttl: 28800,
    //sender === gas payer of the transaction
    //  set to our gas station account defined in memory-wall-gas-station.pact
    sender: 'mw-free-gas',
    //nonce here doesnt matter since the tx will never have the same hash
    nonce: 'some nonce that doesnt matter',
  },
}

export const gtpAPI = {
  contractName: gtpContractName,
  gasStationName: gasStationName,
  namespace: gtpNamespace,
  contractAddress: `${gtpNamespace}.${gtpContractName}`,
  gasStationAddress: `${gtpNamespace}.${gasStationName}`,
  explorerURL: `https://explorer.chainweb.com/${networkId.slice(0, -2)}`,
  constants: gtpConstants,
  meta: {
    networkId: networkId,
    chainId: chainId,
    host: host,
    creationTime: creationTime,
    //gas price at lowest possible denomination
    gasPrice: globalConfig.gasPrice,
    //high gas limit for tx
    gasLimit: globalConfig.gasLimit,
    //time a tx lives in mempool since creationTime
    ttl: 28800,
    //sender === gas payer of the transaction
    //  set to our gas station account defined in memory-wall-gas-station.pact
    sender: 'mw-free-gas',
    //nonce here doesnt matter since the tx will never have the same hash
    nonce: 'some nonce that doesnt matter',
  },
}

export const fqpAPI = {
  contractName: fqpContractName,
  gasStationName: gasStationName,
  namespace: fqpNamespace,
  contractAddress: `${fqpNamespace}.${fqpContractName}`,
  gasStationAddress: `${fqpNamespace}.${gasStationName}`,
  explorerURL: `https://explorer.chainweb.com/${networkId.slice(0, -2)}`,
  constants: fqpConstants,
  meta: {
    networkId: networkId,
    chainId: chainId,
    host: host,
    creationTime: creationTime,
    //gas price at lowest possible denomination
    gasPrice: globalConfig.gasPrice,
    //high gas limit for tx
    gasLimit: globalConfig.gasLimit,
    //time a tx lives in mempool since creationTime
    ttl: 28800,
    //sender === gas payer of the transaction
    //  set to our gas station account defined in memory-wall-gas-station.pact
    sender: 'mw-free-gas',
    //nonce here doesnt matter since the tx will never have the same hash
    nonce: 'some nonce that doesnt matter',
  },
}

export const fqrpAPI = {
  contractName: fqrpContractName,
  gasStationName: gasStationName,
  namespace: fqrpNamespace,
  contractAddress: `${fqrpNamespace}.${fqrpContractName}`,
  gasStationAddress: `${fqrpNamespace}.${gasStationName}`,
  explorerURL: `https://explorer.chainweb.com/${networkId.slice(0, -2)}`,
  constants: fqrpConstants,
  meta: {
    networkId: networkId,
    chainId: chainId,
    host: host,
    creationTime: creationTime,
    //gas price at lowest possible denomination
    gasPrice: globalConfig.gasPrice,
    //high gas limit for tx
    gasLimit: globalConfig.gasLimit,
    //time a tx lives in mempool since creationTime
    ttl: 28800,
    //sender === gas payer of the transaction
    //  set to our gas station account defined in memory-wall-gas-station.pact
    sender: 'mw-free-gas',
    //nonce here doesnt matter since the tx will never have the same hash
    nonce: 'some nonce that doesnt matter',
  },
}

export const keyFormatter = (str) =>
  str
    .replace(new RegExp('[A-Z]+', 'gm'), ' $&')
    .replace(new RegExp('^[a-z]', 'gm'), (k) => k.toUpperCase())
