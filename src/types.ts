/**
 * MCP Test Framework Types
 * Type definitions for MCP server testing
 */

export interface MCPServer {
  tools?: Record<string, ToolHandler>;
  resources?: Record<string, ResourceHandler>;
  prompts?: Record<string, PromptHandler>;
}

export type ToolHandler = (params: any) => Promise<any> | any;
export type ResourceHandler = (uri?: string) => Promise<any> | any;
export type PromptHandler = (args: any) => Promise<any> | any;

export interface TestContext {
  server: MCPServer;
  mocks: MockRegistry;
  calls: CallLog[];
}

export interface MockRegistry {
  tools: Map<string, Mock>;
  resources: Map<string, Mock>;
  prompts: Map<string, Mock>;
}

export interface Mock {
  name: string;
  implementation?: Function;
  calls: MockCall[];
  returnValues: any[];
  errors: Error[];
}

export interface MockCall {
  args: any[];
  timestamp: number;
  result?: any;
  error?: Error;
}

export interface CallLog {
  type: 'tool' | 'resource' | 'prompt';
  name: string;
  params: any;
  result?: any;
  error?: Error;
  duration: number;
  timestamp: number;
}

export interface TestResult {
  name: string;
  passed: boolean;
  error?: Error;
  duration: number;
  assertions: AssertionResult[];
}

export interface AssertionResult {
  description: string;
  passed: boolean;
  expected?: any;
  actual?: any;
  error?: Error;
}

export interface TestSuiteResult {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
}

export interface Expect<T> {
  toBe(expected: T): void;
  toEqual(expected: T): void;
  toBeNull(): void;
  toBeUndefined(): void;
  toBeDefined(): void;
  toBeTruthy(): void;
  toBeFalsy(): void;
  toContain(item: any): void;
  toHaveLength(length: number): void;
  toThrow(error?: string | RegExp | Error): void;
  toHaveBeenCalled(): void;
  toHaveBeenCalledTimes(times: number): void;
  toHaveBeenCalledWith(...args: any[]): void;
  toMatchObject(object: Record<string, any>): void;
  resolves: Expect<Awaited<T>>;
  rejects: Expect<any>;
  not: Expect<T>;
}

export interface TestFunction {
  (name: string, fn: () => void | Promise<void>): void;
  skip(name: string, fn: () => void | Promise<void>): void;
  only(name: string, fn: () => void | Promise<void>): void;
}

export interface DescribeFunction {
  (name: string, fn: () => void): void;
  skip(name: string, fn: () => void): void;
  only(name: string, fn: () => void): void;
}

export interface BeforeEachFunction {
  (fn: () => void | Promise<void>): void;
}

export interface AfterEachFunction {
  (fn: () => void | Promise<void>): void;
}

export interface MockToolOptions {
  returnValue?: any;
  implementation?: Function;
  throwError?: Error | string;
}

export interface IntegrationTestOptions {
  timeout?: number;
  retries?: number;
  setupTimeout?: number;
}
