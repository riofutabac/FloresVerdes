import { TestDataFactory } from './factories/test-data.factory';

// Global test setup
beforeEach(() => {
  // Reset test data factory counter before each test
  TestDataFactory.resetCounter();
});

// Global test teardown
afterEach(() => {
  // Clean up any global state if needed
  jest.clearAllMocks();
});

// Configure test timeout
jest.setTimeout(30000);

// Mock console methods to reduce noise in test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global error handler for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Performance monitoring for tests
const performanceMetrics = {
  slowTests: [],
  memoryUsage: [],
};

beforeEach(() => {
  // Record initial memory usage
  const initialMemory = process.memoryUsage();
  (global as any).testStartTime = Date.now();
  (global as any).testInitialMemory = initialMemory;
});

afterEach(() => {
  const testEndTime = Date.now();
  const testDuration = testEndTime - (global as any).testStartTime;
  const finalMemory = process.memoryUsage();
  const memoryIncrease = finalMemory.heapUsed - (global as any).testInitialMemory.heapUsed;

  // Track slow tests (over 5 seconds)
  if (testDuration > 5000) {
    performanceMetrics.slowTests.push({
      testName: expect.getState().currentTestName,
      duration: testDuration,
      memoryIncrease,
    });
  }

  // Track memory usage
  performanceMetrics.memoryUsage.push({
    testName: expect.getState().currentTestName,
    memoryIncrease,
    duration: testDuration,
  });
});

// Report performance metrics after all tests
afterAll(() => {
  if (performanceMetrics.slowTests.length > 0) {
    console.log('\n🐌 Slow Tests (>5s):');
    performanceMetrics.slowTests.forEach(test => {
      console.log(`  - ${test.testName}: ${test.duration}ms (${(test.memoryIncrease / 1024 / 1024).toFixed(2)}MB)`);
    });
  }

  // Report memory-intensive tests
  const memoryIntensiveTests = performanceMetrics.memoryUsage
    .filter(test => test.memoryIncrease > 50 * 1024 * 1024) // >50MB
    .sort((a, b) => b.memoryIncrease - a.memoryIncrease);

  if (memoryIntensiveTests.length > 0) {
    console.log('\n🧠 Memory Intensive Tests (>50MB):');
    memoryIntensiveTests.forEach(test => {
      console.log(`  - ${test.testName}: ${(test.memoryIncrease / 1024 / 1024).toFixed(2)}MB (${test.duration}ms)`);
    });
  }

  // Calculate overall test performance
  const totalTests = performanceMetrics.memoryUsage.length;
  const totalDuration = performanceMetrics.memoryUsage.reduce((sum, test) => sum + test.duration, 0);
  const totalMemoryUsage = performanceMetrics.memoryUsage.reduce((sum, test) => sum + test.memoryIncrease, 0);
  const avgDuration = totalDuration / totalTests;
  const avgMemoryUsage = totalMemoryUsage / totalTests;

  console.log('\n📊 Test Performance Summary:');
  console.log(`  - Total tests: ${totalTests}`);
  console.log(`  - Total duration: ${totalDuration}ms`);
  console.log(`  - Average duration: ${avgDuration.toFixed(2)}ms`);
  console.log(`  - Average memory usage: ${(avgMemoryUsage / 1024 / 1024).toFixed(2)}MB`);
  console.log(`  - Slow tests: ${performanceMetrics.slowTests.length}`);
  console.log(`  - Memory intensive tests: ${memoryIntensiveTests.length}`);
});

// Export performance metrics for external reporting
(global as any).testPerformanceMetrics = performanceMetrics;