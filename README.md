# Chainweb SSE

Streaming service utilizing server-sent-events to stream chainweb transfers & events.

Tracks and streams transaction confirmation depth updates.

The payloads match the Chainweb-Data API response for [/txs/events](https://github.com/kadena-io/chainweb-api/blob/master/lib/ChainwebData/EventDetail.hs#L11) and [/txs/account](https://github.com/kadena-io/chainweb-api/blob/master/lib/ChainwebData/TransferDetail.hs#L14) with the addition of some [metadata](#payload-addition-meta).

## Status

Alpha version / unstable.

## Requirements

- node.js: **Recommended v18**. v20 should also work but is not tested extensively.
- npm or yarn
- redis

## Setup

Before you run chainweb-stream, you need to configure it via environment variables or a dotenv file.

To use a dotenv file, copy the `.default.env` file into `.env` and set at least the `NETWORK`, `DATA_HOST` and `CHAINWEB_HOST` values.

See [Configuration](#Configuration) for a full list of supported options.

```bash
npm i # or yarn
cp .default.env .env
vi .env # EDIT .env with the appropriate values
```

## Run

```bash
npm run start # or yarn start
```

Chainweb-stream listens on port 4000 by default.

Note: It currently waits for a request before syncing events from chainweb-data.

## Configuration

The following configuration flags can be passed in as environment variables or placed in `/.env`.

| Variable Name                        | Type                       | Required | Default Value  | Description                                                                                                 |
| ------------------------------------ | -------------------------- | -------- | -------------- | ----------------------------------------------------------------------------------------------------------- |
| NETWORK                              | string                     | yes      |                | Chainweb network to use. E.g. testnet04/mainnet01                                                           |
| DATA_HOST                            | string                     | yes      |                | URL of chainweb-data host to connect to. E.g. http://localhost:7890                                         |
| CHAINWEB_HOST                        | string                     | yes      |                | URL of chainweb-node **service** host to connect to. E.g. http://localhost:6600                             |
| PORT                                 | number                     |          | 4000           | Port to listen on                                                                                           |
| REDIS_HOST                           | string                     |          | localhost:6379 | Redis server to use. host:port                                                                              |
| REDIS_PASSWORD                       | string                     |          |                | Redis password                                                                                              |
| CONFIRMATION_DEPTH                   | number                     |          | 6              | Depth at which to consider transactions finalized                                                           |
| HEARTBEAT_INTERVAL                   | number                     |          | 25000          | Interval between heartbeat (ping) events                                                                    |
| EVENTS_STEP_INTERVAL                 | number                     |          | 10000          | Interval between new data checks against chainweb-data                                                      |
| CHAINWEB_CUT_UPDATE_INTERVAL         | number                     |          | 15000          | Interval between getting chainweb-node cuts                                                                 |
| CHAINWEB_DATA_HEIGHT_UPDATE_INTERVAL | number                     |          | 30000          | Interval between getting chainweb-data's latest heights                                                     |
| LOG                                  | error/warn/info/log/debug  |          | log            | Console log verbosity level                                                                                 |
| LOG_TIMESTAMPS                       | boolean                    |          | true           | Prefix console log rows with timestamp                                                                      |
| LOG_COLORS                           | boolean                    |          | true           | Color usage in console                                                                                      |
| NODE_ENV                             | production/<anything else> |          |                | Environment                                                                                                 |
| MODULE_HASH_BLACKLIST                | string[]                   |          |                | Modules to ignore while fetching events                                                                     |
| EVENTS_WHITELIST                     | string[]                   |          | *              | Module/Event allow list for /stream/event endpoint. Recommendation: set this strictly in public deployments |

## Official Client

You can use the official [chainweb-stream-client](https://github.com/kadena-community/kadena.js/tree/master/packages/libs/chainweb-stream-client) library to interact with chainweb-stream-client.

## Example Use

You can experiment with the server APIs using curl:

```
# curl -s  'http://localhost:4000/stream/event/coin?limit=2'
id: 0
event: initial
data: {"config":{"network":"mainnet01","type":"event","id":"coin","maxConf":6,"heartbeat":25000,"v":"0.0.3"},"data":[{"height":3911167,"name":"coin.TRANSFER","params":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","k:e7f7130f359fb1f8c87873bf858a0e9cbc3c1059f62ae715ec72e760b055e9f3",0.0000146],"blockTime":"2023-07-19T12:23:14.777353Z","requestKey":"zl-E_kle_EZzUYJpWHaNZgKyUPUfEs48alIYOek_RF8","blockHash":"QBQy3Aj3ZBYShtVEFOkOEbIDDUda2MfWWZIjb9MkVBc","moduleHash":"rE7DU8jlQL9x_MPYuniZJf5ICBTAEHAIFQCB4blofP4","idx":0,"chain":0,"meta":{"id":"0790270ba1f706c2d0daa62c2787bbd9","confirmations":0}},{"height":3911167,"name":"coin.TRANSFER","params":["99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a","b7df00dc4f1bb05da803d5efbb5336a8de29b015b97cad5df5a99c083e0088ae",{"decimal":"1.007810000000000000000000000000"}],"blockTime":"2023-07-19T12:23:14.777353Z","requestKey":"zl-E_kle_EZzUYJpWHaNZgKyUPUfEs48alIYOek_RF8","blockHash":"QBQy3Aj3ZBYShtVEFOkOEbIDDUda2MfWWZIjb9MkVBc","moduleHash":"rE7DU8jlQL9x_MPYuniZJf5ICBTAEHAIFQCB4blofP4","idx":1,"chain":0,"meta":{"id":"8b4c748babe3dad77269e9532927d25d","confirmations":0}}]}

id: 1
data: {"blockTime":"2023-03-01T12:23:55.929138Z","height":3508106,"blockHash":"qVppqo9ZadSM0RRI5IwDOJPkpWdDq0uH5SFHfItZ-5M","requestKey":"<coinbase>","params":["","k:e7f7130f359fb1f8c87873bf858a0e9cbc3c1059f62ae715ec72e760b055e9f3",1.0265475],"name":"coin.TRANSFER","idx":0,"chain":18,"moduleHash":"rE7DU8jlQL9x_MPYuniZJf5ICBTAEHAIFQCB4blofP4","meta":{"id":"7632170d70ede166c783ffaa3e66f935","confirmations":6}}

id: 2
event: ping
data: ""
```

## Module/Event Routes

`/stream/event/[MODULE_OR_EVENT_NAME]`

To stream events module-wide (e.g. coin) or single event (e.g. coin.TRANSFER)

Two endpoints are currently white listed:

`/stream/event/coin`

`/stream/event/marmalade`

You can change this in `src/sse/index.ts`

The payload matches the Chainweb-Data [/txs/events](https://github.com/kadena-io/chainweb-api/blob/master/lib/ChainwebData/EventDetail.hs#L11) API response, with the `.meta` addition as documented below. 

## Account Route

`/stream/account/[ACCOUNT]`

To stream account transfers.

The payload matches the Chainweb-Data [/txs/account](https://github.com/kadena-io/chainweb-api/blob/master/lib/ChainwebData/TransferDetail.hs#L14) API response, with the `.meta` additions as documented below.

## Payload addition: `.meta` 

Chainweb-stream-server streams event confirmations as they happen, up to the maximum confirmation depth (default 6, configurable with `CONFIRMATION_DEPTH`).

Each streamed payload includes a `.meta` structure as follows:

```
"meta": {
  "id": string
  "confirmations": number
}
```

The `id` field is independent of block-specific values, so an event will have the same ID if it exists on two forks. You can use this to deduplicate, since events will be streamed multiple times if they are not confirmed yet.


## Wire protocol (unstable)

Three kinds of events are sent over the wire:

### Configuration and initial data ("initial")

Upon connection initialization, chainweb-stream-server sends an `initial` event that includes system configuration values, request parameters and cached/initial data. If there is no cached data ready to send, that field is an empty array.

The `initial` event payload structure is defined in `src/types.ts` as `InitialEvent`

Data payload is an array of events/transfers. See Routes for payload definitions.

```
id: 1
event: initial
data: {"config":{"network":"mainnet01","type":"event","id":"coin","maxConf":6,"heartbeat":25000,"v":"0.0.2"},"data":[]}
```

The rationale for exposing and validating these configuration parameters is outlined in [Validating Server/Client configuration compatibility](#validating-serverclient-configuration-compatibility)

### Heartbeats ("ping")

Sent every 25 seconds by default (configurable with `HEARTBEAT_INTERVAL` in ms)

Useful for detecting stale connections from the client and to keep alive the connection through load balancers or proxies when there is no other data.

```
id: 10
event: ping 
data: ""
```

### Heights

Sent whenever a new max height is fetched from chainweb-data. This check against chainweb-data happens every 30 seconds by default, which is configurable with the CHAINWEB_DATA_HEIGHT_UPDATE_INTERVAL env var.

The client currently uses this value to reconnect gracefully based on a formula like `$prev_max_height - $confirmation_depth - $max_chain_span`. 

Payload is an object with `data` as the key and a numeric height as value:

```
id: 2
event: heights
data: {"data":3380002}
```

### Data 

For new or updated data. No event name (default message callback if you are consuming through EventSource).

Payload is single event/transfer.

```
id: 42
data: {payload}
```

## Validating Server/Client configuration compatibility

Certain configuration incompatibilities between the server and a client can cause unexpected behaviors. These can include silent failures and infinite reconnection loops. `chainweb-stream-client` implements certain validation checks.

The most important configuration values for the client to validate are `maxConf` and `heartbeat`.

**Confirmation Depth**

`maxConf` is the server-side configuration for `CONFIRMATION_DEPTH`. If the client is configured with a larger confirmation depth than the server, transactions will never be considered "finalized" on the client, as the server will consider that N confirmations are enough to consider a transaction finalized, whereas the client will wait for more than N for the same.

Therefore the client must ensure that:

`server.CONFIRMATION_DEPTH >= client.CONFIRMATION_DEPTH`

**Heartbeat Interval**

`heartbeat` is the server-side configuration for `HEARTBEAT_INTERVAL`. If the client is configured to process heartbeats (in order to detect stale connections) and its heartbeat interval configuration is smaller than the server's, then it will consider each connection stale before the server has sent the `ping` heartbeat event and the resulting behavior will be a reconnection loop initiated by the client.

Therefore the client must ensure that:

`server.HEARTBEAT_INTERVAL < client.HEARTBEAT_INTERVAL`

**Network**

This enables clients to validate that they are connecting to the intended network, or otherwise throw an error.

**Type & ID**

This echoes the type (e.g. `account`/`event`) and ID (e.g. `coin.TRANSFER`/`k:abcdef01234...`) of the request parameter.

**Version**

A wire protocol version identifier to enable warnings when a client is not fully compatible with the server. 
