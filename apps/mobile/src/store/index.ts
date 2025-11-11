import { create } from 'zustand';
import { AppState, User } from '../types';
import { authService } from '../services/auth.service';

interface AppStore extends AppState {
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  login: (user: User) => void;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isOnline: true,
  syncStatus: 'idle',
  isLoading: true,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setOnlineStatus: (isOnline) => set({ isOnline }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  
  login: (user) => set({ user, isAuthenticated: true }),
  
  logout: async () => {
    await authService.logout();
    set({ user: null, isAuthenticated: false });
  },
  
  restoreSession: async () => {
    set({ isLoading: true });
    const user = await authService.restoreSession();
    
    if (user) {
      set({ user, isAuthenticated: true, isLoading: false });
    } else {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));