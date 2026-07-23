import { API_URI } from "../constants";
import { apiRequest } from "./api";

export const AuthUtils = {
    saveUserSession: (user, rememberMe = false) => {
        const userSession = {
            userId: user._id,
            email: user.email,
            authMail: user.authMail,
            uniqueCode: user.uniqueCode,
            loginTime: new Date().toISOString(),
            expiresAt: rememberMe
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        localStorage.setItem('userSession', JSON.stringify(userSession));
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('auth0token', user.auth0token);
        localStorage.setItem('refresh_token', user.refresh_token);
        localStorage.setItem('isUserLoggedIn', 'true');
    },

    checkUserSession: () => {
        const session = localStorage.getItem('userSession');
        const user = localStorage.getItem('user');
        const isLoggedIn = localStorage.getItem('isUserLoggedIn');

        if (!session || !isLoggedIn) {
            return { isValid: false, user: null };
        }

        try {
            const userSession = JSON.parse(session);
            const userData = JSON.parse(user);
            const now = new Date();
            const expiresAt = new Date(userSession.expiresAt);

            if (now > expiresAt) {
                AuthUtils.clearUserSession();
                return { isValid: false, user: null };
            }

            return {
                isValid: true,
                user: {
                    userId: userSession.userId,
                    email: userSession.email,
                    authMail: userSession.authMail,
                    uniqueCode: userSession.uniqueCode,
                    loginTime: userSession.loginTime,
                    name: userData.name,
                    ...userData
                }
            };
        } catch (error) {
            AuthUtils.clearUserSession();
            return { isValid: false, user: null };
        }
    },

    clearUserSession: () => {
        localStorage.removeItem('userSession');
        localStorage.removeItem('user');
        localStorage.removeItem('isUserLoggedIn');
    },

    getCurrentUser: () => {
        const { isValid, user } = AuthUtils.checkUserSession();
        return isValid ? user : null;
    },

    isAuthenticated: () => {
        return AuthUtils.checkUserSession().isValid;
    },

    extendSession: (days = 30) => {
        const session = localStorage.getItem('userSession');
        if (session) {
            const userSession = JSON.parse(session);
            userSession.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
            localStorage.setItem('userSession', JSON.stringify(userSession));
        }
    }
};

export const LoginLogic = {
    handleLoginSuccess: (userData, rememberMe, navigate, setUserLoggedIn) => {
        AuthUtils.saveUserSession(userData, rememberMe);
        setUserLoggedIn(true);
        navigate('/');
    },

    handleLogout: (navigate, setUserLoggedIn) => {
        AuthUtils.clearUserSession();
        setUserLoggedIn(false);
        navigate('/login');
    },

    enhancedLogin: async (email, password) => {
        try {
            const response = await fetch(`${API_URI}/users/verify-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Invalid credentials');
            }

            return {
                success: true,
                user: data.data,
                requiresOTP: !!data.data.authMail
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    enhancedOTPVerification: async (otp, userData, rememberMe, navigate, setUserLoggedIn) => {
        try {
            const response = await apiRequest(`${API_URI}/otp/verify`, 'POST', {
                email: userData.authMail,
                otp,
                userId: userData._id
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Invalid OTP');
            }

            if (data.authorized) {
                const finalUserData = data.data.user || userData;
                AuthUtils.saveUserSession(finalUserData, rememberMe);
                setUserLoggedIn(true);
                navigate('/');
                return { success: true };
            } else {
                throw new Error('OTP verification failed');
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    requestOTP: async (email) => {
        try {
            const response = await apiRequest(`${API_URI}/otp/request`, 'POST', { email });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to send OTP');
            }

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
};

export const ProtectedRoute = ({ children, navigate }) => {
    const { isValid } = AuthUtils.checkUserSession();

    if (!isValid) {
        navigate('/login');
        return null;
    }

    return children;
};

export const checkAutoLogin = async (setUserLoggedIn, navigate) => {
    const { isValid } = AuthUtils.checkUserSession();
    if (isValid) {
        setUserLoggedIn(true);
    }
};