-- QCSER Backend Seed Data
-- Version: 002
-- Description: Insert initial seed data for QCSER system

-- Insert Areas
INSERT INTO areas (name, code, description) VALUES
('Área 1', 'A1', 'Primera área de producción'),
('Área 2', 'A2', 'Segunda área de producción'),
('Área 3', 'A3', 'Tercera área de producción'),
('Área 4', 'A4', 'Cuarta área de producción');

-- Insert Modules
INSERT INTO modules (name, code, description, area_id) VALUES
('Cosecha', 'COS', 'Módulo de cosecha de flores', 1),
('Post-Cosecha', 'POST', 'Módulo de post-cosecha', 1),
('Cosecha', 'COS', 'Módulo de cosecha de flores', 2),
('Post-Cosecha', 'POST', 'Módulo de post-cosecha', 2),
('Cosecha', 'COS', 'Módulo de cosecha de flores', 3),
('Post-Cosecha', 'POST', 'Módulo de post-cosecha', 3),
('Cosecha', 'COS', 'Módulo de cosecha de flores', 4),
('Post-Cosecha', 'POST', 'Módulo de post-cosecha', 4);

-- Insert Subprocesses for Cosecha (Harvest)
INSERT INTO subprocesses (name, code, module_id) VALUES
('Enmallado', 'ENM', 1),
('Cuadrante', 'CUA', 1),
('Enmallado', 'ENM', 3),
('Cuadrante', 'CUA', 3),
('Enmallado', 'ENM', 5),
('Cuadrante', 'CUA', 5),
('Enmallado', 'ENM', 7),
('Cuadrante', 'CUA', 7);

-- Insert Subprocesses for Post-Cosecha (Post-Harvest)
INSERT INTO subprocesses (name, code, module_id) VALUES
('Recepción', 'REC', 2),
('Clasificación', 'CLA', 2),
('Boncheo', 'BON', 2),
('Fin de Banda', 'FIN', 2),
('Empaque', 'EMP', 2),
('Recepción', 'REC', 4),
('Clasificación', 'CLA', 4),
('Boncheo', 'BON', 4),
('Fin de Banda', 'FIN', 4),
('Empaque', 'EMP', 4),
('Recepción', 'REC', 6),
('Clasificación', 'CLA', 6),
('Boncheo', 'BON', 6),
('Fin de Banda', 'FIN', 6),
('Empaque', 'EMP', 6),
('Recepción', 'REC', 8),
('Clasificación', 'CLA', 8),
('Boncheo', 'BON', 8),
('Fin de Banda', 'FIN', 8),
('Empaque', 'EMP', 8);

-- Insert Rose Varieties
INSERT INTO rose_varieties (name, code, description) VALUES
('Freedom', 'FREE', 'Rosa Freedom - variedad premium'),
('Explorer', 'EXPL', 'Rosa Explorer - variedad estándar'),
('Mondial', 'MOND', 'Rosa Mondial - variedad clásica'),
('Vendela', 'VEND', 'Rosa Vendela - variedad especial'),
('Avalanche', 'AVAL', 'Rosa Avalanche - variedad blanca'),
('Red Naomi', 'RNAM', 'Rosa Red Naomi - variedad roja'),
('Tacazzi', 'TACA', 'Rosa Tacazzi - variedad rosada');

-- Insert Supervisors
INSERT INTO supervisors (full_name, employee_id, area_id) VALUES
('María González', 'SUP001', 1),
('Carlos Rodríguez', 'SUP002', 2),
('Ana Martínez', 'SUP003', 3),
('Luis Fernández', 'SUP004', 4);

-- Insert Evaluation Parameters for Enmallado subprocess
INSERT INTO evaluation_parameters (name, description, subprocess_id, weight) VALUES
-- Enmallado parameters (subprocess_id 1, 3, 5, 7)
('Uso correcto de EPP', 'Verificar uso adecuado de equipos de protección personal', 1, 5.00),
('Técnica de corte', 'Evaluación de la técnica correcta de corte de tallos', 1, 10.00),
('Selección de punto de corte', 'Verificar selección correcta del punto de corte', 1, 8.00),
('Manejo de herramientas', 'Uso adecuado y mantenimiento de herramientas de corte', 1, 7.00),
('Limpieza del área', 'Mantener limpia el área de trabajo', 1, 5.00),

('Uso correcto de EPP', 'Verificar uso adecuado de equipos de protección personal', 3, 5.00),
('Técnica de corte', 'Evaluación de la técnica correcta de corte de tallos', 3, 10.00),
('Selección de punto de corte', 'Verificar selección correcta del punto de corte', 3, 8.00),
('Manejo de herramientas', 'Uso adecuado y mantenimiento de herramientas de corte', 3, 7.00),
('Limpieza del área', 'Mantener limpia el área de trabajo', 3, 5.00),

('Uso correcto de EPP', 'Verificar uso adecuado de equipos de protección personal', 5, 5.00),
('Técnica de corte', 'Evaluación de la técnica correcta de corte de tallos', 5, 10.00),
('Selección de punto de corte', 'Verificar selección correcta del punto de corte', 5, 8.00),
('Manejo de herramientas', 'Uso adecuado y mantenimiento de herramientas de corte', 5, 7.00),
('Limpieza del área', 'Mantener limpia el área de trabajo', 5, 5.00),

('Uso correcto de EPP', 'Verificar uso adecuado de equipos de protección personal', 7, 5.00),
('Técnica de corte', 'Evaluación de la técnica correcta de corte de tallos', 7, 10.00),
('Selección de punto de corte', 'Verificar selección correcta del punto de corte', 7, 8.00),
('Manejo de herramientas', 'Uso adecuado y mantenimiento de herramientas de corte', 7, 7.00),
('Limpieza del área', 'Mantener limpia el área de trabajo', 7, 5.00);

-- Insert Evaluation Parameters for Cuadrante subprocess
INSERT INTO evaluation_parameters (name, description, subprocess_id, weight) VALUES
-- Cuadrante parameters (subprocess_id 2, 4, 6, 8)
('Organización del cuadrante', 'Verificar organización adecuada del área de trabajo', 2, 8.00),
('Calidad de selección', 'Evaluación de la calidad en selección de flores', 2, 12.00),
('Productividad', 'Cumplimiento de metas de productividad', 2, 10.00),
('Cuidado de las plantas', 'Manejo cuidadoso de las plantas durante la cosecha', 2, 8.00),
('Seguimiento de procedimientos', 'Adherencia a procedimientos establecidos', 2, 7.00),

('Organización del cuadrante', 'Verificar organización adecuada del área de trabajo', 4, 8.00),
('Calidad de selección', 'Evaluación de la calidad en selección de flores', 4, 12.00),
('Productividad', 'Cumplimiento de metas de productividad', 4, 10.00),
('Cuidado de las plantas', 'Manejo cuidadoso de las plantas durante la cosecha', 4, 8.00),
('Seguimiento de procedimientos', 'Adherencia a procedimientos establecidos', 4, 7.00),

('Organización del cuadrante', 'Verificar organización adecuada del área de trabajo', 6, 8.00),
('Calidad de selección', 'Evaluación de la calidad en selección de flores', 6, 12.00),
('Productividad', 'Cumplimiento de metas de productividad', 6, 10.00),
('Cuidado de las plantas', 'Manejo cuidadoso de las plantas durante la cosecha', 6, 8.00),
('Seguimiento de procedimientos', 'Adherencia a procedimientos establecidos', 6, 7.00),

('Organización del cuadrante', 'Verificar organización adecuada del área de trabajo', 8, 8.00),
('Calidad de selección', 'Evaluación de la calidad en selección de flores', 8, 12.00),
('Productividad', 'Cumplimiento de metas de productividad', 8, 10.00),
('Cuidado de las plantas', 'Manejo cuidadoso de las plantas durante la cosecha', 8, 8.00),
('Seguimiento de procedimientos', 'Adherencia a procedimientos establecidos', 8, 7.00);

-- Insert sample operators
INSERT INTO operators (employee_id, full_name, hire_date, has_disability, module_id, area_id, quadrant_code, rose_variety_id, status) VALUES
('OP001', 'Juan Pérez', '2023-01-15', false, 1, 1, 'Q001', 1, 'ACTIVO'),
('OP002', 'María López', '2023-02-20', false, 1, 1, 'Q002', 2, 'ACTIVO'),
('OP003', 'Carlos Mendoza', '2023-03-10', true, 3, 2, 'Q003', 3, 'ACTIVO'),
('OP004', 'Ana Torres', '2023-04-05', false, 3, 2, 'Q004', 4, 'ACTIVO'),
('OP005', 'Luis Vargas', '2023-05-12', false, 5, 3, 'Q005', 5, 'ACTIVO'),
('OP006', 'Carmen Silva', '2023-06-18', false, 5, 3, 'Q006', 6, 'ACTIVO'),
('OP007', 'Roberto Díaz', '2023-07-22', false, 7, 4, 'Q007', 7, 'ACTIVO'),
('OP008', 'Patricia Ruiz', '2023-08-30', true, 7, 4, 'Q008', 1, 'ACTIVO');

-- Update operators with disability descriptions
UPDATE operators SET disability_description = 'Discapacidad motriz leve en mano derecha' WHERE employee_id = 'OP003';
UPDATE operators SET disability_description = 'Discapacidad auditiva parcial' WHERE employee_id = 'OP008';