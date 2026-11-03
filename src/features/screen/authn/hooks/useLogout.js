import { useNavigate } from 'react-router-dom';
import { AUTHN_ROUTES } from '../constants/authn.routes';
import { logoutAuthnUser } from '../services/authn.session.service';

export const useLogout = ({ setUserLoggedIn }) => {
  const navigate = useNavigate();

  const logout = async () => {
    await logoutAuthnUser();
    setUserLoggedIn(false);
    navigate(AUTHN_ROUTES.AUTHN, { replace: true });
  };

  return { logout };
};