# QCSER Backend Deployment Script for Windows
# This script handles the complete deployment process

param(
    [Parameter(Position=0)]
    [ValidateSet("deploy", "backup", "health", "logs", "stop", "restart")]
    [string]$Action = "deploy",
    
    [Parameter(Position=1)]
    [string]$Service = "app"
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$EnvFile = Join-Path $ProjectDir ".env.production"
$ComposeFile = Join-Path $ProjectDir "docker-compose.prod.yml"
$BackupDir = Join-Path $ProjectDir "backups"
$LogDir = Join-Path $ProjectDir "logs"
$LogFile = Join-Path $LogDir "deploy.log"

# Colors for output
$Colors = @{
    Red = "Red"
    Green = "Green"
    Yellow = "Yellow"
    Blue = "Blue"
    White = "White"
}

# Logging functions
function Write-Log {
    param([string]$Message, [string]$Color = "White")
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] $Message"
    Write-Host $LogMessage -ForegroundColor $Colors[$Color]
    Add-Content -Path $LogFile -Value $LogMessage -ErrorAction SilentlyContinue
}

function Write-Error-Log {
    param([string]$Message)
    Write-Log "ERROR: $Message" "Red"
    exit 1
}

function Write-Success {
    param([string]$Message)
    Write-Log "SUCCESS: $Message" "Green"
}

function Write-Warning-Log {
    param([string]$Message)
    Write-Log "WARNING: $Message" "Yellow"
}

# Create necessary directories
function New-Directories {
    Write-Log "Creating necessary directories..." "Blue"
    
    @($BackupDir, $LogDir, (Join-Path $ProjectDir "nginx\ssl"), (Join-Path $ProjectDir "uploads")) | ForEach-Object {
        if (!(Test-Path $_)) {
            New-Item -ItemType Directory -Path $_ -Force | Out-Null
        }
    }
}

# Check prerequisites
function Test-Prerequisites {
    Write-Log "Checking prerequisites..." "Blue"
    
    # Check if Docker is installed
    try {
        docker --version | Out-Null
    } catch {
        Write-Error-Log "Docker is not installed. Please install Docker Desktop first."
    }
    
    # Check if Docker Compose is available
    try {
        docker-compose --version | Out-Null
    } catch {
        Write-Error-Log "Docker Compose is not available. Please ensure Docker Desktop is properly installed."
    }
    
    # Check if environment file exists
    if (!(Test-Path $EnvFile)) {
        Write-Error-Log "Environment file not found: $EnvFile"
    }
    
    # Check if compose file exists
    if (!(Test-Path $ComposeFile)) {
        Write-Error-Log "Docker Compose file not found: $ComposeFile"
    }
    
    Write-Success "Prerequisites check passed"
}

# Load environment variables
function Import-Environment {
    Write-Log "Loading environment variables..." "Blue"
    
    if (Test-Path $EnvFile) {
        Get-Content $EnvFile | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
        Write-Success "Environment variables loaded"
    } else {
        Write-Error-Log "Environment file not found: $EnvFile"
    }
}

# Create backup before deployment
function New-Backup {
    Write-Log "Creating backup before deployment..." "Blue"
    
    $BackupTimestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupFile = Join-Path $BackupDir "backup_$BackupTimestamp.sql"
    
    try {
        $ContainerStatus = docker-compose -f $ComposeFile ps postgres 2>$null
        if ($ContainerStatus -match "Up") {
            Write-Log "Creating database backup..." "Blue"
            
            $DatabaseUsername = [Environment]::GetEnvironmentVariable("DATABASE_USERNAME")
            $DatabaseName = [Environment]::GetEnvironmentVariable("DATABASE_NAME")
            
            docker-compose -f $ComposeFile exec -T postgres pg_dump -U $DatabaseUsername -d $DatabaseName --no-owner --no-privileges | Out-File -FilePath $BackupFile -Encoding UTF8
            
            if (Test-Path $BackupFile) {
                Write-Success "Database backup created: $BackupFile"
            } else {
                Write-Error-Log "Failed to create database backup"
            }
        } else {
            Write-Warning-Log "PostgreSQL container is not running, skipping database backup"
        }
    } catch {
        Write-Warning-Log "Could not check PostgreSQL container status, skipping backup"
    }
}

# Run database migrations
function Invoke-Migrations {
    Write-Log "Running database migrations..." "Blue"
    
    # Wait for database to be ready
    Write-Log "Waiting for database to be ready..." "Blue"
    Start-Sleep -Seconds 10
    
    # Run migrations
    $MigrationFiles = Get-ChildItem -Path (Join-Path $ProjectDir "migrations") -Filter "*.sql" -ErrorAction SilentlyContinue
    
    foreach ($MigrationFile in $MigrationFiles) {
        Write-Log "Running migration: $($MigrationFile.Name)" "Blue"
        
        $DatabaseUsername = [Environment]::GetEnvironmentVariable("DATABASE_USERNAME")
        $DatabaseName = [Environment]::GetEnvironmentVariable("DATABASE_NAME")
        
        try {
            Get-Content $MigrationFile.FullName | docker-compose -f $ComposeFile exec -T postgres psql -U $DatabaseUsername -d $DatabaseName
        } catch {
            Write-Warning-Log "Migration $($MigrationFile.Name) may have failed, continuing..."
        }
    }
    
    Write-Success "Database migrations completed"
}

# Build and deploy application
function Deploy-Application {
    Write-Log "Building and deploying application..." "Blue"
    
    # Pull latest images
    Write-Log "Pulling latest images..." "Blue"
    docker-compose -f $ComposeFile pull
    
    # Build application
    Write-Log "Building application..." "Blue"
    docker-compose -f $ComposeFile build --no-cache app
    
    # Stop existing containers
    Write-Log "Stopping existing containers..." "Blue"
    docker-compose -f $ComposeFile down
    
    # Start new containers
    Write-Log "Starting new containers..." "Blue"
    docker-compose -f $ComposeFile up -d
    
    Write-Success "Application deployed successfully"
}

# Health check
function Test-Health {
    Write-Log "Performing health check..." "Blue"
    
    # Wait for application to start
    Start-Sleep -Seconds 30
    
    # Check if containers are running
    $ContainerStatus = docker-compose -f $ComposeFile ps
    if (!($ContainerStatus -match "Up")) {
        Write-Error-Log "Some containers are not running"
    }
    
    # Check application health endpoint
    $MaxAttempts = 10
    $Port = [Environment]::GetEnvironmentVariable("PORT")
    if (!$Port) { $Port = "3000" }
    
    for ($Attempt = 1; $Attempt -le $MaxAttempts; $Attempt++) {
        Write-Log "Health check attempt $Attempt/$MaxAttempts..." "Blue"
        
        try {
            $Response = Invoke-WebRequest -Uri "http://localhost:$Port/api/health" -TimeoutSec 10 -ErrorAction Stop
            if ($Response.StatusCode -eq 200) {
                Write-Success "Application is healthy"
                return
            }
        } catch {
            # Continue to next attempt
        }
        
        Start-Sleep -Seconds 10
    }
    
    Write-Error-Log "Application health check failed after $MaxAttempts attempts"
}

# Cleanup old backups
function Remove-OldBackups {
    Write-Log "Cleaning up old backups..." "Blue"
    
    # Keep only last 30 days of backups
    $CutoffDate = (Get-Date).AddDays(-30)
    Get-ChildItem -Path $BackupDir -Filter "backup_*.sql" | Where-Object { $_.LastWriteTime -lt $CutoffDate } | Remove-Item -Force
    
    Write-Success "Old backups cleaned up"
}

# Main deployment function
function Start-Deployment {
    Write-Log "Starting QCSER Backend deployment..." "Blue"
    
    New-Directories
    Test-Prerequisites
    Import-Environment
    New-Backup
    Deploy-Application
    Invoke-Migrations
    Test-Health
    Remove-OldBackups
    
    $Port = [Environment]::GetEnvironmentVariable("PORT")
    if (!$Port) { $Port = "3000" }
    
    Write-Success "QCSER Backend deployment completed successfully!"
    Write-Log "Application is running at: http://localhost:$Port" "Green"
    Write-Log "API Documentation: http://localhost:$Port/api/docs" "Green"
}

# Handle script actions
switch ($Action) {
    "deploy" {
        Start-Deployment
    }
    "backup" {
        New-Directories
        Test-Prerequisites
        Import-Environment
        New-Backup
    }
    "health" {
        Import-Environment
        Test-Health
    }
    "logs" {
        docker-compose -f $ComposeFile logs -f $Service
    }
    "stop" {
        Write-Log "Stopping QCSER Backend..." "Blue"
        docker-compose -f $ComposeFile down
        Write-Success "QCSER Backend stopped"
    }
    "restart" {
        Write-Log "Restarting QCSER Backend..." "Blue"
        docker-compose -f $ComposeFile restart
        Import-Environment
        Test-Health
        Write-Success "QCSER Backend restarted"
    }
    default {
        Write-Host "Usage: .\deploy.ps1 {deploy|backup|health|logs|stop|restart}" -ForegroundColor Yellow
        Write-Host "  deploy  - Full deployment (default)" -ForegroundColor White
        Write-Host "  backup  - Create database backup only" -ForegroundColor White
        Write-Host "  health  - Check application health" -ForegroundColor White
        Write-Host "  logs    - Show application logs" -ForegroundColor White
        Write-Host "  stop    - Stop all services" -ForegroundColor White
        Write-Host "  restart - Restart all services" -ForegroundColor White
        exit 1
    }
}