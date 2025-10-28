import { Operario, ParametroConPeso, Supervisor, User, EvaluacionGuardada } from '../types';

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
  // 🌾 OPERARIOS DE COSECHA (con área y cuadrante)
  { id: '1', nombre: 'Juan Pérez', correo: 'juan@floresverdes.com', area: 'Área 1', cuadrante: 'C1', discapacidad: 'Ninguna', fechaIngreso: '2023-01-15', variedad: 'Freedom', proceso: 'Cosecha' },
  { id: '2', nombre: 'María González', correo: 'maria@floresverdes.com', area: 'Área 1', cuadrante: 'C2', discapacidad: 'Ninguna', fechaIngreso: '2023-02-20', variedad: 'Red Naomi', proceso: 'Cosecha' },
  { id: '4', nombre: 'Ana Martínez', correo: 'ana@floresverdes.com', area: 'Área 3', cuadrante: 'C4', discapacidad: 'Ninguna', fechaIngreso: '2023-04-05', variedad: 'Avalanche+', proceso: 'Cosecha' },
  { id: '6', nombre: 'Carmen López', correo: 'carmen@floresverdes.com', area: 'Área 2', cuadrante: 'C6', discapacidad: 'Auditiva leve', fechaIngreso: '2023-06-18', variedad: 'Playa Blanca', proceso: 'Cosecha' },
  { id: '8', nombre: 'Sofia Torres', correo: 'sofia@floresverdes.com', area: 'Área 3', cuadrante: 'C8', discapacidad: 'Ninguna', fechaIngreso: '2023-08-30', variedad: 'Pink Floyd', proceso: 'Cosecha' },
  { id: '10', nombre: 'Isabella Castro', correo: 'isabella@floresverdes.com', area: 'Área 2', cuadrante: 'C10', discapacidad: 'Ninguna', fechaIngreso: '2023-10-01', variedad: 'Athena', proceso: 'Cosecha' },
  
  // 📦 OPERARIOS DE POSTCOSECHA (con mesa y rol)
  { id: '3', nombre: 'Carlos Rodríguez', correo: 'carlos@floresverdes.com', mesa: 'Mesa 1', rol: 'Clasificador', discapacidad: 'Visual leve', fechaIngreso: '2023-03-10', variedad: 'Explorer', proceso: 'Postcosecha' },
  { id: '5', nombre: 'Luis García', correo: 'luis@floresverdes.com', mesa: 'Mesa 2', rol: 'Bonchador', discapacidad: 'Ninguna', fechaIngreso: '2023-05-12', variedad: 'Mondial', proceso: 'Postcosecha' },
  { id: '7', nombre: 'Pedro Herrera', correo: 'pedro@floresverdes.com', mesa: 'Mesa 3', rol: 'Clasificador', discapacidad: 'Ninguna', fechaIngreso: '2023-07-22', variedad: 'Tacazzi', proceso: 'Postcosecha' },
  { id: '9', nombre: 'Roberto Silva', correo: 'roberto@floresverdes.com', mesa: 'Mesa 1', rol: 'Bonchador', discapacidad: 'Ninguna', fechaIngreso: '2023-09-15', variedad: 'Vendela', proceso: 'Postcosecha' },
];

// 🌹 VARIEDADES DE ROSAS DISPONIBLES - CATÁLOGO REAL
export const VARIEDADES_ROSAS = [
  // ⚪ WHITE ROSES
  { label: 'Akito', value: 'Akito', color: '#FFFFFF', tipo: 'Blanca' },
  { label: 'Athena', value: 'Athena', color: '#FFFFFF', tipo: 'Blanca' },
  { label: 'Avalanche', value: 'Avalanche', color: '#FFFFFF', tipo: 'Blanca' },
  { label: 'Avalanche+', value: 'Avalanche+', color: '#FFFFFF', tipo: 'Blanca' },
  { label: 'Blizzard', value: 'Blizzard', color: '#FFFFFF', tipo: 'Blanca' },
  { label: 'Escimo', value: 'Escimo', color: '#FFFFFF', tipo: 'Blanca' },
  { label: 'Iceberg', value: 'Iceberg', color: '#FFFFFF', tipo: 'Blanca' },
  { label: 'Mondial', value: 'Mondial', color: '#FFFACD', tipo: 'Blanca' },
  { label: 'Moonstone', value: 'Moonstone', color: '#F5F5DC', tipo: 'Blanca' },
  { label: 'Playa Blanca', value: 'Playa Blanca', color: '#F8F8FF', tipo: 'Blanca' },
  { label: 'Polar Star', value: 'Polar Star', color: '#FFFAFA', tipo: 'Blanca' },
  { label: 'Proud', value: 'Proud', color: '#FFFFFF', tipo: 'Blanca' },
  { label: 'Vendela', value: 'Vendela', color: '#FFF8DC', tipo: 'Blanca' },
  { label: 'White Naomi', value: 'White Naomi', color: '#FFFFFF', tipo: 'Blanca' },

  // 🟡 YELLOW ROSES
  { label: 'Bikini', value: 'Bikini', color: '#FFD700', tipo: 'Amarilla' },
  { label: 'Brighton Amarilla', value: 'Brighton_Amarilla', color: '#FFFF00', tipo: 'Amarilla' },
  { label: 'Limbo Amarilla', value: 'Limbo_Amarilla', color: '#F0E68C', tipo: 'Amarilla' },
  { label: 'Mohana', value: 'Mohana', color: '#FFD700', tipo: 'Amarilla' },
  { label: 'Penny Lane', value: 'Penny Lane', color: '#FFFF00', tipo: 'Amarilla' },
  { label: 'Sphinx', value: 'Sphinx', color: '#F0E68C', tipo: 'Amarilla' },
  { label: 'Stardust', value: 'Stardust', color: '#FFD700', tipo: 'Amarilla' },

  // 🔴 RED ROSES
  { label: 'Baroque', value: 'Baroque', color: '#8B0000', tipo: 'Roja' },
  { label: 'Black Magic', value: 'Black Magic', color: '#800000', tipo: 'Roja' },
  { label: 'Charlotte', value: 'Charlotte', color: '#DC143C', tipo: 'Roja' },
  { label: 'Classy', value: 'Classy', color: '#B22222', tipo: 'Roja' },
  { label: 'Explorer', value: 'Explorer', color: '#B22222', tipo: 'Roja' },
  { label: 'Fire Flash', value: 'Fire Flash', color: '#DC143C', tipo: 'Roja' },
  { label: 'Forever Young', value: 'Forever Young', color: '#CD5C5C', tipo: 'Roja' },
  { label: 'Freedom', value: 'Freedom', color: '#DC143C', tipo: 'Roja' },
  { label: 'High & Magic', value: 'High & Magic', color: '#8B0000', tipo: 'Roja' },
  { label: 'Madam Red', value: 'Madam Red', color: '#B22222', tipo: 'Roja' },
  { label: 'Naomi Red', value: 'Naomi Red', color: '#8B0000', tipo: 'Roja' },
  { label: 'Nena', value: 'Nena', color: '#DC143C', tipo: 'Roja' },
  { label: 'Red Eagle', value: 'Red Eagle', color: '#B22222', tipo: 'Roja' },
  { label: 'Red Naomi', value: 'Red Naomi', color: '#8B0000', tipo: 'Roja' },
  { label: 'Rouge', value: 'Rouge', color: '#DC143C', tipo: 'Roja' },

  // 🟠 ORANGE ROSES  
  { label: 'Fidji', value: 'Fidji', color: '#FF8C00', tipo: 'Naranja' },
  { label: 'Free Spirit', value: 'Free Spirit', color: '#FFA500', tipo: 'Naranja' },
  { label: 'Furiosa', value: 'Furiosa', color: '#FF8C00', tipo: 'Naranja' },
  { label: 'High & Orange', value: 'High & Orange', color: '#FF8C00', tipo: 'Naranja' },
  { label: 'Movie Star', value: 'Movie Star', color: '#FFA500', tipo: 'Naranja' },
  { label: 'Starburst', value: 'Starburst', color: '#FF8C00', tipo: 'Naranja' },

  // 🌸 PINK ROSES
  { label: 'Baronesse', value: 'Baronesse', color: '#FFB6C1', tipo: 'Rosa' },
  { label: 'Carousel', value: 'Carousel', color: '#DB7093', tipo: 'Rosa' },
  { label: 'Engagement', value: 'Engagement', color: '#FF69B4', tipo: 'Rosa' },
  { label: 'Hermosa', value: 'Hermosa', color: '#FFC0CB', tipo: 'Rosa' },
  { label: 'High & Candy', value: 'High & Candy', color: '#FF69B4', tipo: 'Rosa' },
  { label: "Mayra's Rose", value: "Mayra's Rose", color: '#FFB6C1', tipo: 'Rosa' },
  { label: 'Miami', value: 'Miami', color: '#FF1493', tipo: 'Rosa' },
  { label: 'Pink Floyd', value: 'Pink Floyd', color: '#FF69B4', tipo: 'Rosa' },
  { label: 'Sweet Akito', value: 'Sweet Akito', color: '#FFC0CB', tipo: 'Rosa' },
  { label: 'Tacazzi', value: 'Tacazzi', color: '#FFB6C1', tipo: 'Rosa' },
  { label: 'Topaz', value: 'Topaz', color: '#DB7093', tipo: 'Rosa' },

  // � LAVANDER ROSES
  { label: 'Amnesia', value: 'Amnesia', color: '#DDA0DD', tipo: 'Lavanda' },
  { label: 'Cool Water', value: 'Cool Water', color: '#E6E6FA', tipo: 'Lavanda' },
  { label: 'Dancing Queen', value: 'Dancing Queen', color: '#DDA0DD', tipo: 'Lavanda' },
  { label: 'Deep Purple', value: 'Deep Purple', color: '#9370DB', tipo: 'Lavanda' },
  { label: 'Escada', value: 'Escada', color: '#E6E6FA', tipo: 'Lavanda' },
  { label: 'Maritime', value: 'Maritime', color: '#DDA0DD', tipo: 'Lavanda' },
  { label: 'Moody Blues', value: 'Moody Blues', color: '#9370DB', tipo: 'Lavanda' },
  { label: 'Ocean Song', value: 'Ocean Song', color: '#E6E6FA', tipo: 'Lavanda' },
  { label: 'Tibet', value: 'Tibet', color: '#DDA0DD', tipo: 'Lavanda' },

  // 🎨 BICOLOR ROSES
  { label: 'Blush', value: 'Blush', color: '#F0E68C', tipo: 'Bicolor' },
  { label: 'Cabaret', value: 'Cabaret', color: '#FF6347', tipo: 'Bicolor' },
  { label: 'Circus', value: 'Circus', color: '#FF4500', tipo: 'Bicolor' },
  { label: 'Fire & Ice', value: 'Fire & Ice', color: '#DC143C', tipo: 'Bicolor' },
  { label: 'Iguana', value: 'Iguana', color: '#8FBC8F', tipo: 'Bicolor' },
  { label: 'Paloma', value: 'Paloma', color: '#F5DEB3', tipo: 'Bicolor' },
  { label: 'Sweetness', value: 'Sweetness', color: '#FFB6C1', tipo: 'Bicolor' },

  // 🔥 HOT PINK ROSES
  { label: 'Aqua', value: 'Aqua', color: '#FF1493', tipo: 'Rosa Fuerte' },
  { label: 'Brighton Rosa', value: 'Brighton_Rosa', color: '#FF69B4', tipo: 'Rosa Fuerte' },
  { label: 'High & Flashy', value: 'High & Flashy', color: '#FF1493', tipo: 'Rosa Fuerte' },
  { label: 'Magnolia', value: 'Magnolia', color: '#FF69B4', tipo: 'Rosa Fuerte' },
  { label: 'Pink Mondial', value: 'Pink Mondial', color: '#FF1493', tipo: 'Rosa Fuerte' },
  { label: 'Pinky', value: 'Pinky', color: '#FF69B4', tipo: 'Rosa Fuerte' },

  // 🍑 PEACH ROSES
  { label: 'Café Latte', value: 'Café Latte', color: '#D2B48C', tipo: 'Durazno' },
  { label: 'Kahala', value: 'Kahala', color: '#FFDAB9', tipo: 'Durazno' },
  { label: 'Peach Avalanche', value: 'Peach Avalanche', color: '#FFCBA4', tipo: 'Durazno' },
  { label: 'Quicksand', value: 'Quicksand', color: '#DEB887', tipo: 'Durazno' },
  { label: 'Sahara', value: 'Sahara', color: '#F4A460', tipo: 'Durazno' },
  { label: 'Toffee', value: 'Toffee', color: '#D2B48C', tipo: 'Durazno' },
  { label: 'Versilia', value: 'Versilia', color: '#FFDAB9', tipo: 'Durazno' },

  // 💚 GREEN ROSES
  { label: 'Green Tea', value: 'Green Tea', color: '#90EE90', tipo: 'Verde' },
  { label: 'Jade', value: 'Jade', color: '#00FF7F', tipo: 'Verde' },
  { label: 'Kiwi', value: 'Kiwi', color: '#ADFF2F', tipo: 'Verde' },
  { label: 'Limbo Verde', value: 'Limbo_Verde', color: '#98FB98', tipo: 'Verde' },
  { label: 'Mint', value: 'Mint', color: '#90EE90', tipo: 'Verde' },
  { label: 'Super Green', value: 'Super Green', color: '#00FF7F', tipo: 'Verde' },

  // 🌿 GARDEN ROSES
  { label: 'Bridal Piano', value: 'Bridal Piano', color: '#FFFACD', tipo: 'Jardín' },
  { label: 'David Austin', value: 'David Austin', color: '#FFB6C1', tipo: 'Jardín' },
  { label: 'Garden Rose', value: 'Garden Rose', color: '#FFC0CB', tipo: 'Jardín' },
  { label: 'Juliet', value: 'Juliet', color: '#FFDAB9', tipo: 'Jardín' },
  { label: 'Patience', value: 'Patience', color: '#F0E68C', tipo: 'Jardín' },
  { label: 'Piano', value: 'Piano', color: '#FFFACD', tipo: 'Jardín' },

  // ⭐ NOVELTY ROSES
  { label: 'Black Baccara', value: 'Black Baccara', color: '#2F4F4F', tipo: 'Especial' },
  { label: 'Blue Moon', value: 'Blue Moon', color: '#6495ED', tipo: 'Especial' },
  { label: 'Esperance', value: 'Esperance', color: '#B0E0E6', tipo: 'Especial' },
  { label: 'Metalina', value: 'Metalina', color: '#C0C0C0', tipo: 'Especial' },
  { label: 'Sterling Silver', value: 'Sterling Silver', color: '#C0C0C0', tipo: 'Especial' },

  // 🆕 NEW VARIETIES
  { label: 'Avalanche Royal', value: 'Avalanche Royal', color: '#E6E6FA', tipo: 'Nueva' },
  { label: 'Esperance+', value: 'Esperance+', color: '#B0E0E6', tipo: 'Nueva' },
  { label: 'High & Pure', value: 'High & Pure', color: '#FFFFFF', tipo: 'Nueva' },
  { label: 'Madam Bombastic', value: 'Madam Bombastic', color: '#FF1493', tipo: 'Nueva' },
  { label: 'Pink Mondial+', value: 'Pink Mondial+', color: '#FF69B4', tipo: 'Nueva' },
  { label: 'Super Nova', value: 'Super Nova', color: '#FFD700', tipo: 'Nueva' },
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

// 🏭 PROCESOS DISPONIBLES
export const PROCESOS_OPTIONS = [
  { label: '🌾 Cosecha', value: 'Cosecha' },
  { label: '📦 Postcosecha', value: 'Postcosecha' },
];

// 🏢 MESAS DE POSTCOSECHA
export const MESAS_OPTIONS = [
  { label: 'Mesa 1', value: 'Mesa 1' },
  { label: 'Mesa 2', value: 'Mesa 2' },
  { label: 'Mesa 3', value: 'Mesa 3' },
  { label: 'Mesa 4', value: 'Mesa 4' },
  { label: 'Mesa 5', value: 'Mesa 5' },
  { label: 'Mesa 6', value: 'Mesa 6' },
];

// 👨‍💼 ROLES DE POSTCOSECHA
export const ROLES_POSTCOSECHA_OPTIONS = [
  { label: '🔍 Clasificador', value: 'Clasificador' },
  { label: '💐 Bonchador', value: 'Bonchador' },
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

// 📂 OPCIONES PARA GESTIÓN DE PARÁMETROS
export const CATEGORIAS_PARAMETROS_OPTIONS = [
  { label: '🌐 Enmallado', value: 'Enmallado' },
  { label: '🔲 Cuadrante', value: 'Cuadrante' },
  { label: '📦 Postcosecha', value: 'Postcosecha' },
];

export const TIPO_EVALUACION_OPTIONS = [
  { label: '🌾 Cosecha', value: 'Cosecha' },
  { label: '📦 Postcosecha', value: 'Postcosecha' },
  { label: '🔄 Ambos', value: 'Ambos' },
];

// 🌹 OPCIONES PARA GESTIÓN DE VARIEDADES - CATÁLOGO REAL
export const TIPOS_ROSA_OPTIONS = [
  { label: '⚪ Blanca', value: 'Blanca' },
  { label: '🟡 Amarilla', value: 'Amarilla' },
  { label: '🔴 Roja', value: 'Roja' },
  { label: '🟠 Naranja', value: 'Naranja' },
  { label: '🌸 Rosa', value: 'Rosa' },
  { label: '💜 Lavanda', value: 'Lavanda' },
  { label: '🎨 Bicolor', value: 'Bicolor' },
  { label: '🔥 Rosa Fuerte', value: 'Rosa Fuerte' },
  { label: '🍑 Durazno', value: 'Durazno' },
  { label: '💚 Verde', value: 'Verde' },
  { label: '🌿 Jardín', value: 'Jardín' },
  { label: '⭐ Especial', value: 'Especial' },
  { label: '🆕 Nueva', value: 'Nueva' },
];

export const COLORES_ROSA_OPTIONS = [
  { label: '⚪ Blanco', value: '#FFFFFF' },
  { label: '🟡 Amarillo', value: '#FFD700' },
  { label: '🔴 Rojo', value: '#DC143C' },
  { label: '🟠 Naranja', value: '#FF8C00' },
  { label: '🌸 Rosa', value: '#FFB6C1' },
  { label: '💜 Lavanda', value: '#DDA0DD' },
  { label: '🔥 Rosa Fuerte', value: '#FF1493' },
  { label: '🍑 Durazno', value: '#FFDAB9' },
  { label: '💚 Verde', value: '#90EE90' },
  { label: '🎨 Bicolor', value: '#F0E68C' },
  { label: '⭐ Especial', value: '#C0C0C0' },
  { label: '🆕 Nuevo', value: '#E6E6FA' },
];

// 📊 EVALUACIONES GUARDADAS MOCK - Para generar reportes
export const MOCK_EVALUACIONES_GUARDADAS: EvaluacionGuardada[] = [
  // Evaluaciones de Juan Pérez (Área 1, C1)
  {
    id: 'EVAL001',
    operarioId: '1',
    operarioNombre: 'Juan Pérez',
    area: 'Área 1',
    cuadrante: 'C1',
    variedad: 'Freedom',
    proceso: 'Cosecha',
    subproceso: 'Enmallado',
    evaluacion: {
      E001: { cumple: true },
      E002: { cumple: true },
      E003: { cumple: false, observacion: 'Coche con residuos' },
      E004: { cumple: true },
      E005: { cumple: true },
    },
    resultado: {
      puntajeMaximo: 100,
      puntajeObtenido: 85,
      porcentajeCumplimiento: 85,
      parametrosNoCumplidos: ['E003'],
      parametrosCumplidos: ['E001', 'E002', 'E004', 'E005'],
    },
    observaciones: 'Buen desempeño general, mejorar limpieza del coche',
    fechaRegistro: '2024-01-15T08:30:00Z',
    evaluadorId: '3',
    evaluadorNombre: 'Juan Pérez',
  },
  {
    id: 'EVAL002',
    operarioId: '1',
    operarioNombre: 'Juan Pérez',
    area: 'Área 1',
    cuadrante: 'C1',
    variedad: 'Freedom',
    proceso: 'Cosecha',
    subproceso: 'Enmallado',
    evaluacion: {
      E001: { cumple: true },
      E002: { cumple: true },
      E003: { cumple: true },
      E004: { cumple: true },
      E005: { cumple: false, observacion: 'Uso inadecuado del coche' },
    },
    resultado: {
      puntajeMaximo: 100,
      puntajeObtenido: 92,
      porcentajeCumplimiento: 92,
      parametrosNoCumplidos: ['E005'],
      parametrosCumplidos: ['E001', 'E002', 'E003', 'E004'],
    },
    observaciones: 'Mejoró la limpieza, revisar uso del coche',
    fechaRegistro: '2024-01-22T09:15:00Z',
    evaluadorId: '3',
    evaluadorNombre: 'Juan Pérez',
  },

  // Evaluaciones de María González (Área 1, C2)
  {
    id: 'EVAL003',
    operarioId: '2',
    operarioNombre: 'María González',
    area: 'Área 1',
    cuadrante: 'C2',
    variedad: 'Red Naomi',
    proceso: 'Cosecha',
    subproceso: 'Enmallado',
    evaluacion: {
      E001: { cumple: true },
      E002: { cumple: true },
      E003: { cumple: true },
      E004: { cumple: true },
      E005: { cumple: true },
    },
    resultado: {
      puntajeMaximo: 100,
      puntajeObtenido: 98,
      porcentajeCumplimiento: 98,
      parametrosNoCumplidos: [],
      parametrosCumplidos: ['E001', 'E002', 'E003', 'E004', 'E005'],
    },
    observaciones: 'Excelente desempeño en todos los aspectos',
    fechaRegistro: '2024-01-15T10:00:00Z',
    evaluadorId: '3',
    evaluadorNombre: 'Juan Pérez',
  },
  {
    id: 'EVAL004',
    operarioId: '2',
    operarioNombre: 'María González',
    area: 'Área 1',
    cuadrante: 'C2',
    variedad: 'Red Naomi',
    proceso: 'Cosecha',
    subproceso: 'Enmallado',
    evaluacion: {
      E001: { cumple: true },
      E002: { cumple: false, observacion: 'Tina con turbidez alta' },
      E003: { cumple: true },
      E004: { cumple: true },
      E005: { cumple: true },
    },
    resultado: {
      puntajeMaximo: 100,
      puntajeObtenido: 88,
      porcentajeCumplimiento: 88,
      parametrosNoCumplidos: ['E002'],
      parametrosCumplidos: ['E001', 'E003', 'E004', 'E005'],
    },
    observaciones: 'Revisar limpieza de tinas',
    fechaRegistro: '2024-01-22T10:30:00Z',
    evaluadorId: '3',
    evaluadorNombre: 'Juan Pérez',
  },

  // Evaluaciones de Ana Martínez (Área 3, C4)
  {
    id: 'EVAL005',
    operarioId: '4',
    operarioNombre: 'Ana Martínez',
    area: 'Área 3',
    cuadrante: 'C4',
    variedad: 'Avalanche+',
    proceso: 'Cosecha',
    subproceso: 'Enmallado',
    evaluacion: {
      E001: { cumple: false, observacion: 'Nivel de agua insuficiente' },
      E002: { cumple: true },
      E003: { cumple: true },
      E004: { cumple: true },
      E005: { cumple: true },
    },
    resultado: {
      puntajeMaximo: 100,
      puntajeObtenido: 75,
      porcentajeCumplimiento: 75,
      parametrosNoCumplidos: ['E001'],
      parametrosCumplidos: ['E002', 'E003', 'E004', 'E005'],
    },
    observaciones: 'Mejorar control de nivel de agua',
    fechaRegistro: '2024-01-16T08:45:00Z',
    evaluadorId: '3',
    evaluadorNombre: 'Juan Pérez',
  },

  // Evaluaciones de Postcosecha - Carlos Rodríguez
  {
    id: 'EVAL006',
    operarioId: '3',
    operarioNombre: 'Carlos Rodríguez',
    area: 'Postcosecha',
    mesa: 'Mesa 1',
    variedad: 'Explorer',
    proceso: 'Postcosecha',
    subproceso: 'Clasificación',
    evaluacion: {
      PC001: { cumple: true },
      PC002: { cumple: true },
      PC003: { cumple: false, observacion: 'Tallos mal clasificados por longitud' },
      PC004: { cumple: true },
    },
    resultado: {
      puntajeMaximo: 100,
      puntajeObtenido: 82,
      porcentajeCumplimiento: 82,
      parametrosNoCumplidos: ['PC003'],
      parametrosCumplidos: ['PC001', 'PC002', 'PC004'],
    },
    observaciones: 'Revisar criterios de clasificación por longitud',
    fechaRegistro: '2024-01-17T14:20:00Z',
    evaluadorId: '3',
    evaluadorNombre: 'Juan Pérez',
  },
];