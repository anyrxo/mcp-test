#!/usr/bin/env node

/**
 * Self-test for MCP Test Framework
 * Tests the testing framework itself
 */

import { expect } from './dist/expect.js';
import { mockTool, mockResource, mockPrompt, createMockServer, MockFunction, spyOn } from './dist/mock.js';
import { test, describe, beforeEach, afterEach, runAllTests, printResults, clearSuites } from './dist/runner.js';

console.log('\n🧪 MCP Test Framework - Self Test\n');

// Test 1: expect().toBe()
describe('expect() assertions', () => {
  test('toBe() works with primitives', () => {
    expect(42).toBe(42);
    expect('hello').toBe('hello');
    expect(true).toBe(true);
    expect(null).toBe(null);
  });

  test('toEqual() works with objects', () => {
    expect({ a: 1, b: 2 }).toEqual({ a: 1, b: 2 });
    expect([1, 2, 3]).toEqual([1, 2, 3]);
  });

  test('toBeNull() works', () => {
    expect(null).toBeNull();
  });

  test('toBeUndefined() works', () => {
    expect(undefined).toBeUndefined();
  });

  test('toBeDefined() works', () => {
    expect(42).toBeDefined();
    expect('test').toBeDefined();
  });

  test('toBeTruthy() works', () => {
    expect(true).toBeTruthy();
    expect(1).toBeTruthy();
    expect('hello').toBeTruthy();
  });

  test('toBeFalsy() works', () => {
    expect(false).toBeFalsy();
    expect(0).toBeFalsy();
    expect('').toBeFalsy();
    expect(null).toBeFalsy();
  });

  test('toContain() works with arrays', () => {
    expect([1, 2, 3]).toContain(2);
  });

  test('toContain() works with strings', () => {
    expect('hello world').toContain('world');
  });

  test('toHaveLength() works', () => {
    expect([1, 2, 3]).toHaveLength(3);
    expect('hello').toHaveLength(5);
  });

  test('not modifier works', () => {
    expect(42).not.toBe(43);
    expect(true).not.toBeFalsy();
  });
});

// Test 2: Mock functions
describe('Mock functions', () => {
  test('mockTool() creates a mock', async () => {
    const readFile = mockTool('read-file', {
      returnValue: { content: 'Hello', size: 5 }
    });

    const result = await readFile.execute({ path: '/tmp/test.txt' });

    expect(result.content).toBe('Hello');
    expect(result.size).toBe(5);
  });

  test('mock tracks calls', async () => {
    const tool = mockTool('test-tool', { returnValue: 'ok' });

    await tool.execute({ arg1: 'value1' });
    await tool.execute({ arg2: 'value2' });

    expect(tool.calls).toHaveLength(2);
    expect(tool.calls[0].args[0]).toEqual({ arg1: 'value1' });
    expect(tool.calls[1].args[0]).toEqual({ arg2: 'value2' });
  });

  test('mockReturnValue() changes return value', async () => {
    const tool = mockTool('test');
    tool.mockReturnValue('new value');

    const result = await tool.execute();

    expect(result).toBe('new value');
  });

  test('mockResolvedValue() returns async value', async () => {
    const tool = mockTool('async-tool');
    tool.mockResolvedValue({ data: 'async' });

    const result = await tool.execute();

    expect(result.data).toBe('async');
  });

  test('mockRejectedValue() throws error', async () => {
    const tool = mockTool('failing-tool');
    tool.mockRejectedValue('Tool failed');

    let error;
    try {
      await tool.execute();
    } catch (e) {
      error = e;
    }

    expect(error).toBeDefined();
    expect(error.message).toBe('Tool failed');
  });

  test('mockClear() clears call history', async () => {
    const tool = mockTool('test', { returnValue: 'ok' });

    await tool.execute();
    await tool.execute();

    expect(tool.calls).toHaveLength(2);

    tool.mockClear();

    expect(tool.calls).toHaveLength(0);
  });
});

// Test 3: expect() matchers for mocks
describe('Mock matchers', () => {
  test('toHaveBeenCalled() works', async () => {
    const tool = mockTool('test', { returnValue: 'ok' });

    await tool.execute();

    expect(tool).toHaveBeenCalled();
  });

  test('toHaveBeenCalledTimes() works', async () => {
    const tool = mockTool('test', { returnValue: 'ok' });

    await tool.execute();
    await tool.execute();
    await tool.execute();

    expect(tool).toHaveBeenCalledTimes(3);
  });

  test('toHaveBeenCalledWith() works', async () => {
    const tool = mockTool('test', { returnValue: 'ok' });

    await tool.execute({ path: '/tmp/file.txt', mode: 'read' });

    expect(tool).toHaveBeenCalledWith({ path: '/tmp/file.txt', mode: 'read' });
  });
});

// Test 4: createMockServer()
describe('createMockServer()', () => {
  test('creates server with mock tools', async () => {
    const { server, mocks } = createMockServer({
      tools: {
        'read-file': { returnValue: { content: 'test' } },
        'write-file': { returnValue: { success: true } }
      }
    });

    const result1 = await server.tools['read-file']({ path: '/tmp/test.txt' });
    const result2 = await server.tools['write-file']({ path: '/tmp/test.txt', content: 'data' });

    expect(result1.content).toBe('test');
    expect(result2.success).toBe(true);

    expect(mocks.tools.get('read-file')).toHaveBeenCalled();
    expect(mocks.tools.get('write-file')).toHaveBeenCalled();
  });

  test('creates server with resources', async () => {
    const { server, mocks } = createMockServer({
      resources: {
        'file:///config.json': { returnValue: '{"version": "1.0.0"}' }
      }
    });

    const result = await server.resources['file:///config.json']();

    expect(result).toBe('{"version": "1.0.0"}');
    expect(mocks.resources.get('file:///config.json')).toHaveBeenCalled();
  });

  test('creates server with prompts', async () => {
    const { server, mocks } = createMockServer({
      prompts: {
        'code-review': { returnValue: 'Review complete' }
      }
    });

    const result = await server.prompts['code-review']({ file: 'test.js' });

    expect(result).toBe('Review complete');
    expect(mocks.prompts.get('code-review')).toHaveBeenCalled();
  });
});

// Test 5: beforeEach and afterEach
describe('Lifecycle hooks', () => {
  let counter = 0;

  beforeEach(() => {
    counter = 0;
  });

  afterEach(() => {
    // Cleanup
  });

  test('beforeEach runs before test', () => {
    expect(counter).toBe(0);
    counter++;
  });

  test('beforeEach runs again for second test', () => {
    expect(counter).toBe(0);
  });
});

// Test 6: Async/await support
describe('Async tests', () => {
  test('async/await works', async () => {
    const promise = Promise.resolve(42);
    const value = await promise;
    expect(value).toBe(42);
  });

  test('async mocks work', async () => {
    const tool = mockTool('async-tool');
    tool.mockResolvedValue({ data: 'async result' });

    const result = await tool.execute();

    expect(result.data).toBe('async result');
  });
});

// Test 7: Error handling
describe('Error handling', () => {
  test('errors are caught and reported', async () => {
    const tool = mockTool('failing-tool', {
      throwError: 'Something went wrong'
    });

    let caught = false;
    try {
      await tool.execute();
    } catch (error) {
      caught = true;
      expect(error.message).toBe('Something went wrong');
    }

    expect(caught).toBe(true);
  });

  test('mock tracks errors', async () => {
    const tool = mockTool('failing-tool', {
      throwError: 'Test error'
    });

    try {
      await tool.execute();
    } catch (e) {
      // Expected
    }

    expect(tool.errors).toHaveLength(1);
    expect(tool.errors[0].message).toBe('Test error');
  });
});

// Test 8: Custom implementations
describe('Custom mock implementations', () => {
  test('mockImplementation() works', async () => {
    const tool = mockTool('custom-tool');
    tool.mockImplementation((params) => {
      return { result: params.input.toUpperCase() };
    });

    const result = await tool.execute({ input: 'hello' });

    expect(result.result).toBe('HELLO');
  });

  test('implementation can be async', async () => {
    const tool = mockTool('async-custom');
    tool.mockImplementation(async (params) => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { processed: params.data };
    });

    const result = await tool.execute({ data: 'test' });

    expect(result.processed).toBe('test');
  });
});

// Run all tests
const results = await runAllTests();
printResults(results);

// Exit with error if tests failed
const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
if (totalFailed > 0) {
  process.exit(1);
}
