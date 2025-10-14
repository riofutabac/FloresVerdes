#!/bin/bash

# QCSER Backend Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_DIR}/.env.production"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.prod.yml"
BACKUP_DIR="${PROJECT_DIR}/backups"
LOG_FILE="${PROJECT_DIR}/logs/deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
    mkdir -p "${PROJECT_DIR}/nginx/ssl"
    mkdir -p "${PROJECT_DIR}/uploads"
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if environment file exists
    if [ ! -f "$ENV_FILE" ]; then
        error "Environment file not found: $ENV_FILE"
    fi
    
    # Check if compose file exists
    if [ ! -f "$COMPOSE_FILE" ]; then
        error "Docker Compose file not found: $COMPOSE_FILE"
    fi
    
    success "Prerequisites check passed"
}

# Load environment variables
load_environment() {
    log "Loading environment variables..."
    if [ -f "$ENV_FILE" ]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
        success "Environment variables loaded"
    else
        error "Environment file not found: $ENV_FILE"
    fi
}

# Create backup before deployment
create_backup() {
    log "Creating backup before deployment..."
    
    BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/backup_${BACKUP_TIMESTAMP}.sql"
    
    if docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        log "Creating database backup..."
        docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
            -U "$DATABASE_USERNAME" \
            -d "$DATABASE_NAME" \
            --no-owner --no-privileges > "$BACKUP_FILE"
        
        if [ -f "$BACKUP_FILE" ]; then
            success "Database backup created: $BACKUP_FILE"
        else
            error "Failed to create database backup"
        fi
    else
        warning "PostgreSQL container is not running, skipping database backup"
    fi
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    
    # Wait for database to be ready
    log "Waiting for database to be ready..."
    sleep 10
    
    # Run migrations
    for migration_file in "${PROJECT_DIR}/migrations"/*.sql; do
        if [ -f "$migration_file" ]; then
            log "Running migration: $(basename "$migration_file")"
            docker-compose -f "$COMPOSE_FILE" exec -T postgres psql \
                -U "$DATABASE_USERNAME" \
                -d "$DATABASE_NAME" \
                -f "/docker-entrypoint-initdb.d/$(basename "$migration_file")" || true
        fi
    done
    
    success "Database migrations completed"
}

# Build and deploy application
deploy_application() {
    log "Building and deploying application..."
    
    # Pull latest images
    log "Pulling latest images..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Build application
    log "Building application..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache app
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose -f "$COMPOSE_FILE" down
    
    # Start new containers
    log "Starting new containers..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    success "Application deployed successfully"
}

# Health check
health_check() {
    log "Performing health check..."
    
    # Wait for application to start
    sleep 30
    
    # Check if containers are running
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        error "Some containers are not running"
    fi
    
    # Check application health endpoint
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log "Health check attempt $attempt/$max_attempts..."
        
        if curl -f -s "http://localhost:${PORT:-3000}/api/health" > /dev/null; then
            success "Application is healthy"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    error "Application health check failed after $max_attempts attempts"
}

# Cleanup old backups
cleanup_backups() {
    log "Cleaning up old backups..."
    
    # Keep only last 30 days of backups
    find "$BACKUP_DIR" -name "backup_*.sql" -mtime +30 -delete
    
    success "Old backups cleaned up"
}

# Main deployment function
main() {
    log "Starting QCSER Backend deployment..."
    
    create_directories
    check_prerequisites
    load_environment
    create_backup
    deploy_application
    run_migrations
    health_check
    cleanup_backups
    
    success "QCSER Backend deployment completed successfully!"
    log "Application is running at: http://localhost:${PORT:-3000}"
    log "API Documentation: http://localhost:${PORT:-3000}/api/docs"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "backup")
        create_directories
        check_prerequisites
        load_environment
        create_backup
        ;;
    "health")
        health_check
        ;;
    "logs")
        docker-compose -f "$COMPOSE_FILE" logs -f "${2:-app}"
        ;;
    "stop")
        log "Stopping QCSER Backend..."
        docker-compose -f "$COMPOSE_FILE" down
        success "QCSER Backend stopped"
        ;;
    "restart")
        log "Restarting QCSER Backend..."
        docker-compose -f "$COMPOSE_FILE" restart
        health_check
        success "QCSER Backend restarted"
        ;;
    *)
        echo "Usage: $0 {deploy|backup|health|logs|stop|restart}"
        echo "  deploy  - Full deployment (default)"
        echo "  backup  - Create database backup only"
        echo "  health  - Check application health"
        echo "  logs    - Show application logs"
        echo "  stop    - Stop all services"
        echo "  restart - Restart all services"
        exit 1
        ;;
esac