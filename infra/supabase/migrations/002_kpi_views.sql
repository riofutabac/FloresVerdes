-- Vista materializada para KPIs de producción
CREATE MATERIALIZED VIEW public.kpi_produccion_diaria AS
SELECT 
  DATE(fecha_creacion) as fecha,
  COUNT(*) as total_evaluaciones,
  SUM(cantidad) as cantidad_total,
  AVG(calidad) as calidad_promedio,
  COUNT(CASE WHEN tiene_defectos THEN 1 END) as evaluaciones_con_defectos,
  COUNT(DISTINCT operario) as operarios_activos,
  COUNT(DISTINCT variedad) as variedades_evaluadas
FROM evaluaciones
WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(fecha_creacion)
ORDER BY fecha DESC;

-- Vista materializada para KPIs por variedad
CREATE MATERIALIZED VIEW public.kpi_por_variedad AS
SELECT 
  variedad,
  COUNT(*) as total_evaluaciones,
  SUM(cantidad) as cantidad_total,
  AVG(calidad) as calidad_promedio,
  STDDEV(calidad) as desviacion_calidad,
  COUNT(CASE WHEN tiene_defectos THEN 1 END) as evaluaciones_con_defectos,
  COUNT(DISTINCT operario) as operarios_involucrados,
  DATE(MAX(fecha_creacion)) as ultima_evaluacion
FROM evaluaciones
WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY variedad
ORDER BY cantidad_total DESC;

-- Vista materializada para KPIs por operario
CREATE MATERIALIZED VIEW public.kpi_por_operario AS
SELECT 
  operario,
  COUNT(*) as total_evaluaciones,
  SUM(cantidad) as cantidad_total,
  AVG(calidad) as calidad_promedio,
  STDDEV(calidad) as desviacion_calidad,
  COUNT(CASE WHEN tiene_defectos THEN 1 END) as evaluaciones_con_defectos,
  COUNT(DISTINCT variedad) as variedades_trabajadas,
  DATE(MAX(fecha_creacion)) as ultima_evaluacion
FROM evaluaciones
WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY operario
ORDER BY cantidad_total DESC;

-- Índices para las vistas materializadas
CREATE INDEX idx_kpi_produccion_fecha ON kpi_produccion_diaria(fecha);
CREATE INDEX idx_kpi_variedad_nombre ON kpi_por_variedad(variedad);
CREATE INDEX idx_kpi_operario_nombre ON kpi_por_operario(operario);

-- Función para refrescar vistas materializadas
CREATE OR REPLACE FUNCTION refresh_kpi_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_produccion_diaria;
  REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_por_variedad;
  REFRESH MATERIALIZED VIEW CONCURRENTLY kpi_por_operario;
END;
$$ LANGUAGE plpgsql;

-- Vista para el dashboard principal
CREATE VIEW public.dashboard_resumen AS
SELECT 
  (SELECT COUNT(*) FROM evaluaciones WHERE DATE(fecha_creacion) = CURRENT_DATE) as evaluaciones_hoy,
  (SELECT SUM(cantidad) FROM evaluaciones WHERE DATE(fecha_creacion) = CURRENT_DATE) as cantidad_hoy,
  (SELECT AVG(calidad) FROM evaluaciones WHERE DATE(fecha_creacion) = CURRENT_DATE) as calidad_promedio_hoy,
  (SELECT COUNT(DISTINCT operario) FROM evaluaciones WHERE DATE(fecha_creacion) = CURRENT_DATE) as operarios_activos_hoy,
  (SELECT COUNT(*) FROM evaluaciones WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '7 days') as evaluaciones_semana,
  (SELECT SUM(cantidad) FROM evaluaciones WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '7 days') as cantidad_semana,
  (SELECT AVG(calidad) FROM evaluaciones WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '7 days') as calidad_promedio_semana,
  (SELECT COUNT(*) FROM evaluaciones WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '30 days') as evaluaciones_mes,
  (SELECT SUM(cantidad) FROM evaluaciones WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '30 days') as cantidad_mes,
  (SELECT AVG(calidad) FROM evaluaciones WHERE fecha_creacion >= CURRENT_DATE - INTERVAL '30 days') as calidad_promedio_mes;