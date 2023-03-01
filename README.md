# Chainweb SSE

Streaming service utilizing server-sent-events to stream specific events, as well as updates to them.

## Status

Proof-of-concept / Alpha version

## Setup

CW-SSE currently requires a local redis client to cache results.

Configuration via environment variables is required. Copy the `.default.env` file into `.env` and replace the `REDIS_PASSWORD` value with your redis password. It assumes a localhost redis on the default port.

```
npm i
cp .default.env .env
# EDIT .env with the correct REDIS_PASSWORD
```

## Run

```
npm run start
```

Note: It currently waits for a request before syncing events from cw-data. This will likely change.

## Module/Event Routes

These are not final but for now we support two types of streaming module/event routes:

`/stream/event/coin`

and

`/stream/event/marmalade`

These will stream all *confirmed* events as they happen, according to the CONFIRMATION_HEIGHT env var (default 6.)

## Example Use

```
$ curl http://localhost:3000/stream/event/marmalade\?limit=10
id: 0
event: initial
data: [{"blockTime":"2022-12-15T02:46:57.727902Z","height":3288066,"blockHash":"gwQWkewwpzAK0iRVvgRjcPZlNokANEAw7oOBLeWebPo","requestKey":"aea2i7mZQJclB46EBdS3hZ1N-fzs6VfJY3-tifLkJLQ","params":["t:Abd2 Test col0044 collection Staging Final:6",1],"name":"marmalade.ledger.SUPPLY","idx":6,"chain":8,"moduleHash":"ovxYn-4UNKoLxKFgxccjPM076lqZfuD3H89qvzqd0t0"},{"and so on":1}]

id: 1
event: update
data: {"blockTime":"2022-12-15T02:46:57.727902Z","height":3288066,"blockHash":"gwQWkewwpzAK0iRVvgRjcPZlNokANEAw7oOBLeWebPo","requestKey":"aea2i7mZQJclB46EBdS3hZ1N-fzs6VfJY3-tifLkJLQ","params":["t:Abd2 Test col0044 collection Staging Final:6","k:431a0a02cdfd8eabb3b78789795818933f518c8de74c02666ec732457959b6a4",{"pred":"keys-all","keys":["431a0a02cdfd8eabb3b78789795818933f518c8de74c02666ec732457959b6a4"]}],"name":"marmalade.ledger.ACCOUNT_GUARD","idx":3,"chain":8,"moduleHash":"ovxYn-4UNKoLxKFgxccjPM076lqZfuD3H89qvzqd0t0"}
```

We are actively working on an `/account/` endpoint which will stream all account-related transactions & events.
