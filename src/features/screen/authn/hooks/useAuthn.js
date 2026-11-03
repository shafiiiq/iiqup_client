import { useState } from 'react';
import { getDeviceInfo } from '@/features/core/device/info/device.info';
import { AUTHN_STEPS } from '../constants/authn.constant';
import { updateAuthnAuthMail } from '../services/authn.authmail.service';
import { verifyStaffCredentials } from '../services/authn.credentials.service';
import { requestAuthnOtp, verifyAuthnOtp } from '../services/authn.otp.service';
import { parseAuthnError } from '../utils/authn.errors';
import { getAuthnContinueText, getAuthnPanelSubtitle, getAuthnPanelTitle } from '../utils/authn.copy';
import { normalizeAuthMail, validateAuthMail, validateAuthnFields, validateOtpCode } from '../utils/authn.validation';
import { useAuthnCompletion } from './useAuthnCompletion';
import { useOtpCountdown } from './useOtpCountdown';
import { useOtpInputs } from './useOtpInputs';
import { useWebGLSupport } from './useWebGLSupport';

const useAuthn = ({ setUserLoggedIn }) => {
    const [step, setStep] = useState(AUTHN_STEPS.AUTHN);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [authMail, setAuthMail] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [pendingUserData, setPendingUserData] = useState(null);
    const [pendingSessionToken, setPendingSessionToken] = useState(null);
    const [failedAttempts, setFailedAttempts] = useState(0);

    const supportsWebGL = useWebGLSupport();
    const { finishAuthn } = useAuthnCompletion({ setUserLoggedIn });
    const { remainingSeconds, countdownLabel, startCountdown, stopCountdown } = useOtpCountdown();
    const {
        otpDigits,
        otpCode,
        isOtpComplete,
        handleOtpChange,
        handleOtpKeyDown,
        handleOtpPaste,
        resetOtpInputs,
    } = useOtpInputs();

    const otpEmailDisplay = pendingUserData?.authMail || normalizeAuthMail(authMail);
    const canResendOtp = step === AUTHN_STEPS.OTP && remainingSeconds === 0 && !isLoading;

    const runAuthnAction = async (action) => {
        setIsLoading(true);
        setError(null);
        try {
            await action();
            return true;
        } catch (actionError) {
            setError(parseAuthnError(actionError));
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const sendOtp = async (destinationMail) => {
        await requestAuthnOtp(destinationMail);
        resetOtpInputs();
        startCountdown();
        setStep(AUTHN_STEPS.OTP);
    };

    const submitCredentials = async () => {
        const validationError = validateAuthnFields(email, password);
        if (validationError) {
            setError(validationError);
            return;
        }

        const isSuccessful = await runAuthnAction(async () => {
            const { userData, sessionToken } = await verifyStaffCredentials({
                email,
                password,
                deviceInfo: getDeviceInfo(),
            });
            setPendingUserData(userData);
            setPendingSessionToken(sessionToken);
            setFailedAttempts(0);

            if (!userData.authMail) {
                setStep(AUTHN_STEPS.UPDATE_AUTH_MAIL);
                return;
            }
            await sendOtp(userData.authMail);
        });

        if (!isSuccessful) setFailedAttempts((attempts) => attempts + 1);
    };

    const submitAuthMail = async () => {
        const validationError = validateAuthMail(authMail);
        if (validationError) {
            setError(validationError);
            return;
        }

        await runAuthnAction(async () => {
            const normalizedAuthMail = normalizeAuthMail(authMail);
            await updateAuthnAuthMail({ userId: pendingUserData._id, authMail: normalizedAuthMail });
            setPendingUserData((currentUserData) => ({ ...currentUserData, authMail: normalizedAuthMail }));
            await sendOtp(normalizedAuthMail);
        });
    };

    const submitOtp = async () => {
        const validationError = validateOtpCode(otpCode);
        if (validationError) {
            setError(validationError);
            return;
        }

        await runAuthnAction(async () => {
            const verifiedAuthn = await verifyAuthnOtp({
                authMail: otpEmailDisplay,
                otp: otpCode,
                userData: pendingUserData,
                deviceInfo: getDeviceInfo(),
            });
            finishAuthn({
                user: verifiedAuthn.user,
                accessToken: verifiedAuthn.accessToken,
                refreshToken: verifiedAuthn.refreshToken,
                sessionToken: verifiedAuthn.sessionToken ?? pendingSessionToken,
                isRemembered: rememberMe,
            });
        });
    };

    const handleResendOTP = async () => {
        if (!canResendOtp) return;
        await runAuthnAction(() => sendOtp(otpEmailDisplay));
    };

    const handleContinue = () => {
        if (isLoading) return;
        if (step === AUTHN_STEPS.UPDATE_AUTH_MAIL) return submitAuthMail();
        if (step === AUTHN_STEPS.OTP) return canResendOtp ? handleResendOTP() : submitOtp();
        return submitCredentials();
    };

    const handleBackToAuthn = () => {
        setStep(AUTHN_STEPS.AUTHN);
        setError(null);
        setPassword('');
        setAuthMail('');
        setPendingUserData(null);
        setPendingSessionToken(null);
        resetOtpInputs();
        stopCountdown();
    };

    return {
        step,
        error,
        email,
        setEmail,
        password,
        setPassword,
        authMail,
        setAuthMail,
        otpDigits,
        otpEmailDisplay,
        rememberMe,
        setRememberMe,
        remainingTime: remainingSeconds,
        failedAttempts,
        supportsWebGL,
        handleOTPChange: handleOtpChange,
        handleOTPKeyDown: handleOtpKeyDown,
        handleOTPPaste: handleOtpPaste,
        handleResendOTP,
        countdownLabel,
        isOTPContinueDisabled:
            isLoading || (step === AUTHN_STEPS.OTP && remainingSeconds > 0 && !isOtpComplete),
        panelTitle: getAuthnPanelTitle({ step, hasError: Boolean(error) }),
        panelSubtitle: getAuthnPanelSubtitle({ step, errorMessage: error }),
        isBackEnabled: step !== AUTHN_STEPS.AUTHN,
        continueText: getAuthnContinueText({ step, isLoading, canResendOtp }),
        handleContinue,
        handleBackToAuthn,
    };
};

export default useAuthn;