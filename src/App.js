import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useState, createContext, useEffect } from 'react';
import { AuthUtils, checkAutoLogin } from './utils/authUtils';
import { SearchProvider } from './context/SearchContext';
import { HeaderTitleProvider } from './context/HeaderTitleContext';
import { HeaderVibrationProvider } from './context/HeaderVibrationContext';
import { AlertProvider } from './context/AlertContext';
import './App.css'

// All your existing imports
import Home from './Components/Home/Home';
import ServiceDoc from './Components/ServiceDoc/ServiceDoc';
import ServiceForm from './Components/ServiceForm/ServiceForm';
import Equipments from './Components/Equipments/Equipments';
import ServiceHistory from './Components/ServiceHistory/ServiceHistory';
import ServiceHistoryForm from './Components/ServiceHistoryForm/ServiceHistoryForm';
import Notification from './Components/Notification/Notification';
import MechanicService from './Components/MechanicService/MechanicService';
import TyreHistoryForm from './Components/TyreHistoryForm/TyreHistoryForm';
import StocksNavigation from './Components/StocksNavigation/StocksNavigation';
import MaintanceHistoryForm from './Components/MaintanceHistoryForm/MaintanceHistoryForm';
import EquipmentStockForm from './Components/EquipmentStockForm/EquipmentStockForm';
import EquipmentUpdate from './Components/EquipmentUpdate/EquipmentUpdate';
import Header from './Components/Common/Header/Header';
import EquipBypass from './Components/Common/EquipBypass/EquipBypass';
import Documents from './Components/Documents/Documents';
import BatteryHistoryForm from './Components/BatteryHistoryForm/BatteryHistoryForm';
import Dashboard from './Components/Dashboard/Dashboard';
import Lpo from './Components/Lpo/Lpo';
import Toolkits from './Components/Toolkits/Toolkits';
import Mechanics from './Components/Mechanics/Mechanics';
import MechanicForms from './Components/MechanicForms/MechanicForms';
import StockManage from './Components/StockManage/StockManage';
import LpoList from './Components/LpoList/LpoList';
import Login from './Components/Common/Login/Login';
import LpoDoc from './Components/LpoDoc/LpoDoc';
import Applications from './Components/Applications/Applications';
import Complaints from './Components/Complaints/Complaints';
import ApplicationsList from './Components/ApplicationsList/ApplicationsList';
import FormNavigation from './Components/FormNavigation/FormNavigation';
import SplashScreen from './splash/SplashScreen';
import NavigationButtons from './Components/Common/NavigationButtons/NavigationButtons';
import Operators from './Components/Operators/Operators';
import DevModal from './common/DevModal';
import BackchargeForm from './Components/BackchargeForm/BackchargeForm';
import BackchargeDoc from './Components/BackchargeDoc/BackchargeDoc';
import BackchargeList from './Components/BackchargeList/BackchargeList'; import Spacer from './Components/Spacer/Spacer';
import NotFound from './Components/Common/NotFound/NotFound';
import LiveChat from './Components/LiveChat/LiveChat';
import ServiceHistorySummary from './Components/ServiceHistorySummary/ServiceHistorySummary';
import TestInputs from './Components/TestInputs/TestInputs';
;

// Create contexts
export const ServiceReportContext = createContext();
export const AuthContext = createContext();

// Protected Route Component with CEO handling
function ProtectedRoute({ children, ceoOnly = false }) {
  const { isValid } = AuthUtils.checkUserSession();
  const [isCEO, setIsCEO] = useState(null);
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

  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <div></div>;
  }

  // If this is a CEO-only route and user is not CEO, redirect to home
  if (ceoOnly && !isCEO) {
    return <Navigate to="/" replace />;
  }

  // If user is CEO and trying to access non-dashboard routes, redirect to dashboard
  if (isCEO && !ceoOnly && window.location.pathname !== '/dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

// Header Wrapper with Authentication and CEO check
function HeaderWrapper({ userLoggedIn, setUserLoggedIn }) {
  const location = useLocation();
  const [isCEO, setIsCEO] = useState(null);
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

  // Hide header for login, CEO, home page, service-doc routes, and /all routes
  const hideHeader = location.pathname === '/login' ||
    location.pathname === '/' ||
    location.pathname.startsWith('/service-doc') ||
    location.pathname.startsWith('/all') ||
    location.pathname.startsWith('/battery-doc') ||
    location.pathname.startsWith('/tyre-doc') ||
    location.pathname.startsWith('/not-found') ||
    isCEO;

  const currentUser = AuthUtils.getCurrentUser();

  if (loading) {
    return null;
  }

  return !hideHeader && userLoggedIn && (
    <Header
      user_logged_in={userLoggedIn}
      currentUser={currentUser}
      setUserLoggedIn={setUserLoggedIn}
    />
  );
}

// CEO Redirect component for login route
function CEORedirect() {
  const [isCEO, setIsCEO] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCEOStatus = async () => {
      const ceoStatus = await AuthUtils.isCEO();
      setIsCEO(ceoStatus);
      setLoading(false);
    };

    checkCEOStatus();
  }, []);

  if (loading) {
    return <div></div>;
  }

  if (isCEO) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/" replace />;
}

// CEO Route Guard - redirects CEO to dashboard if accessing other routes
function CEOGuard({ children }) {
  const [isCEO, setIsCEO] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkCEOStatus = async () => {
      const ceoStatus = await AuthUtils.isCEO();
      setIsCEO(ceoStatus);
      setLoading(false);
    };

    checkCEOStatus();
  }, []);

  if (loading) {
    return <div></div>;
  }

  if (isCEO) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  // State to store the service report data
  const [serviceReportData, setServiceReportData] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Splash screen states
  const [showSplash, setShowSplash] = useState(false);
  const [splashComplete, setSplashComplete] = useState(false);
  const [showDevModalHidden, setShowDevModalHidden] = useState(true);
  const [isExplored, setExplored] = useState(true);
  const [isLPOAlert, setisLPOAlert] = useState(false);
  const [newLPO, setNewLPO] = useState([]);
  const [isWorkAlert, setisWorkAlert] = useState(false);
  const [newWork, setNewWork] = useState([]);
  const [currentModalIndex, setCurrentModalIndex] = useState(0);

  const navigate = useNavigate();

  // Spacer Wrapper to hide on login and home
  function SpacerWrapper() {
    const location = useLocation();

    const hideSpacer = location.pathname === '/login' || location.pathname === '/' || location.pathname === '/not-found';

    return !hideSpacer && <Spacer vertical="4rem" horizontal="100%" />;
  }


  useEffect(() => {
    const hiddenUntil = sessionStorage.getItem('devModalHidden');
    if (hiddenUntil) {
      const hideUntilTime = parseInt(hiddenUntil);
      const now = new Date().getTime();

      if (now < hideUntilTime) {
        // Still within the "don't show" period
        setShowDevModalHidden(false);
      } else {
        // Time has expired, remove the storage item
        sessionStorage.removeItem('devModalHidden');
      }
    }
  }, []);

  useEffect(() => {
    const hiddenUntil = sessionStorage.getItem('explored');
    if (hiddenUntil) {
      const hideUntilTime = parseInt(hiddenUntil);
      const now = new Date().getTime();

      if (now < hideUntilTime) {
        // Still within the "don't show" period
        setExplored(false);
      } else {
        // Time has expired, remove the storage item
        sessionStorage.removeItem('explored');
      }
    }
  }, []);


  // set dark theme initialy
  useEffect(() => {
    return () => {
      localStorage.setItem('theme', 'dark');
    };
  }, []);

  // Check if splash has been shown in this session
  useEffect(() => {
    const splashShown = sessionStorage.getItem('splashShown');

    if (!splashShown) {
      // First time loading in this session - show splash
      setShowSplash(true);
      sessionStorage.setItem('splashShown', 'true');
    } else {
      // Already shown in this session - skip splash
      setSplashComplete(true);
    }
  }, []);

  // Splash screen timing effect (only runs if splash should be shown)
  useEffect(() => {
    if (showSplash) {
      const splashTimer = setTimeout(() => {
        setShowSplash(false);
        // Wait for fade out animation to complete
        setTimeout(() => {
          setSplashComplete(true);
        }, 800); // 800ms matches the fade-out animation duration
      }, 3000); // Show splash for 3 seconds

      return () => clearTimeout(splashTimer);
    }
  }, [showSplash]);

  // Check for existing session on app load
  useEffect(() => {
    const initializeAuth = async () => {
      await checkAutoLogin(setUserLoggedIn, navigate);

      // Set theme based on user preference after auth check
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
      }

      setLoading(false);
    };

    // Only initialize auth after splash screen is complete (or skipped)
    if (splashComplete) {
      initializeAuth();
    }
  }, [navigate, splashComplete]);

  // Show splash screen first (only if it should be shown)
  if (showSplash || (showSplash === false && !splashComplete)) {
    return <SplashScreen />;
  }

  // Show loading while checking session
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: '#000',
        color: '#fff',
        fontSize: '18px'
      }}>
      </div>
    );
  }

  const dontShowAgain = () => {
    const hideUntil = new Date();
    hideUntil.setDate(hideUntil.getDate() + 1); // Add 1 day

    // Store in sessionStorage instead of component state
    sessionStorage.setItem('devModalHidden', hideUntil.getTime().toString());
    setShowDevModalHidden(false);
  };

  const explore = () => {
    const hideUntil = new Date();
    hideUntil.setDate(hideUntil.getDate() + 1); // Add 1 day

    // Store in sessionStorage instead of component state
    sessionStorage.setItem('explored', hideUntil.getTime().toString());
    setExplored(false);
    navigate('/equipments')
  };

  return (
    <AuthContext.Provider value={{ userLoggedIn, setUserLoggedIn }}>
      <ServiceReportContext.Provider value={{ serviceReportData, setServiceReportData }}>
        <AlertProvider>
          <SearchProvider>
            <HeaderTitleProvider>
              <HeaderVibrationProvider>
                <HeaderWrapper userLoggedIn={userLoggedIn} setUserLoggedIn={setUserLoggedIn} />
                <SpacerWrapper />
                <NavigationButtons />

                {/* {isExplored && (
                <DevModal
                  isOpen={true}
                  onClose={() => { }}
                  type="announcements"
                  title="Fuel Data Collected"
                  message="We have collected all fuel data from April 2020 to August 31, 2025."
                  buttonText="Explore Now"
                  onButtonClick={explore}
                />
              )}

              {showDevModalHidden && (
                <DevModal
                  isOpen={true}
                  onClose={() => { }}
                  type="warning"
                  title="Server Maintenance in Progress"
                  message="Our servers are currently undergoing maintenance to implement new features. You may experience temporary inconvenience."
                  buttonText="Don't Show Again"
                  onButtonClick={dontShowAgain}
                />
              )} */}

                <Routes>
                  {/* Public Routes */}
                  <Route
                    path="/login"
                    element={
                      userLoggedIn ? (
                        <CEORedirect />
                      ) : (
                        <Login setUserLoggedIn={setUserLoggedIn} />
                      )
                    }
                  />

                  {/* CEO Only Route - Dashboard */}
                  {/* important to change here  */}
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute ceoOnly={false}>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />

                  {/* Regular Protected Routes (Non-CEO users) */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Home
                            user_logged_in={userLoggedIn}
                            currentUser={AuthUtils.getCurrentUser()}
                            setUserLoggedIn={setUserLoggedIn}
                          />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* Service Document Routes */}
                  <Route
                    path="/service-doc"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/service-doc/:regNo/:date"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/maintenance-doc/:regNo/:date"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tyre-doc/:regNo/:date"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/battery-doc/:regNo/:date"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* service form navs */}
                  <Route
                    path="/service-form-nav/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <FormNavigation />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* Service Form Routes */}
                  <Route
                    path="/service-form"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceForm />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/service-form/:regNo/:date/:serviceHrs/:nextServiceHrs/:oil/:oilFilter/:fuelFilter/:airFilter/:acFilter/:waterSeparator/:historyId/:isNormal"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceForm />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/service-form/:regNo/:date/:serviceHrs/:nextServiceHrs/:oil/:oilFilter/:fuelFilter/:airFilter/:acFilter/:waterSeparator/:historyId/:isNormal"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceForm />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/service-form/:regNo/:date/:location/:battery/:historyId"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceForm />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/service-form/:regNo/:date/:mechanics/:workRemarks/:maintenance/:historyId"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceForm />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/service-form/tyre-report/:regNo/:date/:location/:runningHours/:tyre/:historyId"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceForm />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/service-form/update/:serviceType/:id"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceForm />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* Equipment Routes */}
                  <Route
                    path="/equipments"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Equipments />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* Service History Routes */}
                  <Route
                    path="/service-history"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceHistory />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/service-history/:regNos"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceHistory />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/service-histoy/summary"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceHistorySummary />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/maintanance-history/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceHistory maintanance={true} />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tyre-history/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <MechanicService tyre={true} />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/battery-history/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <MechanicService />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* Service History Form Routes */}
                  <Route
                    path="/service-history-form/:normal/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceHistoryForm />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/service-history-form/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceHistoryForm />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/tyre-history-form/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <TyreHistoryForm />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/battery-history-form/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <BatteryHistoryForm />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/maintenance-history-form/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <MaintanceHistoryForm />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* View All Documents Routes */}
                  <Route
                    path="/all/all-histories/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/all/oil-service/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/all/maintenance-service/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/all/tyre-service/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/all/battery-service/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/all/date-range/:regNo/:startDate/:endDate"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/all/last-months/:regNo/:monthsCount"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* Notification Routes */}
                  <Route
                    path="/notification"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Notification />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* Stock Routes */}
                  <Route
                    path="/stocks"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <StocksNavigation />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stocks/equipment-stocks"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <EquipBypass equipStocks={true} />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/equipment-stocks-form/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <EquipmentStockForm />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/equipment-updates"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <EquipmentUpdate />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stock-manage"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <StockManage />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* Document Routes */}
                  <Route
                    path="/documents"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <EquipBypass documents={true} />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/documents/:type/:id"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Documents />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/backcharge-form"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <BackchargeForm />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/backcharge-list"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <BackchargeList />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/backcharge-doc/:refNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <BackchargeDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/backcharge-doc"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <BackchargeDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* complaints route  */}
                  <Route
                    path="/complaints"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Complaints />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/complaints/:complaintId/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Complaints />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* Other Routes */}
                  <Route
                    path="/application-form"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Applications />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/application-hr"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ApplicationsList />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lpo-form/for-stock"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Lpo isStock={true} />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lpo-form/for-all-equipments"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Lpo isAllEquip={true} />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lpo-form/edit/:refNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Lpo edit={true} />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lpo-form/edit/:refNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Lpo edit={true} />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lpo-form/amendment-edit/:amendment/:refNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Lpo amendmentEdit={true} amendment={true} />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lpo-form/amendment/:refNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Lpo amendment={true} />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lpo-form/:regNo/:complaintId"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Lpo />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lpo-form/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Lpo />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />


                  <Route path="/lpo-doc/:lpoRef"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <LpoDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route path="/lpo-doc/:lpoRef/:complaintId"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <LpoDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route path="/lpo-doc/:lpoRef/amendment/:amendment/:complaintId"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <LpoDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lpo-list"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <EquipBypass isLPO={true} />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lpo-list/of-all-equipments"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <LpoList isForAllEquip={true} />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* remove this modal note it */}
                  <Route
                    path="/dev-modal"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <DevModal
                            isOpen={true}
                            onClose={() => { }}
                            type="success"
                            title="Success!"
                            message="You have successfully login into the system"
                            buttonText="Go to main screen"
                            onButtonClick={() => navigate('/dashboard')}
                          />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lpo-list/all-list"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <LpoList isAll={true} />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lpo-list/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <LpoList isEquip={true} />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/lpo-list/of-stocks"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <LpoList isStock={true} />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/toolkits"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Toolkits />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/mechanics"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Mechanics />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/mechanics-forms"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <MechanicForms />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/operators"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Operators />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/not-found"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <NotFound />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/live-chat"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <LiveChat />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/test-inputs"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <TestInputs />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  {/* Fallback Route */}
                  <Route path="/not-found" element={<Navigate to="/not-found" replace />} />
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

// Wrapper component to provide Router context
function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;