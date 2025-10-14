# Resumen de Requisitos del Sistema QCSER

## Requisitos Funcionales Clave

### Módulo de Cosecha (COS)
- **Evaluación de Operarios:** El sistema debe permitir a la Jefa de Calidad seleccionar áreas y cuadrantes, iniciar evaluaciones con un puntaje máximo, seleccionar parámetros no cumplidos, y registrar observaciones generales y por parámetro.
- **Cálculo Automático:** Descuento automático de puntaje por incumplimiento y recálculo en tiempo real del porcentaje de cumplimiento.
- **Evidencia Fotográfica:** Adjuntar múltiples fotografías (.jpg, .png) como evidencia, con previsualización y gestión (eliminar/reemplazar) antes de guardar.
- **Información del Operario:** Mostrar información detallada del operario (nombre, fecha de ingreso, discapacidad, variedad de flor, supervisor).
- **Gestión de Evaluaciones:** Guardar evaluaciones, evitar duplicados, permitir edición en borrador y confirmación/cierre definitivo.
- **Modo Offline:** Guardar evaluaciones localmente en ausencia de red y sincronizar al recuperar la conexión (COS-22).
- **Restricción de Acceso:** Acceso al módulo restringido por rol (Jefa de Calidad para evaluaciones, Gerente General para consulta).

### Módulo de Administración (ADM)
- **Gestión de Usuarios:** CRUD (Crear, Leer, Actualizar, Eliminar) de usuarios con datos básicos, asignación de roles (Administrador, Jefe de Calidad, Gerente General), y validación de duplicidad por ID/correo.
- **Gestión de Operarios:** CRUD de operarios de cosecha y postcosecha, incluyendo datos personales, módulo, área, cuadrante, fecha de ingreso, discapacidad y estado (Activo/Inactivo/Baja).
- **Gestión de Parámetros de Evaluación:** CRUD de parámetros con subproceso, peso (descuento) y estado (activo/inactivo). Implementación de versionado/vigencia para trazabilidad histórica (ADM-17).
- **Gestión de Variedades de Rosas:** CRUD de variedades de rosas.
- **Gestión de Subprocesos:** Definir y activar subprocesos por módulo (ej. Enmallado, Cuadrante para Cosecha; Recepción, Clasificación, Boncheo, Fin de Banda, Empaque para Postcosecha) (ADM-18).
- **Asignación de Supervisores:** Asignar supervisores por área (ADM-19).
- **Control de Acceso:** Administrador gestiona catálogos; Jefa de Calidad y Gerente General solo lectura en administración (ADM-22).
- **Mensajes de Confirmación:** Mostrar mensajes de confirmación en acciones críticas.

### Módulo de KPIs y Reportes (KPI)
- **Selección de Período:** Seleccionar período de análisis (semana, mes).
- **Reportes Gráficos:** Mostrar gráficos de líneas de Promedio de Cosecha y Área, tabla resumen mensual, matriz de motivos por área (heatmap).
- **Reporte Individual:** Consultar reporte individual por operario con ficha, tabla código-promedio-objetivo y gráfico de desempeño individual.
- **Exportación:** Exportar reportes (general e individual) en formato PDF (KPI-11).
- **Historial de Evaluaciones:** Consultar historial de evaluaciones con filtros (operario, cuadrante, área, módulo, fecha, nivel de cumplimiento).
- **Restricción de Acceso:** Jefa de Calidad y Gerente General: visualización/exportación; Administrador: solo lectura.

## Requisitos No Funcionales Clave

- **Robustez y Escalabilidad:** El sistema debe ser robusto y escalable para manejar un volumen creciente de datos y usuarios.
- **Funcionamiento Offline/Online:** Capacidad de operar sin conexión a internet y sincronizar datos automáticamente al restablecerse la conexión.
- **Seguridad:** Autenticación de usuarios, autorización basada en roles (RLS en Supabase), y protección de datos.
- **Integración:** Con Power BI para dashboards ejecutivos y Supabase para Auth, DB, Storage y Edge Functions (generación de PDF).
- **Usabilidad:** Interfaz intuitiva para la Jefa de Calidad en la aplicación móvil para evaluaciones.
- **Rendimiento:** Recálculo en tiempo real del porcentaje de cumplimiento.
- **Trazabilidad:** Versionado de parámetros de evaluación para trazabilidad histórica.
- **Generación de PDF:** Utilización de Supabase Edge Function para la generación de PDFs.

