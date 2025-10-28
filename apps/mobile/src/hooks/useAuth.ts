import { useMemo } from 'react';
import { useAppStore } from '../store';

// 🎯 Hook personalizado para autenticación optimizado
export const useAuth = () => {
  const { user, isAuthenticated, login, logout } = useAppStore();

  // ⚡ Memoizar permisos para evitar recalcular en cada render
  const permissions = useMemo(() => ({
    isAdmin: user?.role === 'admin',
    isGerente: user?.role === 'gerente', 
    isJefeCalidad: user?.role === 'jefe_calidad',
    canManageOperarios: user?.role === 'admin' || user?.role === 'gerente',
    canViewReports: true, // Todos pueden ver reportes
    canExportReports: user?.role === 'admin' || user?.role === 'gerente',
    canManageParameters: user?.role === 'admin',
    canManageVarieties: user?.role === 'admin' || user?.role === 'gerente',
  }), [user?.role]);

  // ⚡ Memoizar información del usuario
  const userInfo = useMemo(() => ({
    id: user?.id,
    name: user?.name,
    email: user?.email,
    role: user?.role,
    firstName: user?.name?.split(' ')[0] || 'Usuario',
    initials: user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U',
  }), [user]);

  return {
    user,
    userInfo,
    isAuthenticated,
    login,
    logout,
    ...permissions,
  };
};