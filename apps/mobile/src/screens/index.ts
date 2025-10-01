// Exportar todas las pantallas desde un solo archivo
export { HomeScreen } from './HomeScreen';
export { ProfileScreen } from './ProfileScreen';

// Pantallas de Autenticación
export * from './Auth';

// Pantallas de Cosecha (usando barrel export)
export * from './Cosecha';

// Pantallas de Administración
export * from './Administracion';

// Aquí puedes agregar más pantallas conforme las vayas creando:
// export * from './Postcosecha';
// export * from './Pruebas';
// export * from './Devoluciones';
// export * from './Reportes';