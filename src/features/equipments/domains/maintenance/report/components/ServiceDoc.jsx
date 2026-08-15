// ─────────────────────────────────────────────────────────────────────────────
// ServiceDoc.jsx — Renders a printable service report document.
// Supports single-report view (by historyId) and multi-report (paginated) view.
// Handles digital signature flow: password → OTP → signature URL.
// ─────────────────────────────────────────────────────────────────────────────

import { Loader } from 'lucide-react';

import logoImage    from '@assets/images/al-ansari-color.png';
import alAnsariText from '@assets/images/al-ansari-full-address.png';
import mechanicSign from '@assets/images/mechanic-sign.png';

import DevModal from '@shared/components/DevModal/DevModal';
import Button   from '@shared/components/Button/Button';

import { useServiceDoc } from '../hooks/useServiceDoc';
import {
  getServiceTypeName,
  formatDate,
  formatTimeRemaining,
} from '../utils/serviceDocHelpers';

import './ServiceDoc.css';


// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

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
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

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

function ChecklistRows({ reportData }) {
  const statusMap = {};
  reportData.checklistItems?.forEach((item) => { statusMap[item.id] = item.status; });

  const items      = reportData.checklistItems || [];
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

function ReportDocument({ report, regNo, supervisorSignUrl, headingTitle, onEdit, onDelete, showActions, style }) {
  return (
    <div className="doc-wrapper" style={style}>
      {showActions && (
        <div className="report-actions no-print">
          <Button {...SHARED_BTN} text="Edit"   onClick={() => onEdit(report._id, report.serviceType)}  colorScheme="lime-800" width="160px" type="submit" />
          <Button {...SHARED_BTN} text="Delete" onClick={() => onDelete(report._id)}                    colorScheme="red-800"  width="160px" type="submit" />
        </div>
      )}
      <div className="x-container">
        <div className="report-container">
          <ReportHeader />
          <table className="checklist-table-s">
            <thead>
              <tr><th colSpan="6" className="heading">{headingTitle}</th></tr>
              <tr>
                <th>SL.NO</th><th>DESCRIPTION</th><th>CHECKED</th>
                <th>SL.NO</th><th>DESCRIPTION</th><th>CHECKED</th>
              </tr>
            </thead>
            <tbody>
              <ChecklistRows reportData={report} />
              <FooterRows    reportData={report} regNo={regNo} supervisorSignUrl={supervisorSignUrl} />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SignatureModals({
  showPasswordModal, sixDigitPassword, signLoading, signError,
  onPasswordClose, onPasswordInput, onPasswordSubmit,
  showOtpModal, otpCode,
  onOtpClose, onOtpInput, onOtpBack, onOtpSubmit,
  showWarningModal, onWarningClose, onWarnSign,
  showSuccessModal, onSuccessClose, onSuccessPrint,
  showDeleteModal, onDeleteClose, onDeleteConfirm,
  showLoadingModal, loadingMessage,
}) {
  return (
    <>
      <DevModal isOpen={showPasswordModal} onClose={onPasswordClose} type="authentication" title="Document Signature Authentication" message="Step 1: Enter your 6-digit password" showInput inputValue={sixDigitPassword} onInputChange={onPasswordInput} inputPlaceholder="Enter 6-digit password" inputMaxLength={6} inputError={signError} buttonText={signLoading ? 'Verifying...' : 'Verify & Send OTP'} onButtonClick={onPasswordSubmit} preventClose={signLoading} />
      <DevModal isOpen={showOtpModal} onClose={onOtpClose} type="otp" title="Enter OTP Code" message="OTP has been sent to the authorized email" showInput inputValue={otpCode} onInputChange={onOtpInput} inputPlaceholder="Enter 6-digit OTP" inputMaxLength={6} inputError={signError} buttonText={signLoading ? 'Signing...' : 'Sign Document'} secondaryButtonText="Back" onSecondaryClick={onOtpBack} onButtonClick={onOtpSubmit} preventClose={signLoading} />
      <DevModal isOpen={showWarningModal} onClose={onWarningClose} type="warning" title="!Document Not Signed" message="You must sign the document before printing! This ensures document authenticity and compliance." buttonText="Sign Document Now" secondaryButtonText="Cancel" onButtonClick={onWarnSign} onSecondaryClick={onWarningClose} />
      <DevModal isOpen={showSuccessModal} onClose={onSuccessClose} type="success" title="Document Signed Successfully!" message="Your document has been digitally signed! Signature valid for 10 seconds. You can now print the document." buttonText="Print Now" secondaryButtonText="Close" onButtonClick={onSuccessPrint} onSecondaryClick={onSuccessClose} />
      <DevModal isOpen={showDeleteModal} onClose={onDeleteClose} type="error" title="Delete Report?" message="Are you sure you want to delete this report? This action cannot be undone." buttonText="Delete" secondaryButtonText="Cancel" onButtonClick={onDeleteConfirm} onSecondaryClick={onDeleteClose} />
      <DevModal isOpen={showLoadingModal} onClose={() => {}} type="progress" title="Processing..." message={loadingMessage} progress={100} preventClose />
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ServiceDoc — Main Component
// ─────────────────────────────────────────────────────────────────────────────

function ServiceDoc() {
  const {
    regNo,
    historyId,
    reportData,
    multipleReports,
    isMultipleView,
    totalCount,
    loading,
    supervisorSignUrl,
    isDocumentSigned,
    timeRemaining,
    handleBackToHistory,
    handleAddReport,
    handlePrint,
    handleEditReport,
    handleDeleteReport,
    signDocument,
    signatureModalProps,
  } = useServiceDoc();

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
        <Button {...SHARED_BTN} text="Sign the Document" onClick={signDocument}
          colorScheme={isDocumentSigned ? 'emerald-800' : 'amber-600'} width="160px" type="submit" />
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="loading-container">
        <div className="no-print">
          <Button {...SHARED_BTN} text="Back to Service History" onClick={handleBackToHistory} colorScheme="violet-800" width="220px" type="submit" />
        </div>
        <div className="no-print"><Loader /></div>
      </div>
    );
  }

  if (isMultipleView) {
    if (!multipleReports.length) {
      return (
        <div className="no-data-container">
          <div className="no-print">
            <h2>No report data available for the selected criteria</h2>
            <div className="no-result-found-service-nav">
              <Button {...SHARED_BTN} text="Back to Service History" onClick={handleBackToHistory} colorScheme="violet-800" width="220px" type="submit" />
              <Button {...SHARED_BTN} text="Add Report Data" onClick={() => handleAddReport(historyId)} colorScheme="violet-800" width="160px" type="submit" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
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

  if (!reportData) {
    return (
      <div className="no-data-container">
        <h2>No report data available for this service record</h2>
        <div className="no-result-found-service-nav">
          <Button {...SHARED_BTN} text="Back to Service History" onClick={handleBackToHistory} colorScheme="amber-800" width="220px" type="submit" />
          <Button {...SHARED_BTN} text="Add Report Data" onClick={() => handleAddReport(historyId)} colorScheme="violet-800" width="160px" type="submit" />
        </div>
      </div>
    );
  }

  return (
    <>
      <ActionBar />

      <div className="back-bug pb-n">
        <div className="report-actions no-print single-report-actions">
          <Button {...SHARED_BTN} text="Edit" onClick={() => handleEditReport(reportData._id, reportData.serviceType)} colorScheme="lime-800" width="160px" type="submit" />
          <Button {...SHARED_BTN} text="Delete" onClick={() => handleDeleteReport(reportData._id)} colorScheme="red-700" width="160px" type="submit" />
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