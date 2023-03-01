import { expect, test, jest, beforeEach, afterEach } from '@jest/globals';
import { withRetries } from '../utils.js';

function rejectThenResolve(result, fails = 0, failErrorMessage = 'Simulated Failure') {
  return async () => {
    if (fails <= 0) {
      return result;
    } else {
      fails--;
      throw new Error(failErrorMessage);
    }
  };
}

test('Expect withRetries to return resolved promise (immediate success)', async () => {
  const expected = { success: 1 };
  const fn = rejectThenResolve(expected, 0);
  const actual = await withRetries(fn);
  expect(actual).toBe(expected); // intentionally not using toEqual
});

test('Expect withRetries to return resolved promise (one failure)', async () => {
  const expected = { success: 1 };
  const fn = rejectThenResolve(expected, 1);
  const actual = await withRetries(fn);
  expect(expected).toBe(actual);
});

test('Expect withRetries with timeoutFn to return resolved promise (two failures)', async () => {
  const expected = { success: 1 };
  const fn = rejectThenResolve(expected, 2);
  const actual = await withRetries(fn, { timeoutFn: (n) => Math.pow(n, 2) * 100 });
  expect(expected).toBe(actual); // intentionally not using toEqual
});

test('Expect withRetries with maxAttempts=2 and timeoutFn to succeed', async () => {
  const expected = { success: 1 };
  const fn = rejectThenResolve(expected, 2);
  const actual = await withRetries(fn, { maxAttempts: 2, timeoutFn: (n) => Math.pow(n, 2) * 100 });
  expect(expected).toBe(actual); // intentionally not using toEqual
});

test('Expect withRetries with maxAttempts=1 and timeoutFn to fail after two failures', async () => {
  const expected = { success: 1 };
  const fn = rejectThenResolve(expected, 2);
  try {
    await withRetries(fn, { maxAttempts: 1, timeoutFn: (n) => Math.pow(n, 2) * 100 });
  } catch (e) {
    expect(e.message).toBe('Simulated Failure');
  }
});

test('Expect withRetries with non numeric maxAttempts to fail', async () => {
  const expected = { success: 1 };
  const fn = rejectThenResolve(expected, 0);
  try {
    await withRetries(fn, { maxAttempts: 'a' });
  } catch (e) {
    expect(e.message).toBe('withRetries: expected positive maxAttempts, received a');
  }
});

test('Expect withRetries with maxAttempts=0 to fail', async () => {
  const expected = { success: 1 };
  const fn = rejectThenResolve(expected, 0);
  try {
    await withRetries(fn, { maxAttempts: 0 });
  } catch (e) {
    expect(e.message).toBe('withRetries: expected positive maxAttempts, received 0');
  }
});

test('Expect withRetries with negative maxAttempts to fail', async () => {
  const expected = { success: 1 };
  const fn = rejectThenResolve(expected, 0);
  try {
    await withRetries(fn, { maxAttempts: -1 });
  } catch (e) {
    expect(e.message).toBe('withRetries: expected positive maxAttempts, received -1');
  }
});

test('Expect withRetries with an incorrect timeoutFn fail', async () => {
  const expected = { success: 1 };
  const fn = rejectThenResolve(expected, 0);
  try {
    await withRetries(fn, { timeoutFn: () => -1 });
  } catch (e) {
    expect(e.message).toBe(
      'withRetries: timeoutFn expected to return positive number, received -1',
    );
  }
});
