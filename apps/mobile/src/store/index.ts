import { create } from 'zustand';
import { AppState, User } from '../types';

interface AppStore extends AppState {
  setUser: (user: User | null) => void;
  setOnlineStatus: (isOnline: boolean) => void;
  setSyncStatus: (status: 'idle' | 'syncing' | 'error') => void;
  login: (user: User) => void;
  logout: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isOnline: true,
  syncStatus: 'idle',
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setOnlineStatus: (isOnline) => set({ isOnline }),
  setSyncStatus: (syncStatus) => set({ syncStatus }),
  
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));