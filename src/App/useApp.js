import { useState, createContext, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { readOnboardSeen } from '@/features/core/device/storage/keys/keys.app.flags';
import { verifyStoredSession } from '@/features/screen/authn/services/authn.session.service';
import { apiRequest } from '@/features/core/network/api/api.request';
import socketService from '@/features/core/network/socket/socket.service';
import { useNotificationBootstrap } from '@/features/core/messaging/notification/provider/useNotificationBootstrap';
import { HEADERLESS_PREFIXES, HEADERLESS_ROUTES, NAVIGATOR_HIDDEN_ROUTES } from '@/App/App.constant';

export const AuthContext = createContext();

export const useIsNavigatorVisible = () => {
  const location = useLocation();
  return !NAVIGATOR_HIDDEN_ROUTES.includes(location.pathname);
};

export const useIsHeaderVisible = (userLoggedIn) => {
  const location = useLocation();
  return (
    userLoggedIn &&
    !HEADERLESS_ROUTES.includes(location.pathname) &&
    !HEADERLESS_PREFIXES.some((prefix) => location.pathname.startsWith(prefix))
  );
};

export const useIsSpacerVisible = () => {
  const location = useLocation();
  return (
    !HEADERLESS_ROUTES.includes(location.pathname) &&
    !HEADERLESS_PREFIXES.some((prefix) => location.pathname.startsWith(prefix))
  );
};

export const useAuthContextValue = () => useContext(AuthContext);

export const useApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isPdfRender = new URLSearchParams(location.search).get('pdf') === '1';

  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);

  useNotificationBootstrap({ isUserLoggedIn: userLoggedIn });

  useEffect(() => {
    const splashShown = sessionStorage.getItem('splashShown');

    if (!splashShown) {
      setShowSplash(true);
      sessionStorage.setItem('splashShown', 'true');
    } else {
      setSplashComplete(true);
    }
  }, []);

  useEffect(() => {
    if (!showSplash) return undefined;

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      setTimeout(() => setSplashComplete(true), 800);
    }, 5000);

    return () => clearTimeout(splashTimer);
  }, [showSplash]);

  useEffect(() => {
    if (!splashComplete) return;

    const initializeAuth = async () => {
      if (!readOnboardSeen()) {
        navigate('/onboard');
        setLoading(false);
        return;
      }

      setUserLoggedIn(await verifyStoredSession());

      if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
      }

      setLoading(false);
    };

    initializeAuth();
  }, [navigate, splashComplete]);

  useEffect(() => {
    if (userLoggedIn) socketService.connect();
    else socketService.disconnect();
  }, [userLoggedIn]);

  useEffect(() => {
    if (!userLoggedIn) return;

    const checkForNewReleases = async () => {
      try {
        const response = await apiRequest('/explorer/release/latest', 'GET');
        const data = await response.json();

        if (data.status === 200 && data.data && !data.data.hasExploredThisVersion) {
          navigate('/explorer');
        }
      } catch (error) {
        console.error('[useApp] failed to check latest release:', error);
      }
    };

    checkForNewReleases();
  }, [userLoggedIn, navigate]);

  return {
    isPdfRender,
    userLoggedIn,
    setUserLoggedIn,
    loading,
    showSplash,
    splashComplete,
  };
};