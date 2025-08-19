import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { AuthUtils, LoginLogic } from '../../../utils/authUtils';
import { END_POINT } from '../../../constants';

const Login = ({ setUserLoggedIn }) => {
  const navigate = useNavigate();

  // Form states
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [step, setStep] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMail, setAuthMail] = useState('');
  const [otp, setOtp] = useState('');
  const [userData, setUserData] = useState(null);
  const [remainingTime, setRemainingTime] = useState(0);
  const [canResend, setCanResend] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Base URL for API calls
  const API_BASE_URL = END_POINT;

  // Get current date and time
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const dateString = `${day}-${month}-${year}`;

      let hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const timeString = `${hours}:${minutes} ${ampm}`;

      setCurrentDateTime(`${dateString} | ${timeString}`);
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // OTP countdown timer
  useEffect(() => {
    let interval = null;

    if (remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime(prevTime => {
          if (prevTime <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [remainingTime]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await LoginLogic.enhancedLogin(
        email,
        password,
        rememberMe,
        navigate,
        setUserLoggedIn
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // If user doesn't have authMail, go to setup
      if (!result.user.authMail) {
        setUserData(result.user);
        setStep('updateAuthMail');
      } else {
        // Request OTP
        const otpResult = await requestOTP(result.user.authMail);
        if (otpResult.success) {
          setUserData(result.user);
          setRemainingTime(300);
          setCanResend(false);
          setStep('otp');
        } else {
          throw new Error(otpResult.error || 'Failed to send OTP');
        }
      }
    } catch (err) {
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestOTP = async (emailToSend) => {
    try {
      const response = await fetch(`${API_BASE_URL}/otp/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToSend }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const handleUpdateAuthMail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(authMail)) {
        throw new Error('Please enter a valid email address');
      }

      // API call to update authMail
      const response = await fetch(`${API_BASE_URL}/users/update-auth-mail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          userId: userData._id, 
          authMail 
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update authentication email');
      }

      // Update userData with new authMail
      setUserData(prevData => ({
        ...prevData,
        authMail
      }));

      // Request OTP to the newly set authMail
      const otpResult = await requestOTP(authMail);
      if (otpResult.success) {
        setRemainingTime(300);
        setCanResend(false);
        setStep('otp');
      } else {
        throw new Error(otpResult.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOTPVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await LoginLogic.enhancedOTPVerification(
        otp,
        userData,
        rememberMe,
        navigate,
        setUserLoggedIn
      );

      if (!result.success) {
        throw new Error(result.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (!canResend) return;

    try {
      const otpResult = await requestOTP(userData.authMail || authMail);
      if (otpResult.success) {
        setRemainingTime(300);
        setCanResend(false);
        setOtp('');
      } else {
        throw new Error(otpResult.error || 'Failed to resend OTP');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const renderLoginForm = () => (
    <div className="auth-login-form-container">
      <div className="auth-login-header-content">
        <div className="auth-login-icon-container">
          <div className="auth-icon-glow"></div>
        </div>
        <h1 className="auth-login-title">Welcome Back</h1>
        <p className="auth-login-subtitle">Access your secure workspace</p>
        <div className="auth-subtitle-accent"></div>
      </div>

      <form onSubmit={handleLogin} className="auth-login-form">
        <div className="auth-form-group">
          <label htmlFor="email">Email Address</label>
          <div className="auth-input-container">
            <div className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        <div className="auth-form-group">
          <label htmlFor="password">Password</label>
          <div className="auth-input-container">
            <div className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
                <path d="M7 11V7A5 5 0 0 1 17 7V11" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="auth-password-toggle"
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20C7 20 2.73 16.39 1 12A18.45 18.45 0 0 1 5.06 5.06L17.94 17.94Z" stroke="currentColor" strokeWidth="2" />
                  <path d="M1 1L23 23" stroke="currentColor" strokeWidth="2" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12S5 4 12 4S23 12 23 12S19 20 12 20S1 12 1 12Z" stroke="currentColor" strokeWidth="2" />
                  <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div className="auth-form-group">
          <label className="auth-checkbox-container">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="auth-checkmark"></span>
            Remember me for 30 days
          </label>
        </div>

        <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
          {loading ? (
            <div className="auth-btn-loading">
              <div className="auth-spinner"></div>
              <span>Authenticating...</span>
            </div>
          ) : (
            <div className="auth-btn-content">
              <span>Sign In</span>
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19" stroke="currentColor" strokeWidth="2" />
                <path d="M12 5L19 12L12 19" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
          )}
        </button>

        <div className="auth-form-footer">
          <button type="button" className="auth-link-btn">
            Forgot Password?
          </button>
        </div>
      </form>
    </div>
  );

  const renderAuthMailForm = () => (
    <div className="auth-login-form-container">
      <div className="auth-login-header-content">
        <div className="auth-login-icon-container">
          <img
            src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center"
            alt="Setup"
            className="auth-login-icon-image auth-setup"
          />
          <div className="auth-icon-glow auth-success"></div>
        </div>
        <h1 className="auth-login-title">Security Setup</h1>
        <p className="auth-login-subtitle">Set up your authentication email for enhanced security</p>
        <div className="auth-subtitle-accent"></div>
      </div>

      <form onSubmit={handleUpdateAuthMail} className="auth-login-form">
        <div className="auth-form-group">
          <label htmlFor="authMail">Authentication Email</label>
          <div className="auth-input-container">
            <div className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" />
                <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <input
              type="email"
              id="authMail"
              value={authMail}
              onChange={(e) => setAuthMail(e.target.value)}
              placeholder="Enter authentication email"
              required
            />
          </div>
        </div>

        <button type="submit" className="auth-btn auth-btn-primary" disabled={loading}>
          {loading ? (
            <div className="auth-btn-loading">
              <div className="auth-spinner"></div>
              <span>Setting up...</span>
            </div>
          ) : (
            'Set Authentication Email'
          )}
        </button>

        <button
          type="button"
          className="auth-btn auth-btn-secondary"
          onClick={() => setStep('login')}
          disabled={loading}
        >
          Back to Login
        </button>
      </form>
    </div>
  );

  const renderOTPForm = () => (
    <div className="auth-login-form-container">
      <div className="auth-login-header-content">
        <div className="auth-login-icon-container">
          <div className="auth-icon-glow auth-otp"></div>
        </div>
        <h1 className="auth-login-title">Email Verification</h1>
        <p className="auth-login-subtitle">
          Enter the 6-digit code sent to <strong>{userData?.authMail || authMail}</strong>
        </p>
        <div className="auth-subtitle-accent"></div>
      </div>

      <form onSubmit={handleOTPVerification} className="auth-login-form">
        <div className="auth-form-group">
          <label htmlFor="otp">Verification Code</label>
          <div className="auth-input-container">
            <div className="auth-input-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="16" r="1" fill="currentColor" />
                <path d="M7 11V7A5 5 0 0 1 17 7V11" stroke="currentColor" strokeWidth="2" />
              </svg>
            </div>
            <input
              type="text"
              id="otp"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter 6-digit OTP"
              maxLength={6}
              className="auth-otp-input"
              required
            />
          </div>
        </div>

        <button type="submit" className="auth-btn auth-btn-primary" disabled={loading || otp.length < 6}>
          {loading ? (
            <div className="auth-btn-loading">
              <div className="auth-spinner"></div>
              <span>Verifying...</span>
            </div>
          ) : (
            'Verify & Continue'
          )}
        </button>

        <div className="auth-resend-container">
          {remainingTime > 0 ? (
            <div className="auth-timer-display">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                <polyline points="12,6 12,12 16,14" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>Resend code in {Math.floor(remainingTime / 60)}:{String(remainingTime % 60).padStart(2, '0')}</span>
            </div>
          ) : (
            <button
              type="button"
              className="auth-resend-btn"
              onClick={handleResendOTP}
              disabled={!canResend}
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="23,4 23,10 17,10" stroke="currentColor" strokeWidth="2" />
                <path d="M20.49 15A9 9 0 1 1 5.64 5.64L23 10" stroke="currentColor" strokeWidth="2" />
              </svg>
              <span>Resend Code</span>
            </button>
          )}
        </div>

        <button
          type="button"
          className="auth-btn auth-btn-secondary"
          onClick={() => setStep('login')}
          disabled={loading}
        >
          Back to Login
        </button>
      </form>
    </div>
  );

  const renderForm = () => {
    switch (step) {
      case 'login':
        return renderLoginForm();
      case 'updateAuthMail':
        return renderAuthMailForm();
      case 'otp':
        return renderOTPForm();
      default:
        return renderLoginForm();
    }
  };

  return (
    <div className="auth-premium-login-container">
      <div className="auth-background-overlay"></div>
      <div className="auth-background-image"></div>

      <div className="auth-login-card">
        {error && (
          <div className="auth-error-alert">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
              <line x1="15" y1="9" x2="9" y2="15" stroke="currentColor" strokeWidth="2" />
              <line x1="9" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth="2" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {renderForm()}
      </div>
    </div>
  );
};

export default Login;