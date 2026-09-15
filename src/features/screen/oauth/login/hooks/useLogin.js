import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginLogic } from '@/features/screen/oauth/login/helper/login.helper';
import { apiRequest } from "@/features/core/network/api/api.request";
import { checkWebGLSupport } from '@/features/core/device/compatibility.device';
import { OTP_EXPIRY_SECONDS } from '../constants/login.constant';
import { focusOTPInputByIndex } from '../helper/login.helper';

const useLogin = ({ setUserLoggedIn }) => {
    const navigate = useNavigate();

    const [step, setStep] = useState('login');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authMail, setAuthMail] = useState('');
    const [otp, setOtp] = useState('');
    const [rememberMe, setRememberMe] = useState(false);

    const [userData, setUserData] = useState(null);
    const [remainingTime, setRemainingTime] = useState(0);
    const [canResend, setCanResend] = useState(false);
    const [failedAttempts, setFailedAttempts] = useState(0);

    const [supportsWebGL, setSupportsWebGL] = useState(false);

    useEffect(() => {
        setSupportsWebGL(checkWebGLSupport());
    }, []);

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

    const requestOTP = async (emailToSend) => {
        try {
            const response = await apiRequest(`/otp/request`,
                'POST',
                JSON.stringify({ email: emailToSend })
            );

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to send OTP');
            }

            return { success: true, data };
        } catch (err) {
            return { success: false, error: err.message };
        }
    };

    const advanceToOTPStep = () => {
        setRemainingTime(OTP_EXPIRY_SECONDS);
        setCanResend(false);
        setStep('otp');
    };

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

    const handleUpdateAuthMail = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const emailRegex = /^\S+@\S+\.\S+$/;
            if (!emailRegex.test(authMail)) throw new Error('Please enter a valid email address');

            const response = await apiRequest(`/authn/email`,
                'PUT',
                JSON.stringify({ userId: userData._id, authMail })
            );

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

    const handleOTPChange = (index, e) => {
        const value = e.target.value.replace(/\D/g, '');
        if (!value) return;

        const digits = otp.split('');
        digits[index] = value;
        setOtp(digits.join(''));

        if (index < 5) focusOTPInputByIndex(index + 1);
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
            focusOTPInputByIndex(index - 1);
        }
    };

    const handleOTPPaste = (e) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (!pasted) return;

        setOtp(pasted.padEnd(6, ''));
        focusOTPInputByIndex(Math.min(pasted.length - 1, 5));
    };

    const countdownLabel = `${Math.floor(remainingTime / 60)}:${String(remainingTime % 60).padStart(2, '0')}`;

    const isOTPContinueDisabled = loading || (otp.length < 6 && remainingTime > 0);

    const panelTitle = error
        ? 'Please be here'
        : { otp: "We've sent an OTP", updateAuthMail: 'Set up your security' }[step] ?? 'Step forward';

    const otpEmailDisplay = userData?.authMail || authMail;

    const panelSubtitle = error ? error : (() => {
        if (step === 'otp') {
            return React.createElement(
                React.Fragment,
                null,
                'Enter the 6-digit code sent to ',
                React.createElement('strong', null, otpEmailDisplay)
            );
        }
        if (step === 'updateAuthMail') return 'Set up your authentication email for enhanced security';
        return 'New updates include useful features for everyday work tasks users, to support normal work needs ease comfort clarity and smooth use across teams daily.';
    })();

    const isBackEnabled = step === 'updateAuthMail' || step === 'otp';
    const continueText = step === 'otp' && canResend && remainingTime === 0 ? 'Resend Code'
        : loading ? 'Verifying...' : 'Continue';

    const handleContinue = (e) => {
        if (step === 'updateAuthMail') return handleUpdateAuthMail(e);
        if (step === 'otp' && canResend && remainingTime === 0) return handleResendOTP();
        if (step === 'otp') return handleOTPVerification(e);
        return handleLogin(e);
    };

    const handleBackToLogin = () => setStep('login');

    return {
        step,
        loading,
        error,
        email,
        setEmail,
        password,
        setPassword,
        authMail,
        setAuthMail,
        otp,
        rememberMe,
        setRememberMe,
        remainingTime,
        canResend,
        failedAttempts,
        supportsWebGL,
        handleOTPChange,
        handleOTPKeyDown,
        handleOTPPaste,
        handleResendOTP,
        countdownLabel,
        isOTPContinueDisabled,
        panelTitle,
        panelSubtitle,
        isBackEnabled,
        continueText,
        handleContinue,
        handleBackToLogin,
    };
};

export default useLogin;