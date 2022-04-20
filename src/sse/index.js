import SSE from 'express-sse'
import _ from 'lodash'
import fetch from 'node-fetch'
import { config } from '../../config/index.js'
// get latest data from db if needed

export let kdaEvents = []
export let orphans = {}
export let lowestOrphanBlockheight
export let highestNonOrphanBlockheight = 0
export let continueStreaming = true

let initialEventsPoolCreated = false
let prevEventHeight = 0

export const sse = new SSE({ kdaEvents, orphans }, { initialEvent: 'k:init' })

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
  let offset = 0
  let promisedResults = []
  let completedResults = []
  let continueSync = true

  while (continueSync) {
    for (let i = 0; i < threads; i++) {
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
  // TODO get main api
  // TODO only update the new events req & blockhash

  prevEventHeight = prevKdaEvents.length ? prevKdaEvents[0].height : 0

  const marmaladeEvents = await syncEventsFromChainWeaverData(
    'marmalade.',
    100,
    4,
    true,
    config.moduleHashBlacklist,
  )

  const newKdaEvents = []
  const oldKdaEvents = []
  const orphanKeyMap = {}

  marmaladeEvents.forEach((event) => {
    if (event.height > prevEventHeight) {
      newKdaEvents.push(event)
      prevEventHeight = event.height
    } else if (event.height <= prevEventHeight) {
      oldKdaEvents.push(event)
    }
  })

  marmaladeEvents.forEach((event) => {
    marmaladeEvents.forEach((event2) => {
      if (event.requestKey === event2.requestKey && event.blockHash !== event2.blockHash) {
        orphanKeyMap[event.requestKey] = { event, event2 }
        if (!lowestOrphanBlockheight || lowestOrphanBlockheight > event.height) {
          lowestOrphanBlockheight = event.height
        }

        console.log(orphanKeyMap)
        return false
      }
    })

    // use every to break out of loop when found
    marmaladeEvents.forEach(() => {
      if (event.height < lowestOrphanBlockheight && event.height > highestNonOrphanBlockheight) {
        highestNonOrphanBlockheight = event.height
      }
    })
  })

  return { oldKdaEvents, newKdaEvents, orphanKeyMap }
}

export const updateClient = async (prevKdaEvents) => {
  try {
    const { newKdaEvents, orphanKeyMap, oldKdaEvents } = await getKdaEvents(prevKdaEvents)

    if (!initialEventsPoolCreated) {
      initialEventsPoolCreated = true
      sse.send(oldKdaEvents, 'k:update')
      kdaEvents.push(...oldKdaEvents)
    }

    //TODO create buffer of 6 level deep before send
    kdaEvents.push(...newKdaEvents)
    sse.send(newKdaEvents, 'k:update')

    Object.keys(orphanKeyMap).forEach((requestKey) => {
      if (!orphans[requestKey]) {
        orphans[requestKey] = orphanKeyMap[requestKey]
        sse.send(orphans[requestKey], 'k:update:orphans')
      }
    })

    return { kdaEvents, newKdaEvents, orphans }
  } catch (error) {
    sse.send(error, 'k:error')
    return { kdaEvents, prevKdaEvents, orphans }
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
