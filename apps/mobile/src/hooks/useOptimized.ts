import { useState, useCallback, useMemo } from 'react';

// 🔧 Hook para gestión optimizada de formularios
export const useForm = <T extends Record<string, any>>(initialValues: T) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  // ⚡ Optimizado: Cambiar valor de un campo específico
  const setValue = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [field]: value }));
    // Limpiar error cuando el usuario empieza a escribir
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [errors]);

  // ⚡ Optimizado: Marcar campo como tocado
  const setFieldTouched = useCallback(<K extends keyof T>(field: K) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  }, []);

  // ⚡ Optimizado: Establecer error para un campo
  const setFieldError = useCallback(<K extends keyof T>(field: K, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  }, []);

  // ⚡ Optimizado: Resetear formulario
  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // ⚡ Optimizado: Validar si el formulario es válido
  const isValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  // ⚡ Optimizado: Verificar si algún campo ha sido modificado
  const isDirty = useMemo(() => {
    return JSON.stringify(values) !== JSON.stringify(initialValues);
  }, [values, initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    setFieldError,
    setErrors,
    reset,
    isValid,
    isDirty,
  };
};

// 🔧 Hook para gestión de listas (CRUD operations)
export const useList = <T extends { id: string }>(initialItems: T[] = []) => {
  const [items, setItems] = useState<T[]>(initialItems);

  const addItem = useCallback((item: T) => {
    setItems(prev => [...prev, item]);
  }, []);

  const updateItem = useCallback((id: string, updatedItem: Partial<T>) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updatedItem } : item
    ));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const findItem = useCallback((id: string) => {
    return items.find(item => item.id === id);
  }, [items]);

  const clear = useCallback(() => {
    setItems([]);
  }, []);

  return {
    items,
    addItem,
    updateItem,
    removeItem,
    findItem,
    clear,
    count: items.length,
  };
};

// 🔧 Hook para búsqueda y filtrado optimizado
export const useSearch = <T>(
  items: T[],
  searchFields: (keyof T)[],
  additionalFilters?: (item: T) => boolean
) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredItems = useMemo(() => {
    let filtered = items;

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        searchFields.some(field => {
          const value = item[field];
          return String(value).toLowerCase().includes(lowercaseSearch);
        })
      );
    }

    // Aplicar filtros adicionales
    if (additionalFilters) {
      filtered = filtered.filter(additionalFilters);
    }

    return filtered;
  }, [items, searchTerm, searchFields, additionalFilters]);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  return {
    searchTerm,
    setSearchTerm,
    clearSearch,
    filteredItems,
    hasResults: filteredItems.length > 0,
    resultCount: filteredItems.length,
  };
};

// 🔧 Hook para estado de carga y errores
export const useAsyncState = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async <T>(asyncFn: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await asyncFn();
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    clearError,
  };
};

// 🔧 Hook para persistencia local (AsyncStorage)
export const useLocalStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  const setValue = useCallback(async (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      // En una app real, aquí usarías AsyncStorage
      // await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
      
      // Por ahora, usar localStorage del navegador para pruebas
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.error(`Error saving to storage key "${key}":`, error);
    }
  }, [key, storedValue]);

  const removeValue = useCallback(async () => {
    try {
      setStoredValue(initialValue);
      
      // En una app real:
      // await AsyncStorage.removeItem(key);
      
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing storage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
};