import React, { useEffect, useRef, useMemo } from 'react';
import { useTutorial } from '../../Context/TutorialContext';

function hashKey(str) {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
    hash = hash >>> 0; // keep unsigned 32-bit
  }
  const base36 = hash.toString(36).toUpperCase();
  const padded = base36.padStart(7, '0');
  // Build 25-char key: TUT-XXXXXXX-XXXXXXXXXXXXXXX
  const suffix = (str.length * 31 + hash).toString(36).toUpperCase().padStart(15, '0').slice(0, 15);
  return `TUT-${padded}-${suffix}`;
}

function Tutorial({ id, title, description, order = 99, children }) {
  const ref = useRef(null);
  const ctx = useTutorial();

  const stableId = useMemo(() => {
    return id || hashKey(`${title}::${description}`);
  }, [id, title, description]);

  useEffect(() => {
    if (!ctx) return;
    ctx.register(stableId, ref, title, description, order);
    return () => ctx.unregister(stableId);
  }, [stableId, title, description, order]);

  const isActive = ctx?.activeStep?.id === stableId;

  return (
    <div
      ref={ref}
      className={`tut-target ${isActive ? 'tut-target-active' : ''}`}
      style={{ position: 'relative', zIndex: isActive ? 10001 : undefined }}
    >
      {children}
    </div>
  );
}

export default Tutorial;