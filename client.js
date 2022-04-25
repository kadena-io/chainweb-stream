import sseKadena from './src/client/index.js'

const kdaOrphansSection = document.querySelector('#kdaorphans')
const kdaSection = document.querySelector('#kdaevents')

function updateDom(eventsArray, parentDOM) {
  eventsArray.forEach((data) => {
    const div = document.createElement('div')
    div.classList.add('block')
    div.innerHTML = JSON.stringify(data)
    parentDOM.prepend(div)
  })
}

function updateDomObject(eventsObject, parentDOM) {
  Object.keys(eventsObject).forEach((data) => {
    const orphanObject = eventsObject[data]
    const div = document.createElement('div')
    div.classList.add('block')
    div.innerHTML = JSON.stringify(orphanObject)
    parentDOM.prepend(div)
  })
}

sseKadena().onInit((data) => {
  updateDom(data[0].kdaEvents, kdaSection)
  updateDomObject(data[0].orphans, kdaOrphansSection)
})

sseKadena().onUpdate((data) => {
  console.log('event', data)
  updateDom(data, kdaSection)
})
sseKadena().onUpdateOrphans((data) => {
  console.log('event', data)
  updateDomObject(data, kdaOrphansSection)
})
sseKadena().onError((error) => {
  console.log('event', error)
  updateDomObject(error, kdaOrphansSection)
})
