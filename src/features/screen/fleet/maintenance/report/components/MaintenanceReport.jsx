import mechanicSign from '@assets/images/mechanic-sign.png';
import A2PaperSkeleton from '@/shared/components/widgets/paper/A2PaperSkeleton';
import A2Paper from '@/shared/components/widgets/paper/A2Paper';
import Modal from '@/shared/components/widgets/modal/Modal';
import Button from '@/shared/components/widgets/button/Button';
import Controls from '@/shared/components/widgets/controls/Controls';

import { useServiceDoc } from '../hooks/useMaintenanceReport';
import {
  formatDate,
  getChecklistLayout,
  getNextServiceDisplay,
  getReportHeadingTitle,
} from '../helper/maintenance.report.helper';
import { SHARED_BTN } from '../constants/maintenance.report.constant';

import './MaintenanceReport.css';

function ChecklistRows({ reportData }) {
  const { leftItems, rightItems, statusMap } = getChecklistLayout(reportData);

  return (
    <>
      {leftItems.map((leftItem, rowIndex) => {
        const rightItem = rightItems[rowIndex];
        return (
          <tr key={leftItem.id}>
            <td>{leftItem.id}</td>
            <td>{leftItem.description}</td>
            <td className="equipment maintenance report checked status cell">{statusMap[leftItem.id] || ''}</td>
            {rightItem ? (
              <>
                <td>{rightItem.id}</td>
                <td>{rightItem.description}</td>
                <td className="equipment maintenance report checked status cell">{statusMap[rightItem.id] || ''}</td>
              </>
            ) : (
              <><td /><td /><td /></>
            )}
          </tr>
        );
      })}

      <tr className="equipment maintenance report remarks row">
        <td colSpan="6">
          <div className="equipment maintenance report remarks container">
            <div className="equipment maintenance report remarks text">
              <strong className="equipment maintenance report remarks label">REMARKS : </strong>
              {reportData.remarks?.toUpperCase()}
            </div>
          </div>
          <span className="equipment maintenance report fit to work status">EQUIPMENT FIT TO WORK</span>
        </td>
      </tr>
    </>
  );
}

function FooterRows({ reportData, equipmentRegistrationNumber, supervisorSignUrl }) {
  const nextServiceDisplay = getNextServiceDisplay(reportData);

  return (
    <>
      <tr>
        <td colSpan="3"><strong>SERVICE HRS:</strong> {reportData.fullService ? `${reportData.serviceHrs} - ${reportData.serviceHrs}` : reportData.serviceHrs}</td>
        <td colSpan="3"><strong>EQUIPMENT NO:</strong> {equipmentRegistrationNumber}</td>
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
      <tr className="equipment maintenance report signature row">
        <td colSpan="3">
          <strong>MECHANIC SIGN:</strong>
          <img className="equipment maintenance report mechanic signature image" src={mechanicSign} alt="Mechanic Signature" />
        </td>
        <td colSpan="3">
          <strong>SUPERVISOR SIGN:</strong>
          {supervisorSignUrl ? (
            <img
              className="equipment maintenance report supervisor signature image"
              src={supervisorSignUrl}
              alt="Supervisor Signature"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          ) : (
            <span className="equipment maintenance report missing signature label">Not Signed</span>
          )}
        </td>
      </tr>
    </>
  );
}

function ReportDocument({ report, equipmentRegistrationNumber, supervisorSignUrl, headingTitle, onEditReport, onDeleteReport, showActions, pageBreakStyle }) {
  return (
    <div className="equipment maintenance report document wrapper" style={pageBreakStyle}>
      {showActions && (
        <Controls
          justify='space-between'
          margin='0 auto 20px auto'
          width="297mm"
          buttons={[
            { ...SHARED_BTN, onClick: () => onEditReport(report._id, report.serviceType), colorScheme: 'warning-800', type: 'submit', componentIconCenter: 'IconlyEdit', componentIconSize: '30', iconColor: 'warning-200' },
            { ...SHARED_BTN, onClick: () => onDeleteReport(report._id), colorScheme: 'error-800', type: 'submit', componentIconCenter: 'IconlyDelete', componentIconSize: '30', iconColor: 'error-200' },
          ]}
        />
      )}
      <A2Paper>
        <table className="equipment maintenance report checklist table">
          <thead>
            <tr><th colSpan="6" className="equipment maintenance report document heading">{headingTitle}</th></tr>
            <tr>
              <th>SL.NO</th><th>DESCRIPTION</th><th>CHECKED</th>
              <th>SL.NO</th><th>DESCRIPTION</th><th>CHECKED</th>
            </tr>
          </thead>
          <tbody>
            <ChecklistRows reportData={report} />
            <FooterRows reportData={report} equipmentRegistrationNumber={equipmentRegistrationNumber} supervisorSignUrl={supervisorSignUrl} />
          </tbody>
        </table>
      </A2Paper>
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
      <Modal
        isOpen={showPasswordModal}
        onClose={onPasswordClose}
        type="authentication"
        title="Document Signature Authentication"
        message="Step 1: Enter your 6-digit password"
        showInput inputValue={sixDigitPassword}
        onInputChange={onPasswordInput}
        inputPlaceholder="Enter 6-digit password"
        inputMaxLength={6}
        inputError={signError}
        buttonText={signLoading ? 'Verifying...' : 'Verify & Send OTP'}
        onButtonClick={onPasswordSubmit}
        preventClose={signLoading}
      />
      <Modal
        isOpen={showOtpModal}
        onClose={onOtpClose}
        type="otp" title="Enter OTP Code"
        message="OTP has been sent to the authorized email"
        showInput inputValue={otpCode}
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
      <Modal
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
      <Modal
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
      <Modal
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
      <Modal
        isOpen={showLoadingModal}
        onClose={() => { }}
        type="progress"
        title="Processing..."
        message={loadingMessage}
        progress={100}
        preventClose
      />
    </>
  );
}

function ReportActionBar({ handlePrint, handleDownloadPdf, isDocumentSigned, signDocument }) {
  return (
    <div className="equipment maintenance report toolbar no-print">
      <Controls
        justify='space-between'
        margin='0 auto 60px auto'
        width="297mm"
        columns={3}
        buttons={[
          { ...SHARED_BTN, text: 'Sign the Document', onClick: signDocument, colorScheme: isDocumentSigned ? 'warning-1000' : 'warning-400', type: 'submit', textColor: 'black-100', componentIconLeft: 'SignaturePenIcon', componentIconSize: '30', iconColor: 'black-200', width: '240px' },
          {
            ...SHARED_BTN,
            text: 'Print Report',
            onClick: handlePrint,
            colorScheme: 'info-100',
            textColor: 'black-200',
            type: isDocumentSigned ? 'submit' : 'disabled',
            cursor: isDocumentSigned ? 'allowed' : 'not-allowed',
            componentIconLeft: 'PrinterIcon',
            componentIconSize: '30',
            iconColor: 'black-200'
          },
          { ...SHARED_BTN, text: 'Download as PDF', onClick: handleDownloadPdf, colorScheme: 'error-100', textColor: 'black-200', type: 'submit', componentIconLeft: 'PdfIcon', componentIconSize: '30', iconColor: 'black-200', width: '240px' }
        ]}
      />
    </div>
  );
}

function MaintenanceReport() {
  const isPdfRender = new URLSearchParams(window.location.search).get('pdf') === '1';
  const {
    regNo: equipmentRegistrationNumber,
    reportData,
    multipleReports,
    isMultipleView,
    totalCount,
    loading,
    supervisorSignUrl,
    isDocumentSigned,
    timeRemaining,
    handleAddReportClick,
    handlePrint,
    handleEditReport,
    handleDeleteReport,
    handleEditReportDataClick,
    handleDeleteReportDataClick,
    signDocument,
    signatureModalProps,
    handleDownloadPdf
  } = useServiceDoc();

  if (loading) {
    return (
      <div className="equipment maintenance report loading state container">
        <A2PaperSkeleton />ƒ
      </div>
    );
  }

  if (isMultipleView) {
    if (!multipleReports.length) {
      return (
        <div className="equipment maintenance report empty state container">
          <div className="no-print">
            <h2>No report data available for the selected criteria</h2>
            <div className="equipment maintenance report empty state navigation">
              <Button {...SHARED_BTN} text="Add Report Data" onClick={handleAddReportClick} colorScheme="primary-800" width="160px" type="submit" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <>
        <ReportActionBar
          handlePrint={handlePrint}
          handleDownloadPdf={handleDownloadPdf}
          isDocumentSigned={isDocumentSigned}
          signDocument={signDocument}
        />

        {multipleReports.map((report, reportIndex) => (
          <ReportDocument
            key={report._id || reportIndex}
            report={report}
            equipmentRegistrationNumber={equipmentRegistrationNumber}
            supervisorSignUrl={supervisorSignUrl}
            headingTitle={getReportHeadingTitle(report)}
            onEditReport={handleEditReport}
            onDeleteReport={handleDeleteReport}
            showActions
            pageBreakStyle={{ pageBreakAfter: reportIndex < multipleReports.length - 1 ? 'always' : 'auto' }}
          />
        ))}

        <SignatureModals {...signatureModalProps} />
      </>
    );
  }

  if (!reportData) {
    return (
      <div className="equipment maintenance report empty state container">
        <h2>No report data available for this service record</h2>
        <div className="equipment maintenance report empty state navigation">
          <Button {...SHARED_BTN} text="Add Report Data" onClick={handleAddReportClick} colorScheme="primary-800" width="160px" type="submit" />
        </div>
      </div>
    );
  }

  return (
    <>
      <ReportActionBar
        handlePrint={handlePrint}
        handleDownloadPdf={handleDownloadPdf}
        isDocumentSigned={isDocumentSigned}
        signDocument={signDocument}
      />

      <div className="equipment maintenance report toolbar equipment maintenance report single report toolbar spacing">
        <Controls
          justify='space-between'
          margin='0 auto 20px auto'
          width="297mm"
          buttons={[
            { ...SHARED_BTN, onClick: handleEditReportDataClick, colorScheme: 'warning-800', type: 'submit', componentIconCenter: 'IconlyEdit', componentIconSize: '30', iconColor: 'warning-200' },
            { ...SHARED_BTN, onClick: handleDeleteReportDataClick, colorScheme: 'error-700', type: 'submit', componentIconCenter: 'IconlyDelete', componentIconSize: '30', iconColor: 'error-200' },
          ]}
        />
      </div>

      <ReportDocument
        report={reportData}
        equipmentRegistrationNumber={equipmentRegistrationNumber}
        supervisorSignUrl={supervisorSignUrl}
        headingTitle="PERIODIC SERVICE REPORT"
        onEditReport={handleEditReport}
        onDeleteReport={handleDeleteReport}
        showActions={false}
      />

      <SignatureModals {...signatureModalProps} />
    </>
  );
}

export default MaintenanceReport;