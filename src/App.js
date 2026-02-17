import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { useState, createContext, useEffect } from 'react';
import { AuthUtils, checkAutoLogin } from './utils/authUtils';
import { SearchProvider } from './context/SearchContext';
import { HeaderTitleProvider } from './context/HeaderTitleContext';
import { HeaderVibrationProvider } from './context/HeaderVibrationContext';
import { AlertProvider } from './context/AlertContext';
import { END_POINT } from './constants';
import { apiRequest } from './utils/0auth';

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
import NotFound from './common/NotFound/NotFound';
import LiveChat from './Components/LiveChat/LiveChat';
import ServiceHistorySummary from './Components/ServiceHistorySummary/ServiceHistorySummary';
import Intro from './common/Intro/Intro';
import Explore from './common/Explore/Explore';
import Loader from './common/Loader/Loader';
import OperationsActivities from './Components/OperationsActivities/OperationsActivities';
import './App.css';

export const ServiceReportContext = createContext();
export const AuthContext = createContext();

const HEADERLESS_ROUTES = [
  '/login',
  '/',
  '/not-found',
  '/splash',
  '/intro',
];

const HEADERLESS_PREFIXES = [
  '/service-doc',
  '/all',
  '/battery-doc',
  '/tyre-doc'
];

const isValidRoute = (pathname) => {
  const validRoutes = [
    '/', '/login', '/dashboard', '/equipments', '/service-history',
    '/notification', '/stocks', '/equipment-updates', '/stock-manage',
    '/documents', '/backcharge-form', '/backcharge-list', '/backcharge-doc',
    '/complaints', '/application-form', '/application-hr', '/toolkits',
    '/mechanics', '/mechanics-forms', '/operators', '/live-chat',
    '/splash', '/intro', '/not-found', '/dev-modal',
    '/stocks/equipment-stocks', '/service-histoy/summary', '/lpo-list',
    '/operations-recent-activities'
  ];

  const validPrefixes = [
    '/all/', '/service-document/', '/service-form-nav/', '/service-form/',
    '/service-history/', '/maintenance-history/', '/tyre-history/',
    '/battery-history/', '/service-history-form/', '/tyre-history-form/',
    '/battery-history-form/', '/maintenance-history-form/',
    '/equipment-stocks-form/', '/documents/', '/backcharge-doc/',
    '/complaints/', '/lpo-form/', '/lpo-doc/', '/lpo-list/'
  ];

  return validRoutes.includes(pathname) ||
    validPrefixes.some(prefix => pathname.startsWith(prefix));
};

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

  if (ceoOnly && !isCEO) {
    return <Navigate to="/" replace />;
  }

  if (isCEO && !ceoOnly && window.location.pathname !== '/dashboard') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

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

  const hideHeader = HEADERLESS_ROUTES.includes(location.pathname) ||
    HEADERLESS_PREFIXES.some(prefix => location.pathname.startsWith(prefix)) ||
    !isValidRoute(location.pathname) ||
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
  const [serviceReportData, setServiceReportData] = useState(null);
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

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

  function SpacerWrapper() {
    const location = useLocation();

    const hideSpacer = HEADERLESS_ROUTES.includes(location.pathname) ||
      !isValidRoute(location.pathname);

    return !hideSpacer && <Spacer vertical="4rem" horizontal="100%" />;
  }

  useEffect(() => {
    const checkForNewReleases = async () => {
      if (userLoggedIn) {
        try {
          const response = await apiRequest(`${END_POINT}/explorer/get-latest-release-for-user`, 'GET');
          const data = await response.json();

          console.log("Release check:", data);

          if (data.status === 200 && data.data && !data.data.hasExploredThisVersion) {
            navigate('/explorer');
          }
        } catch (err) {
          console.error('Error checking for new releases:', err);
        }
      }
    };

    checkForNewReleases();
  }, [userLoggedIn]);


  useEffect(() => {
    const hiddenUntil = sessionStorage.getItem('devModalHidden');
    if (hiddenUntil) {
      const hideUntilTime = parseInt(hiddenUntil);
      const now = new Date().getTime();

      if (now < hideUntilTime) {
        setShowDevModalHidden(false);
      } else {
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
        setExplored(false);
      } else {
        sessionStorage.removeItem('explored');
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      localStorage.setItem('theme', 'dark');
    };
  }, []);

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
    if (showSplash) {
      const splashTimer = setTimeout(() => {
        setShowSplash(false);

        setTimeout(() => {
          setSplashComplete(true);
        }, 800);
      }, 5000);

      return () => clearTimeout(splashTimer);
    }
  }, [showSplash]);

  useEffect(() => {
    const initializeAuth = async () => {
      const hasSeenIntro = localStorage.getItem('hasSeenIntro');

      if (!hasSeenIntro) {
        navigate('/intro');
        setLoading(false);
        return;
      }

      await checkAutoLogin(setUserLoggedIn, navigate);

      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
      }

      setLoading(false);
    };

    if (splashComplete) {
      initializeAuth();
    }
  }, [navigate, splashComplete]);

  if (showSplash || (showSplash === false && !splashComplete)) {
    return <SplashScreen />;
  }

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
    hideUntil.setDate(hideUntil.getDate() + 1);

    sessionStorage.setItem('devModalHidden', hideUntil.getTime().toString());
    setShowDevModalHidden(false);
  };

  const explore = () => {
    const hideUntil = new Date();
    hideUntil.setDate(hideUntil.getDate() + 1);

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
                    path="/intro"
                    element={<Intro />}
                  />

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
                    path="/all/date-range/:serviceType/:regNo/:startDate/:endDate"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/all/last-months/:serviceType/:regNo/:monthsCount"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceDoc />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  {/* Service Document Routes */}
                  <Route
                    path="/service-document/:historyId"
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
                    path="/service-form/:serviceType/:historyId"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceForm />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/service-form/update/:serviceType/:reportId"
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
                    path="/maintenance-history/:regNo"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <ServiceHistory maintenance={true} />
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
                    path="/operations-recent-activities"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <OperationsActivities />
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
                    path="/explorer"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Explore />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/splash"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <SplashScreen />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />

                  <Route
                    path="/loader"
                    element={
                      <ProtectedRoute>
                        <CEOGuard>
                          <Loader />
                        </CEOGuard>
                      </ProtectedRoute>
                    }
                  />
                  {/* Fallback Route */}
                  <Route path="/not-found" element={<NotFound />} />
                  <Route path="*" element={<NotFound />} />
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

function AppWrapper() {
  return (
    <Router>
      <App />
    </Router>
  );
}

export default AppWrapper;