'use client';
import React, { useEffect, useState } from 'react';
import logoImage from '../../assets/images/al-ansari.png';
import alAnsariText from '../../assets/images/al-ansari-text.png';
import mechanicSign from '../../assets/images/mechanic-sign.png';
import { useParams, useNavigate } from 'react-router-dom';
import { END_POINT } from '../../constants';
import '../ServiceDoc/ServiceDoc.css'
import { apiRequest } from '../../utils/0auth';

const ServiceDoc = () => {
  const { regNo, date, serviceType, startDate, endDate, monthsCount } = useParams();
  const [reportData, setReportData] = useState(null);
  const [multipleReports, setMultipleReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMultipleView, setIsMultipleView] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [supervisorSignUrl, setSupervisorSignUrl] = useState('');

  // Signature authentication states
  const [showSignModal, setShowSignModal] = useState(false);
  const [signStep, setSignStep] = useState(1); // 1: 6-digit, 2: OTP
  const [sixDigitPassword, setSixDigitPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [signLoading, setSignLoading] = useState(false);
  const [signError, setSignError] = useState('');
  const [docAUTHmiddle, setDocAUTHmiddle] = useState('');

  // Enhanced security states
  const [authAttempts, setAuthAttempts] = useState(0);
  const [lastAttempt, setLastAttempt] = useState(null);
  const [signatureCache, setSignatureCache] = useState({});
  const [isDocumentSigned, setIsDocumentSigned] = useState(false);
  const [signExpiryTime, setSignExpiryTime] = useState(null);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const navigate = useNavigate();

  // Rate limiting check
  const checkRateLimit = () => {
    const now = Date.now();
    const timeDiff = now - (lastAttempt || 0);

    if (timeDiff < 60000 && authAttempts >= 3) { // 3 attempts per minute
      setSignError('Too many attempts. Please wait 1 minute.');
      return false;
    }

    if (timeDiff > 60000) {
      setAuthAttempts(0);
    }

    return true;
  };

  // Check signature cache
  const checkSignatureCache = (documentId) => {
    const cached = signatureCache[documentId || 'default'];
    if (cached && Date.now() < cached.expiry) {
      return cached.url;
    }
    return null;
  };

  // Format time remaining
  const formatTimeRemaining = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Existing useEffect for fetching data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        let url = '';
        let multipleView = false;

        const currentPath = window.location.pathname;

        if (currentPath.includes('/all/all-histories/')) {
          url = `${END_POINT}/service-report/histories/${regNo}`;
          multipleView = true;
        } else if (currentPath.includes('/all/oil-service/')) {
          url = `${END_POINT}/service-report/histories/${regNo}/oil`;
          multipleView = true;
        } else if (currentPath.includes('/all/maintenance-service/')) {
          url = `${END_POINT}/service-report/histories/${regNo}/maintenance`;
          multipleView = true;
        } else if (currentPath.includes('/all/tyre-service/')) {
          url = `${END_POINT}/service-report/histories/${regNo}/tyre`;
          multipleView = true;
        } else if (currentPath.includes('/all/battery-service/')) {
          url = `${END_POINT}/service-report/histories/${regNo}/battery`;
          multipleView = true;
        } else if (currentPath.includes('/all/date-range/')) {
          url = `${END_POINT}/service-report/histories/${regNo}/date-range/${startDate}/${endDate}`;
          multipleView = true;
        } else if (currentPath.includes('/all/last-months/')) {
          url = `${END_POINT}/service-report/histories/${regNo}/last-months/${monthsCount}`;
          multipleView = true;
        } else {
          url = `${END_POINT}/service-report/${regNo}/${date}`;
          multipleView = false;
        }

        setIsMultipleView(multipleView);

        const response = await apiRequest(url);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (multipleView) {
          setMultipleReports(data.data || []);
          setTotalCount(data.data?.length || 0);
        } else {
          setReportData(data.data?.[0] || null);
          setTotalCount(1);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error fetching report data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [regNo, date, startDate, endDate, monthsCount]);

  // Countdown timer effect
  useEffect(() => {
    let interval = null;

    if (signExpiryTime && isDocumentSigned) {
      interval = setInterval(() => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((signExpiryTime - now) / 1000));
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          setIsDocumentSigned(false);
          setSupervisorSignUrl('');
          setSignExpiryTime(null);
          clearInterval(interval);
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [signExpiryTime, isDocumentSigned]);

  // Enhanced sign document function
  const signDocument = () => {
    // Check if already signed and not expired
    const cachedUrl = checkSignatureCache('default');
    if (cachedUrl) {
      setSupervisorSignUrl(cachedUrl);
      setIsDocumentSigned(true);
      setShowSuccessModal(true);
      return;
    }

    setShowSignModal(true);
    setSignStep(1);
    setSixDigitPassword('');
    setOtpCode('');
    setSignError('');
  };

  // Enhanced handle print function
  const handlePrint = () => {
    if (!isDocumentSigned) {
      setShowWarningModal(true);
      return;
    }
    window.print();
  };

  const handleSixDigitVerification = async () => {
    if (sixDigitPassword.length !== 6) {
      setSignError('Please enter a 6-digit password');
      return;
    }

    setSignLoading(true);
    setSignError('');

    // Check rate limiting
    if (!checkRateLimit()) {
      setSignLoading(false);
      return;
    }

    try {
      // Step 1: Verify 6-digit password
      const passwordResponse = await apiRequest(
        `${END_POINT}/users/six-digit-auth/verify`,
        'POST',
        { password: sixDigitPassword }
      );

      if (!passwordResponse.ok) {
        throw new Error('Invalid 6-digit password');
      }

      setDocAUTHmiddle(sixDigitPassword)

      // Step 2: Request OTP
      const otpResponse = await apiRequest(
        `${END_POINT}/otp/request`,
        'POST',
        { email: 'DOCUMENT_VERIFIER_AUTH_MAIL' }
      );

      if (!otpResponse.ok) {
        throw new Error('Failed to send OTP');
      }

      // Move to OTP step
      setSignStep(2);
      setSignLoading(false);
    } catch (error) {
      console.error('Six-digit verification error:', error);
      setAuthAttempts(prev => prev + 1);
      setLastAttempt(Date.now());
      setSignError('Authentication failed. Please try again.');
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
      // Get user data (assuming you have access to userData)
      const userData = JSON.parse(localStorage.getItem('userData') || '{}');

      // Step 3: Verify OTP
      const otpResponse = await apiRequest(
        `${END_POINT}/otp/verify`,
        'POST',
        {
          email: 'DOCUMENT_VERIFIER_AUTH_MAIL',
          otp: otpCode,
          userId: userData._id
        }
      );

      if (!otpResponse.ok) {
        throw new Error('Invalid OTP');
      }

      // Step 4: Get signature key
      const keyResponse = await apiRequest(
        `${END_POINT}/users/doc-0auth-sign-key`,
        'POST',
        {
          password: docAUTHmiddle
        }
      );

      if (!keyResponse.ok) {
        throw new Error('Failed to get signature key');
      }

      setDocAUTHmiddle('')
      const keyData = await keyResponse.json();

      // Step 5: Get presigned URL for signature
      const body = { key: keyData.data.sign_key, isLong: false, isAuthSign: true };
      const s3response = await apiRequest(
        `${END_POINT}/s3Config/get-pre-signed-url`,
        'POST',
        body
      );

      if (!s3response.ok) {
        throw new Error(`S3 URL generation failed: ${s3response.status}`);
      }

      const s3URL = await s3response.json();
      const fullUrl = s3URL.dataUrl;

      // Cache the signature (10 seconds = 10000ms)
      const expiryTime = Date.now() + 10000; // 10 seconds
      setSignatureCache(prev => ({
        ...prev,
        'default': {
          url: fullUrl,
          expiry: expiryTime
        }
      }));

      setSupervisorSignUrl(fullUrl);
      setIsDocumentSigned(true);
      setSignExpiryTime(expiryTime);
      setTimeRemaining(10); // 10 seconds

      // Close modal and reset states
      setShowSignModal(false);
      setSignStep(1);
      setSixDigitPassword('');
      setOtpCode('');
      setSignLoading(false);
      setAuthAttempts(0); // Reset attempts on success

      // Show success modal instead of alert
      setShowSuccessModal(true);

    } catch (error) {
      console.error('OTP verification error:', error);
      setSignError('Verification failed. Please try again.');
      setSignLoading(false);
    }
  };

  const closeSignModal = () => {
    setShowSignModal(false);
    setSignStep(1);
    setSixDigitPassword('');
    setOtpCode('');
    setSignError('');
  };

  // Your existing helper functions
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  const getServiceTypeName = (serviceType) => {
    switch (serviceType) {
      case 'oil':
        return 'Oil Service';
      case 'maintenance':
        return 'Major Works';
      case 'tyre':
        return 'Tyre Service';
      case 'battery':
        return 'Battery Service';
      default:
        return 'Service';
    }
  };

  const handleAddReport = () => {
    navigate('/service-form');
  };

  const handleBackToHistory = () => {
    navigate(`/service-history/${regNo}`);
  };

  const handleEditReport = (reportId) => {
    navigate(`/service-form/update/${reportId}`);
  };

  const handleDeleteReport = async (reportId) => {
    if (window.confirm('Are you sure you want to delete this report?')) {
      try {
        const response = await apiRequest(`${END_POINT}/service-report/deletewith/${reportId}`,
          'DELETE',
        );

        if (response.ok) {
          window.location.reload();
        } else {
          alert('Failed to delete the report. Please try again.');
        }
      } catch (error) {
        console.error('Error deleting report:', error);
        alert('An error occurred while deleting the report.');
      }
    }
  };

  // If loading, show a loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="no-print">
          <button onClick={handleBackToHistory} className="back-button">
            ← Back to Service History
          </button>
        </div>
        <div>Loading report data...</div>
      </div>
    );
  }

  // Multiple reports view
  if (isMultipleView) {
    if (!multipleReports || multipleReports.length === 0) {
      return (
        <div className="no-data-container">
          <div className="no-print">
            <button onClick={handleBackToHistory} className="back-button">
              ← Back to Service History
            </button>
          </div>
          <h2>No report data available for the selected criteria</h2>
          <button className="add-report-button" onClick={handleAddReport}>
            Add Report Data
          </button>
        </div>
      );
    }

    return (
      <>
        <div className="back-bug">
          <div className="print-button-wrapper no-print wraped-print">
            <button onClick={handleBackToHistory} className="back-button">
              ← Back to Service History
            </button>
            <button
              onClick={handlePrint}
              className={!isDocumentSigned ? 'disabled-print-button' : ''}
              style={{
                cursor: !isDocumentSigned ? 'not-allowed' : 'pointer',
              }}
            >
              {!isDocumentSigned ? '🔒 Sign to Print All' : 'Print All Reports'}
            </button>
            <button onClick={signDocument}>Sign the Document</button>
          </div>
        </div>

        <div className="back-bug">
          <div className="document-count">
            <span>Showing {totalCount} document(s) for Equipment: {regNo}</span>
            {isDocumentSigned && (
              <div className="signature-status">
                <span className="signed-indicator">✅ Document Signed</span>
                <span className="expiry-timer">
                  ⏰ Expires in: {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
            )}
          </div>
        </div>

        {multipleReports.map((report, index) => (
          <div key={index} className="doc-wrapper" style={{ pageBreakAfter: index < multipleReports.length - 1 ? 'always' : 'auto' }}>
            <div className="report-actions no-print">
              <button
                className="edit-button"
                onClick={() => handleEditReport(report._id)}
              >
                Edit
              </button>
              <button
                className="delete-button"
                onClick={() => handleDeleteReport(report._id)}
              >
                Delete
              </button>
            </div>

            <div className="x-container">
              <div className="report-container">
                <div className="header">
                  <div className="logo-placeholder">
                    <img src={logoImage} alt="Company Logo" />
                  </div>
                  <div className="company-details-s">
                    <img src={alAnsariText} alt="AL Ansari Transport & Enterprises W.L.L" />
                  </div>
                </div>

                <table className="checklist-table-s">
                  <thead>
                    <tr>
                      <th colSpan="6" className="heading">
                        PERIODIC SERVICE REPORT - {getServiceTypeName(report.serviceType)}
                        {report.date && ` - ${formatDate(report.date)}`}
                      </th>
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
                    {renderChecklistItems(report)}
                    {renderFooterInfo(report, regNo, supervisorSignUrl)}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ))}

        {/* Signature Authentication Modal */}
        {showSignModal && (
          <div className="modal-overlay no-print">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Document Signature Authentication</h3>
                <button className="close-button" onClick={closeSignModal}>×</button>
              </div>

              <div className="modal-body">
                {signStep === 1 && (
                  <div className="auth-step">
                    <h4>Step 1: Enter 6-Digit Password</h4>
                    <input
                      type="password"
                      maxLength="6"
                      placeholder="Enter 6-digit password"
                      value={sixDigitPassword}
                      onChange={(e) => setSixDigitPassword(e.target.value.replace(/\D/g, ''))}
                      className="auth-input"
                    />
                    {signError && <div className="error-message">{signError}</div>}
                    <button
                      onClick={handleSixDigitVerification}
                      disabled={signLoading || sixDigitPassword.length !== 6}
                      className="auth-button"
                    >
                      {signLoading ? 'Verifying...' : 'Verify & Send OTP'}
                    </button>
                  </div>
                )}

                {signStep === 2 && (
                  <div className="auth-step">
                    <h4>Step 2: Enter OTP</h4>
                    <p>OTP has been sent to the authorized email</p>
                    <input
                      type="text"
                      maxLength="6"
                      placeholder="Enter 6-digit OTP"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      className="auth-input"
                    />
                    {signError && <div className="error-message">{signError}</div>}
                    <div className="auth-buttons">
                      <button
                        onClick={() => setSignStep(1)}
                        className="back-button-modal"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleOtpVerification}
                        disabled={signLoading || otpCode.length !== 6}
                        className="auth-button"
                      >
                        {signLoading ? 'Signing...' : 'Sign Document'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Warning Modal for Unsigned Document */}
        {showWarningModal && (
          <div className="modal-overlay no-print">
            <div className="modal-content warning-modal">
              <div className="modal-header warning-header">
                <h3>⚠️ Document Not Signed</h3>
                <button className="close-button" onClick={() => setShowWarningModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="warning-message">
                  <p>🔒 You must sign the document before printing!</p>
                  <p>This ensures document authenticity and compliance.</p>
                </div>
                <div className="warning-buttons">
                  <button
                    onClick={() => {
                      setShowWarningModal(false);
                      signDocument();
                    }}
                    className="sign-now-button"
                  >
                    Sign Document Now
                  </button>
                  <button
                    onClick={() => setShowWarningModal(false)}
                    className="cancel-button"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Success Modal for Signed Document */}
        {showSuccessModal && (
          <div className="modal-overlay no-print">
            <div className="modal-content success-modal">
              <div className="modal-header success-header">
                <h3>✅ Document Signed Successfully!</h3>
                <button className="close-button" onClick={() => setShowSuccessModal(false)}>×</button>
              </div>
              <div className="modal-body">
                <div className="success-message">
                  <p>🎉 Your document has been digitally signed!</p>
                  <p>⏰ Signature valid for: <strong>10 seconds</strong></p>
                  <p>📄 You can now print the document.</p>
                </div>
                <div className="success-buttons">
                  <button
                    onClick={() => {
                      setShowSuccessModal(false);
                      handlePrint();
                    }}
                    className="print-now-button"
                  >
                    Print Now
                  </button>
                  <button
                    onClick={() => setShowSuccessModal(false)}
                    className="close-success-button"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  // Single report view
  if (!reportData) {
    return (
      <div className="no-data-container">
        <div className="no-print">
          <button onClick={handleBackToHistory} className="back-button">
            ← Back to Service History
          </button>
        </div>
        <h2>No report data available for this equipment and date</h2>
        <button className="add-report-button" onClick={handleAddReport}>
          Add Report Data
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="back-bug">
        <div className="print-button-wrapper no-print wraped-print">
          <button onClick={handleBackToHistory} className="back-button">
            ← Back to Service History
          </button>
          <button
            onClick={handlePrint}
            className={!isDocumentSigned ? 'disabled-print-button' : ''}
            style={{
              opacity: !isDocumentSigned ? 0.5 : 1,
              cursor: !isDocumentSigned ? 'not-allowed' : 'pointer'
            }}
          >
            {!isDocumentSigned ? '🔒 Sign to Print' : 'Print Report'}
          </button>
          <button onClick={signDocument}>Sign the Document</button>
        </div>
      </div>

      <div className="back-bug">
        <div className="document-count">
          <span>Showing {totalCount} document for Equipment: {regNo}</span>
          {isDocumentSigned && (
            <div className="signature-status">
              <span className="signed-indicator">✅ Document Signed</span>
              <span className="expiry-timer">
                ⏰ Expires in: {formatTimeRemaining(timeRemaining)}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="back-bug pb-n">
        <div className="report-actions no-print single-report-actions">
          <button
            className="edit-button"
            onClick={() => handleEditReport(reportData._id)}
          >
            Edit
          </button>
          <button
            className="delete-button"
            onClick={() => handleDeleteReport(reportData._id)}
          >
            Delete
          </button>
        </div>
      </div>

      <div className="doc-wrapper">
        <div className="x-container">
          <div className="report-container">
            <div className="header">
              <div className="logo-placeholder">
                <img src={logoImage} alt="Company Logo" />
              </div>
              <div className="company-details-s">
                <img src={alAnsariText} alt="AL Ansari Transport & Enterprises W.L.L" />
              </div>
            </div>

            <table className="checklist-table-s">
              <thead>
                <tr>
                  <th colSpan="6" className="heading">PERIODIC SERVICE REPORT</th>
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
                {renderChecklistItems(reportData)}
                {renderFooterInfo(reportData, regNo, supervisorSignUrl)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Signature Authentication Modal */}
      {showSignModal && (
        <div className="modal-overlay no-print">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Document Signature Authentication</h3>
              <button className="close-button" onClick={closeSignModal}>×</button>
            </div>

            <div className="modal-body">
              {signStep === 1 && (
                <div className="auth-step">
                  <h4>Step 1: Enter 6-Digit Password</h4>
                  <input
                    type="password"
                    maxLength="6"
                    placeholder="Enter 6-digit password"
                    value={sixDigitPassword}
                    onChange={(e) => setSixDigitPassword(e.target.value.replace(/\D/g, ''))}
                    className="auth-input"
                  />
                  {signError && <div className="error-message">{signError}</div>}
                  <button
                    onClick={handleSixDigitVerification}
                    disabled={signLoading || sixDigitPassword.length !== 6}
                    className="auth-button"
                  >
                    {signLoading ? 'Verifying...' : 'Verify & Send OTP'}
                  </button>
                </div>
              )}

              {signStep === 2 && (
                <div className="auth-step">
                  <h4>Step 2: Enter OTP</h4>
                  <p>OTP has been sent to the authorized email</p>
                  <input
                    type="text"
                    maxLength="6"
                    placeholder="Enter 6-digit OTP"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    className="auth-input"
                  />
                  {signError && <div className="error-message">{signError}</div>}
                  <div className="auth-buttons">
                    <button
                      onClick={() => setSignStep(1)}
                      className="back-button-modal"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleOtpVerification}
                      disabled={signLoading || otpCode.length !== 6}
                      className="auth-button"
                    >
                      {signLoading ? 'Signing...' : 'Sign Document'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal for Unsigned Document */}
      {showWarningModal && (
        <div className="modal-overlay no-print">
          <div className="modal-content warning-modal">
            <div className="modal-header warning-header">
              <h3>⚠️ Document Not Signed</h3>
              <button className="close-button" onClick={() => setShowWarningModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="warning-message">
                <p>🔒 You must sign the document before printing!</p>
                <p>This ensures document authenticity and compliance.</p>
              </div>
              <div className="warning-buttons">
                <button
                  onClick={() => {
                    setShowWarningModal(false);
                    signDocument();
                  }}
                  className="sign-now-button"
                >
                  Sign Document Now
                </button>
                <button
                  onClick={() => setShowWarningModal(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal for Signed Document */}
      {showSuccessModal && (
        <div className="modal-overlay no-print">
          <div className="modal-content success-modal">
            <div className="modal-header success-header">
              <h3>✅ Document Signed Successfully!</h3>
              <button className="close-button" onClick={() => setShowSuccessModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="success-message">
                <p>🎉 Your document has been digitally signed!</p>
                <p>⏰ Signature valid for: <strong>10 seconds</strong></p>
                <p>📄 You can now print the document.</p>
              </div>
              <div className="success-buttons">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    handlePrint();
                  }}
                  className="print-now-button"
                >
                  Print Now
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="close-success-button"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Helper function to render checklist items
const renderChecklistItems = (reportData) => {
  const checklistLookup = {};
  if (reportData.checklistItems && reportData.checklistItems.length > 0) {
    reportData.checklistItems.forEach(item => {
      checklistLookup[item.id] = item.status;
    });
  }

  const ifClean = true;

  return (
    <>
      <tr>
        <td>1</td>
        <td>{reportData.checklistItems[0].description}</td>
        <td className='tick'>{checklistLookup[1] || ''}</td>
        <td>25</td>
        <td>Check Silencer</td>
        <td className='tick'>{checklistLookup[25] || ''}</td>
      </tr>
      <tr>
        <td>2</td>
        <td>{reportData.checklistItems[1].description}</td>
        <td className='tick'>{checklistLookup[2] || ''}</td>
        <td>26</td>
        <td>Replace Hydraulic Oil- Filter</td>
        <td className='tick'>{checklistLookup[26] || ''}</td>
      </tr>
      <tr>
        <td>3</td>
        <td>{ifClean ? "Check/Clean Air Filter" : "Check/Change Air Filter"}</td>
        <td className='tick'>{checklistLookup[3] || ''}</td>
        <td>27</td>
        <td>Replace Transmission Oil</td>
        <td className='tick'>{checklistLookup[27] || ''}</td>
      </tr>
      <tr>
        <td>4</td>
        <td>Check Transmission Filter</td>
        <td className='tick'>{checklistLookup[4] || ''}</td>
        <td>28</td>
        <td>Replace Differential Oil</td>
        <td className='tick'>{checklistLookup[28] || ''}</td>
      </tr>
      <tr>
        <td>5</td>
        <td>Check Power Steering Oil</td>
        <td className='tick'>{checklistLookup[5] || ''}</td>
        <td>29</td>
        <td>Replace Steering Box Oil</td>
        <td className='tick'>{checklistLookup[29] || ''}</td>
      </tr>
      <tr>
        <td>6</td>
        <td>Check Hydraulic Oil</td>
        <td className='tick'>{checklistLookup[6] || ''}</td>
        <td>30</td>
        <td>Check Engine Valve Clearence</td>
        <td className='tick'>{checklistLookup[30] || ''}</td>
      </tr>
      <tr>
        <td>7</td>
        <td>Check Brake</td>
        <td className='tick'>{checklistLookup[7] || ''}</td>
        <td>31</td>
        <td>Replace clutch fluid</td>
        <td className='tick'>{checklistLookup[31] || ''}</td>
      </tr>
      <tr>
        <td>8</td>
        <td>Check Tyre Air Pressure</td>
        <td className='tick'>{checklistLookup[8] || ''}</td>
        <td>32</td>
        <td>Check Brake Lining</td>
        <td className='tick'>{checklistLookup[32] || ''}</td>
      </tr>
      <tr>
        <td>9</td>
        <td>Check Oil Leak</td>
        <td className='tick'>{checklistLookup[9] || ''}</td>
        <td>33</td>
        <td>Change Drive Belt</td>
        <td>{checklistLookup[33] || ''}</td>
      </tr>
      <tr>
        <td>10</td>
        <td>Check Battery Condition</td>
        <td className='tick'>{checklistLookup[10] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>11</td>
        <td>Check Wiper & Water</td>
        <td className='tick'>{checklistLookup[11] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>12</td>
        <td>Check All Lights</td>
        <td className='tick'>{checklistLookup[12] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>13</td>
        <td>Check All Horns</td>
        <td className='tick'>{checklistLookup[13] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>14</td>
        <td>Check Parking Brake</td>
        <td className='tick'>{checklistLookup[14] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>15</td>
        <td>Check Differential Oil</td>
        <td className='tick'>{checklistLookup[15] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>16</td>
        <td>Check Rod Water & Hoses</td>
        <td className='tick'>{checklistLookup[16] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>17</td>
        <td>Lubricants All Points</td>
        <td className='tick'>{checklistLookup[17] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>18</td>
        <td>Check Gear Shift System</td>
        <td className='tick'>{checklistLookup[18] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>19</td>
        <td>Check Clutch System</td>
        <td className='tick'>{checklistLookup[19] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>20</td>
        <td>Check Wheel Nut</td>
        <td className='tick'>{checklistLookup[20] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>21</td>
        <td>Check Starter & Alternator</td>
        <td className='tick'>{checklistLookup[21] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>22</td>
        <td>Check Number Plate both</td>
        <td className='tick'>{checklistLookup[22] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>23</td>
        <td>Check Paint</td>
        <td className='tick'>{checklistLookup[23] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
      <tr>
        <td>24</td>
        <td>Check Tires</td>
        <td className='tick'>{checklistLookup[24] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>

      <tr className="remarks-row">
        <td colSpan="6">
          <div className="remarks-box">
            <div className="remarks-text">
              <strong>REMARKS : </strong>
              {reportData.remarks}
            </div>
          </div>
          <span className="equipment-fit-to-work">
            Equipment fit to work
          </span>
        </td>
      </tr>
    </>
  );
};

// Updated helper function to render footer information with signature
const renderFooterInfo = (reportData, regNo, supervisorSignUrl) => {
  const formatDateForDoc = (dateString) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return dateString;
  };

  return (
    <>
      <tr>
        <td colSpan="3"><strong>SERVICE HRS:</strong> {reportData.fullService ? `${reportData.serviceHrs} - ${reportData.serviceHrs}` : reportData.serviceHrs}</td>
        <td colSpan="3"><strong>EQUIPMENT NO:</strong> {regNo}</td>
      </tr>
      <tr>
        <td colSpan="3">
          <strong>NEXT SERVICE HRS:</strong> {
            reportData.nextServiceHrs == 0
              ? ''
              : reportData.fullService
                ? `${reportData.nextServiceHrs} - ${Number(reportData.serviceHrs) + 3000}`
                : reportData.nextServiceHrs
          }
        </td>
        <td colSpan="3"><strong>MACHINE:</strong> {reportData.machine}</td>
      </tr>
      <tr>
        <td colSpan="3"><strong>MECHANICS:</strong> {reportData.mechanics}</td>
        <td colSpan="3"><strong>LOCATION:</strong> {reportData.location}</td>
      </tr>
      <tr>
        <td colSpan="3"><strong>DATE:</strong> {formatDateForDoc(reportData.date)}</td>
        <td colSpan="3"><strong>OPERATOR NAME:</strong> {reportData.operatorName}</td>
      </tr>
      <tr className='sign-table'>
        <td colSpan="3"><strong>MECHANIC SIGN:</strong>
          <img className='sign mechanic-sign' src={mechanicSign} alt="" />
        </td>
        <td colSpan="3"><strong>SUPERVISOR SIGN:</strong>
          {supervisorSignUrl ? (
            <img
              className='sign supervisor-sign'
              src={supervisorSignUrl}
              alt="Supervisor Signature"
              onError={(e) => {
                console.log('Signature URL expired or failed to load');
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <span className="no-signature">Not Signed</span>
          )}
        </td>
      </tr>
    </>
  );
};

export default ServiceDoc;