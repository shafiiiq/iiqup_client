import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/features/core/network/api/api.request';

const SIGNATURE_EXPIRY_MS = 10_000;
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_VERIFICATION_ATTEMPTS = 3;

export const useDocumentSigning = () => {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const [supervisorSignUrl, setSupervisorSignUrl] = useState('');
  const [isDocumentSigned, setIsDocumentSigned] = useState(false);
  const [signatureExpiresAt, setSignatureExpiresAt] = useState(null);

  const [sixDigitPassword, setSixDigitPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [signLoading, setSignLoading] = useState(false);
  const [signError, setSignError] = useState('');

  const [verifiedPasswordAwaitingSignKey, setVerifiedPasswordAwaitingSignKey] = useState('');
  const [verificationAttemptCount, setVerificationAttemptCount] = useState(0);
  const [lastVerificationAttemptAt, setLastVerificationAttemptAt] = useState(null);

  const pendingSignedActionRef = useRef(null);

  useEffect(() => {
    if (!signatureExpiresAt || !isDocumentSigned) return;

    const intervalId = setInterval(() => {
      if (Date.now() >= signatureExpiresAt) {
        setIsDocumentSigned(false);
        setSupervisorSignUrl('');
        setSignatureExpiresAt(null);
        clearInterval(intervalId);
      }
    }, 1000);

    return () => clearInterval(intervalId);
  }, [signatureExpiresAt, isDocumentSigned]);

  const isWithinRateLimit = () => {
    const elapsedSinceLastAttempt = Date.now() - (lastVerificationAttemptAt || 0);

    if (elapsedSinceLastAttempt < RATE_LIMIT_WINDOW_MS && verificationAttemptCount >= MAX_VERIFICATION_ATTEMPTS) {
      setSignError('Too many attempts. Please wait 1 minute.');
      return false;
    }

    if (elapsedSinceLastAttempt > RATE_LIMIT_WINDOW_MS) setVerificationAttemptCount(0);
    return true;
  };

  const getValidCachedSignatureUrl = () =>
    isDocumentSigned && signatureExpiresAt && Date.now() < signatureExpiresAt ? supervisorSignUrl : null;

  const requireSignature = (onSignedAction) => {
    const cachedSignatureUrl = getValidCachedSignatureUrl();
    if (cachedSignatureUrl) {
      onSignedAction(cachedSignatureUrl);
      return;
    }
    pendingSignedActionRef.current = onSignedAction;
    setShowWarningModal(true);
  };

  const runPendingActionWithoutSignature = () => {
    pendingSignedActionRef.current?.(null);
    pendingSignedActionRef.current = null;
  };

  const openPasswordModal = () => {
    setShowPasswordModal(true);
    setSixDigitPassword('');
    setOtpCode('');
    setSignError('');
  };

  const handleSixDigitVerification = async () => {
    if (sixDigitPassword.length !== 6) {
      setSignError('Please enter a 6-digit password');
      return;
    }
    if (!isWithinRateLimit()) return;

    setSignLoading(true);
    setSignError('');

    try {
      setShowPasswordModal(false);
      setShowLoadingModal(true);
      setLoadingMessage('Verifying password...');

      const verifyResponse = await apiRequest(`/authz/six-digit-auth/verify`, 'POST', { password: sixDigitPassword });
      if (!verifyResponse.ok) throw new Error('Invalid 6-digit password');

      setVerifiedPasswordAwaitingSignKey(sixDigitPassword);
      setLoadingMessage('Sending OTP to authorized email...');

      const otpRequestResponse = await apiRequest(`/otp/request`, 'POST', { email: 'DOCUMENT_VERIFIER_AUTH_MAIL' });
      if (!otpRequestResponse.ok) throw new Error('Failed to send OTP');

      setShowLoadingModal(false);
      setShowOtpModal(true);
    } catch (error) {
      setVerificationAttemptCount((count) => count + 1);
      setLastVerificationAttemptAt(Date.now());
      setSignError(error.message || 'Authentication failed. Please try again.');
      setShowLoadingModal(false);
      setShowPasswordModal(true);
    } finally {
      setSignLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    if (otpCode.length !== 6) {
      setSignError('Please enter the 6-digit OTP');
      return;
    }

    setSignLoading(true);
    setSignError('');

    try {
      setShowOtpModal(false);
      setShowLoadingModal(true);
      setLoadingMessage('Verifying OTP code...');

      const currentUser = JSON.parse(localStorage.getItem('userData') || '{}');

      const otpVerifyResponse = await apiRequest(`/otp/verify`, 'POST', {
        email: 'DOCUMENT_VERIFIER_AUTH_MAIL',
        otp: otpCode,
        userId: currentUser._id,
      });
      if (!otpVerifyResponse.ok) throw new Error('Invalid OTP code. Please check and try again.');

      setLoadingMessage('Generating signature key...');
      const signKeyResponse = await apiRequest(`/authz/sign-key`, 'POST', { password: verifiedPasswordAwaitingSignKey });
      if (!signKeyResponse.ok) throw new Error('Failed to generate signature key');

      setVerifiedPasswordAwaitingSignKey('');
      const signKeyResult = await signKeyResponse.json();

      setLoadingMessage('Applying digital signature...');
      const presignedUrlResponse = await apiRequest(`/s3/pre-signed-url`, 'POST', {
        key: signKeyResult.data.sign_key,
        isLong: false,
        isAuthSign: true,
      });
      if (!presignedUrlResponse.ok) throw new Error('Failed to generate signature URL');

      const { dataUrl: signatureDataUrl } = await presignedUrlResponse.json();
      const expiresAt = Date.now() + SIGNATURE_EXPIRY_MS;

      setSupervisorSignUrl(signatureDataUrl);
      setIsDocumentSigned(true);
      setSignatureExpiresAt(expiresAt);
      setVerificationAttemptCount(0);
      setSixDigitPassword('');
      setOtpCode('');
      setSignError('');
      setShowLoadingModal(false);
      setShowSuccessModal(true);

      pendingSignedActionRef.current?.(signatureDataUrl);
      pendingSignedActionRef.current = null;
    } catch (error) {
      setSignError(error.message || 'Verification failed. Please try again.');
      setShowLoadingModal(false);
      setShowOtpModal(true);
    } finally {
      setSignLoading(false);
    }
  };

  return {
    isDocumentSigned,
    supervisorSignUrl,

    requireSignature,
    runPendingActionWithoutSignature,
    openPasswordModal,

    showPasswordModal, setShowPasswordModal,
    showOtpModal, setShowOtpModal,
    showWarningModal, setShowWarningModal,
    showSuccessModal, setShowSuccessModal,
    showLoadingModal,
    loadingMessage,

    sixDigitPassword, setSixDigitPassword,
    otpCode, setOtpCode,
    signLoading,
    signError,

    handleSixDigitVerification,
    handleOtpVerification,
  };
};