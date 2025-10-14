#!/usr/bin/env node

const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive monitoring system test script
 * Tests all health check, monitoring, logging, backup, and maintenance endpoints
 */
class MonitoringTestSuite {
  constructor() {
    this.baseUrl = process.env.TEST_BASE_URL || 'http://localhost:3000';
    this.authToken = process.env.TEST_AUTH_TOKEN || '';
    this.results = {
      passed: 0,
      failed: 0,
      tests: [],
    };
  }

  async runAllTests() {
    console.log('🧪 Starting QCSER Backend Monitoring Test Suite\n');
    console.log(`Base URL: ${this.baseUrl}`);
    console.log(`Auth Token: ${this.authToken ? 'Provided' : 'Not provided'}\n`);

    try {
      // Health Check Tests
      await this.testHealthEndpoints();
      
      // Monitoring Tests (requires auth)
      if (this.authToken) {
        await this.testMonitoringEndpoints();
        await this.testLoggingEndpoints();
        await this.testBackupEndpoints();
        await this.testMaintenanceEndpoints();
      } else {
        console.log('⚠️  Skipping authenticated endpoints (no auth token provided)\n');
      }

      // Generate report
      this.generateReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  async testHealthEndpoints() {
    console.log('🏥 Testing Health Check Endpoints...\n');

    await this.test('Basic Health Check', async () => {
      const response = await this.get('/api/health');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'status');
      this.assertProperty(response.data, 'timestamp');
      this.assertProperty(response.data, 'uptime');
      return response.data;
    });

    await this.test('Detailed Health Check', async () => {
      const response = await this.get('/api/health/detailed');
      this.assertStatus(response, [200, 503]);
      this.assertProperty(response.data, 'status');
      this.assertProperty(response.data, 'services');
      return response.data;
    });

    await this.test('Database Health Check', async () => {
      const response = await this.get('/api/health/database');
      this.assertStatus(response, [200, 503]);
      this.assertProperty(response.data, 'database');
      return response.data;
    });

    await this.test('Storage Health Check', async () => {
      const response = await this.get('/api/health/storage');
      this.assertStatus(response, [200, 503]);
      this.assertProperty(response.data, 'storage');
      return response.data;
    });

    await this.test('Readiness Probe', async () => {
      const response = await this.get('/api/health/readiness');
      this.assertStatus(response, [200, 503]);
      this.assertProperty(response.data, 'status');
      return response.data;
    });

    await this.test('Liveness Probe', async () => {
      const response = await this.get('/api/health/liveness');
      this.assertStatus(response, [200, 503]);
      this.assertProperty(response.data, 'status');
      return response.data;
    });

    await this.test('Performance Metrics', async () => {
      const response = await this.get('/api/health/metrics');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'metrics');
      return response.data;
    });

    console.log('✅ Health check endpoints tested\n');
  }

  async testMonitoringEndpoints() {
    console.log('📊 Testing Monitoring Endpoints...\n');

    await this.test('Monitoring Dashboard', async () => {
      const response = await this.getAuth('/api/monitoring/dashboard');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'timestamp');
      this.assertProperty(response.data, 'status');
      this.assertProperty(response.data, 'metrics');
      return response.data;
    });

    await this.test('System Metrics', async () => {
      const response = await this.getAuth('/api/monitoring/metrics?limit=10');
      this.assertStatus(response, 200);
      this.assert(Array.isArray(response.data), 'Response should be an array');
      return response.data;
    });

    await this.test('Performance Alerts', async () => {
      const response = await this.getAuth('/api/monitoring/alerts');
      this.assertStatus(response, 200);
      this.assert(Array.isArray(response.data), 'Response should be an array');
      return response.data;
    });

    await this.test('System Information', async () => {
      const response = await this.getAuth('/api/monitoring/system-info');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'application');
      this.assertProperty(response.data, 'system');
      return response.data;
    });

    await this.test('Performance Summary', async () => {
      const response = await this.getAuth('/api/monitoring/performance-summary');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'summary');
      return response.data;
    });

    console.log('✅ Monitoring endpoints tested\n');
  }

  async testLoggingEndpoints() {
    console.log('📝 Testing Logging Endpoints...\n');

    await this.test('Recent Logs', async () => {
      const response = await this.getAuth('/api/logging/recent?limit=10');
      this.assertStatus(response, 200);
      this.assert(Array.isArray(response.data), 'Response should be an array');
      return response.data;
    });

    await this.test('Log Statistics', async () => {
      const response = await this.getAuth('/api/logging/statistics');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'recent');
      this.assertProperty(response.data, 'daily');
      return response.data;
    });

    await this.test('Error Logs', async () => {
      const response = await this.getAuth('/api/logging/errors?limit=5');
      this.assertStatus(response, 200);
      this.assert(Array.isArray(response.data), 'Response should be an array');
      return response.data;
    });

    await this.test('Log Analysis', async () => {
      const response = await this.getAuth('/api/logging/analysis');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'totalLogs');
      this.assertProperty(response.data, 'logsByLevel');
      return response.data;
    });

    await this.test('Logging Dashboard', async () => {
      const response = await this.getAuth('/api/logging/dashboard');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'statistics');
      this.assertProperty(response.data, 'todayAnalysis');
      return response.data;
    });

    await this.test('Logging Health', async () => {
      const response = await this.getAuth('/api/logging/health');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'status');
      this.assertProperty(response.data, 'metrics');
      return response.data;
    });

    console.log('✅ Logging endpoints tested\n');
  }

  async testBackupEndpoints() {
    console.log('💾 Testing Backup Endpoints...\n');

    await this.test('Backup List', async () => {
      const response = await this.getAuth('/api/backup/list');
      this.assertStatus(response, 200);
      this.assert(Array.isArray(response.data), 'Response should be an array');
      return response.data;
    });

    await this.test('Backup Statistics', async () => {
      const response = await this.getAuth('/api/backup/statistics');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'summary');
      this.assertProperty(response.data, 'configuration');
      return response.data;
    });

    await this.test('Backup Configuration', async () => {
      const response = await this.getAuth('/api/backup/config');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'database');
      this.assertProperty(response.data, 'files');
      return response.data;
    });

    await this.test('Backup System Test', async () => {
      const response = await this.getAuth('/api/backup/test');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'tests');
      return response.data;
    });

    await this.test('Backup Dashboard', async () => {
      const response = await this.getAuth('/api/backup/dashboard');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'statistics');
      this.assertProperty(response.data, 'systemHealth');
      return response.data;
    });

    await this.test('Backup Health', async () => {
      const response = await this.getAuth('/api/backup/health');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'status');
      this.assertProperty(response.data, 'summary');
      return response.data;
    });

    console.log('✅ Backup endpoints tested\n');
  }

  async testMaintenanceEndpoints() {
    console.log('🔧 Testing Maintenance Endpoints...\n');

    await this.test('Maintenance History', async () => {
      const response = await this.getAuth('/api/maintenance/history');
      this.assertStatus(response, 200);
      this.assert(Array.isArray(response.data), 'Response should be an array');
      return response.data;
    });

    await this.test('System Health', async () => {
      const response = await this.getAuth('/api/maintenance/health');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'status');
      this.assertProperty(response.data, 'checks');
      return response.data;
    });

    await this.test('Maintenance Status', async () => {
      const response = await this.getAuth('/api/maintenance/status');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'maintenanceActive');
      this.assertProperty(response.data, 'systemHealth');
      return response.data;
    });

    await this.test('Maintenance Dashboard', async () => {
      const response = await this.getAuth('/api/maintenance/dashboard');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'summary');
      this.assertProperty(response.data, 'systemHealth');
      return response.data;
    });

    await this.test('Health Check Run', async () => {
      const response = await this.postAuth('/api/maintenance/health-check', {});
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'result');
      this.assertProperty(response.data, 'summary');
      return response.data;
    });

    await this.test('Maintenance Recommendations', async () => {
      const response = await this.getAuth('/api/maintenance/recommendations');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'recommendations');
      return response.data;
    });

    await this.test('Maintenance Schedule', async () => {
      const response = await this.getAuth('/api/maintenance/schedule');
      this.assertStatus(response, 200);
      this.assertProperty(response.data, 'schedule');
      return response.data;
    });

    console.log('✅ Maintenance endpoints tested\n');
  }

  async test(name, testFn) {
    try {
      console.log(`  Testing: ${name}`);
      const result = await testFn();
      this.results.passed++;
      this.results.tests.push({
        name,
        status: 'PASSED',
        result: typeof result === 'object' ? JSON.stringify(result, null, 2) : result,
      });
      console.log(`  ✅ ${name} - PASSED`);
    } catch (error) {
      this.results.failed++;
      this.results.tests.push({
        name,
        status: 'FAILED',
        error: error.message,
      });
      console.log(`  ❌ ${name} - FAILED: ${error.message}`);
    }
  }

  async get(endpoint) {
    try {
      return await axios.get(`${this.baseUrl}${endpoint}`, {
        timeout: 10000,
        validateStatus: () => true, // Don't throw on non-2xx status codes
      });
    } catch (error) {
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  async getAuth(endpoint) {
    if (!this.authToken) {
      throw new Error('Authentication token required');
    }

    try {
      return await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
        timeout: 10000,
        validateStatus: () => true,
      });
    } catch (error) {
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  async postAuth(endpoint, data) {
    if (!this.authToken) {
      throw new Error('Authentication token required');
    }

    try {
      return await axios.post(`${this.baseUrl}${endpoint}`, data, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
        validateStatus: () => true,
      });
    } catch (error) {
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  assertStatus(response, expectedStatus) {
    const expected = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
    if (!expected.includes(response.status)) {
      throw new Error(`Expected status ${expected.join(' or ')}, got ${response.status}`);
    }
  }

  assertProperty(obj, property) {
    if (!obj.hasOwnProperty(property)) {
      throw new Error(`Expected property '${property}' not found in response`);
    }
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message);
    }
  }

  generateReport() {
    console.log('\n📋 Test Results Summary');
    console.log('========================');
    console.log(`Total Tests: ${this.results.passed + this.results.failed}`);
    console.log(`Passed: ${this.results.passed}`);
    console.log(`Failed: ${this.results.failed}`);
    console.log(`Success Rate: ${((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(2)}%`);

    if (this.results.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.tests
        .filter(test => test.status === 'FAILED')
        .forEach(test => {
          console.log(`  - ${test.name}: ${test.error}`);
        });
    }

    // Save detailed report
    const reportPath = path.join(__dirname, '..', 'test-reports', `monitoring-test-${Date.now()}.json`);
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: this.results.passed + this.results.failed,
        passed: this.results.passed,
        failed: this.results.failed,
        successRate: ((this.results.passed / (this.results.passed + this.results.failed)) * 100).toFixed(2),
      },
      tests: this.results.tests,
    }, null, 2));

    console.log(`\n📄 Detailed report saved to: ${reportPath}`);

    if (this.results.failed > 0) {
      console.log('\n❌ Some tests failed. Check the logs above for details.');
      process.exit(1);
    } else {
      console.log('\n✅ All tests passed successfully!');
      process.exit(0);
    }
  }
}

// Run the test suite
if (require.main === module) {
  const testSuite = new MonitoringTestSuite();
  testSuite.runAllTests().catch(error => {
    console.error('Test suite execution failed:', error);
    process.exit(1);
  });
}

module.exports = MonitoringTestSuite;