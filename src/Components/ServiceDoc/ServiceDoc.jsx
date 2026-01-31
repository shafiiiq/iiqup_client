'use client';
import React, { useEffect, useState } from 'react';
import logoImage from '../../assets/images/al-ansari-color.png';
import alAnsariText from '../../assets/images/al-ansari-full-address.png';
import mechanicSign from '../../assets/images/mechanic-sign.png';
import { useParams, useNavigate } from 'react-router-dom';
import { END_POINT } from '../../constants';
import '../ServiceDoc/ServiceDoc.css'
import { apiRequest } from '../../utils/0auth';
import DevModal from '../../common/DevModal';
import Button from '../../common/Button/Button';

const ServiceDoc = () => {
  const { regNo, date, serviceType, startDate, endDate, monthsCount, historyId } = useParams();
  const [reportData, setReportData] = useState(null);
  const [multipleReports, setMultipleReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMultipleView, setIsMultipleView] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [supervisorSignUrl, setSupervisorSignUrl] = useState('');

  // Signature authentication states
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
  const [timeRemaining, setTimeRemaining] = useState(0);
  const navigate = useNavigate();

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReportId, setDeleteReportId] = useState(null);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

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
    const cachedUrl = checkSignatureCache('default');
    if (cachedUrl) {
      setSupervisorSignUrl(cachedUrl);
      setIsDocumentSigned(true);
      setShowSuccessModal(true);
      return;
    }

    setShowPasswordModal(true);
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

    if (!checkRateLimit()) {
      setSignLoading(false);
      return;
    }

    try {
      setShowPasswordModal(false);
      setShowLoadingModal(true);
      setLoadingMessage('Verifying password...');

      const passwordResponse = await apiRequest(
        `${END_POINT}/users/six-digit-auth/verify`,
        'POST',
        { password: sixDigitPassword }
      );

      console.log("sixDigitPassword", await passwordResponse.json());


      if (!passwordResponse.ok) {
        throw new Error('Invalid 6-digit password');
      }

      setDocAUTHmiddle(sixDigitPassword);
      setLoadingMessage('Sending OTP to authorized email...');

      const otpResponse = await apiRequest(
        `${END_POINT}/otp/request`,
        'POST',
        { email: 'DOCUMENT_VERIFIER_AUTH_MAIL' }
      );

      if (!otpResponse.ok) {
        throw new Error('Failed to send OTP');
      }

      setShowLoadingModal(false);
      setShowOtpModal(true);
      setSignLoading(false);
      setSignError('');
    } catch (error) {
      console.error('Six-digit verification error:', error);
      setAuthAttempts(prev => prev + 1);
      setLastAttempt(Date.now());
      setSignError(error.message || 'Authentication failed. Please try again.');
      setShowLoadingModal(false);
      setShowPasswordModal(true);
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

      const userData = JSON.parse(localStorage.getItem('userData') || '{}');

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
        throw new Error('Invalid OTP code. Please check and try again.');
      }

      setLoadingMessage('Generating signature key...');

      const keyResponse = await apiRequest(
        `${END_POINT}/users/doc-0auth-sign-key`,
        'POST',
        { password: docAUTHmiddle }
      );

      if (!keyResponse.ok) {
        throw new Error('Failed to generate signature key');
      }

      setDocAUTHmiddle('');
      const keyData = await keyResponse.json();

      setLoadingMessage('Applying digital signature...');

      const body = { key: keyData.data.sign_key, isLong: false, isAuthSign: true };
      const s3response = await apiRequest(
        `${END_POINT}/s3Config/get-pre-signed-url`,
        'POST',
        body
      );

      if (!s3response.ok) {
        throw new Error('Failed to generate signature URL');
      }

      const s3URL = await s3response.json();
      const fullUrl = s3URL.dataUrl;

      const expiryTime = Date.now() + 10000;
      setSignatureCache(prev => ({
        ...prev,
        'default': { url: fullUrl, expiry: expiryTime }
      }));

      setSupervisorSignUrl(fullUrl);
      setIsDocumentSigned(true);
      setSignExpiryTime(expiryTime);
      setTimeRemaining(10);

      setSixDigitPassword('');
      setOtpCode('');
      setSignLoading(false);
      setAuthAttempts(0);
      setSignError('');

      setShowLoadingModal(false);
      setShowSuccessModal(true);

    } catch (error) {
      console.error('OTP verification error:', error);
      setSignError(error.message || 'Verification failed. Please try again.');
      setShowLoadingModal(false);
      setShowOtpModal(true);
      setSignLoading(false);
    }
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

  const handleAddReport = (historyId) => {
    navigate(`/service-form/${serviceType}/${historyId}`);
  };

  const handleBackToHistory = () => {
    navigate(`/service-history/${regNo}`);
  };

  const handleEditReport = (reportId, serviceType) => {
    navigate(`/service-form/update/${serviceType}/${reportId}`);
  };

  const handleDeleteReport = (reportId) => {
    setDeleteReportId(reportId);
    setShowDeleteModal(true);
  };

  const confirmDeleteReport = async () => {
    try {
      const response = await apiRequest(
        `${END_POINT}/service-report/deletewith/${deleteReportId}`,
        'DELETE'
      );

      if (response.ok) {
        setShowDeleteModal(false);
        window.location.reload();
      } else {
        alert('Failed to delete the report. Please try again.');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('An error occurred while deleting the report.');
    }
  };

  // If loading, show a loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="no-print">
          <Button
            text="Back to Service History"
            onClick={handleBackToHistory}
            colorScheme="violet-800"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="220px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
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
            <h2>No report data available for the selected criteria</h2>
            <div className="no-result-found-service-nav">
              <Button
                text="Back to Service History"
                onClick={handleBackToHistory}
                colorScheme="violet-800"
                variant="gradient"
                font="md"
                animation=""
                squircle="4xl"
                width="220px"
                height="38px"
                type="submit"
                textColor="white-200"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
              <Button
                text=" Add Report Data"
                onClick={handleAddReport}
                colorScheme="violet-800"
                variant="gradient"
                font="md"
                animation=""
                squircle="4xl"
                width="160px"
                height="38px"
                type="submit"
                textColor="white-200"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="back-bug">
          <div className="document-count">
            <span className='status-document-left'>Showing {totalCount} Document(S) for Equipment: {regNo}</span>
            {isDocumentSigned && (
              <div className="signature-status">
                <span className="signed-indicator">✅ Document Signed</span>
                <span className="expiry-timer">
                  ⏰ Expires in: {formatTimeRemaining(timeRemaining)}
                </span>
              </div>
            )}
          </div>
          <div className="print-button-wrapper no-print wraped-print">
            <Button
              text="Back to Service History"
              onClick={handleBackToHistory}
              colorScheme="violet-800"
              variant="gradient"
              font="md"
              animation=""
              squircle="4xl"
              width="220px"
              height="38px"
              type="submit"
              textColor="white-200"
              shadowPosition="to-bottom"
              shadowColor="white-600"
            />
            <Button
              text={!isDocumentSigned ? 'Sign to Print All' : 'Print All Reports'}
              onClick={handlePrint}
              colorScheme={!isDocumentSigned ? 'gray-900' : 'violet-800'}
              variant="gradient"
              font="md"
              animation=""
              squircle="4xl"
              width="160px"
              height="38px"
              type={!isDocumentSigned ? 'disabled' : 'submit'}
              textColor="white-200"
              cursor={!isDocumentSigned ? 'not-allowed' : 'allowed'}
              shadowPosition="to-bottom"
              shadowColor="white-600"
            />
            {/* note here back / back here  */}
            <Button
              text="Sign the Document"
              onClick={signDocument}
              colorScheme={!isDocumentSigned ? 'amber-600' : 'emerald-800'}
              variant="gradient"
              font="md"
              animation=""
              squircle="4xl"
              width="160px"
              height="38px"
              type="submit"
              textColor="white-200"
              shadowPosition="to-bottom"
              shadowColor="white-600"
            />
          </div>
        </div>

        {multipleReports.map((report, index) => (
          <div key={index} className="doc-wrapper" style={{ pageBreakAfter: index < multipleReports.length - 1 ? 'always' : 'auto' }}>
            <div className="report-actions no-print">
              <Button
                text="Edit"
                onClick={() => handleEditReport(report._id, report.serviceType)}
                colorScheme="lime-800"
                variant="gradient"
                font="md"
                animation=""
                squircle="4xl"
                width="160px"
                height="38px"
                type="submit"
                textColor="white-200"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
              <Button
                text="Delete"
                onClick={() => handleDeleteReport(report._id)}
                colorScheme="red-800"
                variant="gradient"
                font="md"
                animation=""
                squircle="4xl"
                width="160px"
                height="38px"
                type="submit"
                textColor="white-200"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
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
        {/* Password Modal */}
        <DevModal
          isOpen={showPasswordModal}
          onClose={() => {
            setShowPasswordModal(false);
            setSixDigitPassword('');
            setSignError('');
          }}
          type="authentication"
          title="Document Signature Authentication"
          message="Step 1: Enter your 6-digit password"
          showInput={true}
          inputValue={sixDigitPassword}
          onInputChange={(value) => setSixDigitPassword(value.replace(/\D/g, ''))}
          inputPlaceholder="Enter 6-digit password"
          inputMaxLength={6}
          inputError={signError}
          buttonText={signLoading ? "Verifying..." : "Verify & Send OTP"}
          onButtonClick={handleSixDigitVerification}
          preventClose={signLoading}
        />

        {/* OTP Modal */}
        <DevModal
          isOpen={showOtpModal}
          onClose={() => {
            setShowOtpModal(false);
            setOtpCode('');
            setSignError('');
          }}
          type="otp"
          title="Enter OTP Code"
          message="OTP has been sent to the authorized email"
          showInput={true}
          inputValue={otpCode}
          onInputChange={(value) => setOtpCode(value.replace(/\D/g, ''))}
          inputPlaceholder="Enter 6-digit OTP"
          inputMaxLength={6}
          inputError={signError}
          buttonText={signLoading ? "Signing..." : "Sign Document"}
          secondaryButtonText="Back"
          onSecondaryClick={() => {
            setShowOtpModal(false);
            setShowPasswordModal(true);
          }}
          onButtonClick={handleOtpVerification}
          preventClose={signLoading}
        />

        {/* Warning Modal */}
        <DevModal
          isOpen={showWarningModal}
          onClose={() => setShowWarningModal(false)}
          type="warning"
          title="!Document Not Signed"
          message="You must sign the document before printing! This ensures document authenticity and compliance."
          buttonText="Sign Document Now"
          secondaryButtonText="Cancel"
          onButtonClick={() => {
            setShowWarningModal(false);
            signDocument();
          }}
          onSecondaryClick={() => setShowWarningModal(false)}
        />

        {/* Success Modal */}
        <DevModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
          type="success"
          title="Document Signed Successfully!"
          message="Your document has been digitally signed! Signature valid for 10 seconds. You can now print the document."
          buttonText="Print Now"
          secondaryButtonText="Close"
          onButtonClick={() => {
            setShowSuccessModal(false);
            handlePrint();
          }}
          onSecondaryClick={() => setShowSuccessModal(false)}
        />

        {/* Delete Confirmation Modal */}
        <DevModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          type="error"
          title="Delete Report?"
          message="Are you sure you want to delete this report? This action cannot be undone."
          buttonText="Delete"
          secondaryButtonText="Cancel"
          onButtonClick={confirmDeleteReport}
          onSecondaryClick={() => setShowDeleteModal(false)}
        />

        {/* Loading Modal */}
        <DevModal
          isOpen={showLoadingModal}
          onClose={() => { }}
          type="progress"
          title="Processing..."
          message={loadingMessage}
          progress={100}
          preventClose={true}
        />
      </>
    );
  }

  // Single report view
  if (!reportData) {
    return (
      <div className="no-data-container">
        <h2>No report data available for this equipment and date</h2>
        <div className="no-result-found-service-nav">
          <Button
            text="Back to Service History"
            onClick={handleBackToHistory}
            colorScheme="amber-800"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="220px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
          <Button
            text="Add Report Data"
            onClick={() => handleAddReport(historyId)}
            colorScheme="violet-800"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="160px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="back-bug">
        <div className="print-button-wrapper no-print wraped-print">
          <Button
            text="Back to Service History"
            onClick={handleBackToHistory}
            colorScheme="violet-800"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="220px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
          <Button
            text={!isDocumentSigned ? 'Sign to Print All' : 'Print All Reports'}
            onClick={handlePrint}
            colorScheme={!isDocumentSigned ? 'gray-900' : 'violet-800'}
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="160px"
            height="38px"
            type={!isDocumentSigned ? 'disabled' : 'submit'}
            textColor="white-200"
            cursor={!isDocumentSigned ? 'not-allowed' : 'allowed'}
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
          <Button
            text="Sign the Document"
            onClick={signDocument}
            colorScheme={!isDocumentSigned ? 'amber-600' : 'emerald-800'}
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="160px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
        </div>
      </div>



      <div className="back-bug pb-n">
        <div className="report-actions no-print single-report-actions">
          <Button
            text="Edit"
            onClick={() => handleEditReport(reportData._id, reportData.serviceType)}
            colorScheme="lime-800"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="160px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
          <Button
            text="Delete"
            onClick={() => handleDeleteReport(reportData._id)}
            colorScheme="red-700"
            variant="gradient"
            font="md"
            animation=""
            squircle="4xl"
            width="160px"
            height="38px"
            type="submit"
            textColor="white-200"
            shadowPosition="to-bottom"
            shadowColor="white-600"
          />
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
      {/* Password Modal */}
      <DevModal
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setSixDigitPassword('');
          setSignError('');
        }}
        type="authentication"
        title="Document Signature Authentication"
        message="Step 1: Enter your 6-digit password"
        showInput={true}
        inputValue={sixDigitPassword}
        onInputChange={(value) => setSixDigitPassword(value.replace(/\D/g, ''))}
        inputPlaceholder="Enter 6-digit password"
        inputMaxLength={6}
        inputError={signError}
        buttonText={signLoading ? "Verifying..." : "Verify & Send OTP"}
        onButtonClick={handleSixDigitVerification}
        preventClose={signLoading}
      />

      {/* OTP Modal */}
      <DevModal
        isOpen={showOtpModal}
        onClose={() => {
          setShowOtpModal(false);
          setOtpCode('');
          setSignError('');
        }}
        type="otp"
        title="Enter OTP Code"
        message="OTP has been sent to the authorized email"
        showInput={true}
        inputValue={otpCode}
        onInputChange={(value) => setOtpCode(value.replace(/\D/g, ''))}
        inputPlaceholder="Enter 6-digit OTP"
        inputMaxLength={6}
        inputError={signError}
        buttonText={signLoading ? "Signing..." : "Sign Document"}
        secondaryButtonText="Back"
        onSecondaryClick={() => {
          setShowOtpModal(false);
          setShowPasswordModal(true);
        }}
        onButtonClick={handleOtpVerification}
        preventClose={signLoading}
      />

      {/* Warning Modal */}
      <DevModal
        isOpen={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        type="warning"
        title="!Document Not Signed"
        message="You must sign the document before printing! This ensures document authenticity and compliance."
        buttonText="Sign Document Now"
        secondaryButtonText="Cancel"
        onButtonClick={() => {
          setShowWarningModal(false);
          signDocument();
        }}
        onSecondaryClick={() => setShowWarningModal(false)}
      />

      {/* Success Modal */}
      <DevModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        type="success"
        title="Document Signed Successfully!"
        message="Your document has been digitally signed! Signature valid for 10 seconds. You can now print the document."
        buttonText="Print Now"
        secondaryButtonText="Close"
        onButtonClick={() => {
          setShowSuccessModal(false);
          handlePrint();
        }}
        onSecondaryClick={() => setShowSuccessModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <DevModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        type="error"
        title="Delete Report?"
        message="Are you sure you want to delete this report? This action cannot be undone."
        buttonText="Delete"
        secondaryButtonText="Cancel"
        onButtonClick={confirmDeleteReport}
        onSecondaryClick={() => setShowDeleteModal(false)}
      />

      {/* Loading Modal */}
      <DevModal
        isOpen={showLoadingModal}
        onClose={() => { }}
        type="progress"
        title="Processing..."
        message={loadingMessage}
        progress={100}
        preventClose={true}
      />
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
        <td>18</td>
        <td>Check Gear Shift System</td>
        <td className='tick'>{checklistLookup[18] || ''}</td>
      </tr>
      <tr>
        <td>2</td>
        <td>{reportData.checklistItems[1].description}</td>
        <td className='tick'>{checklistLookup[2] || ''}</td>
        <td>19</td>
        <td>Check Clutch System</td>
        <td className='tick'>{checklistLookup[19] || ''}</td>
      </tr>
      <tr>
        <td>3</td>
        <td>{ifClean ? "Check/Clean Air Filter" : "Check/Change Air Filter"}</td>
        <td className='tick'>{checklistLookup[3] || ''}</td>
        <td>20</td>
        <td>Check Wheel Nut</td>
        <td className='tick'>{checklistLookup[20] || ''}</td>
      </tr>
      <tr>
        <td>4</td>
        <td>Check Transmission Filter</td>
        <td className='tick'>{checklistLookup[4] || ''}</td>
        <td>21</td>
        <td>Check Starter & Alternator</td>
        <td className='tick'>{checklistLookup[21] || ''}</td>
      </tr>
      <tr>
        <td>5</td>
        <td>Check Power Steering Oil</td>
        <td className='tick'>{checklistLookup[5] || ''}</td>
        <td>22</td>
        <td>Check Number Plate both</td>
        <td className='tick'>{checklistLookup[22] || ''}</td>
      </tr>
      <tr>
        <td>6</td>
        <td>Check Hydraulic Oil</td>
        <td className='tick'>{checklistLookup[6] || ''}</td>
        <td>23</td>
        <td>Check Paint</td>
        <td className='tick'>{checklistLookup[23] || ''}</td>
      </tr>
      <tr>
        <td>7</td>
        <td>Check Brake</td>
        <td className='tick'>{checklistLookup[7] || ''}</td>
        <td>24</td>
        <td>Check Tires</td>
        <td className='tick'>{checklistLookup[24] || ''}</td>
      </tr>
      <tr>
        <td>8</td>
        <td>Check Tyre Air Pressure</td>
        <td className='tick'>{checklistLookup[8] || ''}</td>
        <td>25</td>
        <td>Check Silencer</td>
        <td className='tick'>{checklistLookup[25] || ''}</td>
      </tr>
      <tr>
        <td>9</td>
        <td>Check Oil Leak</td>
        <td className='tick'>{checklistLookup[9] || ''}</td>
        <td>26</td>
        <td>Replace Hydraulic Oil- Filter</td>
        <td className='tick'>{checklistLookup[26] || ''}</td>
      </tr>
      <tr>
        <td>10</td>
        <td>Check Battery Condition</td>
        <td className='tick'>{checklistLookup[10] || ''}</td>
        <td>27</td>
        <td>Replace Transmission Oil</td>
        <td className='tick'>{checklistLookup[27] || ''}</td>
      </tr>
      <tr>
        <td>11</td>
        <td>Check Wiper & Water</td>
        <td className='tick'>{checklistLookup[11] || ''}</td>
        <td>28</td>
        <td>Replace Differential Oil</td>
        <td className='tick'>{checklistLookup[28] || ''}</td>
      </tr>
      <tr>
        <td>12</td>
        <td>Check All Lights</td>
        <td className='tick'>{checklistLookup[12] || ''}</td>
        <td>29</td>
        <td>Replace Steering Box Oil</td>
        <td className='tick'>{checklistLookup[29] || ''}</td>
      </tr>
      <tr>
        <td>13</td>
        <td>Check All Horns</td>
        <td className='tick'>{checklistLookup[13] || ''}</td>
        <td>30</td>
        <td>Check Engine Valve Clearence</td>
        <td className='tick'>{checklistLookup[30] || ''}</td>
      </tr>
      <tr>
        <td>14</td>
        <td>Check Parking Brake</td>
        <td className='tick'>{checklistLookup[14] || ''}</td>
        <td>31</td>
        <td>Replace clutch fluid</td>
        <td className='tick'>{checklistLookup[31] || ''}</td>
      </tr>
      <tr>
        <td>15</td>
        <td>Check Differential Oil</td>
        <td className='tick'>{checklistLookup[15] || ''}</td>
        <td>32</td>
        <td>Check Brake Lining</td>
        <td className='tick'>{checklistLookup[32] || ''}</td>
      </tr>
      <tr>
        <td>16</td>
        <td>Check Rod Water & Hoses</td>
        <td className='tick'>{checklistLookup[16] || ''}</td>
        <td>33</td>
        <td>Change Drive Belt</td>
        <td>{checklistLookup[33] || ''}</td>
      </tr>
      <tr>
        <td>17</td>
        <td>Lubricants All Points</td>
        <td className='tick'>{checklistLookup[17] || ''}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>

      <tr className="remarks-row">
        <td colSpan="6">
          <div className="remarks-box">
            <div className="remarks-text-doc">
              <strong className='remarks-label'>REMARKS : </strong>
              {reportData.remarks.toUpperCase()}
            </div>
          </div>
          <span className="equipment-fit-to-work">
            EQUIPMENT FIT TO WORK
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
        <td colSpan="3"><strong>MACHINE:</strong> {reportData.machine.toUpperCase()}</td>
      </tr>
      <tr>
        <td colSpan="3"><strong>MECHANICS:</strong> {reportData.mechanics.toUpperCase()}</td>
        <td colSpan="3"><strong>LOCATION:</strong> {reportData.location.toUpperCase()}</td>
      </tr>
      <tr>
        <td colSpan="3"><strong>DATE:</strong> {formatDateForDoc(reportData.date)}</td>
        <td colSpan="3"><strong>OPERATOR NAME:</strong> {reportData.operatorName.toUpperCase()}</td>
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