import SSE from 'express-sse'
import _ from 'lodash'
import fetch from 'node-fetch'
import { config } from '../../config/index.js'
// get latest data from db if needed

export let kdaEvents = []
export let orphansEvents = []
export let continueStreaming = true

let initialEventsPoolCreated = false
let prevEventHeight = 0

export const sse = new SSE({ kdaEvents, orphansEvents }, { initialEvent: 'k:init' })

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

  // same requestkey hash of transaction
  // different blockhashes
  // print out duplicates
  // get main api

  // only update the new events req & blockhash
  prevEventHeight = prevKdaEvents.length ? prevKdaEvents[0].height : 0

  console.log({ prevEventHeight, prevKdaEvents })

  const marmaladeEvents = await syncEventsFromChainWeaverData(
    'marmalade.',
    100,
    4,
    true,
    config.moduleHashBlacklist,
  )

  const orphanList = []
  const newKdaEvents = []
  const oldKdaEvents = []

  marmaladeEvents.forEach((event) => {
    if (event.height > prevEventHeight) {
      newKdaEvents.push(event)
      prevEventHeight = event.height
    } else if (event.height <= prevEventHeight) {
      oldKdaEvents.push(event)
    }
  })

  newKdaEvents.forEach((event) => {
    newKdaEvents.forEach((event2) => {
      if (event.requestKey === event2.requestKey && event.blockHash !== event2.blockHash) {
        orphanList.push({ event, event2 })
        console.log('____________orphanList_____________', { event, event2 })
      }
    })
  })

  console.log({ prevEventHeight })
  console.log({ orphanList })
  console.log({ newKdaEvents })
  console.log({ oldKdaEvents })
  console.log('_________________________')

  return { oldKdaEvents, newKdaEvents, orphans: orphanList }
}

export const updateClient = async (prevKdaEvents) => {
  try {
    const { newKdaEvents, orphans, oldKdaEvents } = await getKdaEvents(prevKdaEvents)
    if (initialEventsPoolCreated) {
      initialEventsPoolCreated = true
      sse.send(oldKdaEvents, 'k:update')
      kdaEvents.push(...oldKdaEvents)
    }

    kdaEvents.push(...newKdaEvents)
    orphansEvents.push(...orphans)
    sse.send(newKdaEvents, 'k:update')
    sse.send(orphans, 'k:update:orphans')

    return kdaEvents
  } catch (error) {
    sse.send(error, 'k:error')
    return kdaEvents
  }
}

const startStreamingUpdates = async () => {
  while (continueStreaming) {
    await updateClient(kdaEvents, initialEventsPoolCreated)
    await new Promise((r) => setTimeout(r, 60000))
  }
}

export const stopStreaming = function () {
  continueStreaming = false
}

export const startStreaming = function () {
  startStreamingUpdates(kdaEvents)
}
