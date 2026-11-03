import Header from '@/shared/components/app/header/Header';
import Spacer from '@/shared/components/widgets/spacer/Spacer';
import NavigationButtons from '@/shared/components/widgets/navigator/Navigator';
import ProtectedRoute from '@/features/screen/authn/components/ProtectedRoute';
import { readCurrentUser } from '@/features/screen/authn/services/authn.current.user.service';

import { useIsHeaderVisible, useIsSpacerVisible, useIsNavigatorVisible } from '@/App/useApp';

export function HeaderWrapper({ userLoggedIn, setUserLoggedIn }) {
  const isHeaderVisible = useIsHeaderVisible(userLoggedIn);
  if (!isHeaderVisible) return null;

  return (
    <Header
      user_logged_in={userLoggedIn}
      currentUser={readCurrentUser()}
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