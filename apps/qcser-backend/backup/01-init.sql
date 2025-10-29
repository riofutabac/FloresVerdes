-- Initialize QCSER Database
-- This script runs when the PostgreSQL container starts for the first time

-- Create extensions if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'America/Guayaquil';

-- Create initial database structure will be handled by TypeORM migrations