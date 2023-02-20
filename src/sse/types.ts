export type TransactionType = 'event' | 'account';

export interface ChainwebBaseData {
  blockTime: string;
  height: number;
  blockHash: string;
  requestKey: string;
  idx: number;
  chain: number;
}

export interface ChainwebEventData extends ChainwebBaseData {
  params: string[];
  name: string;
  moduleHash: string;
}

export interface ChainwebAccountData extends ChainwebBaseData {
  amount: string;
  token: string;
  fromAccount: string;
  toAccount: string;
}

export interface ChainwebSSEMetaData {
  meta: {
    id: string;
    confirmations: number;
  }
}

export type EventData = ChainwebEventData & ChainwebSSEMetaData;

export type AccountData = ChainwebEventData & ChainwebSSEMetaData;

export type GenericData = EventData | AccountData;

export interface ChainwebCutData {
  hashes: {
    [chainId: number]: {
      height: number;
      hash: string;
    }
  }
  origin: string | null;
  weight: string;
  height: number;
  instance: string;
  id: string;
}

export type ChainwebCutCallback = (cut: ChainwebCutData) => (void | Promise<void>)

export enum BlockPermanenceState {
  confirmed = 'confirmed', 
  unconfirmed = 'unconfirmed',
  updateConfirmations = 'updateConfirmations',
  orphaned = 'orphaned',
}

const blockPermanenceStateValues = Object.values(BlockPermanenceState);

export function validateBlockPermanence(blockPermanence: BlockPermanenceState): blockPermanence is BlockPermanenceState {
  if (!blockPermanenceStateValues.includes(blockPermanence)) {
    throw new Error(`Expected one of [${blockPermanenceStateValues.join(', ')}] but received ${blockPermanence}`);
  }
  return true;
}

export function isPositiveNumber(num: number) {
  return Number.isFinite(num) && num > 0;
}

export function isNonNegativeNumber(num: number) {
  return Number.isFinite(num) && num >= 0;
}

export function validateType(place: string, name: string, value: any, _type: any) {
  const wasType = typeof value;
  if (wasType !== _type) {
    throw new Error(`${place} expected "${name}" argument to be of type ${_type} but it was: ${wasType}`);
  }
}

export function validateDefined(place: string, name: string, value: any) {
  const [wasNull, wasUndefined] = [isNull(value), isUndefined(value)];
  if (wasNull || wasUndefined) {
    throw new Error(`${place} expected "${name}" argument to be defined but it was: ${wasNull ? 'null' : 'undefined'}`);
  }
}

export function validateInstanceOf(place: string, name: string, value: any, _class: any) {
  if (!(value instanceof _class)) {
    let expected='?';
    try {
      expected = _class.toString().split('\n')[0];
    } catch(e) {
    }
    throw new Error(`${place} expected "${name}" argument to be instanceof ${expected}`);
  }
}

export function isNull(value: any): value is null {
  return value === null
}

export function isUndefined(value: any): value is undefined {
  return value === undefined;
}

