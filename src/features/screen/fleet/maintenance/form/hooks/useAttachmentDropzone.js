import { useState, useRef, useEffect, useCallback } from 'react';

export const useAttachmentDropzone = (onFilesSelected) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const handlePaste = (event) => {
      const pastedFiles = Array.from(event.clipboardData?.files || []);
      if (pastedFiles.length === 0) return;
      event.preventDefault();
      onFilesSelected(pastedFiles);
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [onFilesSelected]);

  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setIsDragging(false);
      onFilesSelected(Array.from(event.dataTransfer.files));
    },
    [onFilesSelected]
  );

  const handleInputChange = useCallback(
    (event) => {
      onFilesSelected(Array.from(event.target.files));
      event.target.value = '';
    },
    [onFilesSelected]
  );

  const openFileExplorer = useCallback(() => fileInputRef.current?.click(), []);

  return { isDragging, fileInputRef, handleDragOver, handleDragLeave, handleDrop, handleInputChange, openFileExplorer };
};