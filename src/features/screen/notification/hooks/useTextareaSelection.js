import { useEffect } from 'react';

export const useTextareaSelection = ({ textareaRef, selection, onSelectionApplied }) => {
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!selection || !textarea) return;
    textarea.focus();
    textarea.setSelectionRange(selection.start, selection.end);
    onSelectionApplied();
  }, [selection]);
};