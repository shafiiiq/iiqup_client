import { useCallback, useState } from 'react';

export const useComposerActionMode = () => {
  const [mode, setMode] = useState('send');
  const toggleMode = useCallback(() => setMode((currentMode) => (currentMode === 'send' ? 'voice' : 'send')), []);
  return { mode, toggleMode };
};