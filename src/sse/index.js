import SSE from 'express-sse'

export const sse = new SSE(['test data'])

let count = 0
setInterval(() => sse.send({ counter: count++ }, 'update'), 5000)
