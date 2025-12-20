import { createContext, useContext, useState } from 'react';

const HeaderTitleContext = createContext();

export const HeaderTitleProvider = ({ children }) => {
  const [headerTitle, setHeaderTitle] = useState(null);
  const [headerSubtitle, setHeaderSubtitle] = useState(null);

  return (
    <HeaderTitleContext.Provider value={{ headerTitle, setHeaderTitle, headerSubtitle, setHeaderSubtitle }}>
      {children}
    </HeaderTitleContext.Provider>
  );
};

export const useHeaderTitle = () => {
  const context = useContext(HeaderTitleContext);
  if (!context) {
    throw new Error('useHeaderTitle must be used within HeaderTitleProvider');
  }
  return context;
};