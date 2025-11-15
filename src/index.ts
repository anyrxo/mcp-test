/**
 * MCP Test Framework
 * Main exports for testing MCP servers
 */

// Export test runner functions
export { test, describe, beforeEach, afterEach, beforeAll, afterAll, runAllTests, printResults, clearSuites } from './runner.js';

// Export assertion library
export { expect } from './expect.js';

// Export mocking utilities
export {
  mockTool,
  mockResource,
  mockPrompt,
  MockFunction,
  spyOn,
  restoreSpy,
  createMockServer,
  clearAllMocks,
  resetAllMocks
} from './mock.js';

// Export types
export type {
  MCPServer,
  ToolHandler,
  ResourceHandler,
  PromptHandler,
  TestContext,
  MockRegistry,
  Mock,
  MockCall,
  CallLog,
  TestResult,
  TestSuiteResult,
  AssertionResult,
  Expect,
  TestFunction,
  DescribeFunction,
  MockToolOptions,
  IntegrationTestOptions
} from './types.js';

// Global test utilities (for convenience)
declare global {
  var test: typeof import('./runner.js').test;
  var describe: typeof import('./runner.js').describe;
  var beforeEach: typeof import('./runner.js').beforeEach;
  var afterEach: typeof import('./runner.js').afterEach;
  var beforeAll: typeof import('./runner.js').beforeAll;
  var afterAll: typeof import('./runner.js').afterAll;
  var expect: typeof import('./expect.js').expect;
}
