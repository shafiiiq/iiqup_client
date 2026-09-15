import { Navigate } from 'react-router-dom';

import Header from '@/shared/components/app/header/Header';
import Spacer from '@/shared/components/widgets/spacer/Spacer';
import NavigationButtons from '@/shared/components/widgets/navigator/Navigator';
import { AuthUtils } from '@/features/screen/oauth/login/helper/login.helper';

import { useIsHeaderVisible, useIsSpacerVisible, useIsNavigatorVisible } from '@/App/useApp';

export function ProtectedRoute({ children }) {
  const { isValid } = AuthUtils.checkUserSession();
  if (!isValid) return <Navigate to="/login" replace />;
  return children;
}

export function HeaderWrapper({ userLoggedIn, setUserLoggedIn }) {
  const isHeaderVisible = useIsHeaderVisible(userLoggedIn);
  if (!isHeaderVisible) return null;

  return (
    <Header
      user_logged_in={userLoggedIn}
      currentUser={AuthUtils.getCurrentUser()}
      setUserLoggedIn={setUserLoggedIn}
    />
  );
}

export function SpacerWrapper() {
  const isSpacerVisible = useIsSpacerVisible();
  if (!isSpacerVisible) return null;
  return <Spacer vertical="4rem" horizontal="100%" />;
}

export function NavigatorWrapper() {
  const isNavigatorVisible = useIsNavigatorVisible();
  if (!isNavigatorVisible) return null;
  return <NavigationButtons />;
}

export const wrapProtected = (element) => <ProtectedRoute>{element}</ProtectedRoute>;