// ─────────────────────────────────────────────────────────────────────────────
// Login.jsx — Authentication flow
// Manages a 3-step auth sequence: credentials → OTP → (optional) auth mail setup.
// Renders a Spline 3D scene on the left and the active form on the right.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { useNavigate }                from 'react-router-dom';
import Spline                         from '@splinetool/react-spline';

import { LoginLogic }       from '../../../utils/authUtils';
import { API_URI }        from '../../../constants';
import { checkWebGLSupport } from '../../../utils/compatibility';
import Button               from '../../../Common/Button/Button';
import Input                from '../../../Common/Input/Input';

import './Login.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** OTP validity window in seconds (5 minutes). */
const OTP_EXPIRY_SECONDS = 300;

/** Number of failed login attempts before showing the "Forgot Password" link. */
const FORGOT_PASSWORD_THRESHOLD = 2;

/** Shared Input props applied to every text/email/password field. */
const FIELD_INPUT_PROPS = {
  colorScheme:       'amber-500',
  textColor:         'black-100',
  fontSize:          '6xl',
  labelBgColor:      'transparent',
  labelSize:         '8xl',
  labelColor:        'White-100',
  labelFontWeight:   '400',
  placeholderColor:  'black-300',
  variant:           'gradient',
  width:             '100%',
  height:            '70px',
  squircle:          '10xl',
  fontWeight:        '500',
  inputPaddingInline:'2xl',
  inputPaddingBlock: 'xl',
};

// ─────────────────────────────────────────────────────────────────────────────
// Login Component
// ─────────────────────────────────────────────────────────────────────────────

const Login = ({ setUserLoggedIn }) => {
  const navigate = useNavigate();

  // ── Auth Flow State ────────────────────────────────────────────────────────

  // step: 'login' | 'updateAuthMail' | 'otp'
  const [step,           setStep]           = useState('login');
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState(null);

  // ── Form Field State ───────────────────────────────────────────────────────

  const [email,          setEmail]          = useState('');
  const [password,       setPassword]       = useState('');
  const [authMail,       setAuthMail]       = useState('');
  const [otp,            setOtp]            = useState('');
  const [rememberMe,     setRememberMe]     = useState(false);

  // ── Session / UX State ─────────────────────────────────────────────────────

  const [userData,       setUserData]       = useState(null);
  const [remainingTime,  setRemainingTime]  = useState(0);
  const [canResend,      setCanResend]      = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);

  // ── Environment State ──────────────────────────────────────────────────────

  const [supportsWebGL,  setSupportsWebGL]  = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  // Detect WebGL support once on mount — determines whether Spline renders.
  useEffect(() => {
    setSupportsWebGL(checkWebGLSupport());
  }, []);

  // Countdown timer for OTP resend window.
  // Ticks every second; enables resend and stops when it hits zero.
  useEffect(() => {
    if (remainingTime <= 0) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [remainingTime]);

  // ─────────────────────────────────────────────────────────────────────────
  // API Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Requests a one-time password be sent to the given email address.
   * Returns a normalised result object so callers never need to catch here.
   *
   * @param {string} emailToSend
   * @returns {Promise<{ success: boolean, data?: object, error?: string }>}
   */
  const requestOTP = async (emailToSend) => {
    try {
      const response = await fetch(`${API_URI}/otp/request`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: emailToSend }),
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

  /** Starts the OTP countdown and advances the flow to the OTP step. */
  const advanceToOTPStep = () => {
    setRemainingTime(OTP_EXPIRY_SECONDS);
    setCanResend(false);
    setStep('otp');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Step 1 — Validates credentials via LoginLogic.
   * On success, either advances to OTP or prompts for an auth mail setup
   * if the user has never set one.
   */
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await LoginLogic.enhancedLogin(email, password, rememberMe, navigate, setUserLoggedIn);

      if (!result.success) throw new Error(result.error);

      setFailedAttempts(0);
      setUserData(result.user);

      if (!result.user.authMail) {
        // First-time user — collect an authentication email before sending OTP
        setStep('updateAuthMail');
      } else {
        const otpResult = await requestOTP(result.user.authMail);
        if (!otpResult.success) throw new Error(otpResult.error || 'Failed to send OTP');
        advanceToOTPStep();
      }
    } catch (err) {
      setFailedAttempts((prev) => prev + 1);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 1b — Saves a new authentication email for first-time users,
   * then proceeds to the OTP step.
   */
  const handleUpdateAuthMail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const emailRegex = /^\S+@\S+\.\S+$/;
      if (!emailRegex.test(authMail)) throw new Error('Please enter a valid email address');

      const response = await fetch(`${API_URI}/users/update-auth-mail`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ userId: userData._id, authMail }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to update authentication email');
      }

      setUserData((prev) => ({ ...prev, authMail }));

      const otpResult = await requestOTP(authMail);
      if (!otpResult.success) throw new Error(otpResult.error || 'Failed to send OTP');

      advanceToOTPStep();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Step 2 — Verifies the entered OTP and completes the login session.
   */
  const handleOTPVerification = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await LoginLogic.enhancedOTPVerification(otp, userData, rememberMe, navigate, setUserLoggedIn);
      if (!result.success) throw new Error(result.error);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /** Resends the OTP to the user's auth email and resets the countdown. */
  const handleResendOTP = async () => {
    if (!canResend) return;

    try {
      const otpResult = await requestOTP(userData?.authMail || authMail);
      if (!otpResult.success) throw new Error(otpResult.error || 'Failed to resend OTP');
      setOtp('');
      advanceToOTPStep();
    } catch (err) {
      setError(err.message);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // OTP Input Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /** Focuses the input at the given index within the OTP grid. */
  const focusOTPInput = (index) => {
    const inputs = document.querySelectorAll('.auth-otp-inputs input');
    inputs[index]?.focus();
  };

  const handleOTPChange = (index, e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (!value) return;

    const digits = otp.split('');
    digits[index] = value;
    setOtp(digits.join(''));

    if (index < 5) focusOTPInput(index + 1);
  };

  const handleOTPKeyDown = (index, e) => {
    if (e.key !== 'Backspace') return;

    const digits = otp.split('');

    if (otp[index]) {
      digits[index] = '';
      setOtp(digits.join(''));
    } else if (index > 0) {
      digits[index - 1] = '';
      setOtp(digits.join(''));
      focusOTPInput(index - 1);
    }
  };

  const handleOTPPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    setOtp(pasted.padEnd(6, ''));
    focusOTPInput(Math.min(pasted.length - 1, 5));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Derived Values
  // ─────────────────────────────────────────────────────────────────────────

  /** Formatted OTP countdown label, e.g. "4:07". */
  const countdownLabel = `${Math.floor(remainingTime / 60)}:${String(remainingTime % 60).padStart(2, '0')}`;

  /** True when the Continue button should be disabled on the OTP step. */
  const isOTPContinueDisabled = loading || (otp.length < 6 && remainingTime > 0);

  // ─────────────────────────────────────────────────────────────────────────
  // Form Renderers
  // ─────────────────────────────────────────────────────────────────────────

  const renderLoginForm = () => (
    <div className="auth-login-form-container">
      <form className="auth-login-form">
        <div className="auth-form-group">
          <Input
            {...FIELD_INPUT_PROPS}
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            label="Email Address"
            placeholder="Enter your email"
          />
        </div>
        <div className="auth-form-group">
          <Input
            {...FIELD_INPUT_PROPS}
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            label="Password"
            placeholder="Enter your password"
          />
        </div>
        <div className="auth-form-group">
          <Input
            type="checkbox"
            name="rememberMe"
            onChange={(e) => setRememberMe(e.target.checked)}
            checked={rememberMe}
            label="Remember me for 30 days"
            labelPosition="right"
            labelBgColor="transparent"
            labelSize="2xl"
            size="md"
            squircle="10xl"
            colorScheme="yellow-700"
            onCheckedColorScheme="yellow-300"
            onCheckedColor="black-300"
            variant="gradient"
          />
        </div>
      </form>
    </div>
  );

  const renderAuthMailForm = () => (
    <div className="auth-login-form-container">
      <form className="auth-login-form">
        <div className="auth-form-group">
          <Input
            {...FIELD_INPUT_PROPS}
            type="email"
            id="authMail"
            name="authMail"
            value={authMail}
            onChange={(e) => setAuthMail(e.target.value)}
            label="Authentication Email"
            placeholder="Enter authentication email"
          />
        </div>
      </form>
    </div>
  );

  const renderOTPForm = () => (
    <div className="auth-login-form-container">
      <form className="auth-login-form">
        <div className="auth-form-group">
          <div className="auth-otp-inputs">
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Input
                key={index}
                type="text"
                maxLength={1}
                value={otp[index] || ''}
                onChange={(e)        => handleOTPChange(index, e)}
                onKeyDown={(e)       => handleOTPKeyDown(index, e)}
                onPaste={handleOTPPaste}
                colorScheme="amber-500"
                textColor="black-100"
                fontSize="40xl"
                variant="gradient"
                width="100px"
                height="100px"
                squircle="10xl"
                fontWeight="600"
                inputPaddingInline="null"
              />
            ))}
          </div>
        </div>
      </form>
    </div>
  );

  const renderForm = () => {
    switch (step) {
      case 'updateAuthMail': return renderAuthMailForm();
      case 'otp':            return renderOTPForm();
      default:               return renderLoginForm();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Left Panel Content (title, subtitle, action buttons)
  // ─────────────────────────────────────────────────────────────────────────

  const panelTitle = error
    ? 'Please be here'
    : { otp: "We've sent an OTP", updateAuthMail: 'Set up your security' }[step] ?? 'Step forward';

  const panelSubtitle = error ? error : (() => {
    if (step === 'otp')           return <>Enter the 6-digit code sent to <strong>{userData?.authMail || authMail}</strong></>;
    if (step === 'updateAuthMail') return 'Set up your authentication email for enhanced security';
    return 'New updates include useful features for everyday work tasks users, to support normal work needs ease comfort clarity and smooth use across teams daily.';
  })();

  const isBackEnabled    = step === 'updateAuthMail' || step === 'otp';
  const continueText     = step === 'otp' && canResend && remainingTime === 0 ? 'Resend Code'
    : loading ? 'Verifying...' : 'Continue';

  const handleContinue = (e) => {
    if (step === 'updateAuthMail')                return handleUpdateAuthMail(e);
    if (step === 'otp' && canResend && remainingTime === 0) return handleResendOTP();
    if (step === 'otp')                           return handleOTPVerification(e);
    return handleLogin(e);
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="auth-login-container">

      {/* ── Left Panel — 3D scene + title + action buttons ──────────────── */}
      <div className="auth-left-section">
        <div className="auth-left-spt">

          {/* Spline 3D scene — falls back to empty div if WebGL unavailable */}
          {supportsWebGL ? (
            <Spline
              scene="https://prod.spline.design/LCYzYZEH1lngG-Tq/scene.splinecode"
              style={{ width: '100%', height: '105vh' }}
            />
          ) : (
            <div className="spline-fallback" />
          )}

          <div className="auth-info">
            <h1 className={`auth-title${error ? ' auth-subtitle-error' : ''}`}>
              {panelTitle}
            </h1>
            <p className={`auth-subtitle${error ? ' auth-subtitle-error' : ''}`}>
              {panelSubtitle}
            </p>

            <div className="auth-buttons">
              {/* Back / decorative left button */}
              <Button
                text={isBackEnabled ? 'Back to login' : "Let's"}
                onClick={isBackEnabled ? () => setStep('login') : undefined}
                colorScheme="white-400"
                variant="gradient"
                font="3xl"
                squircle="4xl"
                width="300px"
                height="70px"
                type="button"
                cursor={isBackEnabled ? 'pointer' : 'not-allowed'}
                textColor="yellow-800"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />

              {/* Primary action button */}
              <Button
                text={continueText}
                onClick={handleContinue}
                colorScheme="yellow-400"
                variant="gradient"
                font="3xl"
                squircle="4xl"
                width="300px"
                height="70px"
                type={isOTPContinueDisabled ? 'disabled' : 'button'}
                cursor={isOTPContinueDisabled ? 'not-allowed' : 'pointer'}
                textColor="black-200"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel — active form ────────────────────────────────────── */}
      <div className="auth-right-section">
        <div className="auth-login-card">
          {renderForm()}
        </div>
      </div>

      {/* ── Footer — Forgot Password (after repeated failures) ──────────── */}
      {step === 'login' && failedAttempts >= FORGOT_PASSWORD_THRESHOLD && (
        <div className="auth-form-footer">
          <button type="button" className="auth-forgot-btn">
            Oops, looks like lost! Forgot Password?
          </button>
        </div>
      )}

      {/* ── Footer — OTP Resend Timer ────────────────────────────────────── */}
      {step === 'otp' && (
        <div className="auth-form-footer">
          <div className="auth-resend-container">
            <Button
              text={remainingTime > 0
                ? `Resend code in ${countdownLabel}`
                : "Didn't receive the code? Resend Code"}
              onClick={handleResendOTP}
              disabled={remainingTime > 0}
              colorScheme="black-900"
              variant="gradient"
              font="3xl"
              animation=""
              squircle="10xl"
              width={remainingTime > 0 ? '300px' : '580px'}
              height="50px"
              type="disabled"
              cursor="not-allowed"
              textColor="white-200"
              shadowPosition="to-bottom"
              shadowColor="white-600"
            />
          </div>
        </div>
      )}

    </div>
  );
};

export default Login;