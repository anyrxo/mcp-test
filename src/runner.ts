/**
 * MCP Test Runner
 * Executes test suites and collects results
 */

import { TestResult, TestSuiteResult, AssertionResult } from './types.js';
import chalk from 'chalk';

interface Test {
  name: string;
  fn: () => void | Promise<void>;
  skip: boolean;
  only: boolean;
}

interface Suite {
  name: string;
  tests: Test[];
  beforeEach: Array<() => void | Promise<void>>;
  afterEach: Array<() => void | Promise<void>>;
  beforeAll: Array<() => void | Promise<void>>;
  afterAll: Array<() => void | Promise<void>>;
  suites: Suite[];
  skip: boolean;
  only: boolean;
}

let currentSuite: Suite | null = null;
const rootSuites: Suite[] = [];

/**
 * Define a test
 */
export function test(name: string, fn: () => void | Promise<void>): void {
  if (!currentSuite) {
    throw new Error('test() must be called inside describe()');
  }

  currentSuite.tests.push({ name, fn, skip: false, only: false });
}

test.skip = (name: string, fn: () => void | Promise<void>): void => {
  if (!currentSuite) {
    throw new Error('test.skip() must be called inside describe()');
  }

  currentSuite.tests.push({ name, fn, skip: true, only: false });
};

test.only = (name: string, fn: () => void | Promise<void>): void => {
  if (!currentSuite) {
    throw new Error('test.only() must be called inside describe()');
  }

  currentSuite.tests.push({ name, fn, skip: false, only: true });
};

/**
 * Define a test suite
 */
export function describe(name: string, fn: () => void): void {
  const suite: Suite = {
    name,
    tests: [],
    beforeEach: [],
    afterEach: [],
    beforeAll: [],
    afterAll: [],
    suites: [],
    skip: false,
    only: false
  };

  if (currentSuite) {
    currentSuite.suites.push(suite);
  } else {
    rootSuites.push(suite);
  }

  const previousSuite = currentSuite;
  currentSuite = suite;

  try {
    fn();
  } finally {
    currentSuite = previousSuite;
  }
}

describe.skip = (name: string, fn: () => void): void => {
  const suite: Suite = {
    name,
    tests: [],
    beforeEach: [],
    afterEach: [],
    beforeAll: [],
    afterAll: [],
    suites: [],
    skip: true,
    only: false
  };

  if (currentSuite) {
    currentSuite.suites.push(suite);
  } else {
    rootSuites.push(suite);
  }
};

describe.only = (name: string, fn: () => void): void => {
  const suite: Suite = {
    name,
    tests: [],
    beforeEach: [],
    afterEach: [],
    beforeAll: [],
    afterAll: [],
    suites: [],
    skip: false,
    only: true
  };

  if (currentSuite) {
    currentSuite.suites.push(suite);
  } else {
    rootSuites.push(suite);
  }

  const previousSuite = currentSuite;
  currentSuite = suite;

  try {
    fn();
  } finally {
    currentSuite = previousSuite;
  }
};

/**
 * Run before each test
 */
export function beforeEach(fn: () => void | Promise<void>): void {
  if (!currentSuite) {
    throw new Error('beforeEach() must be called inside describe()');
  }

  currentSuite.beforeEach.push(fn);
}

/**
 * Run after each test
 */
export function afterEach(fn: () => void | Promise<void>): void {
  if (!currentSuite) {
    throw new Error('afterEach() must be called inside describe()');
  }

  currentSuite.afterEach.push(fn);
}

/**
 * Run before all tests in suite
 */
export function beforeAll(fn: () => void | Promise<void>): void {
  if (!currentSuite) {
    throw new Error('beforeAll() must be called inside describe()');
  }

  currentSuite.beforeAll.push(fn);
}

/**
 * Run after all tests in suite
 */
export function afterAll(fn: () => void | Promise<void>): void {
  if (!currentSuite) {
    throw new Error('afterAll() must be called inside describe()');
  }

  currentSuite.afterAll.push(fn);
}

/**
 * Run a single test
 */
async function runTest(test: Test, suite: Suite): Promise<TestResult> {
  const startTime = Date.now();
  const assertions: AssertionResult[] = [];

  try {
    // Run beforeEach hooks
    for (const hook of suite.beforeEach) {
      await hook();
    }

    // Run test
    await test.fn();

    // Run afterEach hooks
    for (const hook of suite.afterEach) {
      await hook();
    }

    return {
      name: test.name,
      passed: true,
      duration: Date.now() - startTime,
      assertions
    };
  } catch (error) {
    // Run afterEach even if test failed
    try {
      for (const hook of suite.afterEach) {
        await hook();
      }
    } catch (hookError) {
      // Ignore hook errors
    }

    return {
      name: test.name,
      passed: false,
      error: error as Error,
      duration: Date.now() - startTime,
      assertions
    };
  }
}

/**
 * Run a test suite
 */
async function runSuite(suite: Suite, parentName: string = ''): Promise<TestSuiteResult> {
  const fullName = parentName ? `${parentName} > ${suite.name}` : suite.name;
  const startTime = Date.now();
  const results: TestResult[] = [];

  // Run beforeAll hooks
  for (const hook of suite.beforeAll) {
    await hook();
  }

  // Check if only specific tests should run
  const hasOnly = suite.tests.some(t => t.only) || suite.suites.some(s => s.only);

  // Run tests
  for (const test of suite.tests) {
    if (test.skip) {
      results.push({
        name: test.name,
        passed: true,
        duration: 0,
        assertions: []
      });
      continue;
    }

    if (hasOnly && !test.only) {
      continue;
    }

    const result = await runTest(test, suite);
    results.push(result);
  }

  // Run nested suites
  for (const nestedSuite of suite.suites) {
    if (nestedSuite.skip) {
      continue;
    }

    if (hasOnly && !nestedSuite.only) {
      continue;
    }

    const nestedResult = await runSuite(nestedSuite, fullName);
    results.push(...nestedResult.tests);
  }

  // Run afterAll hooks
  for (const hook of suite.afterAll) {
    await hook();
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    name: fullName,
    tests: results,
    passed,
    failed,
    skipped: suite.tests.filter(t => t.skip).length,
    duration: Date.now() - startTime
  };
}

/**
 * Run all test suites
 */
export async function runAllTests(): Promise<TestSuiteResult[]> {
  const results: TestSuiteResult[] = [];

  for (const suite of rootSuites) {
    if (suite.skip) {
      continue;
    }

    const result = await runSuite(suite);
    results.push(result);
  }

  return results;
}

/**
 * Clear all test suites (for testing the framework itself)
 */
export function clearSuites(): void {
  rootSuites.length = 0;
  currentSuite = null;
}

/**
 * Print test results to console
 */
export function printResults(results: TestSuiteResult[]): void {
  console.log('');

  let totalPassed = 0;
  let totalFailed = 0;
  let totalSkipped = 0;

  for (const suite of results) {
    console.log(chalk.cyan(`\n${suite.name}`));

    for (const test of suite.tests) {
      if (test.passed) {
        console.log(chalk.green(`  ✓ ${test.name}`) + chalk.gray(` (${test.duration}ms)`));
      } else {
        console.log(chalk.red(`  ✗ ${test.name}`) + chalk.gray(` (${test.duration}ms)`));
        if (test.error) {
          console.log(chalk.red(`    ${test.error.message}`));
          if (test.error.stack) {
            const stack = test.error.stack.split('\n').slice(1, 4).join('\n');
            console.log(chalk.gray(stack));
          }
        }
      }
    }

    totalPassed += suite.passed;
    totalFailed += suite.failed;
    totalSkipped += suite.skipped;
  }

  console.log('\n' + '='.repeat(50));
  console.log(chalk.bold('\n📊 Test Summary:'));
  console.log(`   Total: ${totalPassed + totalFailed}`);
  console.log(chalk.green(`   ✓ Passed: ${totalPassed}`));
  if (totalFailed > 0) {
    console.log(chalk.red(`   ✗ Failed: ${totalFailed}`));
  }
  if (totalSkipped > 0) {
    console.log(chalk.yellow(`   ⊘ Skipped: ${totalSkipped}`));
  }
  const passRate = totalPassed + totalFailed > 0
    ? Math.round((totalPassed / (totalPassed + totalFailed)) * 100)
    : 0;
  console.log(`   Pass Rate: ${passRate}%\n`);
}
