import { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  fetchServiceReportBatch,
  fetchServiceHistoryRecord,
  fetchServiceReportRecord,
  verifySixDigitPassword,
  requestDocumentOtp,
  verifyDocumentOtp,
  generateDocumentSignatureKey,
  getDocumentSignatureUrl,
  deleteServiceReport,
  downloadServiceReportPdf,
} from '../api/maintenance.report.api';
import {
  SIGNATURE_EXPIRY_MS,
  RATE_LIMIT_WINDOW_MS,
  MAX_AUTH_ATTEMPTS,
  formatTimeRemaining,
  resolveReportUrl,
} from '../helper/maintenance.report.helper';
import { useHeaderVibration } from '@/shared/context/VibrationContext';

export const useServiceDoc = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { triggerVibration } = useHeaderVibration();
  const {
    historyId,
    regNo: regNoParam,
    serviceType: serviceTypeParam,
    startDate: startDateParam,
    endDate: endDateParam,
    monthsCount: monthsCountParam,
  } = useParams();

  const stateData = location.state || {};
  const regNo = stateData.regNo || regNoParam;
  const serviceType = stateData.serviceType || serviceTypeParam;
  const startDate = stateData.startDate || startDateParam;
  const endDate = stateData.endDate || endDateParam;
  const monthsCount = stateData.monthsCount || monthsCountParam;

  const [reportData, setReportData] = useState(null);
  const [multipleReports, setMultipleReports] = useState([]);
  const [isMultipleView, setIsMultipleView] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const [supervisorSignUrl, setSupervisorSignUrl] = useState('');
  const [isDocumentSigned, setIsDocumentSigned] = useState(false);
  const [signExpiryTime, setSignExpiryTime] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [signatureCache, setSignatureCache] = useState({});

  const [sixDigitPassword, setSixDigitPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [docAUTHmiddle, setDocAUTHmiddle] = useState('');
  const [signLoading, setSignLoading] = useState(false);
  const [signError, setSignError] = useState('');
  const [authAttempts, setAuthAttempts] = useState(0);
  const [lastAttempt, setLastAttempt] = useState(null);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [deleteReportId, setDeleteReportId] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const pathname = window.location.pathname;
        const serviceTypes = location.state?.serviceTypes || [];
        const { url: resolvedUrl, isMultiple } = resolveReportUrl(pathname, serviceTypes, { regNo, startDate, endDate, monthsCount });

        setIsMultipleView(isMultiple);

        if (isMultiple) {
          const result = await fetchServiceReportBatch(resolvedUrl);
          setMultipleReports(result.data || []);
          setTotalCount(result.data?.length || 0);
        } else {
          const history = await fetchServiceHistoryRecord(serviceType || 'oil', historyId);

          if (!history?.reportId) {
            setReportData(null);
            setTotalCount(0);
            return;
          }

          const repResult = await fetchServiceReportRecord(history.reportId);
          setReportData(repResult || null);
          setTotalCount(repResult ? 1 : 0);
        }
      } catch (err) {
        console.error('[ServiceDoc] fetchData:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [historyId, regNo, serviceType, startDate, endDate, monthsCount, location.state]);

  useEffect(() => {
    if (!signExpiryTime || !isDocumentSigned) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((signExpiryTime - Date.now()) / 1000));
      setTimeRemaining(remaining);

      if (remaining <= 0) {
        setIsDocumentSigned(false);
        setSupervisorSignUrl('');
        setSignExpiryTime(null);
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [signExpiryTime, isDocumentSigned]);

  const checkRateLimit = () => {
    const now = Date.now();
    const timeDiff = now - (lastAttempt || 0);

    if (timeDiff < RATE_LIMIT_WINDOW_MS && authAttempts >= MAX_AUTH_ATTEMPTS) {
      setSignError('Too many attempts. Please wait 1 minute.');
      triggerVibration();
      return false;
    }

    if (timeDiff > RATE_LIMIT_WINDOW_MS) setAuthAttempts(0);
    return true;
  };

  const checkSignatureCache = (documentId = 'default') => {
    const cached = signatureCache[documentId];
    return cached && Date.now() < cached.expiry ? cached.url : null;
  };

  const signDocument = () => {
    const cachedUrl = checkSignatureCache();
    if (cachedUrl) {
      setSupervisorSignUrl(cachedUrl);
      setIsDocumentSigned(true);
      setShowSuccessModal(true);
      return;
    }
    setSixDigitPassword('');
    setOtpCode('');
    setSignError('');
    setShowPasswordModal(true);
  };

  const handleSixDigitVerification = async () => {
    if (sixDigitPassword.length !== 6) { setSignError('Please enter a 6-digit password'); return; }
    if (!checkRateLimit()) return;

    setSignLoading(true);
    setSignError('');
    setShowPasswordModal(false);
    setShowLoadingModal(true);
    setLoadingMessage('Verifying password...');

    try {
      const passwordResponse = await verifySixDigitPassword(sixDigitPassword);
      if (!passwordResponse.ok) throw new Error('Invalid 6-digit password');

      setDocAUTHmiddle(sixDigitPassword);
      setLoadingMessage('Sending OTP to authorized email...');

      const otpResponse = await requestDocumentOtp();
      if (!otpResponse.ok) throw new Error('Failed to send OTP');

      setShowLoadingModal(false);
      setShowOtpModal(true);
    } catch (err) {
      console.error('[ServiceDoc] six-digit verification:', err);
      setAuthAttempts((prev) => prev + 1);
      setLastAttempt(Date.now());
      setSignError(err.message || 'Authentication failed. Please try again.');
      triggerVibration();
      setShowLoadingModal(false);
      setShowPasswordModal(true);
    } finally {
      setSignLoading(false);
    }
  };

  const handleOtpVerification = async () => {
    if (otpCode.length !== 6) { setSignError('Please enter the 6-digit OTP'); return; }

    setSignLoading(true);
    setSignError('');
    setShowOtpModal(false);
    setShowLoadingModal(true);
    setLoadingMessage('Verifying OTP code...');

    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');
      const otpResponse = await verifyDocumentOtp(otpCode, userData._id);
      if (!otpResponse.ok) throw new Error('Invalid OTP code. Please check and try again.');

      setLoadingMessage('Generating signature key...');
      const keyResponse = await generateDocumentSignatureKey(docAUTHmiddle);
      if (!keyResponse.ok) throw new Error('Failed to generate signature key');

      setDocAUTHmiddle('');
      const keyData = await keyResponse.json();

      setLoadingMessage('Applying digital signature...');
      const s3Response = await getDocumentSignatureUrl(keyData.data.sign_key);
      if (!s3Response.ok) throw new Error('Failed to generate signature URL');

      const s3Data = await s3Response.json();
      const fullUrl = s3Data.dataUrl;
      const expiryTime = Date.now() + SIGNATURE_EXPIRY_MS;

      setSignatureCache((prev) => ({ ...prev, default: { url: fullUrl, expiry: expiryTime } }));
      setSupervisorSignUrl(fullUrl);
      setIsDocumentSigned(true);
      setSignExpiryTime(expiryTime);
      setTimeRemaining(SIGNATURE_EXPIRY_MS / 1000);
      setSixDigitPassword('');
      setOtpCode('');
      setAuthAttempts(0);
      setSignError('');
      setShowLoadingModal(false);
      setShowSuccessModal(true);
    } catch (err) {
      console.error('[ServiceDoc] OTP verification:', err);
      setSignError(err.message || 'Verification failed. Please try again.');
      triggerVibration();
      setShowLoadingModal(false);
      setShowOtpModal(true);
    } finally {
      setSignLoading(false);
    }
  };

  const handlePrint = () => (isDocumentSigned ? window.print() : setShowWarningModal(true));

  // "Add Report Data" — history record already exists, only the report is missing.
  // Opens the merged entry form directly on the Report tab, prefilled from history.
  const handleAddReport = (hId) => navigate(`/maintenance/entry/report/${serviceType || 'oil'}/${hId}`);

  // Edit an existing report — merged entry form, Report tab, prefilled from the report.
  const handleEditReport = (reportId, type) => navigate(`/maintenance/entry/report/update/${type}/${reportId}`);

  const handleDeleteReport = (reportId) => { setDeleteReportId(reportId); setShowDeleteModal(true); };

  const confirmDeleteReport = async () => {
    try {
      const response = await deleteServiceReport(deleteReportId);
      if (response.ok) {
        setShowDeleteModal(false);
        window.location.reload();
      } else {
        alert('Failed to delete the report. Please try again.');
      }
    } catch (err) {
      console.error('[ServiceDoc] delete report:', err);
      alert('An error occurred while deleting the report.');
    }
  };

  const handleAddReportClick = () => handleAddReport(historyId);
  const handleEditReportDataClick = () => handleEditReport(reportData._id, reportData.serviceType);
  const handleDeleteReportDataClick = () => handleDeleteReport(reportData._id);

  const handleDownloadPdf = async () => {
    try {
      const currentPath = window.location.pathname;
      const isSigned = isDocumentSigned ? 'true' : 'false';
      const fileName = `Service-Report-${regNo || 'equipment'}-${historyId || 'batch'}.pdf`;

      const blob = await downloadServiceReportPdf(`${currentPath}?pdf=1&signed=${isSigned}`, fileName);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('[ServiceDoc] handleDownloadPdf:', err);
      alert('Error generating PDF. Please try again.');
    }
  };

  const signatureModalProps = {
    showPasswordModal,
    sixDigitPassword,
    signLoading,
    signError,
    onPasswordClose: () => { setShowPasswordModal(false); setSixDigitPassword(''); setSignError(''); },
    onPasswordInput: (val) => setSixDigitPassword(val.replace(/\D/g, '')),
    onPasswordSubmit: handleSixDigitVerification,
    showOtpModal,
    otpCode,
    onOtpClose: () => { setShowOtpModal(false); setOtpCode(''); setSignError(''); },
    onOtpInput: (val) => setOtpCode(val.replace(/\D/g, '')),
    onOtpBack: () => { setShowOtpModal(false); setShowPasswordModal(true); },
    onOtpSubmit: handleOtpVerification,
    showWarningModal,
    onWarningClose: () => setShowWarningModal(false),
    onWarnSign: () => { setShowWarningModal(false); signDocument(); },
    showSuccessModal,
    onSuccessClose: () => setShowSuccessModal(false),
    onSuccessPrint: () => { setShowSuccessModal(false); handlePrint(); },
    showDeleteModal,
    onDeleteClose: () => setShowDeleteModal(false),
    onDeleteConfirm: confirmDeleteReport,
    showLoadingModal,
    loadingMessage,
  };

  return {
    navigate,
    location,
    historyId,
    regNo,
    serviceType,
    startDate,
    endDate,
    monthsCount,
    reportData,
    multipleReports,
    isMultipleView,
    totalCount,
    loading,
    supervisorSignUrl,
    isDocumentSigned,
    timeRemaining,
    sixDigitPassword,
    otpCode,
    signLoading,
    signError,
    showPasswordModal,
    showOtpModal,
    showWarningModal,
    showSuccessModal,
    showDeleteModal,
    showLoadingModal,
    loadingMessage,
    setSixDigitPassword,
    setOtpCode,
    setShowPasswordModal,
    setShowOtpModal,
    setShowWarningModal,
    setShowSuccessModal,
    setShowDeleteModal,
    setShowLoadingModal,
    setLoadingMessage,
    handlePrint,
    handleAddReport,
    handleEditReport,
    handleDeleteReport,
    handleAddReportClick,
    handleEditReportDataClick,
    handleDeleteReportDataClick,
    signDocument,
    handleSixDigitVerification,
    handleOtpVerification,
    confirmDeleteReport,
    signatureModalProps,
    formatTimeRemaining,
    handleDownloadPdf
  };
};