import { Operario } from '../types';

// 🎭 OPERARIOS MOCK - Datos de prueba
export const MOCK_OPERARIOS: Operario[] = [
  { id: '1', nombre: 'Juan Pérez', correo: 'juan@floresverdes.com', area: 'Área 1', cuadrante: 'C1', discapacidad: 'Ninguna', fechaIngreso: '2023-01-15' },
  { id: '2', nombre: 'María González', correo: 'maria@floresverdes.com', area: 'Área 1', cuadrante: 'C2', discapacidad: 'Ninguna', fechaIngreso: '2023-02-20' },
  { id: '3', nombre: 'Carlos Rodríguez', correo: 'carlos@floresverdes.com', area: 'Área 2', cuadrante: 'C3', discapacidad: 'Visual leve', fechaIngreso: '2023-03-10' },
  { id: '4', nombre: 'Ana Martínez', correo: 'ana@floresverdes.com', area: 'Área 3', cuadrante: 'C4', discapacidad: 'Ninguna', fechaIngreso: '2023-04-05' },
  { id: '5', nombre: 'Luis García', correo: 'luis@floresverdes.com', area: 'Área 1', cuadrante: 'C5', discapacidad: 'Ninguna', fechaIngreso: '2023-05-12' },
  { id: '6', nombre: 'Carmen López', correo: 'carmen@floresverdes.com', area: 'Área 2', cuadrante: 'C6', discapacidad: 'Auditiva leve', fechaIngreso: '2023-06-18' },
  { id: '7', nombre: 'Pedro Herrera', correo: 'pedro@floresverdes.com', area: 'Área 4', cuadrante: 'C7', discapacidad: 'Ninguna', fechaIngreso: '2023-07-22' },
  { id: '8', nombre: 'Sofia Torres', correo: 'sofia@floresverdes.com', area: 'Área 3', cuadrante: 'C8', discapacidad: 'Ninguna', fechaIngreso: '2023-08-30' },
];

// 🏢 ÁREAS DISPONIBLES
export const AREAS_OPTIONS = [
  { label: 'Área 1', value: 'Área 1' },
  { label: 'Área 2', value: 'Área 2' },
  { label: 'Área 3', value: 'Área 3' },
  { label: 'Área 4', value: 'Área 4' },
];

// 🌾 PARÁMETROS DE EVALUACIÓN ENMALLADO
export const PARAMETROS_ENMALLADO = [
  "Nivel de agua (mínimo 40 cm)",
  "Limpieza adecuada de tinas y tachos (turbidez)",
  "Aseo del coche",
  "Uso de E.P.P. (guantes, botas y envase de desinfectante)",
  "Correcto uso de coche de corte",
  "Desinfección frecuente de tijeras",
  "Flor en coches (50 tallos máx. por cuna con separadores)",
  "Manipulación correcta de flor en corte o enmallado",
  "Ajuste de la malla",
  "Inconsistencia en punto de corte",
  "Flor abierta en camas (cuadrante)",
  "No mezcla de largos de tallos",
  "Flor sin hidratación (excepto pedidos especiales)",
  "Flor sin maltrato por enmallado",
  "Flor sin tocones/yemas",
  "Ticket de corte (operador/bloque)",
  "Tallas menores de 40 cm",
  "25 botones por malla (según variedad)",
  "Niveles (ubicación de botones) y a 10 cm",
  "Tallos descabezados o follaje maltratado",
  "Número adecuado de mallas en fina o tacho",
  "No desperdicio",
  "Orden y aseo del área",
  "Flor sin enfermedades",
  "Flor manchada con químicos",
  "Estado de coches, mesas (ruedas, estructura, canaste)",
  "Estado de aviones",
  "Estado de tijeras",
  "Ubicación/tinas en paraderos (bajo sombra)",
  "Número de mallas por espina de pescado",
  "Manipulación correcta de mallas",
  "Tiempo adecuado de ejecución de labores",
  "Uso de E.P.P.",
  "Entrega de desinfectante",
  "Mallas sueltas en el piso",
  "Estado adecuado de mallas"
];

// 🧑‍🌾 PARÁMETROS DE EVALUACIÓN CUADRANTE
export const PARAMETROS_CUADRANTE = [
  "¿Eliminación correcta de brotes?",
  "¿Limpieza de hojas adecuada?",
  "¿Sin daño a tallos principales?",
  "¿Cobertura uniforme de tratamientos?",
  "¿Cumplimiento del calendario?"
];