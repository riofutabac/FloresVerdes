// Re-exportar tipos para uso local
export * from '@flores-verdes/shared-types';
import { User } from '@flores-verdes/shared-types';

// Tipos específicos del frontend
export type NavigationParams = {
  Home: undefined;
  Login: undefined;
  Evaluacion: { loteId?: string };
  Profile: undefined;
};

export type AppState = {
  user: User | null;
  isAuthenticated: boolean;
  isOnline: boolean;
  syncStatus: 'idle' | 'syncing' | 'error';
};