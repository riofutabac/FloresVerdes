# QCSER Backend Deployment Guide

This guide provides comprehensive instructions for deploying the QCSER Backend system in production environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Application Deployment](#application-deployment)
5. [Monitoring Setup](#monitoring-setup)
6. [Backup and Recovery](#backup-and-recovery)
7. [Maintenance](#maintenance)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Linux (Ubuntu 20.04+ recommended) or Windows Server 2019+
- **CPU**: 2+ cores
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 50GB minimum, SSD recommended
- **Network**: Stable internet connection for Supabase integration

### Software Requirements

- **Docker**: Version 20.10+
- **Docker Compose**: Version 2.0+
- **Git**: For version control
- **SSL Certificate**: For HTTPS (Let's Encrypt recommended)

### External Services

- **Supabase Account**: For authentication and storage
- **PostgreSQL**: Managed by Docker or external service
- **Redis**: For caching and session management

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd qcser-backend
```

### 2. Environment Configuration

Copy the production environment template:

```bash
cp .env.example .env.production
```

Configure the following variables in `.env.production`:

```bash
# Database Configuration
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=your_db_user
DATABASE_PASSWORD=your_secure_password
DATABASE_NAME=qcser_production

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT Configuration
JWT_SECRET=your_very_secure_jwt_secret_key_here
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Application Configuration
PORT=3000
NODE_ENV=production
CORS_ORIGIN=https://your-domain.com

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# Security Configuration
RATE_LIMIT_TTL=60
RATE_LIMIT_LIMIT=100
HELMET_ENABLED=true
```

### 3. SSL Certificate Setup

For HTTPS support, place your SSL certificates in the `nginx/ssl/` directory:

```bash
mkdir -p nginx/ssl
# Copy your certificate files
cp your-cert.pem nginx/ssl/cert.pem
cp your-key.pem nginx/ssl/key.pem
```

For Let's Encrypt certificates:

```bash
# Install certbot
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

## Database Setup

### 1. Database Migration

The deployment script automatically runs database migrations. Manual migration can be performed:

```bash
# Linux/macOS
./scripts/deploy.sh

# Windows
.\scripts\deploy.ps1
```

### 2. Initial Data Setup

The system includes seed data for initial setup. To manually run seed data:

```bash
docker-compose -f docker-compose.prod.yml exec postgres psql -U your_db_user -d qcser_production -f /docker-entrypoint-initdb.d/002-seed-data.sql
```

## Application Deployment

### 1. Automated Deployment (Recommended)

Use the deployment script for automated deployment:

```bash
# Linux/macOS
chmod +x scripts/deploy.sh
./scripts/deploy.sh deploy

# Windows PowerShell
.\scripts\deploy.ps1 deploy
```

### 2. Manual Deployment

If you prefer manual deployment:

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Check service status
docker-compose -f docker-compose.prod.yml ps

# View logs
docker-compose -f docker-compose.prod.yml logs -f app
```

### 3. Health Check

Verify the deployment:

```bash
# Check application health
curl -f http://localhost:3000/api/health

# Check API documentation
curl -f http://localhost:3000/api/docs
```

## Monitoring Setup

### 1. Application Monitoring

The system includes built-in health checks and metrics endpoints:

- **Health Check**: `GET /api/health`
- **Metrics**: `GET /api/metrics`
- **System Info**: `GET /api/monitoring/system`

### 2. Log Management

Logs are automatically managed with rotation:

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f app

# View database logs
docker-compose -f docker-compose.prod.yml logs -f postgres

# View all logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. Prometheus and Grafana (Optional)

For advanced monitoring, you can set up Prometheus and Grafana:

```bash
# Add monitoring services to docker-compose
# See monitoring/prometheus.yml for configuration
```

## Backup and Recovery

### 1. Automated Backups

Set up automated daily backups using cron:

```bash
# Add to crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /path/to/qcser-backend/scripts/backup.sh create
```

### 2. Manual Backup

Create manual backups:

```bash
# Linux/macOS
./scripts/backup.sh create          # Database only
./scripts/backup.sh full            # Full system backup

# Windows
.\scripts\backup.ps1 create         # Database only
.\scripts\backup.ps1 full           # Full system backup
```

### 3. Restore from Backup

Restore from a backup file:

```bash
# Linux/macOS
./scripts/backup.sh restore /path/to/backup.sql.gz

# Windows
.\scripts\backup.ps1 restore "C:\path\to\backup.sql.zip"
```

### 4. Backup Verification

Verify backup integrity:

```bash
# Linux/macOS
./scripts/backup.sh verify /path/to/backup.sql.gz

# Windows
.\scripts\backup.ps1 verify "C:\path\to\backup.sql.zip"
```

## Maintenance

### 1. Regular Updates

Update the application:

```bash
# Pull latest changes
git pull origin main

# Redeploy
./scripts/deploy.sh deploy
```

### 2. Database Maintenance

Regular database maintenance tasks:

```bash
# Analyze database statistics
docker-compose -f docker-compose.prod.yml exec postgres psql -U your_db_user -d qcser_production -c "ANALYZE;"

# Vacuum database
docker-compose -f docker-compose.prod.yml exec postgres psql -U your_db_user -d qcser_production -c "VACUUM;"

# Check database size
docker-compose -f docker-compose.prod.yml exec postgres psql -U your_db_user -d qcser_production -c "SELECT pg_size_pretty(pg_database_size('qcser_production'));"
```

### 3. Log Rotation

Logs are automatically rotated by Docker. Manual cleanup:

```bash
# Clean up old logs
docker system prune -f

# Clean up old images
docker image prune -f
```

### 4. SSL Certificate Renewal

For Let's Encrypt certificates:

```bash
# Renew certificates
sudo certbot renew

# Update certificates in nginx
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Restart nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start

```bash
# Check container logs
docker-compose -f docker-compose.prod.yml logs app

# Check environment variables
docker-compose -f docker-compose.prod.yml exec app env | grep -E "(DATABASE|SUPABASE|JWT)"

# Restart services
docker-compose -f docker-compose.prod.yml restart
```

#### 2. Database Connection Issues

```bash
# Check database container
docker-compose -f docker-compose.prod.yml ps postgres

# Test database connection
docker-compose -f docker-compose.prod.yml exec postgres psql -U your_db_user -d qcser_production -c "SELECT 1;"

# Check database logs
docker-compose -f docker-compose.prod.yml logs postgres
```

#### 3. High Memory Usage

```bash
# Check container resource usage
docker stats

# Restart services to free memory
docker-compose -f docker-compose.prod.yml restart

# Clean up unused resources
docker system prune -f
```

#### 4. SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Test SSL connection
openssl s_client -connect your-domain.com:443

# Check nginx configuration
docker-compose -f docker-compose.prod.yml exec nginx nginx -t
```

### Performance Optimization

#### 1. Database Optimization

```sql
-- Create additional indexes for frequently queried columns
CREATE INDEX CONCURRENTLY idx_evaluations_created_at ON evaluations(created_at);
CREATE INDEX CONCURRENTLY idx_operators_full_name ON operators(full_name);

-- Update table statistics
ANALYZE;
```

#### 2. Application Optimization

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=2048"

# Enable production optimizations
export NODE_ENV=production
```

#### 3. Redis Optimization

```bash
# Check Redis memory usage
docker-compose -f docker-compose.prod.yml exec redis redis-cli info memory

# Configure Redis memory policy
docker-compose -f docker-compose.prod.yml exec redis redis-cli config set maxmemory-policy allkeys-lru
```

### Monitoring and Alerts

#### 1. Set up Health Check Monitoring

```bash
# Create a monitoring script
cat > /usr/local/bin/qcser-health-check.sh << 'EOF'
#!/bin/bash
if ! curl -f -s http://localhost:3000/api/health > /dev/null; then
    echo "QCSER Backend health check failed" | mail -s "QCSER Alert" admin@yourcompany.com
fi
EOF

chmod +x /usr/local/bin/qcser-health-check.sh

# Add to crontab for every 5 minutes
echo "*/5 * * * * /usr/local/bin/qcser-health-check.sh" | crontab -
```

#### 2. Disk Space Monitoring

```bash
# Monitor disk space
df -h

# Set up disk space alert
cat > /usr/local/bin/disk-space-check.sh << 'EOF'
#!/bin/bash
THRESHOLD=90
USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ $USAGE -gt $THRESHOLD ]; then
    echo "Disk usage is ${USAGE}% on $(hostname)" | mail -s "Disk Space Alert" admin@yourcompany.com
fi
EOF
```

## Security Considerations

### 1. Network Security

- Use HTTPS only in production
- Configure firewall to allow only necessary ports
- Use VPN for administrative access

### 2. Application Security

- Regularly update dependencies
- Use strong JWT secrets
- Enable rate limiting
- Implement proper CORS policies

### 3. Database Security

- Use strong database passwords
- Enable SSL for database connections
- Regular security updates
- Backup encryption

### 4. Container Security

- Use non-root users in containers
- Regular base image updates
- Scan images for vulnerabilities
- Limit container resources

## Support and Documentation

- **API Documentation**: Available at `/api/docs` when running
- **Health Check**: Available at `/api/health`
- **System Monitoring**: Available at `/api/monitoring/system`
- **Logs**: Use deployment scripts to view logs
- **Backups**: Use backup scripts for data protection

For additional support, refer to the project documentation or contact the development team.