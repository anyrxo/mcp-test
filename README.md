# 🧪 MCP Test - Testing Framework for Model Context Protocol Servers

> **Jest-like testing framework specifically designed for MCP servers**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Tests](https://img.shields.io/badge/tests-31%2F31%20passing-brightgreen.svg)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

## 📖 Overview

**MCP Test** is a comprehensive testing framework for Model Context Protocol (MCP) servers. It provides a familiar Jest-like API with powerful mocking utilities specifically designed for testing MCP tools, resources, and prompts.

### Why MCP Test?

While MCP Inspector exists for manual/visual testing, there was **no programmatic testing framework** for MCP servers. Developers struggled with:

- ❌ No Jest-like testing library for MCP
- ❌ Difficulty testing stdio/SSE transports programmatically
- ❌ No built-in mocking for tools/resources/prompts
- ❌ Complex setup for integration tests
- ❌ Limited unit testing capabilities

**MCP Test solves all of these problems** with a familiar, powerful API.

### Key Features

✅ **Jest-like API** - `describe()`, `test()`, `expect()`, `beforeEach()`
✅ **Powerful Assertions** - 20+ matchers including async support
✅ **Mock Utilities** - Mock tools, resources, prompts with ease
✅ **Spy Functions** - Track calls, arguments, return values
✅ **Async/Await Support** - First-class promise testing
✅ **Lifecycle Hooks** - `beforeEach`, `afterEach`, `beforeAll`, `afterAll`
✅ **Custom Implementations** - Full control over mock behavior
✅ **Error Handling** - Test error conditions easily
✅ **Zero Configuration** - Works out of the box

## 🚀 Quick Start

### Installation

```bash
# Clone repository
git clone <repository-url>
cd mcp-test

# Install dependencies
npm install

# Build TypeScript
npm run build
```

### Basic Usage

Create a test file `my-server.test.js`:

```javascript
import { describe, test, expect, mockTool, createMockServer } from 'mcp-test';

describe('My MCP Server', () => {
  test('read-file tool works', async () => {
    const readFile = mockTool('read-file', {
      returnValue: { content: 'Hello World', size: 11 }
    });

    const result = await readFile.execute({ path: '/tmp/test.txt' });

    expect(result.content).toBe('Hello World');
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile).toHaveBeenCalledWith({ path: '/tmp/test.txt' });
  });

  test('handles errors gracefully', async () => {
    const failingTool = mockTool('failing-tool', {
      throwError: 'File not found'
    });

    await expect(failingTool.execute()).rejects.toThrow('File not found');
  });
});
```

Run tests:

```bash
node dist/cli.js run my-server.test.js
```

## 📚 API Reference

### Test Structure

#### `describe(name, fn)`

Group related tests together:

```javascript
describe('File operations', () => {
  test('reads files', () => { /* ... */ });
  test('writes files', () => { /* ... */ });
});
```

#### `test(name, fn)` or `it(name, fn)`

Define a test:

```javascript
test('should return correct result', () => {
  expect(2 + 2).toBe(4);
});

// Async tests
test('async operation works', async () => {
  const result = await asyncFunction();
  expect(result).toBe('success');
});
```

#### `test.skip()` and `test.only()`

Skip or isolate tests:

```javascript
test.skip('not ready yet', () => {
  // This test will be skipped
});

test.only('run only this test', () => {
  // Only this test will run
});
```

### Lifecycle Hooks

```javascript
describe('Lifecycle example', () => {
  beforeAll(() => {
    // Runs once before all tests
  });

  beforeEach(() => {
    // Runs before each test
  });

  afterEach(() => {
    // Runs after each test
  });

  afterAll(() => {
    // Runs once after all tests
  });

  test('example', () => { /* ... */ });
});
```

### Assertions

#### Basic Matchers

```javascript
expect(value).toBe(expected);           // Strict equality (===)
expect(value).toEqual(expected);        // Deep equality
expect(value).toBeNull();               // value === null
expect(value).toBeUndefined();          // value === undefined
expect(value).toBeDefined();            // value !== undefined
expect(value).toBeTruthy();             // !!value === true
expect(value).toBeFalsy();              // !!value === false
```

#### Negation

```javascript
expect(value).not.toBe(unexpected);
expect(value).not.toEqual(unexpected);
```

#### Collections

```javascript
expect([1, 2, 3]).toContain(2);         // Array contains item
expect('hello').toContain('ell');       // String contains substring
expect([1, 2, 3]).toHaveLength(3);      // Array/string length
```

#### Objects

```javascript
expect(obj).toMatchObject({ a: 1, b: 2 });  // Partial object match
```

#### Errors

```javascript
expect(() => {
  throw new Error('boom');
}).toThrow();

expect(() => {
  throw new Error('boom');
}).toThrow('boom');

expect(() => {
  throw new Error('boom');
}).toThrow(/boom/);
```

#### Async/Promises

```javascript
// Promise resolves
await expect(promise).resolves.toBe('success');
await expect(promise).resolves.toEqual({ data: 'ok' });

// Promise rejects
await expect(promise).rejects.toThrow('error');
await expect(promise).rejects.toThrow(/error/);
```

#### Mock Matchers

```javascript
expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(3);
expect(mockFn).toHaveBeenCalledWith(arg1, arg2);
```

### Mock Utilities

#### Create a Mock Tool

```javascript
import { mockTool } from 'mcp-test';

const readFile = mockTool('read-file', {
  returnValue: { content: 'Hello', size: 5 }
});

// Execute the mock
const result = await readFile.execute({ path: '/tmp/test.txt' });

// Check calls
expect(readFile).toHaveBeenCalled();
expect(readFile.calls).toHaveLength(1);
```

#### Mock Tool Options

```javascript
// Return a value
mockTool('tool-name', {
  returnValue: { data: 'value' }
});

// Custom implementation
mockTool('tool-name', {
  implementation: (params) => {
    return { result: params.input.toUpperCase() };
  }
});

// Throw an error
mockTool('tool-name', {
  throwError: 'Something went wrong'
});

// Or throw a custom error
mockTool('tool-name', {
  throwError: new TypeError('Invalid input')
});
```

#### Mock Methods

```javascript
const tool = mockTool('test-tool');

// Change return value
tool.mockReturnValue('new value');
tool.mockReturnValueOnce('one time value');

// Async values
tool.mockResolvedValue({ data: 'async' });
tool.mockRejectedValue('async error');

// Custom implementation
tool.mockImplementation((params) => {
  return { processed: params.data };
});

// Clear call history
tool.mockClear();

// Reset mock (clears + removes implementation)
tool.mockReset();
```

#### Create Mock Server

```javascript
import { createMockServer } from 'mcp-test';

const { server, mocks } = createMockServer({
  tools: {
    'read-file': { returnValue: { content: 'test' } },
    'write-file': { returnValue: { success: true } }
  },
  resources: {
    'file:///config.json': { returnValue: '{"version": "1.0.0"}' }
  },
  prompts: {
    'code-review': { returnValue: 'Review complete' }
  }
});

// Use the server
await server.tools['read-file']({ path: '/tmp/test.txt' });

// Access mocks
expect(mocks.tools.get('read-file')).toHaveBeenCalled();
```

#### Spy Functions

```javascript
import { spyOn, restoreSpy } from 'mcp-test';

const obj = {
  method: () => 'original'
};

const spy = spyOn(obj, 'method');

obj.method();  // Calls original + tracks call

expect(spy).toHaveBeenCalled();

// Restore original
restoreSpy(spy);
```

## 🎯 Real-World Examples

### Example 1: Testing File Tools

```javascript
describe('File tools', () => {
  let fileSystem;

  beforeEach(() => {
    const { server, mocks } = createMockServer({
      tools: {
        'read-file': {
          implementation: ({ path }) => {
            if (path === '/tmp/exists.txt') {
              return { content: 'File content', size: 12 };
            }
            throw new Error('File not found');
          }
        },
        'write-file': { returnValue: { success: true } }
      }
    });

    fileSystem = { server, mocks };
  });

  test('reads existing file', async () => {
    const result = await fileSystem.server.tools['read-file']({
      path: '/tmp/exists.txt'
    });

    expect(result.content).toBe('File content');
    expect(result.size).toBe(12);
  });

  test('throws error for non-existent file', async () => {
    await expect(
      fileSystem.server.tools['read-file']({ path: '/tmp/missing.txt' })
    ).rejects.toThrow('File not found');
  });

  test('writes file successfully', async () => {
    const result = await fileSystem.server.tools['write-file']({
      path: '/tmp/new.txt',
      content: 'Hello'
    });

    expect(result.success).toBe(true);
    expect(fileSystem.mocks.tools.get('write-file')).toHaveBeenCalledWith({
      path: '/tmp/new.txt',
      content: 'Hello'
    });
  });
});
```

### Example 2: Testing Resources

```javascript
describe('Configuration resource', () => {
  test('returns configuration', async () => {
    const { server } = createMockServer({
      resources: {
        'config://app.json': {
          returnValue: JSON.stringify({
            version: '1.0.0',
            env: 'production'
          })
        }
      }
    });

    const config = await server.resources['config://app.json']();
    const parsed = JSON.parse(config);

    expect(parsed.version).toBe('1.0.0');
    expect(parsed.env).toBe('production');
  });
});
```

### Example 3: Testing Prompts

```javascript
describe('Code review prompt', () => {
  test('reviews code and provides feedback', async () => {
    const codeReview = mockPrompt('code-review', {
      implementation: ({ file, code }) => {
        const issues = code.includes('console.log') ? 1 : 0;
        return {
          file,
          issues,
          feedback: issues > 0 ? 'Remove console.log statements' : 'Looks good'
        };
      }
    });

    const result = await codeReview.execute({
      file: 'test.js',
      code: 'console.log("debug");'
    });

    expect(result.issues).toBe(1);
    expect(result.feedback).toContain('Remove console.log');
  });
});
```

### Example 4: Error Handling

```javascript
describe('Error handling', () => {
  test('handles network errors', async () => {
    const apiTool = mockTool('fetch-data', {
      throwError: new Error('Network timeout')
    });

    await expect(apiTool.execute()).rejects.toThrow('Network timeout');

    expect(apiTool.errors).toHaveLength(1);
    expect(apiTool.errors[0].message).toBe('Network timeout');
  });

  test('retries on failure', async () => {
    let attempts = 0;
    const retryTool = mockTool('retry-tool');

    retryTool.mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return { success: true };
    });

    // Implement retry logic
    let result;
    for (let i = 0; i < 3; i++) {
      try {
        result = await retryTool.execute();
        break;
      } catch (e) {
        if (i === 2) throw e;
      }
    }

    expect(result.success).toBe(true);
    expect(retryTool).toHaveBeenCalledTimes(3);
  });
});
```

## 🧪 Testing the Framework

Run the self-test suite:

```bash
npm test
```

This runs 31 tests covering all framework functionality.

## 📊 Test Results

```
📊 Test Summary:
   Total: 31
   ✓ Passed: 31
   Pass Rate: 100%
```

## 🔧 CLI Usage

```bash
# Run test files
mcp-test run tests/**/*.test.js

# Run specific file
mcp-test run my-server.test.js

# Verbose output
mcp-test run --verbose

# Bail on first failure
mcp-test run --bail

# Initialize example test
mcp-test init
```

## 🎓 Comparison with Other Tools

| Feature | MCP Test | MCP Inspector | Jest | Mocha |
|---------|----------|---------------|------|-------|
| MCP-specific | ✅ | ✅ | ❌ | ❌ |
| Programmatic | ✅ | ❌ | ✅ | ✅ |
| Mock utilities | ✅ | ❌ | ✅ | ❌ |
| Async/await | ✅ | N/A | ✅ | ✅ |
| Tool mocking | ✅ | ✅ | ❌ | ❌ |
| Resource mocking | ✅ | ✅ | ❌ | ❌ |
| Prompt mocking | ✅ | ✅ | ❌ | ❌ |
| Visual testing | ❌ | ✅ | ❌ | ❌ |

**MCP Test** is the only programmatic testing framework designed specifically for MCP servers.

## 🤝 Contributing

Contributions welcome! Please read CONTRIBUTING.md for guidelines.

## 📄 License

MIT License - see LICENSE file for details

## 🔗 Resources

- [Model Context Protocol Docs](https://modelcontextprotocol.io/)
- [MCP Inspector](https://github.com/modelcontextprotocol/inspector)
- [Jest Documentation](https://jestjs.io/)

---

**Built with ❤️ for the MCP community**
