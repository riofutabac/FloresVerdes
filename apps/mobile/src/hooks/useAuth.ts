import { useAppStore } from '../store';

// 🎯 Hook personalizado para autenticación
export const useAuth = () => {
  const { user, isAuthenticated, login, logout } = useAppStore();

  return {
    user,
    isAuthenticated,
    login,
    logout,
    isAdmin: user?.role === 'admin',
    isGerente: user?.role === 'gerente', 
    isJefeCalidad: user?.role === 'jefe_calidad',
  };
};