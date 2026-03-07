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
import { END_POINT }                from './constants';
import { apiRequest }               from './utils/api';

// ── Page Components ──────────────────────────────────────────────────────────
import Home                    from './Components/Home/Home';
import ServiceDoc              from './Components/ServiceDoc/ServiceDoc';
import ServiceForm             from './Components/ServiceForm/ServiceForm';
import Equipments              from './Components/Equipments/Equipments';
import ServiceHistory          from './Components/ServiceHistory/ServiceHistory';
import ServiceHistorySummary   from './Components/ServiceHistorySummary/ServiceHistorySummary';
import Notification            from './Components/Notification/Notification';
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

// ── Common / Shared Components ───────────────────────────────────────────────
import Header            from './Components/Common/Header/Header';
import EquipBypass       from './Components/Common/EquipBypass/EquipBypass';
import Login             from './Components/Common/Login/Login';
import NavigationButtons from './Components/Common/NavigationButtons/NavigationButtons';
import Spacer            from './Components/Spacer/Spacer';
import SplashScreen      from './splash/SplashScreen';
import NotFound          from './Common/NotFound/NotFound';
import Intro          from './Common/Intro/Intro';

import './App.css';
import ServiceHistoryEntryForm from './Components/ServiceHistoryEntryForm/ServiceHistoryEntryForm';

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
// Blocks unauthenticated users. Optionally restricts to CEO-only access.
// ─────────────────────────────────────────────────────────────────────────────

function ProtectedRoute({ children, ceoOnly = false }) {
  const { isValid } = AuthUtils.checkUserSession();
  const [isCEO,   setIsCEO]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCEOStatus = async () => {
      if (isValid) {
        const ceoStatus = await AuthUtils.isCEO();
        setIsCEO(ceoStatus);
      }
      setLoading(false);
    };

    checkCEOStatus();
  }, [isValid]);

  // Redirect unauthenticated users to login
  if (!isValid) return <Navigate to="/login" replace />;

  if (loading) return <div />;

  // CEO-only route accessed by non-CEO → redirect home
  if (ceoOnly && !isCEO) return <Navigate to="/" replace />;

  // Non-CEO-only route accessed by CEO → redirect to dashboard
  if (isCEO && !ceoOnly && window.location.pathname !== '/dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// ─────────────────────────────────────────────────────────────────────────────
// CEOGuard
// Prevents CEO from accessing non-dashboard routes.
// ─────────────────────────────────────────────────────────────────────────────

function CEOGuard({ children }) {
  const [isCEO,   setIsCEO]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCEOStatus = async () => {
      const ceoStatus = await AuthUtils.isCEO();
      setIsCEO(ceoStatus);
      setLoading(false);
    };

    checkCEOStatus();
  }, []);

  if (loading) return <div />;
  if (isCEO)   return <Navigate to="/dashboard" replace />;

  return children;
}

// ─────────────────────────────────────────────────────────────────────────────
// CEORedirect
// After login, redirects CEO → /dashboard, everyone else → /.
// ─────────────────────────────────────────────────────────────────────────────

function CEORedirect() {
  const [isCEO,   setIsCEO]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCEOStatus = async () => {
      const ceoStatus = await AuthUtils.isCEO();
      setIsCEO(ceoStatus);
      setLoading(false);
    };

    checkCEOStatus();
  }, []);

  if (loading) return <div />;

  return isCEO
    ? <Navigate to="/dashboard" replace />
    : <Navigate to="/" replace />;
}

// ─────────────────────────────────────────────────────────────────────────────
// HeaderWrapper
// Conditionally renders the Header based on route and user role.
// ─────────────────────────────────────────────────────────────────────────────

function HeaderWrapper({ userLoggedIn, setUserLoggedIn }) {
  const location = useLocation();
  const [isCEO,   setIsCEO]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCEOStatus = async () => {
      if (userLoggedIn) {
        const ceoStatus = await AuthUtils.isCEO();
        setIsCEO(ceoStatus);
      }
      setLoading(false);
    };

    checkCEOStatus();
  }, [userLoggedIn]);

  if (loading) return null;

  const hideHeader =
    HEADERLESS_ROUTES.includes(location.pathname) ||
    HEADERLESS_PREFIXES.some((prefix) => location.pathname.startsWith(prefix)) ||
    !isValidRoute(location.pathname) ||
    isCEO;

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
// Defined inside App to access router context via useLocation.
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
                    element={userLoggedIn ? <CEORedirect /> : <Login setUserLoggedIn={setUserLoggedIn} />}
                  />

                  {/* ── Home ────────────────────────────────────────────── */}

                  <Route path="/" element={
                    <ProtectedRoute><CEOGuard>
                      <Home
                        user_logged_in={userLoggedIn}
                        currentUser={AuthUtils.getCurrentUser()}
                        setUserLoggedIn={setUserLoggedIn}
                      />
                    </CEOGuard></ProtectedRoute>
                  } />

                  {/* ── Service Documents ───────────────────────────────── */}

                  <Route path="/all/all-histories/:regNo"                              element={<ProtectedRoute><CEOGuard><ServiceDoc /></CEOGuard></ProtectedRoute>} />
                  <Route path="/all/oil-service/:regNo"                                element={<ProtectedRoute><CEOGuard><ServiceDoc /></CEOGuard></ProtectedRoute>} />
                  <Route path="/all/maintenance-service/:regNo"                        element={<ProtectedRoute><CEOGuard><ServiceDoc /></CEOGuard></ProtectedRoute>} />
                  <Route path="/all/tyre-service/:regNo"                               element={<ProtectedRoute><CEOGuard><ServiceDoc /></CEOGuard></ProtectedRoute>} />
                  <Route path="/all/battery-service/:regNo"                            element={<ProtectedRoute><CEOGuard><ServiceDoc /></CEOGuard></ProtectedRoute>} />
                  <Route path="/all/date-range/:serviceType/:regNo/:startDate/:endDate" element={<ProtectedRoute><CEOGuard><ServiceDoc /></CEOGuard></ProtectedRoute>} />
                  <Route path="/all/last-months/:serviceType/:regNo/:monthsCount"       element={<ProtectedRoute><CEOGuard><ServiceDoc /></CEOGuard></ProtectedRoute>} />
                  <Route path="/service-document/:historyId"                           element={<ProtectedRoute><CEOGuard><ServiceDoc /></CEOGuard></ProtectedRoute>} />

                  {/* ── Service Forms ────────────────────────────────────── */}

                  <Route path="/service-form-nav/:regNo"                element={<ProtectedRoute><CEOGuard><FormNavigation /></CEOGuard></ProtectedRoute>} />
                  <Route path="/service-form/:serviceType/:historyId"   element={<ProtectedRoute><CEOGuard><ServiceForm /></CEOGuard></ProtectedRoute>} />
                  <Route path="/service-form/update/:serviceType/:reportId" element={<ProtectedRoute><CEOGuard><ServiceForm /></CEOGuard></ProtectedRoute>} />

                  {/* ── Equipment & Tools ────────────────────────────────── */}

                  <Route path="/equipments" element={<ProtectedRoute><CEOGuard><Equipments /></CEOGuard></ProtectedRoute>} />
                  <Route path="/toolkits"   element={<ProtectedRoute><CEOGuard><Toolkits /></CEOGuard></ProtectedRoute>} />

                  {/* ── Service History ──────────────────────────────────── */}

                  <Route path="/service-history"           element={<ProtectedRoute><CEOGuard><ServiceHistory /></CEOGuard></ProtectedRoute>} />
                  <Route path="/service-history/:regNos"   element={<ProtectedRoute><CEOGuard><ServiceHistory /></CEOGuard></ProtectedRoute>} />
                  <Route path="/service-histoy/summary"    element={<ProtectedRoute><CEOGuard><ServiceHistorySummary /></CEOGuard></ProtectedRoute>} />

                  {/* ── History Forms ────────────────────────────────────── */}

                  <Route path="/service-history-form/:type/:regNo" element={<ProtectedRoute><CEOGuard><ServiceHistoryEntryForm /></CEOGuard></ProtectedRoute>} />
                  <Route path="/service-history-form/:type"        element={<ProtectedRoute><CEOGuard><ServiceHistoryEntryForm /></CEOGuard></ProtectedRoute>} />

                  {/* ── Notifications ────────────────────────────────────── */}

                  <Route path="/notification" element={<ProtectedRoute><CEOGuard><Notification /></CEOGuard></ProtectedRoute>} />

                  {/* ── Stocks & Documents ───────────────────────────────── */}

                  <Route path="/stocks/equipment-stocks" element={<ProtectedRoute><CEOGuard><EquipBypass equipStocks={true} /></CEOGuard></ProtectedRoute>} />
                  <Route path="/stock-manage"            element={<ProtectedRoute><CEOGuard><StockManage /></CEOGuard></ProtectedRoute>} />
                  <Route path="/documents"               element={<ProtectedRoute><CEOGuard><EquipBypass documents={true} /></CEOGuard></ProtectedRoute>} />
                  <Route path="/documents/:type/:id"     element={<ProtectedRoute><CEOGuard><Documents /></CEOGuard></ProtectedRoute>} />

                  {/* ── Backcharge ───────────────────────────────────────── */}

                  <Route path="/backcharge-form"       element={<ProtectedRoute><CEOGuard><BackchargeForm /></CEOGuard></ProtectedRoute>} />
                  <Route path="/backcharge-list"       element={<ProtectedRoute><CEOGuard><BackchargeList /></CEOGuard></ProtectedRoute>} />
                  <Route path="/backcharge-doc/:refNo" element={<ProtectedRoute><CEOGuard><BackchargeDoc /></CEOGuard></ProtectedRoute>} />
                  <Route path="/backcharge-doc"        element={<ProtectedRoute><CEOGuard><BackchargeDoc /></CEOGuard></ProtectedRoute>} />

                  {/* ── Complaints ───────────────────────────────────────── */}

                  <Route path="/complaints"                          element={<ProtectedRoute><CEOGuard><Complaints /></CEOGuard></ProtectedRoute>} />
                  <Route path="/complaints/:complaintId/:regNo"      element={<ProtectedRoute><CEOGuard><Complaints /></CEOGuard></ProtectedRoute>} />

                  {/* ── LPO Forms ────────────────────────────────────────── */}

                  <Route path="/lpo-form/for-stock"                              element={<ProtectedRoute><CEOGuard><Lpo isStock={true} /></CEOGuard></ProtectedRoute>} />
                  <Route path="/lpo-form/for-all-equipments"                     element={<ProtectedRoute><CEOGuard><Lpo isAllEquip={true} /></CEOGuard></ProtectedRoute>} />
                  <Route path="/lpo-form/edit/:refNo"                            element={<ProtectedRoute><CEOGuard><Lpo edit={true} /></CEOGuard></ProtectedRoute>} />
                  <Route path="/lpo-form/amendment-edit/:amendment/:refNo"       element={<ProtectedRoute><CEOGuard><Lpo amendmentEdit={true} amendment={true} /></CEOGuard></ProtectedRoute>} />
                  <Route path="/lpo-form/amendment/:refNo"                       element={<ProtectedRoute><CEOGuard><Lpo amendment={true} /></CEOGuard></ProtectedRoute>} />
                  <Route path="/lpo-form/:regNo/:complaintId"                    element={<ProtectedRoute><CEOGuard><Lpo /></CEOGuard></ProtectedRoute>} />
                  <Route path="/lpo-form/:regNo"                                 element={<ProtectedRoute><CEOGuard><Lpo /></CEOGuard></ProtectedRoute>} />

                  {/* ── LPO Documents ────────────────────────────────────── */}

                  <Route path="/lpo-doc/:lpoRef"                                       element={<ProtectedRoute><CEOGuard><LpoDoc /></CEOGuard></ProtectedRoute>} />
                  <Route path="/lpo-doc/:lpoRef/:complaintId"                          element={<ProtectedRoute><CEOGuard><LpoDoc /></CEOGuard></ProtectedRoute>} />
                  <Route path="/lpo-doc/:lpoRef/amendment/:amendment/:complaintId"     element={<ProtectedRoute><CEOGuard><LpoDoc /></CEOGuard></ProtectedRoute>} />

                  {/* ── LPO Lists ─────────────────────────────────────────── */}

                  <Route path="/lpo-list"                    element={<ProtectedRoute><CEOGuard><EquipBypass isLPO={true} /></CEOGuard></ProtectedRoute>} />
                  <Route path="/lpo-list/of-all-equipments"  element={<ProtectedRoute><CEOGuard><LpoList isForAllEquip={true} /></CEOGuard></ProtectedRoute>} />
                  <Route path="/lpo-list/all-list"           element={<ProtectedRoute><CEOGuard><LpoList isAll={true} /></CEOGuard></ProtectedRoute>} />
                  <Route path="/lpo-list/:regNo"             element={<ProtectedRoute><CEOGuard><LpoList isEquip={true} /></CEOGuard></ProtectedRoute>} />
                  <Route path="/lpo-list/of-stocks"          element={<ProtectedRoute><CEOGuard><LpoList isStock={true} /></CEOGuard></ProtectedRoute>} />

                  {/* ── People ───────────────────────────────────────────── */}

                  <Route path="/mechanics" element={<ProtectedRoute><CEOGuard><Mechanics /></CEOGuard></ProtectedRoute>} />
                  <Route path="/operators" element={<ProtectedRoute><CEOGuard><Operators /></CEOGuard></ProtectedRoute>} />

                  {/* ── Operations ───────────────────────────────────────── */}

                  <Route path="/operations-recent-activities" element={<ProtectedRoute><CEOGuard><OperationsActivities /></CEOGuard></ProtectedRoute>} />

                  {/* ── CEO Dashboard (no CEOGuard — CEO-accessible route) ── */}

                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />

                  {/* ── Fallbacks ────────────────────────────────────────── */}

                  <Route path="/not-found" element={<NotFound />} />
                  <Route path="*"          element={<NotFound />} />

                </Routes>

                <SpacerWrapper />

              </HeaderVibrationProvider>
            </HeaderTitleProvider>
          </SearchProvider>
        </AlertProvider>
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