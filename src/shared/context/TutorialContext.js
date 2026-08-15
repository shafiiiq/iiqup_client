import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiRequest } from '@shared/utils/api';
import { API_URI } from '@shared/constants';
import '@shared/components/Tutorial/Tutorial.css';
import { TutorialContext, TutorialSpotlight } from '@shared/components/TutorialSpotlight/TutorialSpotlight';

export { useTutorial } from '@shared/components/TutorialSpotlight/TutorialSpotlight';

export function TutorialProvider({ children }) {
  const [completedTutorials, setCompletedTutorials] = useState(new Set());
  const [loaded, setLoaded] = useState(false);

  const registry = useRef([]);
  const startedRef = useRef(false);
  const [activeIndex, setActiveIndex] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user._id) { setLoaded(true); return; }

        const res = await apiRequest(`${API_URI}/users/tutorials`, 'GET');
        if (res.ok) {
          const data = await res.json();
          setCompletedTutorials(new Set(data.tutorialsSeen || []));
        }
      } catch (_) {}
      setLoaded(true);
    };
    load();
  }, []);

  const register = useCallback((id, ref, title, description, order) => {
    registry.current = [
      ...registry.current.filter(r => r.id !== id),
      { id, ref, title, description, order }
    ].sort((a, b) => a.order - b.order);

    // Try to auto-start after each registration, debounced
    clearTimeout(registry._startTimer);
    registry._startTimer = setTimeout(() => {
      if (startedRef.current) return;
      const pending = registry.current.filter(r => !completedTutorials.has(r.id));
      if (pending.length > 0) {
        setActiveIndex(0);
        startedRef.current = true;
      }
    }, 300);
  }, [completedTutorials]);

  const unregister = useCallback((id) => {
    registry.current = registry.current.filter(r => r.id !== id);
  }, []);

  const startTutorials = useCallback(() => {
    const pending = registry.current.filter(r => !completedTutorials.has(r.id));
    if (pending.length === 0) return;
    startedRef.current = true;
    setActiveIndex(0);
  }, [completedTutorials]);
  
  const pendingSteps = useCallback(() => registry.current.filter(r => !completedTutorials.has(r.id)), [completedTutorials]);

  const currentStep = useCallback(() => {
    const pending = pendingSteps();
    return activeIndex !== null ? pending[activeIndex] || null : null;
  }, [activeIndex, pendingSteps]);

  const markDone = useCallback(async (id) => {
    try {
      await apiRequest(`${API_URI}/users/tutorials/complete`, 'POST', { tutorialId: id });
    } catch (_) {}
    setCompletedTutorials(prev => new Set([...prev, id]));
  }, []);

  const goNext = useCallback(async () => {
    const step = currentStep();
    if (!step) return;
    await markDone(step.id);

    const pending = pendingSteps().filter(r => r.id !== step.id);
    if (activeIndex < pending.length) {
      setActiveIndex(activeIndex);
    } else {
      setActiveIndex(null);
      startedRef.current = false;
    }
  }, [activeIndex, currentStep, markDone, pendingSteps]);

  const goPrev = useCallback(() => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
  }, [activeIndex]);

  const skip = useCallback(() => {
    const pending = pendingSteps();
    if (activeIndex < pending.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      setActiveIndex(null);
      startedRef.current = false;
    }
  }, [activeIndex, pendingSteps]);

  const done = useCallback(async () => {
    const step = currentStep();
    if (step) await markDone(step.id);
    setActiveIndex(null);
    startedRef.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, markDone]);

  const close = useCallback(() => {
    setActiveIndex(null);
    startedRef.current = false;
  }, []);

  const activeStep = currentStep();
  const pendingCount = pendingSteps().length;

  return (
    <TutorialContext.Provider value={{
      register, unregister, activeStep,
      goNext, goPrev, skip, done, close,
      activeIndex, pendingCount, loaded,
      isFirst: activeIndex === 0,
      isLast:  activeIndex === pendingCount - 1,
      startTutorials,
    }}>
      {children}
      {activeStep && <TutorialSpotlight />}
    </TutorialContext.Provider>
  );
}