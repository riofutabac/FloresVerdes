# QCSER Backend Backup and Recovery Script for Windows
# This script handles database backups and recovery operations

param(
    [Parameter(Position=0)]
    [ValidateSet("create", "full", "restore", "list", "cleanup", "verify", "help")]
    [string]$Action = "help",
    
    [Parameter(Position=1)]
    [string]$Parameter
)

# Configuration
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectDir = Split-Path -Parent $ScriptDir
$EnvFile = Join-Path $ProjectDir ".env.production"
$ComposeFile = Join-Path $ProjectDir "docker-compose.prod.yml"
$BackupDir = Join-Path $ProjectDir "backups"
$LogDir = Join-Path $ProjectDir "logs"
$LogFile = Join-Path $LogDir "backup.log"

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

# Load environment variables
function Import-Environment {
    if (Test-Path $EnvFile) {
        Get-Content $EnvFile | ForEach-Object {
            if ($_ -match '^([^#][^=]+)=(.*)$') {
                [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
            }
        }
    }
}

# Create backup directories
function New-BackupDirectories {
    @($BackupDir, $LogDir) | ForEach-Object {
        if (!(Test-Path $_)) {
            New-Item -ItemType Directory -Path $_ -Force | Out-Null
        }
    }
}

# Create database backup
function New-DatabaseBackup {
    Write-Log "Creating database backup..." "Blue"
    
    $BackupTimestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $BackupFile = Join-Path $BackupDir "db_backup_$BackupTimestamp.sql"
    $BackupCompressed = "$BackupFile.gz"
    
    # Check if PostgreSQL container is running
    try {
        $ContainerStatus = docker-compose -f $ComposeFile ps postgres 2>$null
        if (!($ContainerStatus -match "Up")) {
            Write-Error-Log "PostgreSQL container is not running"
        }
    } catch {
        Write-Error-Log "Could not check PostgreSQL container status"
    }
    
    # Get environment variables
    $DatabaseUsername = [Environment]::GetEnvironmentVariable("DATABASE_USERNAME")
    $DatabaseName = [Environment]::GetEnvironmentVariable("DATABASE_NAME")
    
    # Create backup
    Write-Log "Backing up database to: $BackupFile" "Blue"
    try {
        docker-compose -f $ComposeFile exec -T postgres pg_dump -U $DatabaseUsername -d $DatabaseName --no-owner --no-privileges --verbose | Out-File -FilePath $BackupFile -Encoding UTF8
        
        if (!(Test-Path $BackupFile)) {
            Write-Error-Log "Failed to create database backup"
        }
        
        # Compress backup using 7-Zip if available, otherwise use PowerShell compression
        Write-Log "Compressing backup..." "Blue"
        if (Get-Command 7z -ErrorAction SilentlyContinue) {
            7z a "$BackupFile.7z" $BackupFile
            Remove-Item $BackupFile
            $BackupCompressed = "$BackupFile.7z"
        } else {
            Compress-Archive -Path $BackupFile -DestinationPath "$BackupFile.zip"
            Remove-Item $BackupFile
            $BackupCompressed = "$BackupFile.zip"
        }
        
        if (Test-Path $BackupCompressed) {
            Write-Success "Database backup created and compressed: $BackupCompressed"
            return $BackupCompressed
        } else {
            Write-Error-Log "Failed to compress backup"
        }
    } catch {
        Write-Error-Log "Failed to create database backup: $($_.Exception.Message)"
    }
}

# Create full system backup
function New-FullBackup {
    Write-Log "Creating full system backup..." "Blue"
    
    $BackupTimestamp = Get-Date -Format "yyyyMMdd_HHmmss"
    $FullBackupDir = Join-Path $BackupDir "full_backup_$BackupTimestamp"
    
    New-Item -ItemType Directory -Path $FullBackupDir -Force | Out-Null
    
    # Database backup
    $DbBackup = New-DatabaseBackup
    Copy-Item $DbBackup $FullBackupDir
    
    # Application files backup
    Write-Log "Backing up application files..." "Blue"
    $AppFilesBackup = Join-Path $FullBackupDir "app_files.zip"
    $ExcludePaths = @("node_modules", "dist", "logs", "backups")
    
    $FilesToBackup = Get-ChildItem -Path $ProjectDir -Recurse | Where-Object {
        $relativePath = $_.FullName.Substring($ProjectDir.Length + 1)
        $shouldExclude = $false
        foreach ($exclude in $ExcludePaths) {
            if ($relativePath.StartsWith($exclude)) {
                $shouldExclude = $true
                break
            }
        }
        !$shouldExclude
    }
    
    Compress-Archive -Path $FilesToBackup.FullName -DestinationPath $AppFilesBackup
    
    # Uploads backup
    $UploadsDir = Join-Path $ProjectDir "uploads"
    if (Test-Path $UploadsDir) {
        Write-Log "Backing up uploaded files..." "Blue"
        $UploadsBackup = Join-Path $FullBackupDir "uploads.zip"
        Compress-Archive -Path $UploadsDir -DestinationPath $UploadsBackup
    }
    
    # Configuration backup
    Write-Log "Backing up configuration files..." "Blue"
    if (Test-Path $EnvFile) {
        Copy-Item $EnvFile $FullBackupDir
    }
    if (Test-Path $ComposeFile) {
        Copy-Item $ComposeFile $FullBackupDir
    }
    
    # Create backup manifest
    $ManifestContent = @"
QCSER Backend Full Backup
Created: $(Get-Date)
Database: $(Split-Path $DbBackup -Leaf)
Application Files: app_files.zip
Uploads: uploads.zip
Configuration: $(Split-Path $EnvFile -Leaf), $(Split-Path $ComposeFile -Leaf)
"@
    
    $ManifestFile = Join-Path $FullBackupDir "manifest.txt"
    Set-Content -Path $ManifestFile -Value $ManifestContent
    
    Write-Success "Full system backup created: $FullBackupDir"
}

# Restore database from backup
function Restore-Database {
    param([string]$BackupFile)
    
    if (!$BackupFile) {
        Write-Error-Log "Backup file not specified"
    }
    
    if (!(Test-Path $BackupFile)) {
        Write-Error-Log "Backup file not found: $BackupFile"
    }
    
    Write-Log "Restoring database from: $BackupFile" "Blue"
    
    # Check if PostgreSQL container is running
    try {
        $ContainerStatus = docker-compose -f $ComposeFile ps postgres 2>$null
        if (!($ContainerStatus -match "Up")) {
            Write-Error-Log "PostgreSQL container is not running"
        }
    } catch {
        Write-Error-Log "Could not check PostgreSQL container status"
    }
    
    # Confirm restoration
    $Confirmation = Read-Host "This will overwrite the current database. Are you sure? (y/N)"
    if ($Confirmation -ne "y" -and $Confirmation -ne "Y") {
        Write-Log "Database restoration cancelled" "Yellow"
        return
    }
    
    # Get environment variables
    $DatabaseUsername = [Environment]::GetEnvironmentVariable("DATABASE_USERNAME")
    $DatabaseName = [Environment]::GetEnvironmentVariable("DATABASE_NAME")
    
    # Extract backup if compressed
    $SqlFile = $BackupFile
    if ($BackupFile.EndsWith(".zip") -or $BackupFile.EndsWith(".7z")) {
        Write-Log "Extracting compressed backup..." "Blue"
        $TempDir = Join-Path $env:TEMP "qcser_restore_$(Get-Date -Format 'yyyyMMddHHmmss')"
        New-Item -ItemType Directory -Path $TempDir -Force | Out-Null
        
        if ($BackupFile.EndsWith(".zip")) {
            Expand-Archive -Path $BackupFile -DestinationPath $TempDir
        } elseif ($BackupFile.EndsWith(".7z") -and (Get-Command 7z -ErrorAction SilentlyContinue)) {
            7z x $BackupFile -o$TempDir
        }
        
        $SqlFile = Get-ChildItem -Path $TempDir -Filter "*.sql" | Select-Object -First 1 -ExpandProperty FullName
        if (!$SqlFile) {
            Write-Error-Log "No SQL file found in backup archive"
        }
    }
    
    try {
        # Drop existing connections
        Write-Log "Dropping existing database connections..." "Blue"
        $DropConnectionsQuery = "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DatabaseName' AND pid <> pg_backend_pid();"
        echo $DropConnectionsQuery | docker-compose -f $ComposeFile exec -T postgres psql -U $DatabaseUsername -d postgres
        
        # Drop and recreate database
        Write-Log "Recreating database..." "Blue"
        echo "DROP DATABASE IF EXISTS $DatabaseName;" | docker-compose -f $ComposeFile exec -T postgres psql -U $DatabaseUsername -d postgres
        echo "CREATE DATABASE $DatabaseName;" | docker-compose -f $ComposeFile exec -T postgres psql -U $DatabaseUsername -d postgres
        
        # Restore from backup
        Write-Log "Restoring data..." "Blue"
        Get-Content $SqlFile | docker-compose -f $ComposeFile exec -T postgres psql -U $DatabaseUsername -d $DatabaseName
        
        Write-Success "Database restored successfully"
        
        # Cleanup temporary files
        if ($SqlFile -ne $BackupFile -and (Test-Path $TempDir)) {
            Remove-Item -Path $TempDir -Recurse -Force
        }
    } catch {
        Write-Error-Log "Failed to restore database: $($_.Exception.Message)"
    }
}

# List available backups
function Get-BackupList {
    Write-Log "Available backups:" "Blue"
    
    if (!(Test-Path $BackupDir)) {
        Write-Warning-Log "No backup directory found"
        return
    }
    
    Write-Host "`nDatabase backups:" -ForegroundColor White
    $DbBackups = Get-ChildItem -Path $BackupDir -Filter "db_backup_*" | Sort-Object LastWriteTime -Descending
    if ($DbBackups) {
        $DbBackups | Format-Table Name, Length, LastWriteTime -AutoSize
    } else {
        Write-Host "No database backups found" -ForegroundColor Yellow
    }
    
    Write-Host "`nFull backups:" -ForegroundColor White
    $FullBackups = Get-ChildItem -Path $BackupDir -Filter "full_backup_*" -Directory | Sort-Object LastWriteTime -Descending
    if ($FullBackups) {
        $FullBackups | Format-Table Name, LastWriteTime -AutoSize
    } else {
        Write-Host "No full backups found" -ForegroundColor Yellow
    }
}

# Cleanup old backups
function Remove-OldBackups {
    param([int]$RetentionDays = 30)
    
    Write-Log "Cleaning up backups older than $RetentionDays days..." "Blue"
    
    $CutoffDate = (Get-Date).AddDays(-$RetentionDays)
    
    # Cleanup database backups
    Get-ChildItem -Path $BackupDir -Filter "db_backup_*" | Where-Object { $_.LastWriteTime -lt $CutoffDate } | Remove-Item -Force
    
    # Cleanup full backups
    Get-ChildItem -Path $BackupDir -Filter "full_backup_*" -Directory | Where-Object { $_.LastWriteTime -lt $CutoffDate } | Remove-Item -Recurse -Force
    
    Write-Success "Old backups cleaned up"
}

# Verify backup integrity
function Test-BackupIntegrity {
    param([string]$BackupFile)
    
    if (!$BackupFile) {
        Write-Error-Log "Backup file not specified"
    }
    
    if (!(Test-Path $BackupFile)) {
        Write-Error-Log "Backup file not found: $BackupFile"
    }
    
    Write-Log "Verifying backup integrity: $BackupFile" "Blue"
    
    try {
        # Check if file is compressed
        if ($BackupFile.EndsWith(".zip")) {
            # Test ZIP file
            $TestResult = Test-Path $BackupFile
            if ($TestResult) {
                Write-Success "Compressed backup file is valid"
                
                # Check SQL content
                $TempDir = Join-Path $env:TEMP "qcser_verify_$(Get-Date -Format 'yyyyMMddHHmmss')"
                Expand-Archive -Path $BackupFile -DestinationPath $TempDir
                $SqlFile = Get-ChildItem -Path $TempDir -Filter "*.sql" | Select-Object -First 1
                
                if ($SqlFile) {
                    $FirstLines = Get-Content $SqlFile.FullName -TotalCount 10
                    if ($FirstLines -match "PostgreSQL database dump") {
                        Write-Success "Backup contains valid PostgreSQL dump"
                    } else {
                        Write-Error-Log "Backup does not contain valid PostgreSQL dump"
                    }
                }
                
                Remove-Item -Path $TempDir -Recurse -Force
            } else {
                Write-Error-Log "Compressed backup file is corrupted"
            }
        } else {
            # Check SQL content directly
            $FirstLines = Get-Content $BackupFile -TotalCount 10
            if ($FirstLines -match "PostgreSQL database dump") {
                Write-Success "Backup contains valid PostgreSQL dump"
            } else {
                Write-Error-Log "Backup does not contain valid PostgreSQL dump"
            }
        }
        
        Write-Success "Backup verification completed"
    } catch {
        Write-Error-Log "Backup verification failed: $($_.Exception.Message)"
    }
}

# Main execution
New-BackupDirectories
Import-Environment

switch ($Action) {
    "create" {
        New-DatabaseBackup
    }
    "full" {
        New-FullBackup
    }
    "restore" {
        Restore-Database $Parameter
    }
    "list" {
        Get-BackupList
    }
    "cleanup" {
        $Days = if ($Parameter) { [int]$Parameter } else { 30 }
        Remove-OldBackups $Days
    }
    "verify" {
        Test-BackupIntegrity $Parameter
    }
    "help" {
        Write-Host "Usage: .\backup.ps1 {create|full|restore|list|cleanup|verify}" -ForegroundColor Yellow
        Write-Host "  create           - Create database backup" -ForegroundColor White
        Write-Host "  full             - Create full system backup" -ForegroundColor White
        Write-Host "  restore <file>   - Restore database from backup file" -ForegroundColor White
        Write-Host "  list             - List available backups" -ForegroundColor White
        Write-Host "  cleanup [days]   - Cleanup backups older than specified days (default: 30)" -ForegroundColor White
        Write-Host "  verify <file>    - Verify backup file integrity" -ForegroundColor White
    }
    default {
        Write-Host "Invalid action. Use 'help' for usage information." -ForegroundColor Red
        exit 1
    }
}