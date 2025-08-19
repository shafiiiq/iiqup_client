// authUtils.js - Enhanced Authentication utility functions with CEO handling
import { END_POINT } from "../constants";
import { apiRequest } from "./0auth";
export const AuthUtils = {
    // Save user session after successful login
    saveUserSession: (user, rememberMe = false) => {
        const userSession = {
            userId: user._id,
            email: user.email,
            authMail: user.authMail,
            uniqueCode: user.uniqueCode, // Store uniqueCode
            loginTime: new Date().toISOString(),
            expiresAt: rememberMe
                ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
                : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        };

        localStorage.setItem('userSession', JSON.stringify(userSession));
        localStorage.setItem('user', JSON.stringify(user)); // Store full user data
        localStorage.setItem('auth0token', user.auth0token);
        localStorage.setItem('refresh_token', user.refresh_token);
        localStorage.setItem('isUserLoggedIn', 'true');
    },

    // Check if user session is valid
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
                // Session expired
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
                    ...userData // Include all user data
                }
            };
        } catch (error) {
            AuthUtils.clearUserSession();
            return { isValid: false, user: null };
        }
    },

    // Clear user session (logout)
    clearUserSession: () => {
        localStorage.removeItem('userSession');
        localStorage.removeItem('user');
        localStorage.removeItem('isUserLoggedIn');
        localStorage.removeItem('ceoUniqueCode'); // Clear CEO code cache
    },

    // Get current user from session
    getCurrentUser: () => {
        const { isValid, user } = AuthUtils.checkUserSession();
        return isValid ? user : null;
    },

    // Check if user is logged in
    isAuthenticated: () => {
        return AuthUtils.checkUserSession().isValid;
    },

    // Check if current user is CEO
    isCEO: async () => {
        const currentUser = AuthUtils.getCurrentUser();
        if (!currentUser || !currentUser.uniqueCode || !currentUser.email) {
            return false;
        }

        try {
            // Check if we have cached CEO code
            const cachedCEOCode = localStorage.getItem('ceoUniqueCode');
            if (cachedCEOCode) {
                return currentUser.uniqueCode === cachedCEOCode;
            }

            const body = {
                email: currentUser.email
            }

            // Fetch CEO's unique code from API by sending current user's email
            const response = await apiRequest(`${END_POINT}/users/verify-ceo`,
                'POST',
                body
            );

            const data = await response.json();

            if (response.ok && data.success && data.data) {
                // Cache the CEO code for future use
                localStorage.setItem('ceoUniqueCode', data.data);
                return currentUser.uniqueCode === data.data;
            }

            return false;
        } catch (error) {
            console.error('Error checking CEO status:', error);
            return false;
        }
    },

    // Extend session (for remember me functionality)
    extendSession: (days = 30) => {
        const session = localStorage.getItem('userSession');
        if (session) {
            const userSession = JSON.parse(session);
            userSession.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
            localStorage.setItem('userSession', JSON.stringify(userSession));
        }
    }
};

// Enhanced Login Component Logic
export const LoginLogic = {
    // Handle successful login with CEO check
    handleLoginSuccess: async (userData, rememberMe, navigate, setUserLoggedIn) => {
        // Save session
        AuthUtils.saveUserSession(userData, rememberMe);

        // Update app state
        setUserLoggedIn(true);

        // Check if user is CEO and redirect accordingly
        const isCEO = await AuthUtils.isCEO();
        if (isCEO) {
            navigate('/dashboard');
        } else {
            navigate('/');
        }
    },

    // Handle logout
    handleLogout: (navigate, setUserLoggedIn) => {
        // Clear session
        AuthUtils.clearUserSession();

        // Update app state
        setUserLoggedIn(false);

        // Redirect to login
        navigate('/login');
    },

    enhancedLogin: async (email, password, rememberMe, navigate, setUserLoggedIn) => {
        try {
            const response = await fetch(`${END_POINT}/users/verify-user`, {
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
                requiresOTP: !!data.data.authMail // Flag to indicate if OTP is needed
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    },

    enhancedOTPVerification: async (otp, userData, rememberMe, navigate, setUserLoggedIn) => {
        try {
            const response = await apiRequest(`${END_POINT}/otp/verify`,
                'POST', {
                email: userData.authMail,
                otp,
                userId: userData._id
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Invalid OTP');
            }

            if (data.authorized) {
                // Handle successful verification and login
                const finalUserData = data.data.user || userData;
                AuthUtils.saveUserSession(finalUserData, rememberMe);
                setUserLoggedIn(true);

                // Check if user is CEO and redirect accordingly
                const isCEO = await AuthUtils.isCEO();
                if (isCEO) {
                    navigate('/dashboard');
                } else {
                    navigate('/');
                }

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
            const response = await apiRequest(`${END_POINT}/otp/request`,
                'POST',
                { email }
            );

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

// Protected Route Component Logic
export const ProtectedRoute = ({ children, navigate }) => {
    const { isValid } = AuthUtils.checkUserSession();

    if (!isValid) {
        navigate('/login');
        return null;
    }

    return children;
};

// Auto-login check for App component with CEO redirect
export const checkAutoLogin = async (setUserLoggedIn, navigate) => {
    const { isValid } = AuthUtils.checkUserSession();
    if (isValid) {
        setUserLoggedIn(true);

        // Check if user is CEO and redirect to dashboard if needed
        const isCEO = await AuthUtils.isCEO();
        if (isCEO && navigate && window.location.pathname !== '/dashboard') {
            navigate('/dashboard');
        }
    }
};