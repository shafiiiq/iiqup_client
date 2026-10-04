import { useCallback, useRef } from 'react';

export const useStableCallback = (callback) => {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  return useCallback((...callbackArguments) => callbackRef.current(...callbackArguments), []);
};