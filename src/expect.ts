/**
 * MCP Test Assertion Library
 * Jest-like expect() assertions for MCP testing
 */

import { Expect, Mock } from './types.js';
import { diffLines } from 'diff';

class AssertionError extends Error {
  expected: any;
  actual: any;

  constructor(message: string, expected?: any, actual?: any) {
    super(message);
    this.name = 'AssertionError';
    this.expected = expected;
    this.actual = actual;
  }
}

export class ExpectImpl<T> implements Expect<T> {
  private value: T;
  private isNot: boolean = false;

  constructor(value: T, isNot: boolean = false) {
    this.value = value;
    this.isNot = isNot;
  }

  get not(): Expect<T> {
    return new ExpectImpl(this.value, !this.isNot);
  }

  get resolves(): Expect<Awaited<T>> {
    if (!(this.value instanceof Promise)) {
      throw new AssertionError('Expected value to be a Promise');
    }
    return new ResolveExpect(this.value as any, this.isNot);
  }

  get rejects(): Expect<any> {
    if (!(this.value instanceof Promise)) {
      throw new AssertionError('Expected value to be a Promise');
    }
    return new RejectExpect(this.value as any, this.isNot);
  }

  toBe(expected: T): void {
    const passed = Object.is(this.value, expected);
    this.assert(passed, `Expected ${this.formatValue(this.value)} to be ${this.formatValue(expected)}`, expected, this.value);
  }

  toEqual(expected: T): void {
    const passed = this.deepEqual(this.value, expected);
    this.assert(
      passed,
      `Expected ${this.formatValue(this.value)} to equal ${this.formatValue(expected)}${this.getDiff(this.value, expected)}`,
      expected,
      this.value
    );
  }

  toBeNull(): void {
    const passed = this.value === null;
    this.assert(passed, `Expected ${this.formatValue(this.value)} to be null`, null, this.value);
  }

  toBeUndefined(): void {
    const passed = this.value === undefined;
    this.assert(passed, `Expected ${this.formatValue(this.value)} to be undefined`, undefined, this.value);
  }

  toBeDefined(): void {
    const passed = this.value !== undefined;
    this.assert(passed, `Expected value to be defined`, 'defined', undefined);
  }

  toBeTruthy(): void {
    const passed = !!this.value;
    this.assert(passed, `Expected ${this.formatValue(this.value)} to be truthy`, 'truthy', this.value);
  }

  toBeFalsy(): void {
    const passed = !this.value;
    this.assert(passed, `Expected ${this.formatValue(this.value)} to be falsy`, 'falsy', this.value);
  }

  toContain(item: any): void {
    if (Array.isArray(this.value)) {
      const passed = this.value.includes(item);
      this.assert(passed, `Expected array to contain ${this.formatValue(item)}`, item, this.value);
    } else if (typeof this.value === 'string') {
      const passed = (this.value as unknown as string).includes(item);
      this.assert(passed, `Expected string to contain "${item}"`, item, this.value);
    } else {
      throw new AssertionError('toContain() requires an array or string');
    }
  }

  toHaveLength(length: number): void {
    const actualLength = (this.value as any)?.length;
    const passed = actualLength === length;
    this.assert(passed, `Expected length ${actualLength} to be ${length}`, length, actualLength);
  }

  toThrow(error?: string | RegExp | Error): void {
    if (typeof this.value !== 'function') {
      throw new AssertionError('toThrow() requires a function');
    }

    let thrown = false;
    let thrownError: any;

    try {
      (this.value as any)();
    } catch (e) {
      thrown = true;
      thrownError = e;
    }

    if (error === undefined) {
      this.assert(thrown, 'Expected function to throw', 'error', 'no error');
    } else if (typeof error === 'string') {
      const passed = thrown && thrownError.message.includes(error);
      this.assert(passed, `Expected error message to include "${error}"`, error, thrownError?.message);
    } else if (error instanceof RegExp) {
      const passed = thrown && error.test(thrownError.message);
      this.assert(passed, `Expected error message to match ${error}`, error, thrownError?.message);
    } else if (error instanceof Error) {
      const passed = thrown && thrownError instanceof error.constructor;
      this.assert(passed, `Expected error to be instance of ${error.constructor.name}`, error.constructor.name, thrownError?.constructor.name);
    }
  }

  toHaveBeenCalled(): void {
    const mock = this.value as any as Mock;
    if (!mock || !mock.calls) {
      throw new AssertionError('toHaveBeenCalled() requires a mock function');
    }

    const passed = mock.calls.length > 0;
    this.assert(passed, `Expected mock to have been called`, 'called', 'not called');
  }

  toHaveBeenCalledTimes(times: number): void {
    const mock = this.value as any as Mock;
    if (!mock || !mock.calls) {
      throw new AssertionError('toHaveBeenCalledTimes() requires a mock function');
    }

    const passed = mock.calls.length === times;
    this.assert(passed, `Expected mock to have been called ${times} times, but was called ${mock.calls.length} times`, times, mock.calls.length);
  }

  toHaveBeenCalledWith(...args: any[]): void {
    const mock = this.value as any as Mock;
    if (!mock || !mock.calls) {
      throw new AssertionError('toHaveBeenCalledWith() requires a mock function');
    }

    const passed = mock.calls.some(call =>
      call.args.length === args.length &&
      call.args.every((arg, i) => this.deepEqual(arg, args[i]))
    );

    this.assert(passed, `Expected mock to have been called with ${this.formatValue(args)}`, args, mock.calls.map(c => c.args));
  }

  toMatchObject(object: Record<string, any>): void {
    if (typeof this.value !== 'object' || this.value === null) {
      throw new AssertionError('toMatchObject() requires an object');
    }

    const passed = this.objectMatches(this.value as any, object);
    this.assert(passed, `Expected object to match ${this.formatValue(object)}`, object, this.value);
  }

  private assert(passed: boolean, message: string, expected?: any, actual?: any): void {
    if (this.isNot) {
      passed = !passed;
      message = message.replace('Expected', 'Expected not');
    }

    if (!passed) {
      throw new AssertionError(message, expected, actual);
    }
  }

  private deepEqual(a: any, b: any): boolean {
    if (Object.is(a, b)) return true;
    if (a === null || b === null) return false;
    if (typeof a !== 'object' || typeof b !== 'object') return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    for (const key of keysA) {
      if (!keysB.includes(key)) return false;
      if (!this.deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  private objectMatches(obj: Record<string, any>, pattern: Record<string, any>): boolean {
    for (const key in pattern) {
      if (!(key in obj)) return false;
      if (!this.deepEqual(obj[key], pattern[key])) return false;
    }
    return true;
  }

  private formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `"${value}"`;
    if (typeof value === 'function') return '[Function]';
    if (Array.isArray(value)) return `[${value.map(v => this.formatValue(v)).join(', ')}]`;
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }

  private getDiff(actual: any, expected: any): string {
    if (typeof actual === 'object' && typeof expected === 'object') {
      const actualStr = JSON.stringify(actual, null, 2);
      const expectedStr = JSON.stringify(expected, null, 2);
      const diff = diffLines(expectedStr, actualStr);

      if (diff.length > 1) {
        let result = '\n\nDiff:\n';
        diff.forEach(part => {
          if (part.added) result += `+ ${part.value}`;
          else if (part.removed) result += `- ${part.value}`;
        });
        return result;
      }
    }
    return '';
  }
}

class ResolveExpect<T> extends ExpectImpl<T> {
  constructor(private promise: Promise<T>, isNot: boolean) {
    super(promise as any, isNot);
  }

  async toBe(expected: T): Promise<void> {
    const value = await this.promise;
    new ExpectImpl(value, false).toBe(expected as any);
  }

  async toEqual(expected: T): Promise<void> {
    const value = await this.promise;
    new ExpectImpl(value, false).toEqual(expected as any);
  }
}

class RejectExpect extends ExpectImpl<any> {
  constructor(private promise: Promise<any>, isNot: boolean) {
    super(promise as any, isNot);
  }

  async toThrow(error?: string | RegExp | Error): Promise<void> {
    let thrown = false;
    let thrownError: any;

    try {
      await this.promise;
    } catch (e) {
      thrown = true;
      thrownError = e;
    }

    if (!thrown) {
      throw new AssertionError('Expected promise to reject, but it resolved');
    }

    if (error !== undefined) {
      if (typeof error === 'string') {
        if (!thrownError.message.includes(error)) {
          throw new AssertionError(`Expected error message to include "${error}"`, error, thrownError.message);
        }
      } else if (error instanceof RegExp) {
        if (!error.test(thrownError.message)) {
          throw new AssertionError(`Expected error message to match ${error}`, error, thrownError.message);
        }
      }
    }
  }
}

export function expect<T>(value: T): Expect<T> {
  return new ExpectImpl(value);
}
