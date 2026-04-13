import { useMemo } from 'react';
import { calculateAllPhases } from '../utils/progress';

export function useProgress(formData) {
  return useMemo(() => calculateAllPhases(formData), [formData]);
}
