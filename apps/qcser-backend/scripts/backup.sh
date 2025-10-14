#!/bin/bash

# QCSER Backend Backup and Recovery Script
# This script handles database backups and recovery operations

set -e  # Exit on any error

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_FILE="${PROJECT_DIR}/.env.production"
COMPOSE_FILE="${PROJECT_DIR}/docker-compose.prod.yml"
BACKUP_DIR="${PROJECT_DIR}/backups"
LOG_FILE="${PROJECT_DIR}/logs/backup.log"

# Load environment variables
if [ -f "$ENV_FILE" ]; then
    export $(grep -v '^#' "$ENV_FILE" | xargs)
fi

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

# Create backup directory
create_backup_dir() {
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$(dirname "$LOG_FILE")"
}

# Create database backup
create_database_backup() {
    log "Creating database backup..."
    
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/db_backup_${backup_timestamp}.sql"
    local backup_compressed="${backup_file}.gz"
    
    # Check if PostgreSQL container is running
    if ! docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        error "PostgreSQL container is not running"
    fi
    
    # Create backup
    log "Backing up database to: $backup_file"
    docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
        -U "$DATABASE_USERNAME" \
        -d "$DATABASE_NAME" \
        --no-owner --no-privileges \
        --verbose > "$backup_file"
    
    if [ ! -f "$backup_file" ]; then
        error "Failed to create database backup"
    fi
    
    # Compress backup
    log "Compressing backup..."
    gzip "$backup_file"
    
    if [ -f "$backup_compressed" ]; then
        success "Database backup created and compressed: $backup_compressed"
        echo "$backup_compressed"
    else
        error "Failed to compress backup"
    fi
}

# Create full system backup
create_full_backup() {
    log "Creating full system backup..."
    
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local full_backup_dir="${BACKUP_DIR}/full_backup_${backup_timestamp}"
    
    mkdir -p "$full_backup_dir"
    
    # Database backup
    local db_backup=$(create_database_backup)
    cp "$db_backup" "$full_backup_dir/"
    
    # Application files backup
    log "Backing up application files..."
    tar -czf "${full_backup_dir}/app_files.tar.gz" \
        --exclude="node_modules" \
        --exclude="dist" \
        --exclude="logs" \
        --exclude="backups" \
        -C "$PROJECT_DIR" .
    
    # Uploads backup
    if [ -d "${PROJECT_DIR}/uploads" ]; then
        log "Backing up uploaded files..."
        tar -czf "${full_backup_dir}/uploads.tar.gz" -C "$PROJECT_DIR" uploads
    fi
    
    # Configuration backup
    log "Backing up configuration files..."
    cp "$ENV_FILE" "${full_backup_dir}/" 2>/dev/null || true
    cp "$COMPOSE_FILE" "${full_backup_dir}/" 2>/dev/null || true
    
    # Create backup manifest
    cat > "${full_backup_dir}/manifest.txt" << EOF
QCSER Backend Full Backup
Created: $(date)
Database: $(basename "$db_backup")
Application Files: app_files.tar.gz
Uploads: uploads.tar.gz
Configuration: $(basename "$ENV_FILE"), $(basename "$COMPOSE_FILE")
EOF
    
    success "Full system backup created: $full_backup_dir"
}

# Restore database from backup
restore_database() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Backup file not specified"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Restoring database from: $backup_file"
    
    # Check if PostgreSQL container is running
    if ! docker-compose -f "$COMPOSE_FILE" ps postgres | grep -q "Up"; then
        error "PostgreSQL container is not running"
    fi
    
    # Confirm restoration
    read -p "This will overwrite the current database. Are you sure? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Database restoration cancelled"
        exit 0
    fi
    
    # Drop existing connections
    log "Dropping existing database connections..."
    docker-compose -f "$COMPOSE_FILE" exec -T postgres psql \
        -U "$DATABASE_USERNAME" \
        -d postgres \
        -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DATABASE_NAME' AND pid <> pg_backend_pid();"
    
    # Drop and recreate database
    log "Recreating database..."
    docker-compose -f "$COMPOSE_FILE" exec -T postgres psql \
        -U "$DATABASE_USERNAME" \
        -d postgres \
        -c "DROP DATABASE IF EXISTS $DATABASE_NAME;"
    
    docker-compose -f "$COMPOSE_FILE" exec -T postgres psql \
        -U "$DATABASE_USERNAME" \
        -d postgres \
        -c "CREATE DATABASE $DATABASE_NAME;"
    
    # Restore from backup
    log "Restoring data..."
    if [[ "$backup_file" == *.gz ]]; then
        zcat "$backup_file" | docker-compose -f "$COMPOSE_FILE" exec -T postgres psql \
            -U "$DATABASE_USERNAME" \
            -d "$DATABASE_NAME"
    else
        cat "$backup_file" | docker-compose -f "$COMPOSE_FILE" exec -T postgres psql \
            -U "$DATABASE_USERNAME" \
            -d "$DATABASE_NAME"
    fi
    
    success "Database restored successfully"
}

# List available backups
list_backups() {
    log "Available backups:"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        warning "No backup directory found"
        return
    fi
    
    echo
    echo "Database backups:"
    ls -la "$BACKUP_DIR"/db_backup_*.sql* 2>/dev/null | awk '{print $9, $5, $6, $7, $8}' || echo "No database backups found"
    
    echo
    echo "Full backups:"
    ls -la "$BACKUP_DIR"/full_backup_* 2>/dev/null | awk '{print $9, $6, $7, $8}' || echo "No full backups found"
}

# Cleanup old backups
cleanup_backups() {
    local retention_days="${1:-30}"
    
    log "Cleaning up backups older than $retention_days days..."
    
    # Cleanup database backups
    find "$BACKUP_DIR" -name "db_backup_*.sql*" -mtime +$retention_days -delete
    
    # Cleanup full backups
    find "$BACKUP_DIR" -name "full_backup_*" -type d -mtime +$retention_days -exec rm -rf {} +
    
    success "Old backups cleaned up"
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    if [ -z "$backup_file" ]; then
        error "Backup file not specified"
    fi
    
    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
    fi
    
    log "Verifying backup integrity: $backup_file"
    
    # Check if file is compressed
    if [[ "$backup_file" == *.gz ]]; then
        if gzip -t "$backup_file"; then
            success "Compressed backup file is valid"
        else
            error "Compressed backup file is corrupted"
        fi
        
        # Check SQL content
        if zcat "$backup_file" | head -n 10 | grep -q "PostgreSQL database dump"; then
            success "Backup contains valid PostgreSQL dump"
        else
            error "Backup does not contain valid PostgreSQL dump"
        fi
    else
        # Check SQL content
        if head -n 10 "$backup_file" | grep -q "PostgreSQL database dump"; then
            success "Backup contains valid PostgreSQL dump"
        else
            error "Backup does not contain valid PostgreSQL dump"
        fi
    fi
    
    success "Backup verification completed"
}

# Main function
main() {
    create_backup_dir
    
    case "${1:-help}" in
        "create")
            create_database_backup
            ;;
        "full")
            create_full_backup
            ;;
        "restore")
            restore_database "$2"
            ;;
        "list")
            list_backups
            ;;
        "cleanup")
            cleanup_backups "$2"
            ;;
        "verify")
            verify_backup "$2"
            ;;
        "help"|*)
            echo "Usage: $0 {create|full|restore|list|cleanup|verify}"
            echo "  create           - Create database backup"
            echo "  full             - Create full system backup"
            echo "  restore <file>   - Restore database from backup file"
            echo "  list             - List available backups"
            echo "  cleanup [days]   - Cleanup backups older than specified days (default: 30)"
            echo "  verify <file>    - Verify backup file integrity"
            exit 1
            ;;
    esac
}

main "$@"