import React, { createContext, useContext, useState } from 'react';

const HeaderVibrationContext = createContext();

export const HeaderVibrationProvider = ({ children }) => {
  const [shouldVibrate, setShouldVibrate] = useState(false);

  const triggerVibration = () => {
    setShouldVibrate(true);
  };

  const resetVibration = () => {
    setShouldVibrate(false);
  };

  return (
    <HeaderVibrationContext.Provider
      value={{
        shouldVibrate,
        triggerVibration,
        resetVibration
      }}
    >
      {children}
    </HeaderVibrationContext.Provider>
  );
};

export const useHeaderVibration = () => {
  const context = useContext(HeaderVibrationContext);
  if (!context) {
    throw new Error('useHeaderVibration must be used within a HeaderVibrationProvider');
  }
  return context;
};