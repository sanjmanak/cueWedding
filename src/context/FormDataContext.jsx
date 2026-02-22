import { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { defaultDemoData } from '../data/demoData';

const FormDataContext = createContext(null);

export function FormDataProvider({ children }) {
  const [formData, setFormData, removeFormData] = useLocalStorage('cue-wedding-data', defaultDemoData);

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, [setFormData]);

  const updateNestedField = useCallback((parent, key, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...(prev[parent] || {}), [key]: value },
    }));
  }, [setFormData]);

  const resetToDemo = useCallback(() => {
    setFormData(defaultDemoData);
  }, [setFormData]);

  const clearAll = useCallback(() => {
    removeFormData();
  }, [removeFormData]);

  return (
    <FormDataContext.Provider value={{ formData, setFormData, updateField, updateNestedField, resetToDemo, clearAll }}>
      {children}
    </FormDataContext.Provider>
  );
}

export function useFormData() {
  const ctx = useContext(FormDataContext);
  if (!ctx) throw new Error('useFormData must be used within FormDataProvider');
  return ctx;
}
