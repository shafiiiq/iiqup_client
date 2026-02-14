import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';
import { AuthUtils, LoginLogic } from '../../../utils/authUtils';
import { END_POINT } from '../../../constants';
import Button from '../../../common/Button/Button';
import logoImage from '../../../assets/images/al-ansari.png';
import Spline from '@splinetool/react-spline';
import Input from '../../../common/Input/Input';
import { checkWebGLSupport } from '../../../utils/compatibilty';

const Login = ({ setUserLoggedIn }) => {
  const navigate = useNavigate();

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
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [splineError, setSplineError] = useState(false);
  const [supportsWebGL, setSupportsWebGL] = useState(true);

  useEffect(() => {
    setSupportsWebGL(checkWebGLSupport());
  }, []);

  useEffect(() => {
    if (splineError) {
      console.log('Spline failed to load in Login');
    }
  }, [splineError]);

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

      setFailedAttempts(0);

      if (!result.user.authMail) {
        setUserData(result.user);
        setStep('updateAuthMail');
      } else {
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
      setFailedAttempts(prev => prev + 1);
      setError(err.message || 'Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const requestOTP = async (emailToSend) => {
    try {
      const response = await fetch(`${END_POINT}/otp/request`, {
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
      const response = await fetch(`${END_POINT}/users/update-auth-mail`, {
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
      <form className="auth-login-form">
        <div className="auth-form-group">
          <Input
            type="email"
            id="email"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            colorScheme="amber-500"
            textColor="black-100"
            fontSize='6xl'
            label='Email Address'
            labelBgColor='transparent'
            labelSize='8xl'
            labelColor='White-100'
            labelFontWeight='400'
            placeholder="Enter your email"
            placeholderColor="black-300"
            variant="gradient"
            width="100%"
            height="70px"
            squircle="10xl"
            fontWeight='500'
            inputPaddingInline="2xl"
            inputPaddingBlock="xl"
          />
        </div>

        <div className="auth-form-group">
          <Input
            type={showPassword ? "text" : "password"}
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            colorScheme="amber-500"
            textColor="black-100"
            fontSize='6xl'
            label='Password'
            labelBgColor='transparent'
            labelSize='8xl'
            labelColor='White-100'
            labelFontWeight='400'
            placeholder="Enter your password"
            placeholderColor="black-300"
            variant="gradient"
            width="100%"
            height="70px"
            squircle="10xl"
            fontWeight='500'
            inputPaddingInline="2xl"
            inputPaddingBlock="xl"
          />
        </div>

        <div className="auth-form-group">
          <Input
            type="checkbox"
            name="text"
            onChange={(e) => setRememberMe(e.target.checked)}
            checked={rememberMe}
            label='Remember me for 30 days'
            labelPosition='right'
            labelBgColor='transparent'
            labelSize='2xl'
            size='md'
            squircle="10xl"
            colorScheme='yellow-700'
            onCheckedColorScheme='yellow-300'
            onCheckedColor='black-300'
            variant='gradient'
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
            type="email"
            id="authMail"
            name="authMail"
            value={authMail}
            onChange={(e) => setAuthMail(e.target.value)}
            colorScheme="amber-500"
            textColor="black-100"
            fontSize='6xl'
            label='Authentication Email'
            labelBgColor='transparent'
            labelSize='8xl'
            labelColor='White-100'
            labelFontWeight='400'
            placeholder="Enter authentication email"
            placeholderColor="black-300"
            variant="gradient"
            width="100%"
            height="70px"
            squircle="10xl"
            fontWeight='500'
            inputPaddingInline="2xl"
            inputPaddingBlock="xl"
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
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value) {
                    const newOtp = otp.split('');
                    newOtp[index] = value;
                    setOtp(newOtp.join(''));

                    if (index < 5) {
                      const nextInput = document.querySelectorAll('.auth-otp-inputs input')[index + 1];
                      if (nextInput) nextInput.focus();
                    }
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace') {
                    const newOtp = otp.split('');
                    if (otp[index]) {
                      newOtp[index] = '';
                      setOtp(newOtp.join(''));
                    } else if (index > 0) {
                      newOtp[index - 1] = '';
                      setOtp(newOtp.join(''));
                      const prevInput = document.querySelectorAll('.auth-otp-inputs input')[index - 1];
                      if (prevInput) prevInput.focus();
                    }
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
                  if (pastedData) {
                    const newOtp = pastedData.padEnd(6, '').split('');
                    setOtp(newOtp.join(''));
                    const lastIndex = Math.min(pastedData.length - 1, 5);
                    const lastInput = document.querySelectorAll('.auth-otp-inputs input')[lastIndex];
                    if (lastInput) lastInput.focus();
                  }
                }}
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
    <div className="auth-login-container">
      <div className="auth-left-section">
        <div className="auth-left-spt">
          {supportsWebGL ? (
            <Spline
              scene="https://prod.spline.design/LCYzYZEH1lngG-Tq/scene.splinecode"
              style={{ width: '100%', height: '105vh' }}
              onError={() => setSplineError(true)}
            />
          ) : (
            <div className="spline-fallback"> </div>
          )}
          <div className="auth-info">
            <h1 className={error ? 'auth-title auth-subtitle-error' : 'auth-title'}>
              {error ? 'Please be here' : (step === 'otp' ? "We've sent an OTP" : (step === 'updateAuthMail' ? "Set up your security" : 'Step forward'))}
            </h1>
            <p className={error ? 'auth-subtitle auth-subtitle-error' : 'auth-subtitle'}>
              {error ? error : (
                step === 'otp' ? (
                  <>
                    Enter the 6-digit code sent to <strong>{userData?.authMail || authMail}</strong>
                  </>
                ) : step === 'updateAuthMail' ? (
                  <>
                    Set up your authentication email for enhanced security
                  </>
                ) : (
                  <>
                    New updates include useful features for everyday work tasks users,
                    <br />
                    to support normal work needs ease comfort clarity and smooth use across teams daily.
                  </>
                )
              )}
            </p>
            <div className="auth-buttons">
              <Button
                text={step === 'updateAuthMail' ? "Back to login" : (step === 'otp' ? "Back to login" : "Let's")}
                onClick={step === 'updateAuthMail' || step === 'otp' ? () => setStep('login') : () => console.log()}
                colorScheme="white-400"
                variant="gradient"
                font="3xl"
                squircle="4xl"
                width="300px"
                height="70px"
                type="button"
                cursor={(step === 'updateAuthMail' || step === 'otp') ? 'pointer' : 'not-allowed'}
                textColor="yellow-800"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
              <Button
                text={
                  step === 'updateAuthMail'
                    ? "Continue"
                    : step === 'otp'
                      ? (loading
                        ? "Verifying..."
                        : (remainingTime === 0 && canResend ? "Resend Code" : "Continue")
                      )
                      : "Continue"
                }
                onClick={(e) => {
                  if (step === 'updateAuthMail') {
                    handleUpdateAuthMail(e);
                  } else if (step === 'otp') {
                    if (remainingTime === 0 && canResend) {
                      handleResendOTP();
                    } else {
                      handleOTPVerification(e);
                    }
                  } else {
                    handleLogin(e);
                  }
                }}
                colorScheme="yellow-400"
                variant="gradient"
                font="3xl"
                squircle="4xl"
                width="300px"
                height="70px"
                type={
                  step === 'otp' && (loading || (otp.length < 6 && remainingTime > 0))
                    ? 'disabled'
                    : 'button'
                }
                cursor={
                  step === 'otp' && (loading || (otp.length < 6 && remainingTime > 0))
                    ? 'not-allowed'
                    : 'pointer'
                }
                style={{
                  cursor: step === 'otp' && (loading || (otp.length < 6 && remainingTime > 0))
                    ? 'not-allowed'
                    : 'pointer'
                }}
                textColor="black-200"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="auth-right-section">
        <div className="auth-login-card">
          {renderForm()}
        </div>
      </div>

      {step === 'login' && failedAttempts >= 2 && (
        <div className="auth-form-footer">
          <button type="button" className="auth-forgot-btn">
            Oops, looks like lost! Forgot Password?
          </button>
        </div>
      )}

      {step === 'otp' && (
        <div className="auth-form-footer">
          <div className="auth-resend-container">
            {remainingTime > 0 ? (
              <Button
                text={`Resend code in ${Math.floor(remainingTime / 60)}:${String(remainingTime % 60).padStart(2, '0')}`}
                onClick={handleResendOTP}
                disabled="true"
                colorScheme='black-900'
                variant="gradient"
                font="3xl"
                animation=""
                squircle="10xl"
                width="300px"
                height="50px"
                type='disabled'
                cursor='not-allowed'
                textColor="white-200"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
            ) : (
              <Button
                text={` Didn't receive the code? Resend Code`}
                disabled="true"
                colorScheme='black-900'
                variant="gradient"
                font="3xl"
                animation=""
                squircle="10xl"
                width="580px"
                height="50px"
                type='disabled'
                cursor='not-allowed'
                textColor="white-200"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;