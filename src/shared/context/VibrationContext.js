import React, { createContext, useContext, useState } from 'react';

const VibrationContext = createContext();

export const HeaderVibrationProvider = ({ children }) => {
  const [shouldVibrate, setShouldVibrate] = useState(false);

  const triggerVibration = () => {
    setShouldVibrate(true);
  };

  const resetVibration = () => {
    setShouldVibrate(false);
  };

  return (
    <VibrationContext.Provider
      value={{
        shouldVibrate,
        triggerVibration,
        resetVibration
      }}
    >
      {children}
    </VibrationContext.Provider>
  );
};

export const useHeaderVibration = () => {
  const context = useContext(VibrationContext);
  if (!context) {
    throw new Error('useHeaderVibration must be used within a HeaderVibrationProvider');
  }
  return context;
};