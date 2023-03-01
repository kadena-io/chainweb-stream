# Chainweb SSE

Streaming service utilizing server-sent-events to stream chainweb transfers & events.

Tracks and streams transaction confirmation depth updates.

The payloads match the Chainweb-Data API response for [/txs/events](https://github.com/kadena-io/chainweb-api/blob/master/lib/ChainwebData/EventDetail.hs#L11) and [/txs/account](https://github.com/kadena-io/chainweb-api/blob/master/lib/ChainwebData/TransferDetail.hs#L14) with the addition of some [metadata](#payload-addition-meta).

## Status

Alpha version / unstable.

## Setup

CW-SSE currently requires a local redis client to cache results.

Configuration via environment variables or dotenv file is required. Copy the `.default.env` file into `.env` and set at least the `NETWORK`, `DATA_HOST` and `CHAINWEB_HOST` values.

```
npm i
cp .default.env .env
# EDIT .env with the appropriate values
```

## Run

```
npm run start
```

Note: It currently waits for a request before syncing events from cw-data.

## Wire protocol (unstable)

Three kinds of events are sent over the wire:

### Initial load ("initial")

Sent upon initialization _if_ there are cached results to send immediately, otherwise omitted.

Payload is an array of events/transfers. See Routes below for payload definitions.

```
id: 1
event: initial
data: [{payload}, {payload}]
```

### Heartbeats ("ping")

Sent every 25 seconds by default (configurable with `HEARTBEAT_INTERVAL` in ms)

Useful for detecting stale connections from the client and to keep alive the connection through load balancers or proxies when there is no other data.

```
id: 10
event: ping 
data: ""
```

### Data 

For new or updated data. No event name (default message callback if you are consuming through EventSource).

Payload is single event/transfer.

```
id: 42
data: {payload}
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

CW-SSE streams event confirmations as they happen, up to the maximum confirmation depth (default 6, configurable with `CONFIRMATION_DEPTH`).

Each streamed payload includes a `.meta` structure as follows:

```
"meta": {
  "id": string
  "confirmations": number
}
```

The `id` field is independent of block-specific values, so an event will have the same ID if it exists on two forks. You can use this to deduplicate, since events will be streamed multiple times if they are not confirmed yet.

## Example Use

```
# curl -s  'http://localhost:4000/stream/event/coin?limit=2'
id: 0
event: initial
data: [{"blockTime":"2023-03-01T12:23:25.564693Z","height":3508106,"blockHash":"O6kzghnwCe0BowtcymSRX8URP2kC_6zeRKb6OUdu3vE","requestKey":"<coinbase>","params":["","99cb7008d7d70c94f138cc366a825f0d9c83a8a2f4ba82c86c666e0ab6fecf3a",1.0265475],"name":"coin.TRANSFER","idx":0,"chain":9,"moduleHash":"rE7DU8jlQL9x_MPYuniZJf5ICBTAEHAIFQCB4blofP4","meta":{"id":"2db40fabb613fe9e970af8b71d594f0e","confirmations":1}},{"blockTime":"2023-03-01T12:24:01.520663Z","height":3508106,"blockHash":"YZZgxM9SGjfh_-WKdsffeg1dI8j6APHB8aDM8aqnGyk","requestKey":"<coinbase>","params":["","k:e7f7130f359fb1f8c87873bf858a0e9cbc3c1059f62ae715ec72e760b055e9f3",1.0265475],"name":"coin.TRANSFER","idx":0,"chain":1,"moduleHash":"rE7DU8jlQL9x_MPYuniZJf5ICBTAEHAIFQCB4blofP4","meta":{"id":"b02626c21b7dffe8a41ec5bccfd5d2f6","confirmations":0}}]

id: 1
data: {"blockTime":"2023-03-01T12:23:55.929138Z","height":3508106,"blockHash":"qVppqo9ZadSM0RRI5IwDOJPkpWdDq0uH5SFHfItZ-5M","requestKey":"<coinbase>","params":["","k:e7f7130f359fb1f8c87873bf858a0e9cbc3c1059f62ae715ec72e760b055e9f3",1.0265475],"name":"coin.TRANSFER","idx":0,"chain":18,"moduleHash":"rE7DU8jlQL9x_MPYuniZJf5ICBTAEHAIFQCB4blofP4","meta":{"id":"7632170d70ede166c783ffaa3e66f935","confirmations":6}}

id: 2
event: ping
data: ""
```
