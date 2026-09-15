import { Routes, Route, Navigate } from 'react-router-dom';

import Login from '@/features/screen/oauth/login/components/Login';
import SplashScreen from '@/shared/components/app/splash/SplashScreen';
import NotFound from '@/shared/components/app/lost/NotFound';
import NotificationPage from '@/features/screen/notification/components/Notification';

import { SearchProvider } from '@/shared/context/SearchContext';
import { HeaderTitleProvider } from '@/shared/context/TitleContext';
import { HeaderVibrationProvider } from '@/shared/context/VibrationContext';
import { AlertProvider } from '@/shared/context/AlertContext';
import { TutorialProvider } from '@/shared/components/widgets/tutorial/context/TutorialContext';

import { NavTreeProvider } from '@/shared/context/NavTreeContext';
import { useApp, AuthContext } from '@/App/useApp';
import { PUBLIC_ROUTES, PROTECTED_ROUTES } from '@/App/App.config';
import { HeaderWrapper, SpacerWrapper, NavigatorWrapper, wrapProtected } from '@/App/App.helper';

import './theme/App.theme.css';

function App() {
  const { isPdfRender, liveNotification, userLoggedIn, setUserLoggedIn, loading, showSplash, splashComplete } = useApp();

  return (
    <AuthContext.Provider value={{ userLoggedIn, setUserLoggedIn }}>
      <TutorialProvider>
        <AlertProvider>
          <SearchProvider>
            <HeaderTitleProvider>
              <HeaderVibrationProvider>
                <NavTreeProvider>

                  {showSplash || (!showSplash && !splashComplete) ? (
                    <SplashScreen />
                  ) : loading ? (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100vh',
                        background: 'var(--text-inverse)',
                        color: 'var(--text-color)',
                        fontSize: '18px',
                      }}
                    />
                  ) : (
                    <>
                      {!isPdfRender && <HeaderWrapper userLoggedIn={userLoggedIn} setUserLoggedIn={setUserLoggedIn} />}
                      {!isPdfRender && <SpacerWrapper />}
                      {!isPdfRender && <NavigatorWrapper />}

                      <Routes>
                        {PUBLIC_ROUTES.map(({ path, element }) => (
                          <Route key={path} path={path} element={element} />
                        ))}

                        <Route
                          path="/login"
                          element={userLoggedIn ? <Navigate to="/" replace /> : <Login setUserLoggedIn={setUserLoggedIn} />}
                        />

                        <Route
                          path="/notification"
                          element={wrapProtected(<NotificationPage liveNotification={liveNotification} />)}
                        />

                        {PROTECTED_ROUTES.map(({ path, element }) => (
                          <Route key={path} path={path} element={wrapProtected(element)} />
                        ))}

                        <Route path="/not-found" element={<NotFound />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>

                      <SpacerWrapper />
                    </>
                  )}
                </NavTreeProvider>
              </HeaderVibrationProvider>
            </HeaderTitleProvider>
          </SearchProvider>
        </AlertProvider>
      </TutorialProvider>
    </AuthContext.Provider>
  );
}

export default App;