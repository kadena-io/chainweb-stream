const sseKadena = () => {
  const es = new EventSource('http://localhost:3000/stream');
  let innerOnInit;
  let innerOnUpdate;
  let innerOnError;
  let innerOnUpdateOrphans;

  es.addEventListener('k:init', function (event) {
    innerOnInit && innerOnInit(JSON.parse(event.data));
  });

  es.addEventListener('k:update', function (event) {
    innerOnUpdate && innerOnUpdate(JSON.parse(event.data));
  });

  es.addEventListener('k:update:orphans', function (event) {
    innerOnUpdateOrphans && innerOnUpdateOrphans(JSON.parse(event.data));
  });

  es.addEventListener('k:error', function (event) {
    innerOnError && innerOnError(JSON.parse(event.data));
  });

  function onInit(fn) {
    innerOnInit = fn;
  }
  function onUpdate(fn) {
    innerOnUpdate = fn;
  }
  function onUpdateOrphans(fn) {
    innerOnUpdateOrphans = fn;
  }
  function onError(fn) {
    innerOnError = fn;
  }

  return {
    onInit,
    onUpdate,
    onUpdateOrphans,
    onError,
  };
};

export default sseKadena;
