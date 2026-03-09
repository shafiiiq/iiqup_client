// ─────────────────────────────────────────────────────────────────────────────
// ServiceDoc.jsx — Renders a printable service report document.
// Supports single-report view and multi-report (paginated) view.
// Handles digital signature flow: password → OTP → signature URL.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Loader } from 'lucide-react';

import logoImage    from '../../assets/images/al-ansari-color.png';
import alAnsariText from '../../assets/images/al-ansari-full-address.png';
import mechanicSign from '../../assets/images/mechanic-sign.png';

import { END_POINT }  from '../../constants';
import { apiRequest } from '../../utils/api';

import DevModal from '../../Common/DevModal/DevModal';
import Button   from '../../Common/Button/Button';

import '../ServiceDoc/ServiceDoc.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Signature session duration in milliseconds (10 seconds). */
const SIGNATURE_EXPIRY_MS = 10_000;

/** Rate-limit window in milliseconds (1 minute). */
const RATE_LIMIT_WINDOW_MS = 60_000;

/** Maximum authentication attempts allowed within the rate-limit window. */
const MAX_AUTH_ATTEMPTS = 3;

/** Shared Button props used across every action button to reduce duplication. */
const SHARED_BTN = {
  variant:       'gradient',
  font:          'md',
  animation:     '',
  squircle:      '4xl',
  height:        '38px',
  textColor:     'white-200',
  shadowPosition:'to-bottom',
  shadowColor:   'white-600',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps a service type key to its human-readable display name.
 *
 * @param {string} type - Service type key (e.g. 'oil', 'tyre').
 * @returns {string} Display name.
 */
const getServiceTypeName = (type) => {
  const map = {
    oil:         'Oil Service',
    maintenance: 'Major Works',
    tyre:        'Tyre Service',
    battery:     'Battery Service',
  };
  return map[type] || 'Service';
};

/**
 * Converts a "DD-MM-YYYY" date string to "YYYY-MM-DD" for display.
 * Returns the original string unchanged if the format is unrecognised.
 *
 * @param {string} dateString - Date in "DD-MM-YYYY" format.
 * @returns {string} Reformatted date or original value.
 */
const formatDate = (dateString) => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : dateString;
};

/**
 * Formats a countdown in seconds to "M:SS" display format.
 *
 * @param {number} totalSeconds - Remaining seconds.
 * @returns {string} Formatted time string.
 */
const formatTimeRemaining = (totalSeconds) => {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

/**
 * Resolves the correct API URL for the fetch based on the current pathname
 * and optional service-type filters from router state.
 *
 * @param {string}   pathname     - Current window pathname.
 * @param {string[]} serviceTypes - Optional service-type filters from state.
 * @param {Object}   params       - Destructured URL params (regNo, startDate, endDate, monthsCount).
 * @returns {{ url: string, isMultiple: boolean }}
 */
const resolveReportUrl = (pathname, serviceTypes, { regNo, startDate, endDate, monthsCount }) => {
  const typeQuery = serviceTypes.length ? `?serviceTypes=${serviceTypes.join(',')}` : '';

  if (pathname.includes('/all/all-histories/')) {
    return { url: `${END_POINT}/service-report/histories/${regNo}/all${typeQuery}`, isMultiple: true };
  }

  if (pathname.includes('/all/date-range/')) {
    const serviceType = pathname.split('/')[3];
    return { url: `${END_POINT}/service-report/histories/${regNo}/${serviceType}/date-range/${startDate}/${endDate}${typeQuery}`, isMultiple: true };
  }

  if (pathname.includes('/all/last-months/')) {
    const serviceType = pathname.split('/')[3];
    return { url: `${END_POINT}/service-report/histories/${regNo}/${serviceType}/last-months/${monthsCount}${typeQuery}`, isMultiple: true };
  }

  // Single-report view resolved by regNo + date (from router state).
  return { url: null, isMultiple: false };
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ReportHeader — Company logo and address banner shown at the top of each document.
 */
function ReportHeader() {
  return (
    <div className="header">
      <div className="logo-placeholder">
        <img src={logoImage} alt="Company Logo" />
      </div>
      <div className="company-details-s">
        <img src={alAnsariText} alt="AL Ansari Transport & Enterprises W.L.L" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * ChecklistRows — Renders the 35-item checklist as paired table rows (two columns).
 *
 * @param {Object} reportData - Full report object containing `checklistItems`.
 */
function ChecklistRows({ reportData }) {
  // Build a lookup map { id → status } for O(1) access in the render loop.
  const statusMap = {};
  reportData.checklistItems?.forEach((item) => {
    statusMap[item.id] = item.status;
  });

  const items = reportData.checklistItems || [];

  // The left column renders items 1-17; the right column renders 18-33.
  // Items 34 and 35 are omitted from the table rows (displayed in footer area).
  const leftItems  = items.slice(0, 17);
  const rightItems = items.slice(17, 33);

  return (
    <>
      {leftItems.map((leftItem, idx) => {
        const rightItem = rightItems[idx];
        return (
          <tr key={leftItem.id}>
            <td>{leftItem.id}</td>
            <td>{leftItem.description}</td>
            <td className="tick">{statusMap[leftItem.id] || ''}</td>
            {rightItem ? (
              <>
                <td>{rightItem.id}</td>
                <td>{rightItem.description}</td>
                <td className="tick">{statusMap[rightItem.id] || ''}</td>
              </>
            ) : (
              <><td /><td /><td /></>
            )}
          </tr>
        );
      })}

      {/* ── Remarks row ── */}
      <tr className="remarks-row">
        <td colSpan="6">
          <div className="remarks-box">
            <div className="remarks-text-doc">
              <strong className="remarks-label">REMARKS : </strong>
              {reportData.remarks?.toUpperCase()}
            </div>
          </div>
          <span className="equipment-fit-to-work">EQUIPMENT FIT TO WORK</span>
        </td>
      </tr>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * FooterRows — Renders the service metadata and signature rows at the bottom
 * of each report table.
 *
 * @param {Object} reportData       - Full report object.
 * @param {string} regNo            - Equipment registration number.
 * @param {string} supervisorSignUrl - URL of the supervisor's digital signature image.
 */
function FooterRows({ reportData, regNo, supervisorSignUrl }) {
  const nextServiceDisplay =
    reportData.nextServiceHrs === 0 || reportData.nextServiceHrs === '0'
      ? ''
      : reportData.fullService
        ? `${reportData.nextServiceHrs} - ${Number(reportData.serviceHrs) + 3000}`
        : reportData.nextServiceHrs;

  return (
    <>
      <tr>
        <td colSpan="3"><strong>SERVICE HRS:</strong> {reportData.fullService ? `${reportData.serviceHrs} - ${reportData.serviceHrs}` : reportData.serviceHrs}</td>
        <td colSpan="3"><strong>EQUIPMENT NO:</strong> {regNo}</td>
      </tr>
      <tr>
        <td colSpan="3"><strong>NEXT SERVICE HRS:</strong> {nextServiceDisplay}</td>
        <td colSpan="3"><strong>MACHINE:</strong> {reportData.machine?.toUpperCase()}</td>
      </tr>
      <tr>
        <td colSpan="3"><strong>MECHANICS:</strong> {reportData.mechanics?.toUpperCase()}</td>
        <td colSpan="3"><strong>LOCATION:</strong> {reportData.location?.toUpperCase()}</td>
      </tr>
      <tr>
        <td colSpan="3"><strong>DATE:</strong> {formatDate(reportData.date)}</td>
        <td colSpan="3"><strong>OPERATOR NAME:</strong> {reportData.operatorName?.toUpperCase()}</td>
      </tr>
      <tr className="sign-table">
        <td colSpan="3">
          <strong>MECHANIC SIGN:</strong>
          <img className="sign mechanic-sign" src={mechanicSign} alt="Mechanic Signature" />
        </td>
        <td colSpan="3">
          <strong>SUPERVISOR SIGN:</strong>
          {supervisorSignUrl ? (
            <img
              className="sign supervisor-sign"
              src={supervisorSignUrl}
              alt="Supervisor Signature"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <span className="no-signature">Not Signed</span>
          )}
        </td>
      </tr>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * ReportDocument — Wraps a single report in its printable document shell.
 *
 * @param {Object}   report           - Report data object.
 * @param {string}   regNo            - Equipment registration number.
 * @param {string}   supervisorSignUrl - Supervisor signature image URL.
 * @param {string}   headingTitle     - Table heading (e.g. "PERIODIC SERVICE REPORT - Oil Service").
 * @param {Function} onEdit           - Edit handler: (reportId, serviceType) => void.
 * @param {Function} onDelete         - Delete handler: (reportId) => void.
 * @param {boolean}  showActions      - Whether to show the Edit/Delete action bar.
 * @param {Object}   [style]          - Optional inline styles for the wrapper div.
 */
function ReportDocument({ report, regNo, supervisorSignUrl, headingTitle, onEdit, onDelete, showActions, style }) {
  return (
    <div className="doc-wrapper" style={style}>

      {/* ── Edit / Delete actions (hidden on print) ── */}
      {showActions && (
        <div className="report-actions no-print">
          <Button {...SHARED_BTN} text="Edit"   onClick={() => onEdit(report._id, report.serviceType)}   colorScheme="lime-800" width="160px" type="submit" />
          <Button {...SHARED_BTN} text="Delete" onClick={() => onDelete(report._id)}                     colorScheme="red-800"  width="160px" type="submit" />
        </div>
      )}

      <div className="x-container">
        <div className="report-container">
          <ReportHeader />
          <table className="checklist-table-s">
            <thead>
              <tr>
                <th colSpan="6" className="heading">{headingTitle}</th>
              </tr>
              <tr>
                <th>SL.NO</th>
                <th>DESCRIPTION</th>
                <th>CHECKED</th>
                <th>SL.NO</th>
                <th>DESCRIPTION</th>
                <th>CHECKED</th>
              </tr>
            </thead>
            <tbody>
              <ChecklistRows  reportData={report} />
              <FooterRows     reportData={report} regNo={regNo} supervisorSignUrl={supervisorSignUrl} />
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * SignatureModals — All modal dialogs used by the signature and delete flows.
 * Extracted to keep the main component's JSX concise.
 */
function SignatureModals({
  // Password
  showPasswordModal, sixDigitPassword, signLoading, signError,
  onPasswordClose, onPasswordInput, onPasswordSubmit,
  // OTP
  showOtpModal, otpCode,
  onOtpClose, onOtpInput, onOtpBack, onOtpSubmit,
  // Warning
  showWarningModal, onWarningClose, onWarnSign,
  // Success
  showSuccessModal, onSuccessClose, onSuccessPrint,
  // Delete
  showDeleteModal, onDeleteClose, onDeleteConfirm,
  // Loading
  showLoadingModal, loadingMessage,
}) {
  return (
    <>
      {/* ── Step 1: 6-digit password ── */}
      <DevModal
        isOpen={showPasswordModal}
        onClose={onPasswordClose}
        type="authentication"
        title="Document Signature Authentication"
        message="Step 1: Enter your 6-digit password"
        showInput
        inputValue={sixDigitPassword}
        onInputChange={onPasswordInput}
        inputPlaceholder="Enter 6-digit password"
        inputMaxLength={6}
        inputError={signError}
        buttonText={signLoading ? 'Verifying...' : 'Verify & Send OTP'}
        onButtonClick={onPasswordSubmit}
        preventClose={signLoading}
      />

      {/* ── Step 2: OTP ── */}
      <DevModal
        isOpen={showOtpModal}
        onClose={onOtpClose}
        type="otp"
        title="Enter OTP Code"
        message="OTP has been sent to the authorized email"
        showInput
        inputValue={otpCode}
        onInputChange={onOtpInput}
        inputPlaceholder="Enter 6-digit OTP"
        inputMaxLength={6}
        inputError={signError}
        buttonText={signLoading ? 'Signing...' : 'Sign Document'}
        secondaryButtonText="Back"
        onSecondaryClick={onOtpBack}
        onButtonClick={onOtpSubmit}
        preventClose={signLoading}
      />

      {/* ── Print warning ── */}
      <DevModal
        isOpen={showWarningModal}
        onClose={onWarningClose}
        type="warning"
        title="!Document Not Signed"
        message="You must sign the document before printing! This ensures document authenticity and compliance."
        buttonText="Sign Document Now"
        secondaryButtonText="Cancel"
        onButtonClick={onWarnSign}
        onSecondaryClick={onWarningClose}
      />

      {/* ── Signature success ── */}
      <DevModal
        isOpen={showSuccessModal}
        onClose={onSuccessClose}
        type="success"
        title="Document Signed Successfully!"
        message="Your document has been digitally signed! Signature valid for 10 seconds. You can now print the document."
        buttonText="Print Now"
        secondaryButtonText="Close"
        onButtonClick={onSuccessPrint}
        onSecondaryClick={onSuccessClose}
      />

      {/* ── Delete confirmation ── */}
      <DevModal
        isOpen={showDeleteModal}
        onClose={onDeleteClose}
        type="error"
        title="Delete Report?"
        message="Are you sure you want to delete this report? This action cannot be undone."
        buttonText="Delete"
        secondaryButtonText="Cancel"
        onButtonClick={onDeleteConfirm}
        onSecondaryClick={onDeleteClose}
      />

      {/* ── Progress / loading ── */}
      <DevModal
        isOpen={showLoadingModal}
        onClose={() => {}}
        type="progress"
        title="Processing..."
        message={loadingMessage}
        progress={100}
        preventClose
      />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ServiceDoc — Main Component
// ─────────────────────────────────────────────────────────────────────────────

function ServiceDoc() {
  const navigate = useNavigate();
  const location = useLocation();

  // ── Route params ───────────────────────────────────────────────────────────

  const {
    historyId,
    regNo:       regNoParam,
    serviceType: serviceTypeParam,
    startDate:   startDateParam,
    endDate:     endDateParam,
    monthsCount: monthsCountParam,
  } = useParams();

  // Router state takes precedence over URL params (supports programmatic navigation).
  const stateData   = location.state || {};
  const regNo       = stateData.regNo       || regNoParam;
  const date        = stateData.date;
  const serviceType = stateData.serviceType || serviceTypeParam;
  const startDate   = stateData.startDate   || startDateParam;
  const endDate     = stateData.endDate     || endDateParam;
  const monthsCount = stateData.monthsCount || monthsCountParam;

  // ── Data state ─────────────────────────────────────────────────────────────

  const [reportData,      setReportData]      = useState(null);
  const [multipleReports, setMultipleReports] = useState([]);
  const [isMultipleView,  setIsMultipleView]  = useState(false);
  const [totalCount,      setTotalCount]      = useState(0);
  const [loading,         setLoading]         = useState(true);

  // ── Signature state ────────────────────────────────────────────────────────

  const [supervisorSignUrl, setSupervisorSignUrl] = useState('');
  const [isDocumentSigned,  setIsDocumentSigned]  = useState(false);
  const [signExpiryTime,    setSignExpiryTime]    = useState(null);
  const [timeRemaining,     setTimeRemaining]     = useState(0);
  const [signatureCache,    setSignatureCache]    = useState({});

  // ── Auth state ─────────────────────────────────────────────────────────────

  const [sixDigitPassword, setSixDigitPassword] = useState('');
  const [otpCode,          setOtpCode]          = useState('');
  const [docAUTHmiddle,    setDocAUTHmiddle]    = useState('');
  const [signLoading,      setSignLoading]      = useState(false);
  const [signError,        setSignError]        = useState('');
  const [authAttempts,     setAuthAttempts]     = useState(0);
  const [lastAttempt,      setLastAttempt]      = useState(null);

  // ── Modal visibility state ─────────────────────────────────────────────────

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOtpModal,      setShowOtpModal]      = useState(false);
  const [showWarningModal,  setShowWarningModal]  = useState(false);
  const [showSuccessModal,  setShowSuccessModal]  = useState(false);
  const [showDeleteModal,   setShowDeleteModal]   = useState(false);
  const [showLoadingModal,  setShowLoadingModal]  = useState(false);
  const [loadingMessage,    setLoadingMessage]    = useState('');
  const [deleteReportId,    setDeleteReportId]    = useState(null);

  // ── Effect: Fetch report data ──────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        const pathname     = window.location.pathname;
        const serviceTypes = location.state?.serviceTypes || [];

        const { url: resolvedUrl, isMultiple } = resolveReportUrl(
          pathname, serviceTypes, { regNo, startDate, endDate, monthsCount }
        );

        // Single-report view uses regNo + date from router state.
        const fetchUrl = resolvedUrl || `${END_POINT}/service-report/${regNo}/${date}`;

        setIsMultipleView(isMultiple);

        const response = await apiRequest(fetchUrl);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);

        const result = await response.json();

        if (isMultiple) {
          setMultipleReports(result.data || []);
          setTotalCount(result.data?.length || 0);
        } else {
          setReportData(result.data?.[0] || null);
          setTotalCount(1);
        }
      } catch (err) {
        console.error('[ServiceDoc] fetchData error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [regNo, date, startDate, endDate, monthsCount, location.state]);

  // ── Effect: Signature countdown timer ─────────────────────────────────────

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

  // ── Helpers ────────────────────────────────────────────────────────────────

  /**
   * Returns true if the user is within the allowed request rate.
   * Resets the attempt counter if the rate-limit window has expired.
   */
  const checkRateLimit = () => {
    const now      = Date.now();
    const timeDiff = now - (lastAttempt || 0);

    if (timeDiff < RATE_LIMIT_WINDOW_MS && authAttempts >= MAX_AUTH_ATTEMPTS) {
      setSignError('Too many attempts. Please wait 1 minute.');
      return false;
    }

    if (timeDiff > RATE_LIMIT_WINDOW_MS) setAuthAttempts(0);

    return true;
  };

  /**
   * Returns a cached signature URL if still valid, otherwise null.
   *
   * @param {string} documentId - Cache key (defaults to 'default').
   * @returns {string|null}
   */
  const checkSignatureCache = (documentId = 'default') => {
    const cached = signatureCache[documentId];
    return cached && Date.now() < cached.expiry ? cached.url : null;
  };

  // ── Signature flow handlers ────────────────────────────────────────────────

  /** Initiates the signature flow. Uses cache if a valid entry exists. */
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

  /** Verifies the 6-digit password and triggers an OTP send. */
  const handleSixDigitVerification = async () => {
    if (sixDigitPassword.length !== 6) {
      setSignError('Please enter a 6-digit password');
      return;
    }

    if (!checkRateLimit()) return;

    setSignLoading(true);
    setSignError('');
    setShowPasswordModal(false);
    setShowLoadingModal(true);
    setLoadingMessage('Verifying password...');

    try {
      const passwordResponse = await apiRequest(
        `${END_POINT}/users/six-digit-auth/verify`,
        'POST',
        { password: sixDigitPassword }
      );
      if (!passwordResponse.ok) throw new Error('Invalid 6-digit password');

      setDocAUTHmiddle(sixDigitPassword);
      setLoadingMessage('Sending OTP to authorized email...');

      const otpResponse = await apiRequest(
        `${END_POINT}/otp/request`,
        'POST',
        { email: 'DOCUMENT_VERIFIER_AUTH_MAIL' }
      );
      if (!otpResponse.ok) throw new Error('Failed to send OTP');

      setShowLoadingModal(false);
      setShowOtpModal(true);

    } catch (err) {
      console.error('[ServiceDoc] Six-digit verification error:', err);
      setAuthAttempts((prev) => prev + 1);
      setLastAttempt(Date.now());
      setSignError(err.message || 'Authentication failed. Please try again.');
      setShowLoadingModal(false);
      setShowPasswordModal(true);
    } finally {
      setSignLoading(false);
    }
  };

  /** Verifies the OTP, fetches the signature key, and applies the digital signature. */
  const handleOtpVerification = async () => {
    if (otpCode.length !== 6) {
      setSignError('Please enter the 6-digit OTP');
      return;
    }

    setSignLoading(true);
    setSignError('');
    setShowOtpModal(false);
    setShowLoadingModal(true);
    setLoadingMessage('Verifying OTP code...');

    try {
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');

      const otpResponse = await apiRequest(
        `${END_POINT}/otp/verify`,
        'POST',
        { email: 'DOCUMENT_VERIFIER_AUTH_MAIL', otp: otpCode, userId: userData._id }
      );
      if (!otpResponse.ok) throw new Error('Invalid OTP code. Please check and try again.');

      setLoadingMessage('Generating signature key...');

      const keyResponse = await apiRequest(
        `${END_POINT}/users/doc-oauth-sign-key`,
        'POST',
        { password: docAUTHmiddle }
      );
      if (!keyResponse.ok) throw new Error('Failed to generate signature key');

      setDocAUTHmiddle('');
      const keyData = await keyResponse.json();

      setLoadingMessage('Applying digital signature...');

      const s3Response = await apiRequest(
        `${END_POINT}/s3/get-pre-signed-url`,
        'POST',
        { key: keyData.data.sign_key, isLong: false, isAuthSign: true }
      );
      if (!s3Response.ok) throw new Error('Failed to generate signature URL');

      const s3Data  = await s3Response.json();
      const fullUrl = s3Data.dataUrl;

      // Cache the signature URL with an expiry timestamp.
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
      console.error('[ServiceDoc] OTP verification error:', err);
      setSignError(err.message || 'Verification failed. Please try again.');
      setShowLoadingModal(false);
      setShowOtpModal(true);
    } finally {
      setSignLoading(false);
    }
  };

  // ── Navigation handlers ────────────────────────────────────────────────────

  const handlePrint           = () => isDocumentSigned ? window.print() : setShowWarningModal(true);
  const handleBackToHistory   = () => navigate(`/service-history/${regNo}`);
  const handleAddReport       = (id) => navigate(`/service-form/${serviceType}/${id}`);
  const handleEditReport      = (reportId, type) => navigate(`/service-form/update/${type}/${reportId}`);
  const handleDeleteReport    = (reportId) => { setDeleteReportId(reportId); setShowDeleteModal(true); };

  const confirmDeleteReport = async () => {
    try {
      const response = await apiRequest(`${END_POINT}/service-report/deletewith/${deleteReportId}`, 'DELETE');
      if (response.ok) {
        setShowDeleteModal(false);
        window.location.reload();
      } else {
        alert('Failed to delete the report. Please try again.');
      }
    } catch (err) {
      console.error('[ServiceDoc] Delete report error:', err);
      alert('An error occurred while deleting the report.');
    }
  };

  // ── Modal prop bundles ─────────────────────────────────────────────────────

  /** All props forwarded to <SignatureModals />. */
  const signatureModalProps = {
    // Password
    showPasswordModal, sixDigitPassword, signLoading, signError,
    onPasswordClose: () => { setShowPasswordModal(false); setSixDigitPassword(''); setSignError(''); },
    onPasswordInput: (val) => setSixDigitPassword(val.replace(/\D/g, '')),
    onPasswordSubmit: handleSixDigitVerification,
    // OTP
    showOtpModal, otpCode,
    onOtpClose: () => { setShowOtpModal(false); setOtpCode(''); setSignError(''); },
    onOtpInput: (val) => setOtpCode(val.replace(/\D/g, '')),
    onOtpBack: () => { setShowOtpModal(false); setShowPasswordModal(true); },
    onOtpSubmit: handleOtpVerification,
    // Warning
    showWarningModal,
    onWarningClose: () => setShowWarningModal(false),
    onWarnSign: () => { setShowWarningModal(false); signDocument(); },
    // Success
    showSuccessModal,
    onSuccessClose: () => setShowSuccessModal(false),
    onSuccessPrint: () => { setShowSuccessModal(false); handlePrint(); },
    // Delete
    showDeleteModal,
    onDeleteClose: () => setShowDeleteModal(false),
    onDeleteConfirm: confirmDeleteReport,
    // Loading
    showLoadingModal, loadingMessage,
  };

  // ── Shared action bar rendered above both single and multi-report views ────

  const ActionBar = () => (
    <div className="back-bug">
      <div className="print-button-wrapper no-print wraped-print">
        <Button {...SHARED_BTN} text="Back to Service History" onClick={handleBackToHistory} colorScheme="violet-800" width="220px" type="submit" />
        <Button
          {...SHARED_BTN}
          text={isDocumentSigned ? 'Print All Reports' : 'Sign to Print All'}
          onClick={handlePrint}
          colorScheme={isDocumentSigned ? 'violet-800' : 'gray-900'}
          width="160px"
          type={isDocumentSigned ? 'submit' : 'disabled'}
          cursor={isDocumentSigned ? 'allowed' : 'not-allowed'}
        />
        <Button
          {...SHARED_BTN}
          text="Sign the Document"
          onClick={signDocument}
          colorScheme={isDocumentSigned ? 'emerald-800' : 'amber-600'}
          width="160px"
          type="submit"
        />
      </div>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render guards
  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="loading-container">
        <div className="no-print">
          <Button {...SHARED_BTN} text="Back to Service History" onClick={handleBackToHistory} colorScheme="violet-800" width="220px" type="submit" />
        </div>
        <div className="no-print">
          <Loader />
        </div>
      </div>
    );
  }

  // ── Multiple-report view ───────────────────────────────────────────────────

  if (isMultipleView) {
    if (!multipleReports.length) {
      return (
        <div className="no-data-container">
          <div className="no-print">
            <h2>No report data available for the selected criteria</h2>
            <div className="no-result-found-service-nav">
              <Button {...SHARED_BTN} text="Back to Service History" onClick={handleBackToHistory}           colorScheme="violet-800" width="220px" type="submit" />
              <Button {...SHARED_BTN} text="Add Report Data"         onClick={() => handleAddReport(historyId)} colorScheme="violet-800" width="160px" type="submit" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* ── Document count + signature status ── */}
        <div className="back-bug">
          <div className="document-count">
            <span className="status-document-left">
              Showing {totalCount} Document(S) for Equipment: {regNo}
            </span>
            {isDocumentSigned && (
              <div className="signature-status">
                <span className="signed-indicator">✅ Document Signed</span>
                <span className="expiry-timer">⏰ Expires in: {formatTimeRemaining(timeRemaining)}</span>
              </div>
            )}
          </div>
        </div>

        <ActionBar />

        {/* ── Report pages ── */}
        {multipleReports.map((report, index) => (
          <ReportDocument
            key={report._id || index}
            report={report}
            regNo={regNo}
            supervisorSignUrl={supervisorSignUrl}
            headingTitle={`PERIODIC SERVICE REPORT - ${getServiceTypeName(report.serviceType)}${report.date ? ` - ${formatDate(report.date)}` : ''}`}
            onEdit={handleEditReport}
            onDelete={handleDeleteReport}
            showActions
            style={{ pageBreakAfter: index < multipleReports.length - 1 ? 'always' : 'auto' }}
          />
        ))}

        <SignatureModals {...signatureModalProps} />
      </>
    );
  }

  // ── Single-report view ────────────────────────────────────────────────────

  if (!reportData) {
    return (
      <div className="no-data-container">
        <h2>No report data available for this equipment and date</h2>
        <div className="no-result-found-service-nav">
          <Button {...SHARED_BTN} text="Back to Service History" onClick={handleBackToHistory}                colorScheme="amber-800"  width="220px" type="submit" />
          <Button {...SHARED_BTN} text="Add Report Data"         onClick={() => handleAddReport(historyId)}   colorScheme="violet-800" width="160px" type="submit" />
        </div>
      </div>
    );
  }

  return (
    <>
      <ActionBar />

      {/* ── Single report edit/delete bar ── */}
      <div className="back-bug pb-n">
        <div className="report-actions no-print single-report-actions">
          <Button {...SHARED_BTN} text="Edit"   onClick={() => handleEditReport(reportData._id, reportData.serviceType)} colorScheme="lime-800" width="160px" type="submit" />
          <Button {...SHARED_BTN} text="Delete" onClick={() => handleDeleteReport(reportData._id)}                        colorScheme="red-700"  width="160px" type="submit" />
        </div>
      </div>

      <ReportDocument
        report={reportData}
        regNo={regNo}
        supervisorSignUrl={supervisorSignUrl}
        headingTitle="PERIODIC SERVICE REPORT"
        onEdit={handleEditReport}
        onDelete={handleDeleteReport}
        showActions={false}
      />

      <SignatureModals {...signatureModalProps} />
    </>
  );
}

export default ServiceDoc;