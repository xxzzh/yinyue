import { createContext, useContext, useEffect, useId } from 'react';
import type { Progress } from './progress';

export interface LearningState {
  progress: Progress;
  update: (action: (previous: Progress) => Progress) => void;
  complete: (id: string) => void;
  exercise: () => void;
  notify: (message: string) => void;
  activity: (id: string, active: boolean) => void;
}
export const LearningContext = createContext<LearningState | null>(null);
export function useLearning() {
  const context = useContext(LearningContext);
  if (!context) throw new Error('LearningProvider missing');
  return context;
}
export function useStudyClock(active: boolean) {
  const { activity } = useLearning();
  const id = useId();
  useEffect(() => {
    activity(id, active);
    return () => activity(id, false);
  }, [active, activity, id]);
}
