#!/usr/bin/env node

/**
 * MCP Test CLI
 * Command-line interface for running MCP tests
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { runAllTests, printResults } from './runner.js';
import { expect } from './expect.js';
import { test, describe, beforeEach, afterEach, beforeAll, afterAll } from './runner.js';

const program = new Command();

const banner = `
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ${chalk.cyan('███╗   ███╗ ██████╗██████╗     ████████╗███████╗███████╗████████╗')}   ║
║   ${chalk.cyan('████╗ ████║██╔════╝██╔══██╗    ╚══██╔══╝██╔════╝██╔════╝╚══██╔══╝')}   ║
║   ${chalk.cyan('██╔████╔██║██║     ██████╔╝       ██║   █████╗  ███████╗   ██║   ')}   ║
║   ${chalk.cyan('██║╚██╔╝██║██║     ██╔═══╝        ██║   ██╔══╝  ╚════██║   ██║   ')}   ║
║   ${chalk.cyan('██║ ╚═╝ ██║╚██████╗██║            ██║   ███████╗███████║   ██║   ')}   ║
║   ${chalk.cyan('╚═╝     ╚═╝ ╚═════╝╚═╝            ╚═╝   ╚══════╝╚══════╝   ╚═╝   ')}   ║
║                                                           ║
║   ${chalk.white('Testing Framework for Model Context Protocol')}          ║
║   ${chalk.gray('Jest-like testing for MCP servers')}                     ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
`;

program
  .name('mcp-test')
  .description('Testing framework for MCP servers')
  .version('1.0.0');

// Run command
program
  .command('run [files...]')
  .description('Run test files')
  .option('--verbose', 'Verbose output')
  .option('--bail', 'Exit after first failure')
  .action(async (files, options) => {
    console.log(banner);

    if (!files || files.length === 0) {
      files = ['**/*.test.js', '**/*.test.ts'];
    }

    console.log(chalk.cyan('\n🧪 Running MCP Tests...\n'));

    // Make globals available
    (global as any).test = test;
    (global as any).describe = describe;
    (global as any).beforeEach = beforeEach;
    (global as any).afterEach = afterEach;
    (global as any).beforeAll = beforeAll;
    (global as any).afterAll = afterAll;
    (global as any).expect = expect;

    // Import test files
    for (const file of files) {
      try {
        await import(file);
      } catch (error) {
        console.error(chalk.red(`Error loading test file ${file}:`), error);
        if (options.bail) {
          process.exit(1);
        }
      }
    }

    // Run all tests
    const results = await runAllTests();

    // Print results
    printResults(results);

    // Exit with error code if any tests failed
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0);
    if (totalFailed > 0) {
      process.exit(1);
    }
  });

// Init command
program
  .command('init')
  .description('Initialize MCP Test in current directory')
  .action(() => {
    console.log(banner);
    console.log(chalk.cyan('\n📦 Initializing MCP Test...\n'));

    const exampleTest = `import { describe, test, expect, mockTool, createMockServer } from 'mcp-test';

describe('My MCP Server', () => {
  test('should call read-file tool', async () => {
    const readFile = mockTool('read-file', {
      returnValue: { content: 'Hello World', size: 11 }
    });

    const result = await readFile.execute({ path: '/tmp/test.txt' });

    expect(result.content).toBe('Hello World');
    expect(readFile).toHaveBeenCalledTimes(1);
    expect(readFile).toHaveBeenCalledWith({ path: '/tmp/test.txt' });
  });

  test('should handle errors', async () => {
    const failingTool = mockTool('failing-tool', {
      throwError: 'Tool failed'
    });

    await expect(failingTool.execute()).rejects.toThrow('Tool failed');
  });
});
`;

    console.log(chalk.green('✓ Created example test file: example.test.js\n'));
    console.log(chalk.gray(exampleTest));
    console.log(chalk.cyan('\n Run tests with:'));
    console.log(chalk.white('   mcp-test run example.test.js\n'));
  });

program.parse();
