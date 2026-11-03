import { Routes, Route, Navigate } from 'react-router-dom';

import Authn from '@/features/screen/authn/components/Authn';
import SplashScreen from '@/shared/components/app/splash/SplashScreen';
import NotFound from '@/shared/components/app/lost/NotFound';
import Notification from '@/features/screen/notification/components/Notification';
import NotificationArrivalAlert from '@/shared/components/app/notification/NotificationArrivalAlert';
import NotificationPermissionBanner from '@/shared/components/app/notification/NotificationPermissionBanner';
import { AUTHN_ROUTES } from '@/features/screen/authn/constants/authn.routes';

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
  const { isPdfRender, userLoggedIn, setUserLoggedIn, loading, showSplash, splashComplete } = useApp();

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
                          path={AUTHN_ROUTES.AUTHN}
                          element={
                            userLoggedIn
                              ? <Navigate to={AUTHN_ROUTES.HOME} replace />
                              : <Authn setUserLoggedIn={setUserLoggedIn} />
                          }
                        />

                        <Route path="/notification" element={wrapProtected(<Notification />)} />

                        {PROTECTED_ROUTES.map(({ path, element }) => (
                          <Route key={path} path={path} element={wrapProtected(element)} />
                        ))}

                        <Route path="/not-found" element={<NotFound />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>

                      <SpacerWrapper />

                      {userLoggedIn && !isPdfRender && <NotificationArrivalAlert />}
                      {userLoggedIn && !isPdfRender && <NotificationPermissionBanner />}
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