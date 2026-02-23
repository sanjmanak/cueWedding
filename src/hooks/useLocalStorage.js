import { useState, useCallback, useRef } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const valueRef = useRef(storedValue);

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(valueRef.current) : value;
      valueRef.current = valueToStore;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }, [key]);

  const removeValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      console.error('Error removing from localStorage:', error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}
