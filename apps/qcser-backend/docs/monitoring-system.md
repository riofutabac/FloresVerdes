# QCSER Backend - Monitoring and Maintenance System

## Overview

The QCSER Backend includes a comprehensive monitoring and maintenance system designed to ensure high availability, performance, and reliability in production environments. This system provides real-time health monitoring, performance metrics, automated maintenance, backup management, and detailed logging capabilities.

## System Components

### 1. Health Monitoring (`/api/health`)

Provides real-time health status of all system components:

- **Basic Health Check**: Quick system status verification
- **Detailed Health Check**: Comprehensive system component analysis
- **Database Health**: Connection pool status and query performance
- **Storage Health**: File system and cloud storage accessibility
- **Readiness Probe**: Kubernetes/Docker readiness verification
- **Liveness Probe**: Application responsiveness check
- **Performance Metrics**: System resource utilization

### 2. Performance Monitoring (`/api/monitoring`)

Continuous performance tracking and alerting:

- **Real-time Metrics**: Memory, CPU, database, and response time monitoring
- **Alert Management**: Configurable thresholds with severity levels
- **Performance Dashboard**: Comprehensive system overview
- **Trend Analysis**: Historical performance data and patterns
- **Automated Alerts**: Proactive issue detection and notification

### 3. Logging System (`/api/logging`)

Centralized logging with analysis capabilities:

- **Structured Logging**: JSON-formatted logs with metadata
- **Log Aggregation**: Centralized collection and storage
- **Real-time Analysis**: Pattern detection and anomaly identification
- **Search and Filtering**: Advanced log query capabilities
- **Export Functionality**: Data export for external analysis

### 4. Backup Management (`/api/backup`)

Automated backup and recovery system:

- **Scheduled Backups**: Daily database and file backups
- **Cloud Integration**: Supabase Storage for off-site backups
- **Backup Verification**: Automated integrity checks
- **Recovery Procedures**: Streamlined restoration process
- **Retention Management**: Automated cleanup of old backups

### 5. Maintenance System (`/api/maintenance`)

Automated maintenance and system optimization:

- **Scheduled Maintenance**: Daily, weekly, and monthly routines
- **Database Optimization**: Index maintenance and statistics updates
- **System Cleanup**: Temporary file removal and log rotation
- **Security Scanning**: Vulnerability detection and reporting
- **Performance Analysis**: System optimization recommendations

## Quick Start

### Health Check

```bash
# Basic health check
curl http://localhost:3000/api/health

# Detailed system status
curl http://localhost:3000/api/health/detailed

# Database connectivity
curl http://localhost:3000/api/health/database
```

### Monitoring Dashboard

```bash
# Get monitoring dashboard (requires authentication)
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/monitoring/dashboard

# View performance metrics
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/monitoring/metrics
```

### System Logs

```bash
# Recent error logs
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/logging/errors?limit=10

# Log analysis
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/logging/analysis
```

## Configuration

### Environment Variables

```bash
# Monitoring Configuration
MONITORING_ENABLED=true
MONITORING_INTERVAL=60000  # 1 minute
ALERT_THRESHOLDS_MEMORY=85
ALERT_THRESHOLDS_CPU=80
ALERT_THRESHOLDS_DISK=90

# Logging Configuration
LOG_LEVEL=info
LOG_RETENTION_DAYS=30
LOG_MAX_FILES=100

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE_DB="0 2 * * *"    # Daily at 2 AM
BACKUP_SCHEDULE_FILES="0 3 * * *" # Daily at 3 AM
BACKUP_RETENTION_DAYS=30

# Maintenance Configuration
MAINTENANCE_ENABLED=true
MAINTENANCE_WEEKLY="0 1 * * 0"    # Sunday at 1 AM
MAINTENANCE_MONTHLY="0 2 1 * *"   # 1st day at 2 AM
```

### Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|---------|
| Memory Usage | 70% | 85% | Scale up or optimize |
| CPU Usage | 70% | 85% | Investigate load |
| Disk Space | 80% | 90% | Clean up or expand |
| Response Time | 2000ms | 5000ms | Optimize queries |
| Error Rate | 5% | 10% | Check logs |
| DB Connections | 30 | 50 | Review pool config |

## Automated Schedules

### Daily (6:00 AM)
- System health checks
- Log rotation and cleanup
- Temporary file removal
- Basic performance analysis

### Weekly (Sunday 1:00 AM)
- Database statistics update
- Index maintenance and optimization
- Security vulnerability scan
- Performance trend analysis

### Monthly (1st day 2:00 AM)
- Full database vacuum and optimization
- System update checks
- Comprehensive backup verification
- Detailed performance report generation

## API Endpoints

### Health Endpoints (Public)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Basic health status |
| `/api/health/detailed` | GET | Detailed system health |
| `/api/health/database` | GET | Database health check |
| `/api/health/storage` | GET | Storage system health |
| `/api/health/readiness` | GET | Readiness probe |
| `/api/health/liveness` | GET | Liveness probe |
| `/api/health/metrics` | GET | Performance metrics |

### Monitoring Endpoints (Authenticated)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/monitoring/dashboard` | GET | Monitoring dashboard |
| `/api/monitoring/metrics` | GET | System metrics |
| `/api/monitoring/alerts` | GET | Active alerts |
| `/api/monitoring/alerts/:id/resolve` | POST | Resolve alert |
| `/api/monitoring/system-info` | GET | System information |
| `/api/monitoring/performance-summary` | GET | Performance summary |

### Logging Endpoints (Authenticated)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/logging/recent` | GET | Recent log entries |
| `/api/logging/search` | POST | Search logs |
| `/api/logging/statistics` | GET | Log statistics |
| `/api/logging/analysis` | GET | Log analysis |
| `/api/logging/errors` | GET | Error logs |
| `/api/logging/export` | POST | Export logs |

### Backup Endpoints (Admin Only)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/backup/create` | POST | Create backup |
| `/api/backup/list` | GET | List backups |
| `/api/backup/restore` | POST | Restore backup |
| `/api/backup/statistics` | GET | Backup statistics |
| `/api/backup/test` | GET | Test backup system |

### Maintenance Endpoints (Admin Only)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/maintenance/start` | POST | Start maintenance |
| `/api/maintenance/status` | GET | Maintenance status |
| `/api/maintenance/history` | GET | Maintenance history |
| `/api/maintenance/health` | GET | System health |
| `/api/maintenance/health-check` | POST | Run health check |

## Testing

### Automated Testing

```bash
# Run monitoring system tests
npm run test:monitoring

# Run health checks
npm run health:check

# Generate test report
npm run test:report
```

### Manual Testing

```bash
# Test all health endpoints
node scripts/test-monitoring.js

# Test with authentication
TEST_AUTH_TOKEN="your-token" node scripts/test-monitoring.js

# Test specific environment
TEST_BASE_URL="https://api.example.com" node scripts/test-monitoring.js
```

## Troubleshooting

### Common Issues

#### High Memory Usage
```bash
# Check memory metrics
curl http://localhost:3000/api/health/metrics

# View memory alerts
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/api/monitoring/alerts?severity=high
```

#### Database Connection Issues
```bash
# Check database health
curl http://localhost:3000/api/health/database

# View connection pool status
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/api/monitoring/system-info
```

#### Performance Degradation
```bash
# Get performance summary
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/api/monitoring/performance-summary

# Check for slow queries in logs
curl -H "Authorization: Bearer TOKEN" \
     -X POST http://localhost:3000/api/logging/search \
     -d '{"message": "slow query", "limit": 10}'
```

### Log Analysis

```bash
# Check error patterns
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/api/logging/analysis

# Export logs for analysis
curl -H "Authorization: Bearer TOKEN" \
     -X POST http://localhost:3000/api/logging/export \
     -d '{"startDate": "2024-01-01", "endDate": "2024-01-31", "format": "json"}'
```

## Integration

### Docker Health Checks

```dockerfile
# Dockerfile health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1
```

### Kubernetes Probes

```yaml
# Kubernetes deployment
spec:
  containers:
  - name: qcser-backend
    livenessProbe:
      httpGet:
        path: /api/health/liveness
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
    readinessProbe:
      httpGet:
        path: /api/health/readiness
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
```

### Monitoring Integration

```bash
# Prometheus metrics endpoint (if implemented)
curl http://localhost:3000/metrics

# Grafana dashboard data
curl -H "Authorization: Bearer TOKEN" \
     http://localhost:3000/api/monitoring/dashboard
```

## Security

### Authentication

All monitoring endpoints (except health checks) require JWT authentication:

```bash
# Get auth token
curl -X POST http://localhost:3000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "admin@example.com", "password": "password"}'

# Use token in requests
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/monitoring/dashboard
```

### Role-Based Access

- **Public**: Health check endpoints
- **JEFE_CALIDAD**: Monitoring and logging (read-only)
- **GERENTE_GENERAL**: All monitoring and reporting
- **ADMINISTRADOR**: Full access including maintenance and backups

### Security Monitoring

The system monitors for:
- Failed authentication attempts
- Unauthorized access attempts
- Suspicious file upload activity
- Rate limit violations
- SQL injection attempts

## Performance Optimization

### Database Optimization

```sql
-- Check slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY mean_time DESC;

-- Update statistics
ANALYZE;

-- Vacuum database
VACUUM ANALYZE;
```

### Application Optimization

- Monitor heap usage and garbage collection
- Implement caching for frequently accessed data
- Use connection pooling for database connections
- Optimize file I/O operations
- Implement proper error handling

## Best Practices

### Monitoring

1. **Regular Health Checks**: Monitor system health continuously
2. **Alert Thresholds**: Set appropriate thresholds for your environment
3. **Trend Analysis**: Review performance trends regularly
4. **Capacity Planning**: Monitor resource usage for scaling decisions

### Maintenance

1. **Scheduled Maintenance**: Use maintenance windows for intensive operations
2. **Backup Verification**: Regularly test backup restoration procedures
3. **Security Updates**: Keep dependencies and system components updated
4. **Documentation**: Maintain up-to-date operational documentation

### Logging

1. **Log Levels**: Use appropriate log levels for different environments
2. **Structured Logging**: Use consistent log formats for analysis
3. **Log Retention**: Balance storage costs with audit requirements
4. **Security**: Avoid logging sensitive information

## Support

For issues or questions about the monitoring system:

1. Check the [Production Support Documentation](./production-support.md)
2. Review system logs and metrics
3. Run diagnostic tests
4. Contact the development team

---

**Last Updated**: January 2024  
**Version**: 1.0  
**Next Review**: March 2024