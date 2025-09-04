import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useState, createContext, useEffect } from 'react';
import { AuthUtils, checkAutoLogin } from './utils/authUtils';

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
import Stocks from './Components/Stocks/Stocks';
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

  const navigate = useNavigate();

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

  return (
    <AuthContext.Provider value={{ userLoggedIn, setUserLoggedIn }}>
      <ServiceReportContext.Provider value={{ serviceReportData, setServiceReportData }}>
        <HeaderWrapper userLoggedIn={userLoggedIn} setUserLoggedIn={setUserLoggedIn} />
        <NavigationButtons />
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
            path="/service-form/:regNo/:date/:serviceHrs/:nextServiceHrs/:oil/:oilFilter/:fuelFilter/:airFilter/:acFilter/:waterSeparator"
            element={
              <ProtectedRoute>
                <CEOGuard>
                  <ServiceForm />
                </CEOGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/service-form/:regNo/:date/:location"
            element={
              <ProtectedRoute>
                <CEOGuard>
                  <ServiceForm />
                </CEOGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/service-form/:regNo/:date/:mechanics/:workRemarks"
            element={
              <ProtectedRoute>
                <CEOGuard>
                  <ServiceForm />
                </CEOGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/service-form/:regNo/:date/:location/:runningHours/:tyreForm"
            element={
              <ProtectedRoute>
                <CEOGuard>
                  <ServiceForm />
                </CEOGuard>
              </ProtectedRoute>
            }
          />
          <Route
            path="/service-form/update/:id"
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
            path="/service-history/:regNo"
            element={
              <ProtectedRoute>
                <CEOGuard>
                  <ServiceHistory />
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
            path="/stocks/equipment-part-stocks"
            element={
              <ProtectedRoute>
                <CEOGuard>
                  <Stocks />
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
            path="/documents/:regNo"
            element={
              <ProtectedRoute>
                <CEOGuard>
                  <Documents />
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
            } />

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

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
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