/**
 * MCP Test Mocking Utilities
 * Mock tools, resources, and prompts for testing
 */

import { Mock, MockCall, MockToolOptions, MCPServer, ToolHandler } from './types.js';

export class MockFunction implements Mock {
  name: string;
  implementation?: Function;
  calls: MockCall[] = [];
  returnValues: any[] = [];
  errors: Error[] = [];

  constructor(name: string, options?: MockToolOptions) {
    this.name = name;

    if (options?.implementation) {
      this.implementation = options.implementation;
    } else if (options?.returnValue !== undefined) {
      this.implementation = () => options.returnValue;
    } else if (options?.throwError) {
      const error = typeof options.throwError === 'string'
        ? new Error(options.throwError)
        : options.throwError;
      this.implementation = () => { throw error; };
    }
  }

  async execute(...args: any[]): Promise<any> {
    const call: MockCall = {
      args,
      timestamp: Date.now()
    };

    try {
      const result = this.implementation
        ? await this.implementation(...args)
        : undefined;

      call.result = result;
      this.calls.push(call);
      this.returnValues.push(result);

      return result;
    } catch (error) {
      call.error = error as Error;
      this.calls.push(call);
      this.errors.push(error as Error);
      throw error;
    }
  }

  mockReturnValue(value: any): this {
    this.implementation = () => value;
    return this;
  }

  mockReturnValueOnce(value: any): this {
    const oldImpl = this.implementation;
    let called = false;

    this.implementation = (...args: any[]) => {
      if (!called) {
        called = true;
        return value;
      }
      return oldImpl ? oldImpl(...args) : undefined;
    };

    return this;
  }

  mockResolvedValue(value: any): this {
    this.implementation = async () => value;
    return this;
  }

  mockRejectedValue(error: any): this {
    this.implementation = async () => {
      throw typeof error === 'string' ? new Error(error) : error;
    };
    return this;
  }

  mockImplementation(fn: Function): this {
    this.implementation = fn;
    return this;
  }

  mockClear(): void {
    this.calls = [];
    this.returnValues = [];
    this.errors = [];
  }

  mockReset(): void {
    this.mockClear();
    this.implementation = undefined;
  }
}

/**
 * Create a mock MCP tool
 */
export function mockTool(name: string, options?: MockToolOptions): MockFunction {
  return new MockFunction(name, options);
}

/**
 * Create a mock MCP resource
 */
export function mockResource(uri: string, options?: MockToolOptions): MockFunction {
  return new MockFunction(uri, options);
}

/**
 * Create a mock MCP prompt
 */
export function mockPrompt(name: string, options?: MockToolOptions): MockFunction {
  return new MockFunction(name, options);
}

/**
 * Create a spy that wraps an existing function
 */
export function spyOn(obj: any, method: string): MockFunction {
  const original = obj[method];
  const spy = new MockFunction(method, {
    implementation: original.bind(obj)
  });

  obj[method] = (...args: any[]) => spy.execute(...args);

  // Store reference to restore later
  (spy as any).__original = original;
  (spy as any).__object = obj;
  (spy as any).__method = method;

  return spy;
}

/**
 * Restore a spied function to its original implementation
 */
export function restoreSpy(spy: MockFunction): void {
  const original = (spy as any).__original;
  const obj = (spy as any).__object;
  const method = (spy as any).__method;

  if (obj && method && original) {
    obj[method] = original;
  }
}

/**
 * Create a mock MCP server with mocked tools/resources/prompts
 */
export function createMockServer(config?: {
  tools?: Record<string, MockToolOptions>;
  resources?: Record<string, MockToolOptions>;
  prompts?: Record<string, MockToolOptions>;
}): { server: MCPServer; mocks: { tools: Map<string, MockFunction>; resources: Map<string, MockFunction>; prompts: Map<string, MockFunction> } } {
  const mocks = {
    tools: new Map<string, MockFunction>(),
    resources: new Map<string, MockFunction>(),
    prompts: new Map<string, MockFunction>()
  };

  const server: MCPServer = {
    tools: {},
    resources: {},
    prompts: {}
  };

  // Create mock tools
  if (config?.tools) {
    for (const [name, options] of Object.entries(config.tools)) {
      const mock = mockTool(name, options);
      mocks.tools.set(name, mock);
      server.tools![name] = (...args: any[]) => mock.execute(...args);
    }
  }

  // Create mock resources
  if (config?.resources) {
    for (const [uri, options] of Object.entries(config.resources)) {
      const mock = mockResource(uri, options);
      mocks.resources.set(uri, mock);
      server.resources![uri] = (...args: any[]) => mock.execute(...args);
    }
  }

  // Create mock prompts
  if (config?.prompts) {
    for (const [name, options] of Object.entries(config.prompts)) {
      const mock = mockPrompt(name, options);
      mocks.prompts.set(name, mock);
      server.prompts![name] = (...args: any[]) => mock.execute(...args);
    }
  }

  return { server, mocks };
}

/**
 * Clear all mocks in a mock registry
 */
export function clearAllMocks(mocks: { tools: Map<string, MockFunction>; resources: Map<string, MockFunction>; prompts: Map<string, MockFunction> }): void {
  mocks.tools.forEach(mock => mock.mockClear());
  mocks.resources.forEach(mock => mock.mockClear());
  mocks.prompts.forEach(mock => mock.mockClear());
}

/**
 * Reset all mocks in a mock registry
 */
export function resetAllMocks(mocks: { tools: Map<string, MockFunction>; resources: Map<string, MockFunction>; prompts: Map<string, MockFunction> }): void {
  mocks.tools.forEach(mock => mock.mockReset());
  mocks.resources.forEach(mock => mock.mockReset());
  mocks.prompts.forEach(mock => mock.mockReset());
}
