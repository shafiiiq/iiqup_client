import { useEffect, useState } from 'react';

export const useNowTicker = (isActive) => {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!isActive) return undefined;
    setNow(Date.now());
    const intervalId = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(intervalId);
  }, [isActive]);

  return now;
};