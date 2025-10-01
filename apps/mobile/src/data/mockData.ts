import { Operario, ParametroConPeso, Supervisor, User } from '../types';

// 🎭 USUARIOS MOCK - Para autenticación de prueba
export const MOCK_USUARIOS: (User & { contraseña: string })[] = [
  {
    id: '1',
    email: 'admin@floresverdes.com',
    name: 'Administrador Principal',
    role: 'admin',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    contraseña: 'admin123'
  },
  {
    id: '2', 
    email: 'gerente@floresverdes.com',
    name: 'Gerente de Operaciones',
    role: 'gerente',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z',
    contraseña: 'gerente123'
  },
  {
    id: '3',
    email: 'jefe.calidad@floresverdes.com', 
    name: 'Juan Pérez',
    role: 'jefe_calidad',
    created_at: '2023-01-15T00:00:00Z',
    updated_at: '2023-01-15T00:00:00Z',
    contraseña: 'calidad123'
  }
];

// 🎭 OPERARIOS MOCK - Datos de prueba
export const MOCK_OPERARIOS: Operario[] = [
  { id: '1', nombre: 'Juan Pérez', correo: 'juan@floresverdes.com', area: 'Área 1', cuadrante: 'C1', discapacidad: 'Ninguna', fechaIngreso: '2023-01-15', variedad: 'Freedom' },
  { id: '2', nombre: 'María González', correo: 'maria@floresverdes.com', area: 'Área 1', cuadrante: 'C2', discapacidad: 'Ninguna', fechaIngreso: '2023-02-20', variedad: 'Red Naomi' },
  { id: '3', nombre: 'Carlos Rodríguez', correo: 'carlos@floresverdes.com', area: 'Área 2', cuadrante: 'C3', discapacidad: 'Visual leve', fechaIngreso: '2023-03-10', variedad: 'Explorer' },
  { id: '4', nombre: 'Ana Martínez', correo: 'ana@floresverdes.com', area: 'Área 3', cuadrante: 'C4', discapacidad: 'Ninguna', fechaIngreso: '2023-04-05', variedad: 'Avalanche+' },
  { id: '5', nombre: 'Luis García', correo: 'luis@floresverdes.com', area: 'Área 1', cuadrante: 'C5', discapacidad: 'Ninguna', fechaIngreso: '2023-05-12', variedad: 'Mondial' },
  { id: '6', nombre: 'Carmen López', correo: 'carmen@floresverdes.com', area: 'Área 2', cuadrante: 'C6', discapacidad: 'Auditiva leve', fechaIngreso: '2023-06-18', variedad: 'Playa Blanca' },
  { id: '7', nombre: 'Pedro Herrera', correo: 'pedro@floresverdes.com', area: 'Área 4', cuadrante: 'C7', discapacidad: 'Ninguna', fechaIngreso: '2023-07-22', variedad: 'Tacazzi' },
  { id: '8', nombre: 'Sofia Torres', correo: 'sofia@floresverdes.com', area: 'Área 3', cuadrante: 'C8', discapacidad: 'Ninguna', fechaIngreso: '2023-08-30', variedad: 'Pink Floyd' },
  { id: '9', nombre: 'Roberto Silva', correo: 'roberto@floresverdes.com', area: 'Área 1', cuadrante: 'C9', discapacidad: 'Ninguna', fechaIngreso: '2023-09-15', variedad: 'Vendela' },
  { id: '10', nombre: 'Isabella Castro', correo: 'isabella@floresverdes.com', area: 'Área 2', cuadrante: 'C10', discapacidad: 'Ninguna', fechaIngreso: '2023-10-01', variedad: 'Athena' },
];

// 🌹 VARIEDADES DE ROSAS DISPONIBLES
export const VARIEDADES_ROSAS = [
  // 🔴 Rosas Rojas
  { label: 'Freedom', value: 'Freedom', color: '#DC143C', tipo: 'Roja' },
  { label: 'Red Naomi', value: 'Red Naomi', color: '#8B0000', tipo: 'Roja' },
  { label: 'Explorer', value: 'Explorer', color: '#B22222', tipo: 'Roja' },
  { label: 'Forever Young', value: 'Forever Young', color: '#CD5C5C', tipo: 'Roja' },
  
  // ⚪ Rosas Blancas
  { label: 'Avalanche+', value: 'Avalanche+', color: '#FFFFFF', tipo: 'Blanca' },
  { label: 'Playa Blanca', value: 'Playa Blanca', color: '#F8F8FF', tipo: 'Blanca' },
  { label: 'Athena', value: 'Athena', color: '#FFFFFF', tipo: 'Blanca' },
  { label: 'Polar Star', value: 'Polar Star', color: '#FFFAFA', tipo: 'Blanca' },
  
  // 🌸 Rosas Rosadas
  { label: 'Tacazzi', value: 'Tacazzi', color: '#FFB6C1', tipo: 'Rosa' },
  { label: 'Pink Floyd', value: 'Pink Floyd', color: '#FF69B4', tipo: 'Rosa' },
  { label: 'Hermosa', value: 'Hermosa', color: '#FFC0CB', tipo: 'Rosa' },
  { label: 'Carousel', value: 'Carousel', color: '#DB7093', tipo: 'Rosa' },
  
  // 🟡 Rosas Crema/Amarillas
  { label: 'Mondial', value: 'Mondial', color: '#FFFACD', tipo: 'Crema' },
  { label: 'Vendela', value: 'Vendela', color: '#FFF8DC', tipo: 'Crema' },
  { label: 'Moonstone', value: 'Moonstone', color: '#F5F5DC', tipo: 'Crema' },
  { label: 'High & Yellow', value: 'High & Yellow', color: '#FFFFE0', tipo: 'Amarilla' },
  
  // 🟠 Rosas Especiales
  { label: 'Café Latte', value: 'Café Latte', color: '#D2B48C', tipo: 'Café' },
  { label: 'Quicksand', value: 'Quicksand', color: '#DEB887', tipo: 'Durazno' },
  { label: 'Talea', value: 'Talea', color: '#F0E68C', tipo: 'Amarilla' },
  { label: 'Furiosa', value: 'Furiosa', color: '#FF8C00', tipo: 'Naranja' },
];

// 👨‍💼 SUPERVISORES MOCK - Asignados por área
export const MOCK_SUPERVISORES: Supervisor[] = [
  {
    id: 'SUP001',
    nombre: 'Roberto Hernández',
    correo: 'roberto.hernandez@floresverdes.com',
    telefono: '+57 310 123 4567',
    area: 'Área 1',
    fechaAsignacion: '2023-01-10',
  },
  {
    id: 'SUP002',
    nombre: 'Patricia González',
    correo: 'patricia.gonzalez@floresverdes.com',
    telefono: '+57 315 234 5678',
    area: 'Área 2',
    fechaAsignacion: '2023-02-15',
  },
  {
    id: 'SUP003',
    nombre: 'Miguel Vargas',
    correo: 'miguel.vargas@floresverdes.com',
    telefono: '+57 320 345 6789',
    area: 'Área 3',
    fechaAsignacion: '2023-03-20',
  },
  {
    id: 'SUP004',
    nombre: 'Carmen Delgado',
    correo: 'carmen.delgado@floresverdes.com',
    telefono: '+57 318 456 7890',
    area: 'Área 4',
    fechaAsignacion: '2023-04-25',
  },
];

// 🏢 ÁREAS DISPONIBLES
export const AREAS_OPTIONS = [
  { label: 'Área 1', value: 'Área 1' },
  { label: 'Área 2', value: 'Área 2' },
  { label: 'Área 3', value: 'Área 3' },
  { label: 'Área 4', value: 'Área 4' },
];

// 🌾 PARÁMETROS DE EVALUACIÓN ENMALLADO CON PESOS
export const PARAMETROS_ENMALLADO: ParametroConPeso[] = [
  { id: 'E001', nombre: "Nivel de agua (mínimo 40 cm)", peso: 3 },
  { id: 'E002', nombre: "Limpieza adecuada de tinas y tachos (turbidez)", peso: 4 },
  { id: 'E003', nombre: "Aseo del coche", peso: 2 },
  { id: 'E004', nombre: "Uso de E.P.P. (guantes, botas y envase de desinfectante)", peso: 5 },
  { id: 'E005', nombre: "Correcto uso de coche de corte", peso: 3 },
  { id: 'E006', nombre: "Desinfección frecuente de tijeras", peso: 4 },
  { id: 'E007', nombre: "Flor en coches (50 tallos máx. por cuna con separadores)", peso: 4 },
  { id: 'E008', nombre: "Manipulación correcta de flor en corte o enmallado", peso: 5 },
  { id: 'E009', nombre: "Ajuste de la malla", peso: 4 },
  { id: 'E010', nombre: "Inconsistencia en punto de corte", peso: 5 },
  { id: 'E011', nombre: "Flor abierta en camas (cuadrante)", peso: 3 },
  { id: 'E012', nombre: "No mezcla de largos de tallos", peso: 4 },
  { id: 'E013', nombre: "Flor sin hidratación (excepto pedidos especiales)", peso: 4 },
  { id: 'E014', nombre: "Flor sin maltrato por enmallado", peso: 5 },
  { id: 'E015', nombre: "Flor sin tocones/yemas", peso: 3 },
  { id: 'E016', nombre: "Ticket de corte (operador/bloque)", peso: 2 },
  { id: 'E017', nombre: "Tallas menores de 40 cm", peso: 3 },
  { id: 'E018', nombre: "25 botones por malla (según variedad)", peso: 4 },
  { id: 'E019', nombre: "Niveles (ubicación de botones) y a 10 cm", peso: 4 },
  { id: 'E020', nombre: "Tallos descabezados o follaje maltratado", peso: 3 },
  { id: 'E021', nombre: "Número adecuado de mallas en fina o tacho", peso: 3 },
  { id: 'E022', nombre: "No desperdicio", peso: 4 },
  { id: 'E023', nombre: "Orden y aseo del área", peso: 3 },
  { id: 'E024', nombre: "Flor sin enfermedades", peso: 5 },
  { id: 'E025', nombre: "Flor manchada con químicos", peso: 4 },
  { id: 'E026', nombre: "Estado de coches, mesas (ruedas, estructura, canaste)", peso: 2 },
  { id: 'E027', nombre: "Estado de aviones", peso: 2 },
  { id: 'E028', nombre: "Estado de tijeras", peso: 2 },
  { id: 'E029', nombre: "Ubicación/tinas en paraderos (bajo sombra)", peso: 3 },
  { id: 'E030', nombre: "Número de mallas por espina de pescado", peso: 3 },
  { id: 'E031', nombre: "Manipulación correcta de mallas", peso: 4 },
  { id: 'E032', nombre: "Tiempo adecuado de ejecución de labores", peso: 4 },
  { id: 'E033', nombre: "Uso de E.P.P.", peso: 5 },
  { id: 'E034', nombre: "Entrega de desinfectante", peso: 3 },
  { id: 'E035', nombre: "Mallas sueltas en el piso", peso: 2 },
  { id: 'E036', nombre: "Estado adecuado de mallas", peso: 3 }
];

// 🧑‍🌾 PARÁMETROS DE EVALUACIÓN CUADRANTE CON PESOS
export const PARAMETROS_CUADRANTE: ParametroConPeso[] = [
  { id: 'C001', nombre: "¿Eliminación correcta de brotes?", peso: 5 },
  { id: 'C002', nombre: "¿Limpieza de hojas adecuada?", peso: 4 },
  { id: 'C003', nombre: "¿Sin daño a tallos principales?", peso: 5 },
  { id: 'C004', nombre: "¿Cobertura uniforme de tratamientos?", peso: 4 },
  { id: 'C005', nombre: "¿Cumplimiento del calendario?", peso: 4 }
];