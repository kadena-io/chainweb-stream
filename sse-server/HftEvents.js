const _ = require('lodash');
//config file for blockchain calls
const { hftAPI, fqpAPI, fqrpAPI, globalConfig, chainId } = require("../kadena-config.js");

const eventHost = "testnetqueries.kadena.network";

const getCWDataEvents = async (name, offset, limit=50) => {
  console.debug('fetching marm events', {limit, offset})
//  const raw = fetch(`https://${eventHost}/txs/events\?name\=${name}\&limit\=${limit}\&offset\=${offset}`);
  const raw = fetch(`http://${globalConfig.dataHost}/txs/events\?name\=${name}\&limit\=${limit}\&offset\=${offset}`);
  const rawRes = await raw;
  const res = await rawRes;
  if (res.ok){
     const resJSON = await rawRes.json();
     return resJSON;
   } else {
     const resTEXT = await rawRes.text();
     return resTEXT;
   }
};

const sortEvents = (ev1, ev2, newestToOldest=false) => {
  return newestToOldest ? ev2.height-ev1.height : ev1.height-ev2.height;
};

export const syncEventsFromCWData = async (name, limit=50, threads=4, newestToOldest=false, moduleHashBlacklist=[]) => {
  console.debug(`starting to get ${name} events`)
  var offset = 0;
  var promisedResults = [];
  var completedResults = [];
  var continueSync = true;
  while (continueSync) {
    console.debug(`${name} events, doing batch`, {offset, limit, threads});
    for (var i = 0; i < threads; i++) {
      promisedResults.push(getCWDataEvents(name, offset, limit));
      offset = (offset + limit);
    };
    completedResults = await Promise.all(promisedResults);
    // once a batch comes back empty, we're caught up
    continueSync = _.every(_.map(completedResults, (v) => v.length >= limit));
  };
  // console.debug(`${name} raw events`, _.flatten(completedResults));
  completedResults = _.filter(_.flatten(completedResults), ({moduleHash}) => {return !moduleHashBlacklist.includes(moduleHash);});
  completedResults.sort((a,b)=>sortEvents(a,b,newestToOldest));
  console.debug(`${name}'s events`, stateObj);
  return stateObj;
};

// TODO: finish this, blocked on bug in Chainweb.js that defaults host back to mainnet. This is for id-ing orphaned events
// export const getQuotesForSaleEvents = async (evs) => {
//   let p = {};
//   for (const {name, requestKey, blockHash} of evs) {
//     console.debug([hftAPI.meta.chainId, blockHash, hftAPI.meta.networkId, hftAPI.meta.apiHost]);
//     debugger;
//     p[requestKey] = await Chainweb.transaction.blockHash(hftAPI.meta.chainId, blockHash, hftAPI.meta.networkId, hftAPI.meta.apiHost);
//   };
//   // await Promise.allSettled(p);
//   console.debug("getQuotesForSaleEvents", p);
//   return p;
// }
