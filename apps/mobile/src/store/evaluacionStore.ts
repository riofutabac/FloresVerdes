import { create } from 'zustand';
import { sqliteManager } from '../core/sync/SQLiteManager';

interface Evaluacion {
  id?: number;
  uuid?: string;
  operario: string;
  variedad: string;
  lote: string;
  calidad: number;
  cantidad: number;
  observaciones: string;
  tieneDefectos: boolean;
  fechaCreacion?: string;
  synced?: boolean;
}

interface EvaluacionState {
  evaluaciones: Evaluacion[];
  loading: boolean;
  error: string | null;
  
  // Actions
  addEvaluacion: (evaluacion: Evaluacion) => Promise<void>;
  loadEvaluaciones: () => Promise<void>;
  clearError: () => void;
}

export const useEvaluacionStore = create<EvaluacionState>((set, get) => ({
  evaluaciones: [],
  loading: false,
  error: null,

  addEvaluacion: async (evaluacion: Evaluacion) => {
    try {
      set({ loading: true, error: null });
      
      await sqliteManager.insertEvaluacion(evaluacion);
      
      // Reload evaluaciones from database
      await get().loadEvaluaciones();
      
      set({ loading: false });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Error al guardar evaluación' 
      });
    }
  },

  loadEvaluaciones: async () => {
    try {
      set({ loading: true, error: null });
      
      const evaluaciones = await sqliteManager.getEvaluaciones();
      
      set({ 
        evaluaciones: evaluaciones as Evaluacion[], 
        loading: false 
      });
    } catch (error) {
      set({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Error al cargar evaluaciones' 
      });
    }
  },

  clearError: () => set({ error: null }),
}));