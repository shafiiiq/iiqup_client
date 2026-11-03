import { useNavigate } from 'react-router-dom';
import socketService from '@/features/core/network/socket/socket.service';
import { AUTHN_ROUTES } from '../constants/authn.routes';
import { saveAuthnSession } from '../services/authn.session.service';

export const useAuthnCompletion = ({ setUserLoggedIn }) => {
    const navigate = useNavigate();

    const finishAuthn = ({ user, accessToken, refreshToken, sessionToken, isRemembered }) => {
        saveAuthnSession({ user, accessToken, refreshToken, sessionToken, isRemembered });
        setUserLoggedIn(true);
        socketService.connect();
        navigate(AUTHN_ROUTES.HOME, { replace: true });
    };

    return { finishAuthn };
};