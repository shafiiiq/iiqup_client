// ─────────────────────────────────────────────────────────────────────────────
// App.jsx — Root application entry point
// Handles routing, authentication gating, splash screen, and global context.
// ─────────────────────────────────────────────────────────────────────────────

import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useState, createContext, useEffect } from 'react';

import { AuthUtils, checkAutoLogin } from './utils/authUtils';
import { SearchProvider }           from './Context/SearchContext';
import { HeaderTitleProvider }      from './Context/HeaderTitleContext';
import { HeaderVibrationProvider }  from './Context/HeaderVibrationContext';
import { AlertProvider }            from './Context/AlertContext';
import { TutorialProvider }         from './Context/TutorialContext';
import { END_POINT }                from './constants';
import { apiRequest }               from './utils/api';

// ── Websocket ──────────────────────────────────────────────────────────
import WebSocketService             from './websocket/websocket';
import { registerServiceWorker, requestNotificationPermission, subscribeToPush, showNativeNotification, saveSubscriptionToServer } from './utils/webPush';

// ── Page Components ──────────────────────────────────────────────────────────
import Home                    from './Components/Home/Home';
import ServiceDoc              from './Components/ServiceDoc/ServiceDoc';
import ServiceForm             from './Components/ServiceForm/ServiceForm';
import Equipments              from './Components/Equipments/Equipments';
import ServiceHistory          from './Components/ServiceHistory/ServiceHistory';
import ServiceHistorySummary   from './Components/ServiceHistorySummary/ServiceHistorySummary';
import NotificationPage        from './Components/Notification/Notification';
import Documents               from './Components/Documents/Documents';
import Dashboard               from './Components/Dashboard/Dashboard';
import Lpo                     from './Components/Lpo/Lpo';
import LpoList                 from './Components/LpoList/LpoList';
import LpoDoc                  from './Components/LpoDoc/LpoDoc';
import Toolkits                from './Components/Toolkits/Toolkits';
import Mechanics               from './Components/Mechanics/Mechanics';
import Operators               from './Components/Operators/Operators';
import StockManage             from './Components/StockManage/StockManage';
import Complaints              from './Components/Complaints/Complaints';
import BackchargeForm          from './Components/BackchargeForm/BackchargeForm';
import BackchargeDoc           from './Components/BackchargeDoc/BackchargeDoc';
import BackchargeList          from './Components/BackchargeList/BackchargeList';
import FormNavigation          from './Components/FormNavigation/FormNavigation';
import OperationsActivities    from './Components/OperationsActivities/OperationsActivities';
import ServiceHistoryEntryForm from './Components/ServiceHistoryEntryForm/ServiceHistoryEntryForm';

// ── Common / Shared Components ───────────────────────────────────────────────
import Header            from './Components/Common/Header/Header';
import EquipBypass       from './Components/Common/EquipBypass/EquipBypass';
import Login             from './Components/Common/Login/Login';
import NavigationButtons from './Components/Common/NavigationButtons/NavigationButtons';
import Spacer            from './Components/Spacer/Spacer';
import SplashScreen      from './splash/SplashScreen';
import NotFound          from './Common/NotFound/NotFound';
import Intro             from './Common/Intro/Intro';

import './App.css';

// ─────────────────────────────────────────────────────────────────────────────
// Global Contexts
// ─────────────────────────────────────────────────────────────────────────────

export const ServiceReportContext = createContext();
export const AuthContext          = createContext();

// ─────────────────────────────────────────────────────────────────────────────
// Route Configuration
// Routes and prefixes where the Header should NOT be rendered.
// ─────────────────────────────────────────────────────────────────────────────

const HEADERLESS_ROUTES = ['/login', '/', '/not-found', '/splash', '/intro'];

const HEADERLESS_PREFIXES = ['/service-doc', '/all', '/battery-doc', '/tyre-doc'];

// Full list of valid app routes — used to detect unknown paths.
const VALID_ROUTES = [
  '/', '/login', '/dashboard', '/equipments', '/service-history',
  '/notification', '/stocks', '/equipment-updates', '/stock-manage',
  '/documents', '/backcharge-form', '/backcharge-list', '/backcharge-doc',
  '/complaints', '/application-form', '/application-hr', '/toolkits',
  '/mechanics', '/mechanics-forms', '/operators', '/live-chat',
  '/splash', '/intro', '/not-found', '/dev-modal',
  '/stocks/equipment-stocks', '/service-histoy/summary', '/lpo-list',
  '/operations-recent-activities',
];

const VALID_PREFIXES = [
  '/all/', '/service-document/', '/service-form-nav/', '/service-form/',
  '/service-history/', '/maintenance-history/', '/tyre-history/',
  '/battery-history/', '/service-history-form/', '/tyre-history-form/',
  '/battery-history-form/', '/maintenance-history-form/',
  '/equipment-stocks-form/', '/documents/', '/backcharge-doc/',
  '/complaints/', '/lpo-form/', '/lpo-doc/', '/lpo-list/',
];

/** Returns true if the given pathname is a known app route. */
const isValidRoute = (pathname) =>
  VALID_ROUTES.includes(pathname) ||
  VALID_PREFIXES.some((prefix) => pathname.startsWith(prefix));

// ─────────────────────────────────────────────────────────────────────────────
// ProtectedRoute
// Blocks unauthenticated users from accessing protected routes.
// ─────────────────────────────────────────────────────────────────────────────

function ProtectedRoute({ children }) {
  const { isValid } = AuthUtils.checkUserSession();

  if (!isValid) return <Navigate to="/login" replace />;

  return children;
}

// ─────────────────────────────────────────────────────────────────────────────
// HeaderWrapper
// Conditionally renders the Header based on route.
// ─────────────────────────────────────────────────────────────────────────────

function HeaderWrapper({ userLoggedIn, setUserLoggedIn }) {
  const location = useLocation();

  const hideHeader =
    HEADERLESS_ROUTES.includes(location.pathname) ||
    HEADERLESS_PREFIXES.some((prefix) => location.pathname.startsWith(prefix)) ||
    !isValidRoute(location.pathname);

  if (hideHeader || !userLoggedIn) return null;

  return (
    <Header
      user_logged_in={userLoggedIn}
      currentUser={AuthUtils.getCurrentUser()}
      setUserLoggedIn={setUserLoggedIn}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SpacerWrapper
// Renders a vertical spacer on all valid, non-headerless routes.
// ─────────────────────────────────────────────────────────────────────────────

function SpacerWrapper() {
  const location = useLocation();

  const hideSpacer =
    HEADERLESS_ROUTES.includes(location.pathname) ||
    !isValidRoute(location.pathname);

  if (hideSpacer) return null;

  return <Spacer vertical="4rem" horizontal="100%" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// App — Core application shell
// Manages auth initialization, splash screen, and the route tree.
// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const navigate = useNavigate();

  const [liveNotification,  setLiveNotification]  = useState(null);
  const [serviceReportData, setServiceReportData] = useState(null);
  const [userLoggedIn,      setUserLoggedIn]      = useState(false);
  const [loading,           setLoading]           = useState(true);
  const [showSplash,        setShowSplash]        = useState(false);
  const [splashComplete,    setSplashComplete]    = useState(false);

  // ── Splash Screen ──────────────────────────────────────────────────────────
  // Show the splash screen once per browser session.

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

    // Auto-dismiss splash after 5 seconds, with a short fade-out delay.
    const splashTimer = setTimeout(() => {
      setShowSplash(false);
      setTimeout(() => setSplashComplete(true), 800);
    }, 5000);

    return () => clearTimeout(splashTimer);
  }, [showSplash]);

  // ── Auth Initialization ────────────────────────────────────────────────────
  // Runs after splash completes. Checks intro, auto-login, and theme.

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

      // Apply saved theme preference
      if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
      }

      setLoading(false);
    };

    initializeAuth();
  }, [navigate, splashComplete]);

  // ── WebSocket Lifecycle ────────────────────────────────────────────────────

  useEffect(() => {
    if (!userLoggedIn) {
      WebSocketService.disconnect();
      return;
    }

    const init = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const uniqueCode = userData.uniqueCode || '';
        const sessionToken = userData.sessionToken || '';
        if (!uniqueCode) return;

        WebSocketService.connect(uniqueCode, sessionToken);

        const reg = await registerServiceWorker();
        console.log('[App] SW registered:', reg);
        const permitted = await requestNotificationPermission();
        console.log('[App] notification permission:', permitted);
        if (!reg || !permitted) return;

        const subscription = await subscribeToPush(reg);
        await saveSubscriptionToServer(subscription, uniqueCode);

      } catch (error) {
        console.error('[App] init error:', error);
      }
    };

    init();

    const unsubscribe = WebSocketService.on('new_notification', (data) => {
      console.log('[App] new_notification received:', data);
      setLiveNotification({ ...data, _wsTimestamp: Date.now() });

      if (!('Notification' in window)) return;

      const fire = () => {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(data.title || 'New Notification', {
            body: data.description || data.message || '',
            icon: '/logo192.png',
            badge: '/logo192.png',
          });
        }).catch(() => {
          new Notification(data.title || 'New Notification', {
            body: data.description || data.message || '',
            icon: '/logo192.png',
          });
        });
      };

      if (Notification.permission === 'granted') {
        fire();
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((perm) => {
          if (perm === 'granted') fire();
        });
      }
    });

    return unsubscribe;
  }, [userLoggedIn]);

  // ── New Release Check ──────────────────────────────────────────────────────
  // After login, redirect to /explorer if user hasn't seen the latest release.

  useEffect(() => {
    if (!userLoggedIn) return;

    const checkForNewReleases = async () => {
      try {
        const response = await apiRequest(`${END_POINT}/explorer/get-latest-release-for-user`, 'GET');
        const data     = await response.json();

        if (data.status === 200 && data.data && !data.data.hasExploredThisVersion) {
          navigate('/explorer');
        }
      } catch (err) {
        console.error('Failed to check latest release:', err);
      }
    };

    checkForNewReleases();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoggedIn]);

  // ── Theme Persistence ──────────────────────────────────────────────────────
  // Ensure dark theme is persisted on unmount.

  useEffect(() => {
    return () => localStorage.setItem('theme', 'dark');
  }, []);

  // ── Splash / Loading Guards ────────────────────────────────────────────────

  if (showSplash || (!showSplash && !splashComplete)) return <SplashScreen />;

  if (loading) {
    return (
      <div style={{
        display:        'flex',
        justifyContent: 'center',
        alignItems:     'center',
        height:         '100vh',
        background:     'var(--text-inverse)',
        color:          'var(--text-color)',
        fontSize:       '18px',
      }} />
    );
  }

  // ── Route Tree ─────────────────────────────────────────────────────────────

  return (
    <AuthContext.Provider value={{ userLoggedIn, setUserLoggedIn }}>
      <ServiceReportContext.Provider value={{ serviceReportData, setServiceReportData }}>
        <TutorialProvider>
          <AlertProvider>
            <SearchProvider>
              <HeaderTitleProvider>
                <HeaderVibrationProvider>

                  {/* Persistent UI — always rendered above routes */}
                  <HeaderWrapper userLoggedIn={userLoggedIn} setUserLoggedIn={setUserLoggedIn} />
                  <SpacerWrapper />
                  <NavigationButtons />

                  <Routes>

                    {/* ── Public ──────────────────────────────────────────── */}

                    <Route path="/intro" element={<Intro />} />

                    <Route
                      path="/login"
                      element={userLoggedIn ? <Navigate to="/" replace /> : <Login setUserLoggedIn={setUserLoggedIn} />}
                    />

                    {/* ── Home ────────────────────────────────────────────── */}

                    <Route path="/" element={
                      <ProtectedRoute>
                        <Home
                          user_logged_in={userLoggedIn}
                          currentUser={AuthUtils.getCurrentUser()}
                          setUserLoggedIn={setUserLoggedIn}
                        />
                      </ProtectedRoute>
                    } />

                    {/* ── Service Documents ───────────────────────────────── */}

                    <Route path="/all/all-histories/:regNo"                                element={<ProtectedRoute><ServiceDoc />                                       </ProtectedRoute>} />
                    <Route path="/all/oil-service/:regNo"                                  element={<ProtectedRoute><ServiceDoc />                                       </ProtectedRoute>} />
                    <Route path="/all/maintenance-service/:regNo"                          element={<ProtectedRoute><ServiceDoc />                                       </ProtectedRoute>} />
                    <Route path="/all/tyre-service/:regNo"                                 element={<ProtectedRoute><ServiceDoc />                                       </ProtectedRoute>} />
                    <Route path="/all/battery-service/:regNo"                              element={<ProtectedRoute><ServiceDoc />                                       </ProtectedRoute>} />
                    <Route path="/all/date-range/:serviceType/:regNo/:startDate/:endDate"  element={<ProtectedRoute><ServiceDoc />                                       </ProtectedRoute>} />
                    <Route path="/all/last-months/:serviceType/:regNo/:monthsCount"        element={<ProtectedRoute><ServiceDoc />                                       </ProtectedRoute>} />
                    <Route path="/service-document/:historyId"                             element={<ProtectedRoute><ServiceDoc />                                       </ProtectedRoute>} />

                    {/* ── Service Forms ────────────────────────────────────── */}

                    <Route path="/service-form-nav/:regNo"                                 element={<ProtectedRoute><FormNavigation />                                  </ProtectedRoute>} />
                    <Route path="/service-form/:serviceType/:historyId"                    element={<ProtectedRoute><ServiceForm />                                     </ProtectedRoute>} />
                    <Route path="/service-form/update/:serviceType/:reportId"              element={<ProtectedRoute><ServiceForm />                                     </ProtectedRoute>} />

                    {/* ── Equipment & Tools ────────────────────────────────── */}

                    <Route path="/equipments"                                              element={<ProtectedRoute><Equipments />                                      </ProtectedRoute>} />
                    <Route path="/toolkits"                                                element={<ProtectedRoute><Toolkits />                                        </ProtectedRoute>} />

                    {/* ── Service History ──────────────────────────────────── */}

                    <Route path="/service-history"                                         element={<ProtectedRoute><ServiceHistory />                                  </ProtectedRoute>} />
                    <Route path="/service-history/:regNos"                                 element={<ProtectedRoute><ServiceHistory />                                  </ProtectedRoute>} />
                    <Route path="/service-histoy/summary"                                  element={<ProtectedRoute><ServiceHistorySummary />                           </ProtectedRoute>} />

                    {/* ── History Forms ────────────────────────────────────── */}

                    <Route path="/service-history-form/:type/:regNo"                       element={<ProtectedRoute><ServiceHistoryEntryForm />                         </ProtectedRoute>} />
                    <Route path="/service-history-form/:type"                              element={<ProtectedRoute><ServiceHistoryEntryForm />                         </ProtectedRoute>} />

                    {/* ── Notifications ────────────────────────────────────── */}

                    <Route path="/notification" element={<ProtectedRoute><NotificationPage liveNotification={liveNotification} /></ProtectedRoute>} />

                    {/* ── Stocks & Documents ───────────────────────────────── */}

                    <Route path="/stocks/equipment-stocks"                                 element={<ProtectedRoute><EquipBypass equipStocks={true} /></ProtectedRoute>} />
                    <Route path="/stock-manage"                                            element={<ProtectedRoute><StockManage /></ProtectedRoute>} />
                    <Route path="/documents"                                               element={<ProtectedRoute><EquipBypass documents={true} /></ProtectedRoute>} />
                    <Route path="/documents/:type/:id"                                     element={<ProtectedRoute><Documents /></ProtectedRoute>} />

                    {/* ── Backcharge ───────────────────────────────────────── */}

                    <Route path="/backcharge-form"                                         element={<ProtectedRoute><BackchargeForm /></ProtectedRoute>} />
                    <Route path="/backcharge-list"                                         element={<ProtectedRoute><BackchargeList /></ProtectedRoute>} />
                    <Route path="/backcharge-doc/:refNo"                                   element={<ProtectedRoute><BackchargeDoc /></ProtectedRoute>} />
                    <Route path="/backcharge-doc"                                          element={<ProtectedRoute><BackchargeDoc /></ProtectedRoute>} />

                    {/* ── Complaints ───────────────────────────────────────── */}

                    <Route path="/complaints"                                              element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
                    <Route path="/complaints/:complaintId/:regNo"                          element={<ProtectedRoute><Complaints /></ProtectedRoute>} />

                    {/* ── LPO Forms ────────────────────────────────────────── */}

                    <Route path="/lpo-form/for-stock"                                      element={<ProtectedRoute><Lpo isStock={true} /></ProtectedRoute>} />
                    <Route path="/lpo-form/for-all-equipments"                             element={<ProtectedRoute><Lpo isAllEquip={true} /></ProtectedRoute>} />
                    <Route path="/lpo-form/edit/:refNo"                                    element={<ProtectedRoute><Lpo edit={true} /></ProtectedRoute>} />
                    <Route path="/lpo-form/amendment-edit/:amendment/:refNo"               element={<ProtectedRoute><Lpo amendmentEdit={true} amendment={true} /></ProtectedRoute>} />
                    <Route path="/lpo-form/amendment/:refNo"                               element={<ProtectedRoute><Lpo amendment={true} /></ProtectedRoute>} />
                    <Route path="/lpo-form/:regNo/:complaintId"                            element={<ProtectedRoute><Lpo /></ProtectedRoute>} />
                    <Route path="/lpo-form/:regNo"                                         element={<ProtectedRoute><Lpo /></ProtectedRoute>} />

                    {/* ── LPO Documents ────────────────────────────────────── */}

                    <Route path="/lpo-doc/:lpoRef"                                         element={<ProtectedRoute><LpoDoc /></ProtectedRoute>} />
                    <Route path="/lpo-doc/:lpoRef/:complaintId"                            element={<ProtectedRoute><LpoDoc /></ProtectedRoute>} />
                    <Route path="/lpo-doc/:lpoRef/amendment/:amendment/:complaintId"       element={<ProtectedRoute><LpoDoc /></ProtectedRoute>} />

                    {/* ── LPO Lists ─────────────────────────────────────────── */}

                    <Route path="/lpo-list"                                                element={<ProtectedRoute><EquipBypass isLPO={true} /></ProtectedRoute>} />
                    <Route path="/lpo-list/of-all-equipments"                              element={<ProtectedRoute><LpoList isForAllEquip={true} /></ProtectedRoute>} />
                    <Route path="/lpo-list/all-list"                                       element={<ProtectedRoute><LpoList isAll={true} /></ProtectedRoute>} />
                    <Route path="/lpo-list/:regNo"                                         element={<ProtectedRoute><LpoList isEquip={true} /></ProtectedRoute>} />
                    <Route path="/lpo-list/of-stocks"                                      element={<ProtectedRoute><LpoList isStock={true} /></ProtectedRoute>} />

                    {/* ── People ───────────────────────────────────────────── */}

                    <Route path="/mechanics"                                               element={<ProtectedRoute><Mechanics /></ProtectedRoute>} />
                    <Route path="/operators"                                               element={<ProtectedRoute><Operators /></ProtectedRoute>} />

                    {/* ── Operations ───────────────────────────────────────── */}

                    <Route path="/operations-recent-activities"                            element={<ProtectedRoute><OperationsActivities /></ProtectedRoute>} />

                    {/* ── Dashboard ────────────────────────────────────────── */}

                    <Route path="/dashboard"                                               element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                    {/* ── Fallbacks ────────────────────────────────────────── */}

                    <Route path="/not-found"                                               element={<NotFound />} />
                    <Route path="*"                                                        element={<NotFound />} />

                  </Routes>

                  <SpacerWrapper />

                </HeaderVibrationProvider>
              </HeaderTitleProvider>
            </SearchProvider>
          </AlertProvider>
      </TutorialProvider>
      </ServiceReportContext.Provider>
    </AuthContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AppWrapper — Wraps App with BrowserRouter so useNavigate works inside App.
// ─────────────────────────────────────────────────────────────────────────────

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;