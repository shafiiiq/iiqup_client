import React from 'react';
import { useBackchargeReport } from '../hooks/useBackchargeReport';
import A2Paper from '@/shared/components/widgets/paper/A2Paper';
import Controls from '@/shared/components/widgets/controls/Controls';
import Modal from '@/shared/components/widgets/modal/Modal';
import './BackchargeReport.css';
import { SHARED_BTN } from '../constants/backcharge.report.constant.js';
import A2PaperSkeleton from '@/shared/components/widgets/paper/A2PaperSkeleton';

function BackchargeReport() {
  const {
    componentRef,
    formData,
    grantTotal,
    documentExists,
    isEditing,
    isLoading,
    saveStatus,
    showEmailModal,
    emailFormValues,
    isSendingEmail,
    signatureFlags,
    signatureStates,
    isSigningDoc,
    showOverrideModal,
    showActivationModal,
    showTrustModal,
    showNotTrustedModal,
    showSignConfirmModal,
    showUnauthorisedModal,
    signResult,
    activationKey,
    activationError,
    activationLoading,
    unsignedAboveRoles,
    supplierMail,
    setActivationKey,
    handleInputChange,
    handleTableChange,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDownloadPdf,
    handlePrint,
    handleSendEmail,
    handleSignButtonClick,
    handleConfirmSign,
    handleActivation,
    inputStyle,
    toDisplayDate,
    toIsoInputDate,
    handleOpenEmailModal,
    handleCloseEmailModal,
    handleEmailFormChange,
    handleOpenSignConfirmModal,
    handleCloseSignConfirmModal,
    handleCloseActivationModal,
    handleCloseNotTrustedModal,
    handleCloseUnauthorisedModal,
    handleCloseOverrideModal,
    handleOverrideAndSign,
  } = useBackchargeReport();

  if (isLoading && !documentExists) {
    return <A2PaperSkeleton />;
  }

  const toolbarButtons = isEditing
    ? [
      { key: 'save', ...SHARED_BTN, text: isLoading ? 'Saving...' : 'Save Changes', onClick: handleSaveEdit, colorScheme: 'success-800', width: '160px', disabled: isLoading },
      { key: 'cancel', ...SHARED_BTN, text: 'Cancel', onClick: handleCancelEdit, colorScheme: 'warning-800', width: '160px' },
    ]
    : [
      { key: 'edit', ...SHARED_BTN, text: 'Edit', onClick: handleEdit, colorScheme: 'warning-800', width: '160px' },
      { key: 'sign', ...SHARED_BTN, text: isSigningDoc ? 'Signing...' : 'Sign Document', onClick: handleSignButtonClick, colorScheme: 'warning-800', width: '160px', disabled: isSigningDoc },
      { key: 'download', ...SHARED_BTN, text: 'Download PDF', onClick: handleDownloadPdf, colorScheme: 'success-800', width: '160px' },
      supplierMail && { key: 'send', ...SHARED_BTN, text: 'Send to client', onClick: handleOpenEmailModal, colorScheme: 'warning-700', width: '160px' },
      { key: 'print', ...SHARED_BTN, text: 'Print', onClick: handlePrint, colorScheme: 'success-800', width: '160px' },
    ].filter(Boolean);

  return (
    <div className="features screens backcharge report page">
      <Controls
        width="297mm"
        justify="space-between"
        margin="0 auto 20px"
        buttons={toolbarButtons}
      />

      {saveStatus && (
        <div className={`features screens backcharge report save status features screens backcharge report save status ${saveStatus}`}>
          {saveStatus === 'success' ? 'Changes saved.' : 'Unable to save.'}
        </div>
      )}

      <A2Paper ref={componentRef}>
        <h1 className="features screens backcharge report main title">MAINTENANCE BACK CHARGE REPORT</h1>

        <div className="features screens backcharge report info grid">
          <div className="features screens backcharge report info full row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="features screens backcharge report info field" style={{ display: 'flex', alignItems: 'center' }}>
              <span className="features screens backcharge report field label">Ref No :</span>
              <span className="features screens backcharge report field value">{formData.refNo || 'N/A'}</span>
            </div>
            <div className="features screens backcharge report info field" style={{ display: 'flex', alignItems: 'center' }}>
              <span className="features screens backcharge report field label">Date :</span>
              {!isEditing ? (
                <span className="features screens backcharge report field value">{toDisplayDate(formData.date)}</span>
              ) : (
                <input type="date" value={toIsoInputDate(formData.date)} onChange={(e) => handleInputChange('date', e.target.value)} disabled={!isEditing} style={inputStyle()} />
              )}
            </div>
          </div>

          <div className="features screens backcharge report title hero">
            {[
              ['equipmentType', 'Equipment Type'],
              ['plateNo', 'Plate No'],
              ['model', 'Model'],
              ['supplierName', 'Supplier Name'],
              ['contactPerson', 'Contact Person'],
              ['siteLocation', 'Site Location'],
            ].map(([field, label]) => (
              <div key={field} className="features screens backcharge report info full row">
                <div className="features screens backcharge report info field">
                  <span className="features screens backcharge report field label wide">{label}</span>
                  <span>:</span>
                  <input
                    type="text"
                    value={formData[field] ?? ''}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    disabled={!isEditing}
                    className="features screens backcharge report field value bold features screens backcharge report text underline features screens backcharge report"
                    style={inputStyle()}
                  />
                </div>
              </div>
            ))}

            <div className="features screens backcharge report info full row">
              <div className="features screens backcharge report info field">
                <span className="features screens backcharge report field label wide">Work Date</span>
                <span>:</span>
                <span className="features screens backcharge report field value bold features screens backcharge report text underline features screens backcharge report">
                  {!isEditing ? (
                    <span>{toDisplayDate(formData.workDate || formData.date)}</span>
                  ) : (
                    <input
                      type="date"
                      value={toIsoInputDate(formData.workDate || formData.date)}
                      onChange={(e) => handleInputChange('workDate', e.target.value)}
                      disabled={!isEditing}
                      style={inputStyle()}
                    />
                  )}
                  <span className="features screens backcharge report signature label">Customer Signature &amp; Date : </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="features screens backcharge report scope section">
          <div className="features screens backcharge report scope section sub">
            <span className="features screens backcharge report scope label">Scope of Work :-</span>
            <input
              type="text"
              value={formData.scopeOfWork ?? ''}
              onChange={(e) => handleInputChange('scopeOfWork', e.target.value)}
              disabled={!isEditing}
              className="features screens backcharge report text underline features screens backcharge report scope value"
              style={inputStyle()}
            />
          </div>
        </div>

        <div className="features screens backcharge report parts section">
          <h3 className="features screens backcharge report parts header">DETAILS OF SPARE PARTS &amp; OTHER MATERIALS USED :</h3>
          <table className="features screens backcharge report parts table">
            <thead>
              <tr>
                <th className="features screens backcharge report parts table header features screens backcharge report parts table sl">SL</th>
                <th className="features screens backcharge report parts table header features screens backcharge report parts table desc header">PART DESCRIPTION</th>
                <th className="features screens backcharge report parts table header features screens backcharge report parts table qty">QTY</th>
                <th className="features screens backcharge report parts table header features screens backcharge report parts table cost">COST</th>
                <th className="features screens backcharge report parts table header features screens backcharge report parts table total">TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {(formData.tableRows || []).map((row, index) => (
                <tr key={index}>
                  <td className="features screens backcharge report parts table cell features screens backcharge report parts table center">{index + 1}</td>
                  <td className="features screens backcharge report parts table cell features screens backcharge report parts table desc">
                    <input
                      type="text"
                      value={row.description ?? ''}
                      onChange={(e) => handleTableChange(index, 'description', e.target.value)}
                      disabled={!isEditing}
                      style={{ ...inputStyle(), width: '100%', padding: 0 }}
                    />
                  </td>
                  <td className="features screens backcharge report parts table cell">
                    <input
                      type="text"
                      value={row.qty ?? ''}
                      onChange={(e) => handleTableChange(index, 'qty', e.target.value)}
                      disabled={!isEditing}
                      style={{ ...inputStyle(), width: '100%', padding: 0, textAlign: 'center' }}
                    />
                  </td>
                  <td className="features screens backcharge report parts table cell">
                    <input
                      type="text"
                      value={row.cost ?? ''}
                      onChange={(e) => handleTableChange(index, 'cost', e.target.value)}
                      disabled={!isEditing}
                      style={{ ...inputStyle(), width: '100%', padding: 0, textAlign: 'center' }}
                    />
                  </td>
                  <td className="features screens backcharge report parts table cell">
                    <input
                      type="text"
                      value={row.total ?? ''}
                      onChange={(e) => handleTableChange(index, 'total', e.target.value)}
                      disabled={!isEditing}
                      style={{ ...inputStyle(), width: '100%', padding: 0, textAlign: 'center' }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td className="features screens backcharge report parts table footer features screens backcharge report parts table total label" colSpan="4">TOTAL</td>
                <td className="features screens backcharge report parts table footer features screens backcharge report text center">{grantTotal}.00</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div className="features screens backcharge report comments section">
          <span className="features screens backcharge report comments label">Workshop Manager's Comments/ Work Summary :-</span>
          <input
            type="text"
            value={formData.workshopComments ?? ''}
            onChange={(e) => handleInputChange('workshopComments', e.target.value)}
            disabled={!isEditing}
            className="features screens backcharge report comments text features screens backcharge report text underline"
            style={{ ...inputStyle(), width: 'calc(100% - 4.5rem)', marginLeft: '4.5rem' }}
          />
          <input
            type="text"
            value={formData.workSummaryLine2 ?? ''}
            onChange={(e) => handleInputChange('workSummaryLine2', e.target.value)}
            disabled={!isEditing}
            className="features screens backcharge report comments text features screens backcharge report text underline"
            style={{ ...inputStyle(), width: '100%' }}
          />
          <input
            type="text"
            value={formData.workSummaryLine3 ?? ''}
            onChange={(e) => handleInputChange('workSummaryLine3', e.target.value)}
            disabled={!isEditing}
            className="features screens backcharge report comments text features screens backcharge report text underline"
            style={{ ...inputStyle(), width: '100%' }}
          />
          <input
            type="text"
            value={formData.workSummaryLine4 ?? ''}
            onChange={(e) => handleInputChange('workSummaryLine4', e.target.value)}
            disabled={!isEditing}
            className="features screens backcharge report comments text features screens backcharge report text underline"
            style={{ ...inputStyle(), width: '100%' }}
          />
        </div>

        <div className="features screens backcharge report cost summary section">
          <h3 className="features screens backcharge report cost summary title">Summary of Costs :</h3>
          <div className="features screens backcharge report cost summary content">
            {[
              ['sparePartsCost', 'Spare Parts & Materials'],
              ['labourCharges', 'Labour Charges'],
              ['totalCost', 'Total Cost'],
            ].map(([field, label]) => (
              <div key={field} className="features screens backcharge report cost row">
                <span className="features screens backcharge report cost label">{label}</span>
                <div className="features screens backcharge report cost value container">
                  <span className="features screens backcharge report price colon">:</span>
                  <span className="features screens backcharge report currency">QR</span>
                  <input
                    type="text"
                    value={isEditing ? formData[field] ?? '' : (formData[field] ? `${formData[field]}.00` : '')}
                    onChange={(e) => handleInputChange(field, e.target.value)}
                    disabled={!isEditing}
                    className="features screens backcharge report cost amount"
                    style={inputStyle()}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="features screens backcharge report deduction row">
            <span className="features screens backcharge report deduction label">Approved Cost of Deduction from Supplier :-</span>
            <div className="features screens backcharge report deduction value container">
              <span className="features screens backcharge report price colon">:</span>
              <span className="features screens backcharge report currency">QR</span>
              <input
                type="text"
                value={isEditing ? formData.approvedDeduction ?? '' : (formData.approvedDeduction ? `${formData.approvedDeduction}.00` : '')}
                onChange={(e) => handleInputChange('approvedDeduction', e.target.value)}
                disabled={!isEditing}
                className="features screens backcharge report cost amount"
                style={inputStyle()}
              />
            </div>
          </div>
        </div>

        <div className="features screens backcharge report auth section">
          <table className="features screens backcharge report auth table">
            <thead>
              <tr>
                <th className="features screens backcharge report auth header">Workshop Manager</th>
                <th className="features screens backcharge report auth header">Purchase Manager</th>
                <th className="features screens backcharge report auth header">Operations Manager</th>
                <th className="features screens backcharge report auth header">Authorized Signatory</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {[
                  ['workshopManager', 'features screens backcharge report auth cell features screens backcharge report auth signature space'],
                  ['purchaseManager', 'features screens backcharge report auth cell'],
                  ['operationsManager', 'features screens backcharge report auth cell'],
                  ['authorizedSignatory', 'features screens backcharge report auth cell'],
                ].map(([field, className]) => (
                  <td key={field} className={className}>
                    {signatureFlags[field] && signatureStates[field]?.url ? (
                      <img
                        src={signatureStates[field].url}
                        alt={`${field} signature`}
                        crossOrigin="anonymous"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : null}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="features screens backcharge report auth cell features screens backcharge report auth name">Firoz Khan</td>
                <td className="features screens backcharge report auth cell features screens backcharge report auth name">Abdul Malik</td>
                <td className="features screens backcharge report auth cell features screens backcharge report auth name">Suresh Kanth</td>
                <td className="features screens backcharge report auth cell features screens backcharge report auth name">
                  {isEditing ? (
                    <span
                      className="features screens backcharge report toggle field"
                      style={{ cursor: 'pointer' }}
                      onClick={handleOpenSignConfirmModal}
                    >
                      {formData.authorizedSignatoryName || 'Ahammed Kamal'}
                    </span>
                  ) : (
                    formData.authorizedSignatoryName || 'Ahammed Kamal'
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </A2Paper>

      <Modal
        isOpen={showEmailModal}
        onClose={handleCloseEmailModal}
        type="form"
        title={supplierMail ? 'Confirm Email' : 'Send to Client'}
        message={supplierMail ? 'Sending to saved email. You can change it if needed.' : "Enter the client's email address"}
        buttonText={isSendingEmail ? 'Sending...' : 'Send'}
        onButtonClick={handleSendEmail}
        secondaryButtonText="Cancel"
        onSecondaryClick={handleCloseEmailModal}
        formFields={[
          {
            name: 'email',
            label: supplierMail ? 'Saved Email (tap to edit)' : 'Client Email',
            type: 'email',
            placeholder: 'client@example.com',
            required: true,
          },
        ]}
        formValues={emailFormValues}
        onFormChange={handleEmailFormChange}
      />

      <Modal
        isOpen={showActivationModal}
        onClose={handleCloseActivationModal}
        type="activation"
        title="Activate Signatures"
        message="Enter your 20-digit activation key"
        showInput
        useCellInput
        cellCount={20}
        inputValue={activationKey}
        onInputChange={setActivationKey}
        inputError={activationError}
        buttonText={activationLoading ? 'Activating...' : 'Activate'}
        onButtonClick={handleActivation}
        preventClose={activationLoading}
      />

      <Modal
        isOpen={showTrustModal}
        onClose={() => { }}
        type="success"
        title="Key Activated"
        message="Your activation key is confirmed. Click below to trust this browser and load signatures."
        buttonText="Trust this browser"
        onButtonClick={handleCloseActivationModal}
        preventClose
      />

      <Modal
        isOpen={showNotTrustedModal}
        onClose={handleCloseNotTrustedModal}
        type="warning"
        title="Device Not Trusted"
        message="This device is activated but not yet trusted. Contact your system administrator."
        buttonText="Close"
        onButtonClick={handleCloseNotTrustedModal}
      />

      <Modal
        isOpen={showSignConfirmModal}
        onClose={handleCloseSignConfirmModal}
        type="warning"
        title="Confirm Signature"
        message="You are about to sign this backcharge document. This action cannot be undone."
        buttonText="Confirm & Sign"
        onButtonClick={handleConfirmSign}
        secondaryButtonText="Cancel"
        onSecondaryClick={handleCloseSignConfirmModal}
      />

      <Modal
        isOpen={showUnauthorisedModal}
        onClose={handleCloseUnauthorisedModal}
        type="unauthorized"
        title="Not Authorised"
        message="Your device is not registered as an authorised signatory for backcharge documents."
        unauthorizedReason="Your unique device code does not match any of the four authorised signatories."
        buttonText="Close"
        onButtonClick={handleCloseUnauthorisedModal}
      />

      <Modal
        isOpen={signResult === 'already_signed'}
        onClose={handleCloseSignConfirmModal}
        type="warning"
        title="Already Signed"
        message="This signature position has already been signed on this document."
        buttonText="OK"
        onButtonClick={handleCloseSignConfirmModal}
      />

      <Modal
        isOpen={showOverrideModal}
        onClose={handleCloseOverrideModal}
        type="warning"
        title="Signatures Pending"
        message={`The following signatories have not yet signed:\n\n${unsignedAboveRoles.join(', ')}\n\nYou can wait or override and sign now.`}
        buttonText="Override & Sign"
        onButtonClick={handleOverrideAndSign}
        secondaryButtonText="Wait"
        onSecondaryClick={handleCloseOverrideModal}
      />

      <Modal
        isOpen={signResult === 'success'}
        onClose={handleCloseSignConfirmModal}
        type="success"
        title="Document Signed"
        message="Your signature has been recorded successfully."
        buttonText="OK"
        onButtonClick={handleCloseSignConfirmModal}
        autoClose
        autoCloseDelay={3000}
      />
    </div>
  );
}

export default BackchargeReport;