-- QCSER Backend Initial Schema Migration
-- Version: 001
-- Description: Create initial database schema for QCSER system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Set timezone
SET timezone = 'America/Guayaquil';

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('ADMINISTRADOR', 'JEFE_CALIDAD', 'GERENTE_GENERAL');
CREATE TYPE operator_status AS ENUM ('ACTIVO', 'INACTIVO', 'TERMINADO');
CREATE TYPE evaluation_status AS ENUM ('BORRADOR', 'COMPLETADA', 'CERRADA');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Areas table
CREATE TABLE areas (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Modules table
CREATE TABLE modules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    description TEXT,
    area_id INTEGER REFERENCES areas(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subprocesses table
CREATE TABLE subprocesses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(10) NOT NULL,
    module_id INTEGER REFERENCES modules(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(code, module_id)
);

-- Rose varieties table
CREATE TABLE rose_varieties (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Supervisors table
CREATE TABLE supervisors (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    area_id INTEGER REFERENCES areas(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Operators table
CREATE TABLE operators (
    id SERIAL PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    hire_date DATE NOT NULL,
    has_disability BOOLEAN DEFAULT false,
    disability_description TEXT,
    module_id INTEGER REFERENCES modules(id),
    area_id INTEGER REFERENCES areas(id),
    quadrant_code VARCHAR(20) NOT NULL,
    rose_variety_id INTEGER REFERENCES rose_varieties(id),
    status operator_status DEFAULT 'ACTIVO',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Evaluation parameters table
CREATE TABLE evaluation_parameters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    subprocess_id INTEGER REFERENCES subprocesses(id),
    weight DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN DEFAULT true,
    version INTEGER DEFAULT 1,
    effective_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Evaluations table
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    operator_id INTEGER REFERENCES operators(id),
    evaluator_id UUID REFERENCES users(id),
    area_id INTEGER REFERENCES areas(id),
    module_id INTEGER REFERENCES modules(id),
    quadrant_code VARCHAR(20) NOT NULL,
    evaluation_date DATE NOT NULL,
    evaluation_time TIME NOT NULL,
    compliance_percentage DECIMAL(5,2) DEFAULT 0.00,
    final_score DECIMAL(4,2) DEFAULT 0.00,
    general_observations TEXT,
    status evaluation_status DEFAULT 'BORRADOR',
    is_synced BOOLEAN DEFAULT false,
    local_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(operator_id, quadrant_code, evaluation_date)
);

-- Evaluation details table
CREATE TABLE evaluation_details (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER REFERENCES evaluations(id) ON DELETE CASCADE,
    parameter_id INTEGER REFERENCES evaluation_parameters(id),
    is_compliant BOOLEAN NOT NULL,
    deduction_points DECIMAL(4,2) DEFAULT 0.00,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Evaluation photos table
CREATE TABLE evaluation_photos (
    id SERIAL PRIMARY KEY,
    evaluation_id INTEGER REFERENCES evaluations(id) ON DELETE CASCADE,
    subprocess_id INTEGER REFERENCES subprocesses(id),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    is_synced BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sync logs table
CREATE TABLE sync_logs (
    id SERIAL PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    local_id UUID,
    data JSONB,
    status VARCHAR(20) DEFAULT 'PENDING',
    attempts INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_operators_employee_id ON operators(employee_id);
CREATE INDEX idx_operators_status ON operators(status);
CREATE INDEX idx_operators_area_module ON operators(area_id, module_id);
CREATE INDEX idx_evaluations_operator_date ON evaluations(operator_id, evaluation_date);
CREATE INDEX idx_evaluations_date_range ON evaluations(evaluation_date);
CREATE INDEX idx_evaluations_status ON evaluations(status);
CREATE INDEX idx_evaluation_details_evaluation ON evaluation_details(evaluation_id);
CREATE INDEX idx_evaluation_photos_evaluation ON evaluation_photos(evaluation_id);
CREATE INDEX idx_sync_logs_status ON sync_logs(status);
CREATE INDEX idx_sync_logs_entity ON sync_logs(entity_type, entity_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_areas_updated_at BEFORE UPDATE ON areas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_modules_updated_at BEFORE UPDATE ON modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subprocesses_updated_at BEFORE UPDATE ON subprocesses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rose_varieties_updated_at BEFORE UPDATE ON rose_varieties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_supervisors_updated_at BEFORE UPDATE ON supervisors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_operators_updated_at BEFORE UPDATE ON operators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluation_parameters_updated_at BEFORE UPDATE ON evaluation_parameters FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluations_updated_at BEFORE UPDATE ON evaluations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluation_details_updated_at BEFORE UPDATE ON evaluation_details FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_evaluation_photos_updated_at BEFORE UPDATE ON evaluation_photos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sync_logs_updated_at BEFORE UPDATE ON sync_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();