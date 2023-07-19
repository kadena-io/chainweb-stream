import { markdownTable } from 'markdown-table';
import { configSpec as spec } from '../build/config/index.js';

// 😶

function getType({ numeric, boolean, typeHint }) {
  if (typeHint)
    return typeHint;
  if (numeric)
    return 'Number';
  if (boolean)
    return 'Boolean';
  return 'String';
}

const output = spec.map(entry => {
  let { varName, required, envName, isArray, numeric, boolean, callback, defaultValue, typeHint, description } = entry;
  defaultValue = (defaultValue ?? '').toString()
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

console.log(markdownTable([
  Object.keys(output[0]),
  ...output.map(row => Object.values(row)),
]));

