import React, { createContext, useContext, useState } from 'react';

const AlertContext = createContext();

export const useAlert = () => useContext(AlertContext);

export const AlertProvider = ({ children }) => {
    const [alert, setAlert] = useState(null);

    const showAlert = (message, icon, color) => {
        setAlert({ message, icon, color });
        setTimeout(() => setAlert(null), 3000);
    };

    return (
        <AlertContext.Provider value={{ alert, showAlert }}>
            {children}
        </AlertContext.Provider>
    );
};