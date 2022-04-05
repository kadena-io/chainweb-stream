import SSE from 'express-sse'
import _ from 'lodash'
import fetch from 'node-fetch'
import { config } from '../../config/index.js'

export const sse = new SSE([]) // get latest data from db if needed

export let kdaEvents = []

const getChainWeaverDataEvents = async (name, offset, limit = 50) => {
  const rawRes = await fetch(
    `http://${config.dataHost}/txs/events\?name\=${name}\&limit\=${limit}\&offset\=${offset}`,
  )
  const response = await rawRes

  if (response.ok) {
    const resJSON = await rawRes.json()
    return resJSON
  } else {
    const resTEXT = await rawRes.text()
    return resTEXT
  }
}

const sortEvents = (ev1, ev2, newestToOldest = false) => {
  return newestToOldest ? ev2.height - ev1.height : ev1.height - ev2.height
}

const syncEventsFromChainWeaverData = async (
  name,
  limit = 50,
  threads = 4,
  newestToOldest = false,
  moduleHashBlacklist = [],
) => {
  var offset = 0
  var promisedResults = []
  var completedResults = []
  var continueSync = true
  while (continueSync) {
    console.log(`${name} events, doing batch`, { offset, limit, threads })

    for (var i = 0; i < threads; i++) {
      promisedResults.push(getChainWeaverDataEvents(name, offset, limit))
      offset = offset + limit
    }

    completedResults = await Promise.all(promisedResults)
    // once a batch comes back empty, we're caught up
    continueSync = _.every(_.map(completedResults, (v) => v.length >= limit))
  }
  completedResults = _.filter(_.flatten(completedResults), ({ moduleHash }) => {
    return !moduleHashBlacklist.includes(moduleHash)
  })
  completedResults.sort((a, b) => sortEvents(a, b, newestToOldest))
  return completedResults
}

const getKdaEvents = async (prevKdaEvents) => {
  // TODO: hacky orphan detection
  const forkDepth = 100
  const newEventHeight = prevKdaEvents.length ? prevKdaEvents[0]['blockHeight'] - forkDepth : 0

  console.log({ newEventHeight, prevKdaEvents })

  const oldKdaEvents = _.dropWhile(prevKdaEvents, ({ height }) => height > newEventHeight)

  const marmaladeEvents = await syncEventsFromChainWeaverData(
    'marmalade.',
    100,
    4,
    true,
    config.moduleHashBlacklist,
  )

  const newKdaEvents = _.takeWhile(marmaladeEvents, ({ height }) => height >= newEventHeight)

  const mergedEvents = [...newKdaEvents, ...oldKdaEvents]

  return { mergedEvents, newKdaEvents }
}

const updateClient = async (prevKdaEvents) => {
  const { newKdaEvents } = await getKdaEvents(prevKdaEvents)
  kdaEvents.push(...newKdaEvents)
  sse.send(kdaEvents, 'k:update')
}

const startStreamingUpdates = async (prevKdaEvents) => {
  while (true) {
    await updateClient(prevKdaEvents)
    await new Promise((r) => setTimeout(r, 60000))
  }
}

startStreamingUpdates(kdaEvents)
