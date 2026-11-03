import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLogout } from '@/features/screen/authn/hooks/useLogout';
import { getProfileInitial } from '../helper/home.helper';

export const useHome = ({ currentUser, setUserLoggedIn }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const { logout } = useLogout({ setUserLoggedIn });
  const [activeLink, setActiveLink] = useState('/');
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location]);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      setIsDarkMode(true);
    }
  }, []);

  const handleNavSelect = (path) => {
    const routePath = path[0];
    setActiveLink(routePath);
    navigate(routePath);
  };

  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.body.classList.toggle('dark-theme', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) return;
    logout();
  };

  const profileInitial = getProfileInitial(currentUser?.name);

  return {
    activeLink,
    isDarkMode,
    profileInitial,
    handleNavSelect,
    toggleTheme,
    handleLogout,
  };
};

export default useHome;