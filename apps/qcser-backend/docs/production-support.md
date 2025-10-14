# QCSER Backend - Production Support Documentation

## Overview

This document provides comprehensive guidance for production support, monitoring, and maintenance of the QCSER Backend system. It covers operational procedures, troubleshooting guides, and best practices for maintaining system health.

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Monitoring and Alerting](#monitoring-and-alerting)
3. [Health Checks](#health-checks)
4. [Logging and Analysis](#logging-and-analysis)
5. [Backup and Recovery](#backup-and-recovery)
6. [Maintenance Procedures](#maintenance-procedures)
7. [Troubleshooting Guide](#troubleshooting-guide)
8. [Performance Optimization](#performance-optimization)
9. [Security Monitoring](#security-monitoring)
10. [Incident Response](#incident-response)

## System Architecture

### Core Components

- **Application Server**: NestJS application running on Node.js
- **Database**: PostgreSQL with connection pooling
- **Storage**: Hybrid Supabase Storage + Local fallback
- **Cache**: Redis for session management and offline queues
- **Authentication**: JWT with Supabase Auth integration

### Key Endpoints

- **Health Checks**: `/api/health/*`
- **Monitoring**: `/api/monitoring/*`
- **Logging**: `/api/logging/*`
- **Backup**: `/api/backup/*`
- **Maintenance**: `/api/maintenance/*`

## Monitoring and Alerting

### Health Check Endpoints

#### Basic Health Check
```bash
curl -X GET http://localhost:3000/api/health
```

Expected Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "version": "1.0.0"
}
```

#### Detailed Health Check
```bash
curl -X GET http://localhost:3000/api/health/detailed
```

#### Service-Specific Checks
- Database: `/api/health/database`
- Storage: `/api/health/storage`
- Readiness: `/api/health/readiness`
- Liveness: `/api/health/liveness`

### Performance Metrics

#### System Metrics
```bash
curl -X GET http://localhost:3000/api/health/metrics
```

#### Monitoring Dashboard
```bash
curl -H "Authorization: Bearer <token>" \
     -X GET http://localhost:3000/api/monitoring/dashboard
```

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Memory Usage | 70% | 85% |
| CPU Usage | 70% | 85% |
| Disk Space | 80% | 90% |
| Response Time | 2000ms | 5000ms |
| Error Rate | 5% | 10% |
| Database Connections | 30 | 50 |

### Setting Up Alerts

1. **Memory Alerts**:
   - Monitor heap usage percentage
   - Alert when > 85% for 5 minutes

2. **Database Alerts**:
   - Monitor connection pool usage
   - Alert on slow queries (> 1000ms)

3. **Response Time Alerts**:
   - Monitor average response time
   - Alert when > 2000ms for 10 minutes

## Health Checks

### Automated Health Monitoring

The system performs automated health checks every minute:

```typescript
// Health check schedule
@Cron(CronExpression.EVERY_MINUTE)
async performHealthCheck() {
  // Database connectivity
  // Storage accessibility
  // Memory usage
  // File system health
}
```

### Manual Health Verification

#### Database Health
```bash
# Check database connection
curl -X GET http://localhost:3000/api/health/database

# Expected healthy response
{
  "status": "healthy",
  "responseTime": 45,
  "details": {
    "tablesCount": 12,
    "connectionPool": {
      "totalConnections": 10,
      "idleConnections": 8,
      "waitingClients": 0
    }
  }
}
```

#### Storage Health
```bash
# Check storage systems
curl -X GET http://localhost:3000/api/health/storage

# Expected response
{
  "status": "healthy",
  "details": {
    "supabaseBuckets": 2,
    "localStorageAvailable": true,
    "uploadsDirectory": "/app/uploads"
  }
}
```

### Health Check Troubleshooting

#### Database Issues
- **Connection Failed**: Check database server status and credentials
- **High Connection Count**: Review connection pool configuration
- **Slow Queries**: Analyze query performance and indexes

#### Storage Issues
- **Supabase Unavailable**: Check network connectivity and API keys
- **Local Storage Full**: Clean up old files or increase disk space
- **Permission Errors**: Verify file system permissions

## Logging and Analysis

### Log Levels and Categories

- **ERROR**: Critical errors requiring immediate attention
- **WARN**: Warning conditions that should be monitored
- **LOG**: General operational messages
- **DEBUG**: Detailed debugging information

### Log Analysis Endpoints

#### Recent Logs
```bash
curl -H "Authorization: Bearer <token>" \
     -X GET "http://localhost:3000/api/logging/recent?limit=100&level=error"
```

#### Log Search
```bash
curl -H "Authorization: Bearer <token>" \
     -X POST http://localhost:3000/api/logging/search \
     -H "Content-Type: application/json" \
     -d '{
       "level": "error",
       "startDate": "2024-01-15T00:00:00.000Z",
       "endDate": "2024-01-15T23:59:59.999Z",
       "limit": 50
     }'
```

#### Log Statistics
```bash
curl -H "Authorization: Bearer <token>" \
     -X GET http://localhost:3000/api/logging/statistics
```

### Log File Locations

- **Application Logs**: `/app/logs/app-YYYY-MM-DD.log`
- **Error Logs**: Filtered from application logs
- **Access Logs**: HTTP request logs
- **Performance Logs**: Response time and performance metrics

### Log Rotation

Logs are automatically rotated:
- **Daily**: New log file created each day
- **Size-based**: Files > 100MB are rotated
- **Retention**: 30 days for application logs, 7 days for debug logs

## Backup and Recovery

### Backup Types

1. **Database Backup**: PostgreSQL dump with compression
2. **File Backup**: Application files, uploads, and configurations
3. **Full Backup**: Complete system backup

### Backup Schedule

- **Database**: Daily at 2:00 AM
- **Files**: Daily at 3:00 AM
- **Full Backup**: Weekly on Sunday at 1:00 AM

### Creating Manual Backups

#### Database Backup
```bash
curl -H "Authorization: Bearer <token>" \
     -X POST http://localhost:3000/api/backup/create \
     -H "Content-Type: application/json" \
     -d '{"type": "database"}'
```

#### File Backup
```bash
curl -H "Authorization: Bearer <token>" \
     -X POST http://localhost:3000/api/backup/create \
     -H "Content-Type: application/json" \
     -d '{"type": "files"}'
```

### Backup Verification

```bash
# List available backups
curl -H "Authorization: Bearer <token>" \
     -X GET http://localhost:3000/api/backup/list

# Get backup statistics
curl -H "Authorization: Bearer <token>" \
     -X GET http://localhost:3000/api/backup/statistics
```

### Recovery Procedures

#### Database Recovery
```bash
# Restore from backup
curl -H "Authorization: Bearer <token>" \
     -X POST http://localhost:3000/api/backup/restore \
     -H "Content-Type: application/json" \
     -d '{"backupJobId": "db-backup-1642248000000"}'
```

#### Recovery Verification
1. Check database connectivity
2. Verify data integrity
3. Test application functionality
4. Monitor system performance

## Maintenance Procedures

### Scheduled Maintenance

#### Daily (6:00 AM)
- Health checks
- Log rotation
- Temporary file cleanup

#### Weekly (Sunday 1:00 AM)
- Database statistics update
- Index maintenance
- Security scan
- Performance analysis

#### Monthly (1st day 2:00 AM)
- Database vacuum
- System updates check
- Backup verification
- Comprehensive performance analysis

### Manual Maintenance

#### Start Maintenance Window
```bash
curl -H "Authorization: Bearer <token>" \
     -X POST http://localhost:3000/api/maintenance/start \
     -H "Content-Type: application/json" \
     -d '{"type": "weekly-maintenance"}'
```

#### Check Maintenance Status
```bash
curl -H "Authorization: Bearer <token>" \
     -X GET http://localhost:3000/api/maintenance/status
```

#### View Maintenance History
```bash
curl -H "Authorization: Bearer <token>" \
     -X GET http://localhost:3000/api/maintenance/history
```

### Database Maintenance

#### Update Statistics
```sql
-- Run ANALYZE to update table statistics
ANALYZE;

-- Check for unused indexes
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_tup_read = 0 AND idx_tup_fetch = 0;
```

#### Vacuum Database
```sql
-- Full vacuum (requires maintenance window)
VACUUM FULL;

-- Regular vacuum (can run during operation)
VACUUM ANALYZE;
```

## Troubleshooting Guide

### Common Issues

#### High Memory Usage
**Symptoms**: Memory alerts, slow response times
**Diagnosis**:
```bash
# Check memory metrics
curl -X GET http://localhost:3000/api/health/metrics

# Check for memory leaks
curl -H "Authorization: Bearer <token>" \
     -X GET http://localhost:3000/api/monitoring/performance-summary
```

**Solutions**:
1. Restart application if memory leak suspected
2. Optimize database queries
3. Implement caching strategies
4. Increase server memory

#### Database Connection Issues
**Symptoms**: Connection timeouts, pool exhaustion
**Diagnosis**:
```bash
# Check database health
curl -X GET http://localhost:3000/api/health/database

# Check connection pool status
curl -H "Authorization: Bearer <token>" \
     -X GET http://localhost:3000/api/monitoring/metrics
```

**Solutions**:
1. Increase connection pool size
2. Optimize long-running queries
3. Implement connection retry logic
4. Check database server resources

#### Storage Issues
**Symptoms**: File upload failures, disk space alerts
**Diagnosis**:
```bash
# Check storage health
curl -X GET http://localhost:3000/api/health/storage

# Check disk usage
df -h
```

**Solutions**:
1. Clean up old files
2. Implement file rotation
3. Increase disk space
4. Optimize file storage strategy

#### Performance Degradation
**Symptoms**: Slow response times, high CPU usage
**Diagnosis**:
```bash
# Check performance metrics
curl -H "Authorization: Bearer <token>" \
     -X GET http://localhost:3000/api/monitoring/performance-summary

# Analyze slow queries
curl -H "Authorization: Bearer <token>" \
     -X GET http://localhost:3000/api/logging/analysis
```

**Solutions**:
1. Optimize database queries
2. Add database indexes
3. Implement caching
4. Scale horizontally

### Error Code Reference

| Error Code | Description | Action |
|------------|-------------|---------|
| DB_CONNECTION_FAILED | Database connection failed | Check database server and credentials |
| STORAGE_UNAVAILABLE | Storage service unavailable | Check Supabase connectivity |
| MEMORY_LIMIT_EXCEEDED | Memory usage too high | Restart application or increase memory |
| DISK_SPACE_LOW | Disk space below threshold | Clean up files or increase storage |
| AUTH_TOKEN_EXPIRED | JWT token expired | Refresh authentication token |
| RATE_LIMIT_EXCEEDED | Too many requests | Implement rate limiting or increase limits |

## Performance Optimization

### Database Optimization

#### Query Performance
```sql
-- Find slow queries
SELECT query, calls, total_time, mean_time, rows
FROM pg_stat_statements 
WHERE mean_time > 1000
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes 
ORDER BY idx_tup_read DESC;
```

#### Connection Pool Tuning
```typescript
// Optimal connection pool settings
{
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  extra: {
    max: 20,        // Maximum connections
    min: 5,         // Minimum connections
    idle: 10000,    // Idle timeout (10 seconds)
    acquire: 30000, // Acquire timeout (30 seconds)
  }
}
```

### Application Optimization

#### Memory Management
- Monitor heap usage regularly
- Implement proper garbage collection
- Avoid memory leaks in event listeners
- Use streaming for large file operations

#### Caching Strategy
- Implement Redis caching for frequently accessed data
- Use in-memory caching for configuration data
- Cache database query results appropriately
- Implement cache invalidation strategies

## Security Monitoring

### Security Endpoints

#### Security Analysis
```bash
curl -H "Authorization: Bearer <token>" \
     -X GET http://localhost:3000/api/logging/analysis
```

#### Failed Authentication Attempts
```bash
curl -H "Authorization: Bearer <token>" \
     -X POST http://localhost:3000/api/logging/search \
     -H "Content-Type: application/json" \
     -d '{
       "message": "authentication failed",
       "limit": 100
     }'
```

### Security Alerts

Monitor for:
- Multiple failed login attempts
- Unauthorized access attempts
- Suspicious file upload activity
- SQL injection attempts
- Rate limit violations

### Security Best Practices

1. **Regular Security Scans**: Run weekly security scans
2. **Access Log Monitoring**: Monitor access patterns
3. **Vulnerability Assessment**: Check for known vulnerabilities
4. **Security Updates**: Keep dependencies updated
5. **Backup Verification**: Ensure backups are secure and accessible

## Incident Response

### Incident Classification

#### Severity Levels
- **Critical (P1)**: System down, data loss, security breach
- **High (P2)**: Major functionality impaired, performance severely degraded
- **Medium (P3)**: Minor functionality issues, moderate performance impact
- **Low (P4)**: Cosmetic issues, minimal impact

### Response Procedures

#### Critical Incidents (P1)
1. **Immediate Response** (0-15 minutes):
   - Acknowledge incident
   - Assess impact and scope
   - Implement immediate containment

2. **Investigation** (15-60 minutes):
   - Gather diagnostic information
   - Identify root cause
   - Develop resolution plan

3. **Resolution** (1-4 hours):
   - Implement fix
   - Verify system stability
   - Monitor for recurrence

4. **Post-Incident** (24-48 hours):
   - Conduct post-mortem
   - Document lessons learned
   - Implement preventive measures

### Diagnostic Commands

#### System Status
```bash
# Overall system health
curl -X GET http://localhost:3000/api/health/detailed

# Performance metrics
curl -H "Authorization: Bearer <token>" \
     -X GET http://localhost:3000/api/monitoring/dashboard

# Recent errors
curl -H "Authorization: Bearer <token>" \
     -X GET "http://localhost:3000/api/logging/errors?limit=50"
```

#### Database Diagnostics
```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Long running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Database size
SELECT pg_size_pretty(pg_database_size('qcser_db'));
```

### Contact Information

#### Escalation Path
1. **Level 1**: Development Team
2. **Level 2**: System Administrator
3. **Level 3**: Infrastructure Team
4. **Level 4**: Management

#### Emergency Contacts
- **Development Team**: dev-team@company.com
- **System Admin**: sysadmin@company.com
- **On-Call**: +1-555-0123

## Appendix

### Useful Commands

#### System Information
```bash
# System resources
free -h
df -h
top -p $(pgrep -f "node.*main.js")

# Network connectivity
ping -c 4 database-server
telnet database-server 5432
```

#### Log Analysis
```bash
# Find errors in logs
grep -i error /app/logs/app-$(date +%Y-%m-%d).log

# Count error types
grep -i error /app/logs/app-*.log | cut -d: -f3 | sort | uniq -c | sort -nr

# Monitor logs in real-time
tail -f /app/logs/app-$(date +%Y-%m-%d).log
```

### Configuration Files

#### Environment Variables
```bash
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=qcser_user
DB_PASSWORD=secure_password
DB_NAME=qcser_db

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_KEY=your-service-key

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=15m

# Application
NODE_ENV=production
PORT=3000
LOG_LEVEL=info
```

### Monitoring Checklist

#### Daily Checks
- [ ] System health status
- [ ] Error log review
- [ ] Performance metrics
- [ ] Backup completion
- [ ] Security alerts

#### Weekly Checks
- [ ] Database performance
- [ ] Storage usage
- [ ] Security scan results
- [ ] Maintenance task completion
- [ ] Performance trends

#### Monthly Checks
- [ ] Capacity planning
- [ ] Security assessment
- [ ] Backup verification
- [ ] Performance optimization
- [ ] Documentation updates

---

**Document Version**: 1.0  
**Last Updated**: January 2024  
**Next Review**: March 2024