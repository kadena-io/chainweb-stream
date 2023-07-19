import { configSpec as spec } from '../build/config/index.js';

// 😶

console.log('Variable Name,Type,Required,Default Value,Description');

console.log(spec.map(entry => {
  let { varName, required, envName, isArray, numeric, boolean, callback, defaultValue, typeHint, description } = entry;
  defaultValue = (defaultValue ?? '').toString()
  noComma(defaultValue)
  noComma(description);
  const req = required === true ? 'yes' : '';
  debugger;
  let typeStr = getType({ numeric, boolean, typeHint });
  if (Array.isArray(defaultValue))
    defaultValue = defaultValue.join('¦');
  if (isArray)
    typeStr += '[]';
  return [
    envName,
    typeStr,
    req.toString(),
    defaultValue,
    description,
  ].join(',');
}).join('\n'));

function getType({ numeric, boolean, typeHint }) {
  if (typeHint)
    return typeHint;
  if (numeric)
    return 'number';
  if (boolean)
    return 'boolean';
  return 'string';
  
}

function noComma(str = '') {
  if (str.includes(',')) {
    console.error(`Comma found in string: "${str}"`);
    process.exit(1);
  }
}
