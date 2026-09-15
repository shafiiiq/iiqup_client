import { useState, createContext, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { AuthUtils, checkAutoLogin } from '@/features/screen/oauth/login/helper/login.helper';
import { apiRequest } from '@/features/core/network/api/api.request';
import WebSocketService from '@/features/core/network/websocket/websocket';
import {
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  saveSubscriptionToServer,
} from '@/features/core/messaging/notification/webpush';
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

const fireBrowserNotification = (data) => {
  if (!('Notification' in window)) return;

  const showNotification = () => {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.showNotification(data.title || 'New Notification', {
          body: data.description || data.message || '',
          icon: '/logo192.png',
          badge: '/logo192.png',
        });
      })
      .catch(() => {
        new Notification(data.title || 'New Notification', {
          body: data.description || data.message || '',
          icon: '/logo192.png',
        });
      });
  };

  if (Notification.permission === 'granted') {
    showNotification();
    return;
  }

  if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') showNotification();
    });
  }
};

export const useApp = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isPdfRender = new URLSearchParams(location.search).get('pdf') === '1';

  const [liveNotification, setLiveNotification] = useState(null);
  const [serviceReportData, setServiceReportData] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);

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
    if (!showSplash) return;

    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      setTimeout(() => setSplashComplete(true), 800);
    }, 5000);

    return () => clearTimeout(splashTimer);
  }, [showSplash]);

  useEffect(() => {
    if (!splashComplete) return;

    const initializeAuth = async () => {
      const hasSeenIntro = localStorage.getItem('hasSeenIntro');

      if (!hasSeenIntro) {
        navigate('/intro');
        setLoading(false);
        return;
      }

      await checkAutoLogin(setUserLoggedIn, navigate);

      if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
      }

      setLoading(false);
    };

    initializeAuth();
  }, [navigate, splashComplete]);

  useEffect(() => {
    if (!userLoggedIn) {
      WebSocketService.disconnect();
      return;
    }

    const initializeWebSocketAndPush = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const uniqueCode = userData.uniqueCode || '';
        const sessionToken = userData.sessionToken || '';
        if (!uniqueCode) return;

        WebSocketService.connect(uniqueCode, sessionToken);

        const registration = await registerServiceWorker();
        const permitted = await requestNotificationPermission();
        if (!registration || !permitted) return;

        const subscription = await subscribeToPush(registration);
        await saveSubscriptionToServer(subscription, uniqueCode);
      } catch (error) {
        console.error('[useApp] websocket/push init error:', error);
      }
    };

    initializeWebSocketAndPush();

    const unsubscribe = WebSocketService.on('new_notification', (data) => {
      setLiveNotification({ ...data, _wsTimestamp: Date.now() });
      fireBrowserNotification(data);
    });

    return unsubscribe;
  }, [userLoggedIn]);

  useEffect(() => {
    if (!userLoggedIn) return;

    const checkForNewReleases = async () => {
      try {
        const response = await apiRequest(`/explorer/release/latest`, 'GET');
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

  useEffect(() => () => localStorage.setItem('theme', 'dark'), []);

  return {
    isPdfRender,
    liveNotification,
    serviceReportData,
    setServiceReportData,
    userLoggedIn,
    setUserLoggedIn,
    loading,
    showSplash,
    splashComplete,
  };
};