import { createContext, useContext, useEffect, useState } from 'react';

const NavTreeContext = createContext();

export function NavTreeProvider({ children }) {
  const [registration, setRegistration] = useState(null);
  return (
    <NavTreeContext.Provider value={{ registration, setRegistration }}>
      {children}
    </NavTreeContext.Provider>
  );
}

export function useRegisterNavTree({ rootLabel, rootIcon, tree, selectedPath, onSelect }) {
  const { setRegistration } = useContext(NavTreeContext);

  useEffect(() => {
    setRegistration({ rootLabel, rootIcon, tree, selectedPath, onSelect });
    return () => setRegistration(null);
  }, [rootLabel, rootIcon, tree, selectedPath, onSelect, setRegistration]);
}

export function useNavTree() {
  return useContext(NavTreeContext);
}