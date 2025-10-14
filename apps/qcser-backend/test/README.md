# QCSER Backend Testing Suite

This comprehensive testing suite implements performance and security testing following the patterns from the reference implementation. The test suite covers all critical aspects of the QCSER backend system.

## Test Structure

```
test/
├── factories/
│   └── test-data.factory.ts          # Test data generation utilities
├── performance/
│   ├── load-testing.spec.ts          # Load testing for critical endpoints
│   ├── database-performance.spec.ts   # Database performance testing
│   ├── file-upload-performance.spec.ts # File upload performance testing
│   └── synchronization-stress.spec.ts # Synchronization stress testing
├── security/
│   ├── security-testing.spec.ts      # Basic security testing
│   └── advanced-security.spec.ts     # Advanced security scenarios
├── jest-e2e.json                     # E2E test configuration
├── jest-performance.json             # Performance test configuration
├── jest-security.json                # Security test configuration
├── setup.ts                          # Global test setup and monitoring
└── README.md                         # This file
```

## Test Categories

### 1. Unit Tests (70% Coverage Target)
- Service layer business logic testing
- Utility functions and calculations
- Guard and pipe validation logic
- Mock-based isolated testing

**Run Command:**
```bash
npm run test:unit
```

### 2. Integration Tests (20% Coverage Target)
- Controller endpoint testing with real database
- Repository operations testing
- External service integration testing
- Module interaction testing

**Run Command:**
```bash
npm run test:integration
```

### 3. Performance Tests (10% Coverage Target)
- Load testing for critical endpoints
- Database performance with large datasets
- File upload performance testing
- Synchronization stress testing
- Memory usage and resource testing

**Run Command:**
```bash
npm run test:performance
```

### 4. Security Tests
- Authentication security testing
- Authorization and privilege escalation prevention
- Input validation and injection prevention
- File upload security testing
- Business logic security testing

**Run Command:**
```bash
npm run test:security
```

### 5. End-to-End Tests
- Complete user workflow testing
- Cross-module integration testing
- Real-world scenario testing

**Run Command:**
```bash
npm run test:e2e
```

## Performance Testing Details

### Load Testing (`load-testing.spec.ts`)
- **Authentication Load**: 50 concurrent login requests
- **Token Validation**: 100 concurrent profile requests
- **Operator Queries**: 50 concurrent list requests with search
- **Evaluation Creation**: 20 concurrent evaluation submissions
- **Dashboard Data**: 25 concurrent dashboard requests
- **Memory Usage**: Sustained load testing with memory monitoring

**Performance Criteria:**
- Authentication: < 100ms average response time
- Token validation: < 30ms average response time
- Operator queries: < 80ms average response time
- Evaluation creation: < 300ms average response time
- Dashboard data: < 320ms average response time

### Database Performance (`database-performance.spec.ts`)
- **Large Dataset Queries**: 1000+ records with complex joins
- **Aggregation Performance**: Complex GROUP BY and statistical queries
- **Index Effectiveness**: Comparison of indexed vs non-indexed queries
- **Transaction Performance**: Bulk operations within transactions
- **Memory Usage**: Large result set handling
- **Query Optimization**: N+1 problem demonstration and solutions

**Performance Criteria:**
- Large dataset queries: < 2000ms
- Complex aggregations: < 1000ms
- Index performance: > 1.5x improvement
- Transaction processing: > 10 operations/second

### File Upload Performance (`file-upload-performance.spec.ts`)
- **Single File Upload**: Various file sizes (100KB to 8MB)
- **Multiple File Upload**: Concurrent and sequential uploads
- **Mixed Size Batches**: Different file sizes in single batch
- **Stress Testing**: Sustained upload load
- **Memory Pressure**: Large file handling
- **Download Performance**: File retrieval testing

**Performance Criteria:**
- Small files (100KB): < 2000ms
- Medium files (2MB): < 5000ms
- Large files (8MB): < 15000ms
- Concurrent uploads: > 95% success rate
- Memory efficiency: > 0.5x (uploaded size vs memory used)

### Synchronization Stress (`synchronization-stress.spec.ts`)
- **Offline Queue**: 1000+ operations queuing
- **Batch Processing**: Large batch synchronization
- **Conflict Resolution**: Multiple conflicting operations
- **Real-time Updates**: Concurrent sync status requests
- **Network Simulation**: Connectivity cycle testing
- **Memory Management**: Large queue handling

**Performance Criteria:**
- Queue operations: > 10 operations/second
- Batch processing: > 80% success rate
- Conflict resolution: < 3000ms
- Memory usage: < 50MB increase for large queues

## Security Testing Details

### Authentication Security
- **JWT Token Manipulation**: Algorithm confusion, payload tampering
- **Timing Attacks**: Consistent response times for valid/invalid credentials
- **Session Fixation**: New token generation per login
- **Concurrent Sessions**: Multiple session isolation
- **Brute Force Protection**: Rate limiting validation

### Authorization Security
- **Horizontal Privilege Escalation**: Same-role user access prevention
- **Vertical Privilege Escalation**: Role elevation prevention
- **Resource Ownership**: User-specific resource access control
- **Role Manipulation**: Request tampering prevention

### Input Validation Security
- **SQL Injection**: Advanced techniques (union, blind, time-based)
- **NoSQL Injection**: MongoDB-style injection prevention
- **XSS Prevention**: Script injection sanitization
- **XXE Attacks**: XML external entity prevention
- **SSRF Prevention**: Server-side request forgery blocking
- **Template Injection**: Template engine security

### File Upload Security
- **Malicious Files**: Web shells, executables, scripts
- **Path Traversal**: Directory traversal prevention
- **File Type Validation**: MIME type and extension checking
- **Size Limits**: Large file rejection
- **Content Scanning**: Malicious content detection

### Business Logic Security
- **Evaluation Manipulation**: Score and data tampering prevention
- **Duplicate Prevention**: Business rule enforcement
- **Time Manipulation**: Date/time validation
- **Status Manipulation**: Workflow integrity protection

## Test Data Factory

The `TestDataFactory` class provides consistent test data generation:

```typescript
// Create test users with different roles
const adminUser = TestDataFactory.createAdminUser();
const jefeUser = TestDataFactory.createJefeCalidadUser();
const gerenteUser = TestDataFactory.createGerenteUser();

// Create test operators
const operator = TestDataFactory.createOperator();
const inactiveOperator = TestDataFactory.createInactiveOperator();
const operatorWithDisability = TestDataFactory.createOperatorWithDisability();

// Create test evaluations
const evaluation = TestDataFactory.createEvaluation();
const completedEvaluation = TestDataFactory.createCompletedEvaluation();
const offlineEvaluation = TestDataFactory.createOfflineEvaluation();

// Create batches of test data
const operators = TestDataFactory.createBatch(
  () => TestDataFactory.createOperator(),
  100
);

// Create complex scenarios
const scenario = TestDataFactory.createCompleteEvaluationScenario();
```

## Running Tests

### Individual Test Suites
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Performance tests only
npm run test:performance

# Security tests only
npm run test:security

# E2E tests only
npm run test:e2e
```

### All Tests
```bash
# Run all test suites
npm run test:all
```

### With Coverage
```bash
# Generate coverage report
npm run test:cov
```

### Test Reporting
```bash
# Generate comprehensive test report
npm run test:report
```

## Test Configuration

### Performance Test Configuration
- **Timeout**: 60 seconds for long-running performance tests
- **Memory Monitoring**: Automatic memory usage tracking
- **Performance Metrics**: Response time and throughput measurement
- **Concurrency**: Configurable concurrent request testing

### Security Test Configuration
- **Timeout**: 30 seconds for security validation
- **Payload Testing**: Comprehensive attack vector coverage
- **Response Validation**: Security response verification
- **Error Handling**: Secure error message validation

## Monitoring and Reporting

### Automatic Performance Monitoring
- Slow test detection (>5 seconds)
- Memory usage tracking (>50MB increase)
- Performance metrics collection
- Resource usage analysis

### Test Reports
- **JSON Reports**: Detailed test results in JSON format
- **HTML Reports**: Visual test report dashboard
- **Coverage Reports**: Code coverage analysis
- **Performance Analysis**: Performance metrics and recommendations
- **Security Analysis**: Security test results and findings

### Report Locations
```
test-reports/
├── unit-results-{timestamp}.json
├── integration-results-{timestamp}.json
├── performance-results-{timestamp}.json
├── security-results-{timestamp}.json
├── e2e-results-{timestamp}.json
├── performance-analysis-{timestamp}.json
├── security-analysis-{timestamp}.json
├── coverage-analysis-{timestamp}.json
├── consolidated-report-{timestamp}.json
└── test-report-{timestamp}.html
```

## Best Practices

### Test Writing
1. **Isolation**: Each test should be independent
2. **Cleanup**: Proper setup and teardown
3. **Assertions**: Clear and specific expectations
4. **Performance**: Monitor test execution time
5. **Security**: Validate security measures thoroughly

### Performance Testing
1. **Realistic Data**: Use production-like data volumes
2. **Concurrent Testing**: Test under concurrent load
3. **Memory Monitoring**: Track memory usage patterns
4. **Baseline Metrics**: Establish performance baselines
5. **Regression Testing**: Detect performance regressions

### Security Testing
1. **Comprehensive Coverage**: Test all attack vectors
2. **Realistic Payloads**: Use real-world attack patterns
3. **Response Validation**: Verify secure error handling
4. **Business Logic**: Test domain-specific security rules
5. **Regular Updates**: Keep security tests current

## Troubleshooting

### Common Issues
1. **Test Timeouts**: Increase timeout for slow operations
2. **Memory Issues**: Monitor and optimize memory usage
3. **Database Locks**: Ensure proper test isolation
4. **Port Conflicts**: Use different ports for test environments
5. **File System**: Clean up temporary files

### Performance Issues
1. **Slow Tests**: Optimize test data creation
2. **Memory Leaks**: Monitor memory usage patterns
3. **Database Performance**: Use in-memory databases for testing
4. **Network Delays**: Mock external services
5. **Resource Cleanup**: Proper test teardown

### Security Test Issues
1. **False Positives**: Validate security test results
2. **Environment Differences**: Ensure consistent test environments
3. **Payload Updates**: Keep attack payloads current
4. **Response Validation**: Verify security response handling
5. **Business Logic**: Test domain-specific security rules

## Continuous Integration

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm run test:unit
    npm run test:integration
    npm run test:performance
    npm run test:security
    npm run test:e2e

- name: Generate Reports
  run: npm run test:report

- name: Upload Coverage
  uses: codecov/codecov-action@v1
```

### Quality Gates
- **Unit Test Coverage**: Minimum 70%
- **Performance Benchmarks**: All performance tests must pass
- **Security Tests**: Zero security test failures
- **Integration Tests**: All integration tests must pass
- **E2E Tests**: Critical user flows must pass

This comprehensive testing suite ensures the QCSER backend system meets all performance, security, and functional requirements while maintaining high code quality and reliability.