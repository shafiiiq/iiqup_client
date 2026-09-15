import { useCallback, useEffect, useRef, useState } from 'react';

export const useModalController = ({
  isOpen,
  onClose,
  autoClose,
  autoCloseDelay,
  closable,
  submitOnEnter,
  onSubmit,
}) => {
  const [visible, setVisible] = useState(false);
  const modalRef = useRef(null);
  const autoCloseRef = useRef(null);
  const lastActiveRef = useRef(null);
  const latestRef = useRef({});

  latestRef.current = { onClose, autoClose, autoCloseDelay, closable, submitOnEnter, onSubmit };

  const focusFirstElement = useCallback(() => {
    if (!modalRef.current) return;
    const target = modalRef.current.querySelector(
      'input, button, a, [tabindex]:not([tabindex="-1"])'
    );
    if (target) target.focus();
    else modalRef.current.focus();
  }, []);

  const requestClose = useCallback(() => {
    const { closable, onClose } = latestRef.current;
    if (!closable) return;
    clearTimeout(autoCloseRef.current);
    setVisible(false);
    setTimeout(() => {
      onClose();
      if (lastActiveRef.current?.focus) lastActiveRef.current.focus();
    }, 360);
  }, []);

  const trapTab = useCallback((event) => {
    if (!modalRef.current) return;
    const focusable = Array.from(
      modalRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((node) => node.offsetParent !== null);

    if (focusable.length === 0) {
      event.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      if (lastActiveRef.current?.focus) lastActiveRef.current.focus();
      return undefined;
    }

    lastActiveRef.current = document.activeElement;
    setVisible(true);

    const rafId = window.requestAnimationFrame(focusFirstElement);

    const { autoClose, autoCloseDelay, closable } = latestRef.current;
    if (autoClose && closable) {
      autoCloseRef.current = setTimeout(requestClose, autoCloseDelay);
    }

    const handleKeyDown = (event) => {
      const { closable, submitOnEnter, onSubmit } = latestRef.current;
      if (event.key === 'Escape' && closable) {
        event.preventDefault();
        requestClose();
      } else if (event.key === 'Tab') {
        trapTab(event);
      } else if (event.key === 'Enter' && submitOnEnter && onSubmit) {
        event.preventDefault();
        onSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(rafId);
      clearTimeout(autoCloseRef.current);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, focusFirstElement, requestClose, trapTab]);

  return { visible, modalRef, requestClose };
};