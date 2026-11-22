import { useState, useEffect } from 'react';

export const useMultiSelectModifierKey = () => {
  const [isPressed, setIsPressed] = useState(false);

  useEffect(() => {
    const syncFromEvent = (event) => setIsPressed(event.metaKey || event.ctrlKey);
    const release = () => setIsPressed(false);

    window.addEventListener('keydown', syncFromEvent);
    window.addEventListener('keyup', syncFromEvent);
    window.addEventListener('blur', release);
    return () => {
      window.removeEventListener('keydown', syncFromEvent);
      window.removeEventListener('keyup', syncFromEvent);
      window.removeEventListener('blur', release);
    };
  }, []);

  return isPressed;
};

export default useMultiSelectModifierKey;