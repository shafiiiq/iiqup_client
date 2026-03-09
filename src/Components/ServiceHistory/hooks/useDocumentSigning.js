// ─────────────────────────────────────────────────────────────────────────────
// useDocumentSigning.js — Two-step document signature authentication.
// Step 1: 6-digit password → backend verification
// Step 2: OTP sent to authorised email → OTP verify → S3 signature URL
// Signature is valid for 10 seconds then auto-expires.
// Rate-limited to 3 attempts per 60 seconds.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { apiRequest }          from '../../../utils/api';
import { END_POINT }           from '../../../constants';

const SIGNATURE_EXPIRY_MS = 10_000; // 10 seconds
const RATE_LIMIT_WINDOW   = 60_000; // 60 seconds
const MAX_ATTEMPTS        = 3;

/**
 * Manages the full document-signing flow.
 *
 * @param {{
 *   onSigned: () => void  — called immediately when signing succeeds
 * }} options
 */
export const useDocumentSigning = ({ onSigned } = {}) => {

  // ── Modal Visibility ───────────────────────────────────────────────────────
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOtpModal,      setShowOtpModal]      = useState(false);
  const [showWarningModal,  setShowWarningModal]   = useState(false);
  const [showSuccessModal,  setShowSuccessModal]   = useState(false);
  const [showLoadingModal,  setShowLoadingModal]   = useState(false);
  const [loadingMessage,    setLoadingMessage]     = useState('');

  // ── Signature State ────────────────────────────────────────────────────────
  const [supervisorSignUrl,  setSupervisorSignUrl]  = useState('');
  const [isDocumentSigned,   setIsDocumentSigned]   = useState(false);
  const [signExpiryTime,     setSignExpiryTime]     = useState(null);

  // ── Auth Form State ────────────────────────────────────────────────────────
  const [sixDigitPassword, setSixDigitPassword] = useState('');
  const [otpCode,          setOtpCode]          = useState('');
  const [signLoading,      setSignLoading]       = useState(false);
  const [signError,        setSignError]         = useState('');

  // ── Internal (not exposed) ─────────────────────────────────────────────────
  const [docAUTHmiddle,  setDocAUTHmiddle]  = useState(''); // temp password store between steps
  const [authAttempts,   setAuthAttempts]   = useState(0);
  const [lastAttempt,    setLastAttempt]     = useState(null);
  const [signatureCache, setSignatureCache]  = useState({});

  // ── Pending Action ─────────────────────────────────────────────────────────
  // Which action triggered signing: 'pdf' | 'print' | null
  const [pendingAction, setPendingAction] = useState(null);

  // ─────────────────────────────────────────────────────────────────────────
  // Signature expiry countdown
  // Auto-revokes after SIGNATURE_EXPIRY_MS so the URL cannot be reused.
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!signExpiryTime || !isDocumentSigned) return;

    const interval = setInterval(() => {
      if (Date.now() >= signExpiryTime) {
        setIsDocumentSigned(false);
        setSupervisorSignUrl('');
        setSignExpiryTime(null);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [signExpiryTime, isDocumentSigned]);

  // ─────────────────────────────────────────────────────────────────────────
  // Rate Limiting
  // ─────────────────────────────────────────────────────────────────────────

  const checkRateLimit = () => {
    const now     = Date.now();
    const elapsed = now - (lastAttempt || 0);

    if (elapsed < RATE_LIMIT_WINDOW && authAttempts >= MAX_ATTEMPTS) {
      setSignError('Too many attempts. Please wait 1 minute.');
      return false;
    }

    // Reset counter after the window passes
    if (elapsed > RATE_LIMIT_WINDOW) setAuthAttempts(0);
    return true;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Cache check
  // If we already have a valid signature URL, skip the auth flow entirely.
  // ─────────────────────────────────────────────────────────────────────────

  const getSignatureFromCache = () => {
    const cached = signatureCache['default'];
    return cached && Date.now() < cached.expiry ? cached.url : null;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Public: initiate signing
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Called when the user triggers an action that requires a signed document.
   * If a valid cached signature exists, uses it immediately.
   * Otherwise opens the 6-digit password modal.
   *
   * @param {'pdf'|'print'} action  — what to do after signing
   */
  const requireSignature = (action) => {
    const cachedUrl = getSignatureFromCache();
    if (cachedUrl) {
      setSupervisorSignUrl(cachedUrl);
      setIsDocumentSigned(true);
      setPendingAction(action);
      setShowSuccessModal(true);
      return;
    }

    setPendingAction(action);
    setShowWarningModal(true);
  };

  const openPasswordModal = () => {
    setShowPasswordModal(true);
    setSixDigitPassword('');
    setOtpCode('');
    setSignError('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Step 1: 6-digit password verification
  // ─────────────────────────────────────────────────────────────────────────

  const handleSixDigitVerification = async () => {
    if (sixDigitPassword.length !== 6) {
      setSignError('Please enter a 6-digit password');
      return;
    }

    if (!checkRateLimit()) return;

    setSignLoading(true);
    setSignError('');

    try {
      setShowPasswordModal(false);
      setShowLoadingModal(true);
      setLoadingMessage('Verifying password...');

      const res = await apiRequest(`${END_POINT}/users/six-digit-auth/verify`, 'POST', { password: sixDigitPassword });
      if (!res.ok) throw new Error('Invalid 6-digit password');

      setDocAUTHmiddle(sixDigitPassword); // stored temporarily for step 2
      setLoadingMessage('Sending OTP to authorized email...');

      const otpRes = await apiRequest(`${END_POINT}/otp/request`, 'POST', { email: 'DOCUMENT_VERIFIER_AUTH_MAIL' });
      if (!otpRes.ok) throw new Error('Failed to send OTP');

      setShowLoadingModal(false);
      setShowOtpModal(true);
    } catch (err) {
      setAuthAttempts(prev => prev + 1);
      setLastAttempt(Date.now());
      setSignError(err.message || 'Authentication failed. Please try again.');
      setShowLoadingModal(false);
      setShowPasswordModal(true);
    } finally {
      setSignLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Step 2: OTP verification → signature URL
  // ─────────────────────────────────────────────────────────────────────────

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

      const userData = JSON.parse(localStorage.getItem('userData') || '{}');

      const otpRes = await apiRequest(`${END_POINT}/otp/verify`, 'POST', {
        email:  'DOCUMENT_VERIFIER_AUTH_MAIL',
        otp:    otpCode,
        userId: userData._id,
      });
      if (!otpRes.ok) throw new Error('Invalid OTP code. Please check and try again.');

      setLoadingMessage('Generating signature key...');

      const keyRes = await apiRequest(`${END_POINT}/users/doc-oauth-sign-key`, 'POST', { password: docAUTHmiddle });
      if (!keyRes.ok) throw new Error('Failed to generate signature key');

      setDocAUTHmiddle(''); // immediately clear the intermediate password from memory
      const keyData = await keyRes.json();

      setLoadingMessage('Applying digital signature...');

      const s3Res = await apiRequest(`${END_POINT}/s3/get-pre-signed-url`, 'POST', {
        key:        keyData.data.sign_key,
        isLong:     false,
        isAuthSign: true,
      });
      if (!s3Res.ok) throw new Error('Failed to generate signature URL');

      const { dataUrl } = await s3Res.json();
      const expiryTime  = Date.now() + SIGNATURE_EXPIRY_MS;

      // Cache the URL so re-signing within the same session is instant
      setSignatureCache(prev => ({ ...prev, default: { url: dataUrl, expiry: expiryTime } }));

      setSupervisorSignUrl(dataUrl);
      setIsDocumentSigned(true);
      setSignExpiryTime(expiryTime);
      setAuthAttempts(0);
      setSixDigitPassword('');
      setOtpCode('');
      setSignError('');
      setShowLoadingModal(false);
      setShowSuccessModal(true);

      onSigned?.();
    } catch (err) {
      setSignError(err.message || 'Verification failed. Please try again.');
      setShowLoadingModal(false);
      setShowOtpModal(true);
    } finally {
      setSignLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Exposed API
  // ─────────────────────────────────────────────────────────────────────────

  return {
    // Signature state
    isDocumentSigned,
    supervisorSignUrl,

    // Pending action (what to trigger after signing succeeds)
    pendingAction, setPendingAction,

    // Public entry points
    requireSignature,
    openPasswordModal,

    // Modal visibility
    showPasswordModal, setShowPasswordModal,
    showOtpModal,      setShowOtpModal,
    showWarningModal,  setShowWarningModal,
    showSuccessModal,  setShowSuccessModal,
    showLoadingModal,
    loadingMessage,

    // Form values
    sixDigitPassword, setSixDigitPassword,
    otpCode,          setOtpCode,
    signLoading,
    signError,

    // Step handlers
    handleSixDigitVerification,
    handleOtpVerification,
  };
};