import { configSpec as spec } from '../build/config/index.js';

// 😶

function printMarkdown(arr) {
  for(const entry of arr)
    for(const [key, value] of Object.entries(entry)) {
      widths[key] = widths[key] ?? 0;
      widths[key] = Math.max(key.length, value.length ?? 0, widths[key]);
    }
  console.log(joinSurround(Object.keys(arr[0]).map(key => printCell(key, key))));
  printSep();
  arr.forEach(row =>
    console.log(joinSurround(Object.entries(row).map(([key, value]) => printCell(key, value))))
  );
}

function joinSurround(arr, sep='|') {
  return ['', ...arr, ''].join(sep);
}

function printSep() {
  console.log(joinSurround(Object.values(widths).map(w =>
    ' ' + ('').padEnd(w, '-') + ' '
  )));
}

function printCell(key, value = '') {
  const width = widths[key];
  value = value.padEnd(width, ' ');
  return ` ${value} `;
}

function getType({ numeric, boolean, typeHint }) {
  if (typeHint)
    return typeHint;
  if (numeric)
    return 'Number';
  if (boolean)
    return 'Boolean';
  return 'String';
}

function noBars(str = '') {
  if (str.includes('|')) {
    console.error(`Bar found in string: "${str}"`);
    process.exit(1);
  }
}


const output = spec.map(entry => {
  let { varName, required, envName, isArray, numeric, boolean, callback, defaultValue, typeHint, description } = entry;
  defaultValue = (defaultValue ?? '').toString()
  noBars(defaultValue);
  noBars(description);
  const req = required === true ? 'Yes' : '';
  let typeStr = getType({ numeric, boolean, typeHint });
  if (Array.isArray(defaultValue))
    defaultValue = defaultValue.join('¦');
  if (isArray)
    typeStr += '[]';
  return {
    "Variable Name": envName,
    "Type": typeStr,
    "Required": req.toString(),
    "Default Value": defaultValue,
    "Description": description,
  }
});

const widths = {};

printMarkdown(output);

