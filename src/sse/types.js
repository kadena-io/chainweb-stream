export const BLOCK_PERMANENCE_STATES = ['confirmed', 'unconfirmed', 'updateConfirmations', 'orphaned'];

export function validateBlockPermanence(blockPermanence) {
  if (!BLOCK_PERMANENCE_STATES.includes(blockPermanence)) {
    throw new Error(`Expected one of [${BLOCK_PERMANENCE_STATES.join(', ')}] but received ${blockPermanence}`);
  }
}

export function isPositiveNumber(num) {
  return Number.isFinite(num) && num > 0;
}

export function isNonNegativeNumber(num) {
  return Number.isFinite(num) && num >= 0;
}

export function validateType(place, name, value, _type) {
  const wasType = typeof value;
  if (wasType !== _type) {
    throw new Error(`${place} expected "${name}" argument to be of type ${_type} but it was: ${wasType}`);
  }
}

export function validateDefined(place, name, value) {
  const [wasNull, wasUndefined] = [isNull(value), isUndefined(value)];
  if (wasNull || wasUndefined) {
    throw new Error(`${place} expected "${name}" argument to be defined but it was: ${wasNull ? 'null' : 'undefined'}`);
  }
}

export function validateInstanceOf(place, name, value, _class) {
  if (!(value instanceof _class)) {
    let expected='?';
    try {
      expected = _class.toString().split('\n')[0];
    } catch(e) {
    }
    throw new Error(`${place} expected "${name}" argument to be instanceof ${expected}`);
  }
}

export function isNull(value) {
  return value === null
}

export function isUndefined(value) {
  return value === undefined;
}

