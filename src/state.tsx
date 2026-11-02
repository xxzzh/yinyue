import { useCallback, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { addActivity, completeLesson, readProgress, STORAGE_KEY } from './progress';
import type { Progress } from './progress';
import { setVolume } from './audio';
import { LearningContext } from './learning';
export function LearningProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(readProgress);
  const [progress, setProgress] = useState(initial.progress);
  const [toast, setToast] = useState('');
  const [dirty, setDirty] = useState(false);
  const [activeIds, setActiveIds] = useState<Set<string>>(() => new Set());
  const lastWarning = useRef('');
  const notify = useCallback((message: string) => setToast(message), []);
  const update = useCallback((action: (previous: Progress) => Progress) => { setDirty(true); setProgress(action); }, []);
  const activity = useCallback((id: string, active: boolean) => setActiveIds(previous => {
    const next = new Set(previous); if (active) next.add(id); else next.delete(id); return next;
  }), []);
  const studying = activeIds.size > 0;
  useEffect(() => {
    if (!studying) return;
    let previous = performance.now();
    const timer = setInterval(() => {
      const now = performance.now();
      const elapsed = Math.min(2, (now - previous) / 1000);
      previous = now;
      if (document.visibilityState === 'visible' && document.hasFocus()) update(state => addActivity(state, { seconds: elapsed }));
    }, 1000);
    return () => clearInterval(timer);
  }, [studying, update]);
  useEffect(() => { if (initial.warning) setToast(initial.warning); }, [initial]);
  useEffect(() => {
    setVolume(progress.volume);
    if (!dirty) return;
    try {
      if (initial.warning && !localStorage.getItem(`${STORAGE_KEY}.recovery`)) {
        const old = localStorage.getItem(STORAGE_KEY);
        if (old) localStorage.setItem(`${STORAGE_KEY}.recovery`, old);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch {
      const warning = '浏览器未允许保存记录；本次进度仍可查看，请及时导出备份。';
      if (lastWarning.current !== warning) { lastWarning.current = warning; setToast(warning); }
    }
  }, [progress, dirty, initial.warning]);
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 6000); return () => clearTimeout(timer); }, [toast]);
  const complete = useCallback((id: string) => update(previous => completeLesson(previous, id)), [update]);
  const exercise = useCallback(() => update(previous => addActivity(previous, { exercises: 1 })), [update]);
  return <LearningContext.Provider value={{ progress, update, complete, exercise, notify, activity }}>
    {children}<div className={`toast ${toast ? 'visible' : ''}`} role="status" aria-live="polite">{toast}</div>
  </LearningContext.Provider>;
}
