import fetch from "node-fetch";
import cors from 'cors';
import bodyParser from "body-parser";
import express from 'express'
import _ from 'lodash';
import { hftAPI, fqpAPI, fqrpAPI, globalConfig, chainId } from '../kadena-config.js';

// Server Code
const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.get('/status', (request, response) => response.json({clients: clients.length}));

const PORT = 3000;

let clients = [];
let kdaEvents = [];

app.listen(PORT, () => {
  console.log(`KDA even Events service listening at http://localhost:${PORT}`)
})

function eventsHandler(request, response, next) {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  response.writeHead(200, headers);

  const data = `data: ${JSON.stringify(kdaEvents)}\n\n`;

  response.write(data);

  const clientId = Date.now();

  const newClient = {
    id: clientId,
    response
  };

  clients.push(newClient);

  request.on('close', () => {
    console.log(`${clientId} Connection closed`);
    clients = clients.filter(client => client.id !== clientId);
  });
}

app.get('/events', eventsHandler);

function sendEventsToAll(newFact) {
  clients.forEach(client => client.response.write(`data: ${JSON.stringify(newFact)}\n\n`))
}

async function addEvent(newEvent) {
  kdaEvents.push(newEvent);
  console.log("new event: ", newEvent );
  return sendEventsToAll(newEvent);
}

// Events Code
const eventHost = "testnetqueries.kadena.network";

const getCWDataEvents = async (name, offset, limit=50) => {
  console.log('fetching marm events', {limit, offset})
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

const syncEventsFromCWData = async (name, limit=50, threads=4, newestToOldest=false, moduleHashBlacklist=[]) => {
  console.log(`starting to get ${name} events`)
  var offset = 0;
  var promisedResults = [];
  var completedResults = [];
  var continueSync = true;
  while (continueSync) {
    console.log(`${name} events, doing batch`, {offset, limit, threads});
    for (var i = 0; i < threads; i++) {
      promisedResults.push(getCWDataEvents(name, offset, limit));
      offset = (offset + limit);
    };
    completedResults = await Promise.all(promisedResults);
    // once a batch comes back empty, we're caught up
    continueSync = _.every(_.map(completedResults, (v) => v.length >= limit));
  };
  // console.log(`${name} raw events`, _.flatten(completedResults));
  completedResults = _.filter(_.flatten(completedResults), ({moduleHash}) => {return !moduleHashBlacklist.includes(moduleHash);});
  completedResults.sort((a,b)=>sortEvents(a,b,newestToOldest));
  // console.log(`${name}'s events`, completedResults);
  return completedResults;
};

const getKdaEvents = async (prevKdaEvents) => {
  const moduleHashBlacklist = [
      "LKQj2snGFz7Y8iyYlSm3uIomEAYb0C9zXCkTIPtzkPU",
      "F7tD1QlT8dx8BGyyq-h22OECYS7C3FfcYaRyxt6D1YQ",
      "WSIFGtnAlLCHFcFEHaKGrGeAG4qnTsZRj9BdvzzGa6w",
      "4m9KUKUzbd9hVZoN9uIlJkxYaf1NTz9G7Pc9C9rKTo4",
      "_1rbpI8gnHqflwb-XqHsYEFBCrLNncLplikh9XFG-y8",
      "dhIGiZIWED2Rk6zIrJxG8DeQn8n7WDKg2b5cZD2w4CU",
      "cOJgr8s3j3p5Vk0AAqjdf1TzvWZlFsAiq4pMiOzUo1w",
      "HsePyFCyYUPEPJqG5VymbQkkI3gsPAQn218uWEF_dbs",
      "lWqEvH5U20apKfBn27HOBaW46vQlxhkiDtYHZ5KoYp0",
      "uvtUnp96w2KnxnneYa4kUN1kTvYSa8Ma33UDkQXV0NA",
      "78ngDzxXE8ZyHE-kFm2h7-6Xm8N8uwU_xd1fasO8gWU"
  ]
  // Some hacky "streaming" until the streaming api is back in
  // TODO: hacky orphan detection
  const forkDepth = 100;
  const newEventHeight = prevKdaEvents.length ? prevKdaEvents[0]["blockHeight"] - forkDepth : 0;
  const oldKdaEvents = _.dropWhile(prevKdaEvents,({height})=>height>newEventHeight);
  const marmEvents = await syncEventsFromCWData('marmalade.', 100, 4, true, moduleHashBlacklist);
  const newKdaEvents = _.takeWhile(marmEvents,({height})=>height>=newEventHeight);
  const mergedEvents = [...newKdaEvents, ...oldKdaEvents];
  console.log("getKdaEvents", {mergedEvents, newKdaEvents, oldKdaEvents});
  return {mergedEvents, newKdaEvents};
};

const jankyStreaming = async (prevKdaEvents) => {
  // this is just a hack until we get the steaming API online for events
  while (true) {
    const {newKdaEvents, mergedEvents} = await getKdaEvents(prevKdaEvents);
    newKdaEvents.map((v)=>addEvent(v));
    console.log('janky streaming fired...', {prevKdaEvents, mergedEvents});
    await new Promise(r => setTimeout(r, 60000));
  }
};

jankyStreaming(kdaEvents)

// TODO: finish this, blocked on bug in Chainweb.js that defaults host back to mainnet. This is for id-ing orphaned events
// export const getQuotesForSaleEvents = async (evs) => {
//   let p = {};
//   for (const {name, requestKey, blockHash} of evs) {
//     console.log([hftAPI.meta.chainId, blockHash, hftAPI.meta.networkId, hftAPI.meta.apiHost]);
//     debugger;
//     p[requestKey] = await Chainweb.transaction.blockHash(hftAPI.meta.chainId, blockHash, hftAPI.meta.networkId, hftAPI.meta.apiHost);
//   };
//   // await Promise.allSettled(p);
//   console.log("getQuotesForSaleEvents", p);
//   return p;
// }
