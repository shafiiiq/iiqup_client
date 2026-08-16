import React from 'react';
import { useBackchargeReport } from '../hooks/useBackchargeReport';
import Button from '@/shared/components/widgets/button/Button';
import DevModal from '@/shared/components/widgets/modal/DevModal';
import logoImage from '@assets/images/al-ansari-color.png';
import alAnsariText from '@assets/images/al-ansari-full-address.png';
import './BackchargeReport.css';

const SHARED_BTN = {
  variant: 'gradient',
  font: 'md',
  animation: '',
  squircle: '4xl',
  height: '38px',
  type: 'submit',
  textColor: 'white-200',
  shadowPosition: 'to-bottom',
  shadowColor: 'white-600',
};

const INLINE_INPUT_STYLE = {
  border: 'none',
  outline: 'none',
  background: 'transparent',
};

const parseDateParts = (val) => {
  if (!val) return null;
  if (typeof val === 'string' && val.includes('T')) {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return null;
    return {
      yyyy: d.getFullYear(),
      mm: String(d.getMonth() + 1).padStart(2, '0'),
      dd: String(d.getDate()).padStart(2, '0'),
    };
  }

  const isoMatch = String(val).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return { yyyy: isoMatch[1], mm: isoMatch[2], dd: isoMatch[3] };
  }

  const parts = String(val).split(/[-/.]/).map((p) => p.trim());
  if (parts.length === 3) {
    const [p1, p2, p3] = parts;
    if (p1.length === 4) return { yyyy: p1, mm: p2.padStart(2, '0'), dd: p3.padStart(2, '0') };
    if (p3.length === 4) return { yyyy: p3, mm: p1.padStart(2, '0'), dd: p2.padStart(2, '0') };
  }

  return null;
};

const toDisplayDate = (val) => {
  const parts = parseDateParts(val);
  if (!parts) return '';
  return `${parts.dd}/${parts.mm}/${parts.yyyy}`;
};

const toIsoInputDate = (val) => {
  const parts = parseDateParts(val);
  if (!parts) return '';
  return `${parts.yyyy}-${parts.mm}-${parts.dd}`;
};

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
    globalActivation,
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
    setShowEmailModal,
    setEmailFormValues,
    setShowActivationModal,
    setShowTrustModal,
    setShowNotTrustedModal,
    setShowSignConfirmModal,
    setShowUnauthorisedModal,
    setShowOverrideModal,
    setActivationKey,
    setActivationError,
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
    getFileName,
  } = useBackchargeReport();

  const inputStyle = () => (isEditing ? INLINE_INPUT_STYLE : { ...INLINE_INPUT_STYLE, cursor: 'default' });

  if (isLoading && !documentExists) {
    return <div className="bcr-loading">Loading backcharge document...</div>;
  }

  return (
    <div className="bcr-page">
      <div className="bcr-toolbar">
        <div className="bcr-btn-left">
          {!isEditing ? (
            <>
              <Button {...SHARED_BTN} text="Edit" onClick={handleEdit} colorScheme="blue-700" width="160px" />
              <Button {...SHARED_BTN} text="Download PDF" onClick={handleDownloadPdf} colorScheme="teal-700" width="160px" />
              {supplierMail && (
                <Button
                  {...SHARED_BTN}
                  text="Send to client"
                  onClick={() => {
                    if (supplierMail) {
                      setEmailFormValues((prev) => ({ ...prev, email: supplierMail }));
                    }
                    setShowEmailModal(true);
                  }}
                  colorScheme="rose-700"
                  width="160px"
                />
              )}
              <Button {...SHARED_BTN} text={isSigningDoc ? 'Signing...' : 'Sign Document'} onClick={handleSignButtonClick} colorScheme="indigo-700" width="160px" disabled={isSigningDoc} />
              <Button {...SHARED_BTN} text="Print" onClick={handlePrint} colorScheme="amber-700" width="160px" />
            </>
          ) : (
            <>
              <Button {...SHARED_BTN} text={isLoading ? 'Saving...' : 'Save Changes'} onClick={handleSaveEdit} colorScheme="lime-700" width="160px" disabled={isLoading} />
              <Button {...SHARED_BTN} text="Cancel" onClick={handleCancelEdit} colorScheme="amber-800" width="160px" />
            </>
          )}
        </div>
      </div>

      {saveStatus && <div className={`bcr-save-status bcr-save-status-${saveStatus}`}>{saveStatus === 'success' ? 'Changes saved.' : 'Unable to save.'}</div>}

      <div ref={componentRef} className="bcr-main-wrapper">
        <div className="bcr-container">
          <div className="bcr-report-border">
            <header className="bcr-header-section">
              <div className="bcr-logo-container">
                <div className="logo-placeholder-l">
                  <img src={logoImage} alt="Company Logo" />
                </div>
              </div>
              <div className="company-details-b company-details-l">
                <img src={alAnsariText} alt="AL Ansari Transport & Enterprises W.L.L" />
              </div>
            </header>

            <h1 className="bcr-document-title">MAINTENANCE BACK CHARGE REPORT</h1>

            <div className="bcr-info-grid sign-border-td-l">
              <div className="bcr-info-full-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="bcr-info-field" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="bcr-field-label">Ref No :</span>
                  <span className="bcr-field-value">{formData.refNo || formData.reportNo || 'N/A'}</span>
                </div>
                <div className="bcr-info-field" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="bcr-field-label">Date :</span>
                  {!isEditing ? (
                    <span className="bcr-field-value">{toDisplayDate(formData.date)}</span>
                  ) : (
                    <input type="date" value={toIsoInputDate(formData.date)} onChange={(e) => handleInputChange('date', e.target.value)} disabled={!isEditing} style={inputStyle()} />
                  )}
                </div>
              </div>

              <div className="sign-border-td-r sign-border-td-b sign-border-td-t bcr-title-hero">
                {[
                  ['reportNo', 'Report No'],
                  ['equipmentType', 'Equipment Type'],
                  ['plateNo', 'Plate No'],
                  ['model', 'Model'],
                  ['supplierName', 'Supplier Name'],
                  ['contactPerson', 'Contact Person'],
                  ['siteLocation', 'Site Location'],
                ].map(([field, label]) => (
                  <div key={field} className="bcr-info-full-row">
                    <div className="bcr-info-field">
                      <span className="bcr-field-label-wide">{label}</span>
                      <span>:</span>
                      <input
                        type="text"
                        value={formData[field] ?? ''}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        disabled={!isEditing}
                        className="bcr-field-value-bold text-data-underline mr-l-2"
                        style={inputStyle()}
                      />
                    </div>
                  </div>
                ))}

                <div className="bcr-info-full-row">
                  <div className="bcr-info-field">
                    <span className="bcr-field-label-wide">Work Date</span>
                    <span>:</span>
                    <span className="bcr-field-value-bold text-data-underline mr-l-2">
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
                      <span className="bcr-signature-label">Customer Signature &amp; Date : </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bcr-scope-section">
              <div className="bcr-scope-section-sub">
                <span className="bcr-scope-label">Scope of Work :-</span>
                <input
                  type="text"
                  value={formData.scopeOfWork?.line1 ?? formData.scopeOfWork ?? ''}
                  onChange={(e) => handleInputChange('scopeOfWork', { ...(formData.scopeOfWork || {}), line1: e.target.value })}
                  disabled={!isEditing}
                  className="text-data-underline scope-value scope-line-1"
                  style={inputStyle()}
                />
              </div>
            </div>

            <div className="bcr-parts-section sign-border-td-l">
              <h3 className="bcr-parts-header">DETAILS OF SPARE PARTS &amp; OTHER MATERIALS USED :</h3>
              <table className="bcr-parts-table">
                <thead>
                  <tr className="bcr-parts-table-header-row">
                    <th className="bcr-parts-table-header bcr-parts-table-sl">SL</th>
                    <th className="bcr-parts-table-header bcr-parts-table-desc-header sign-border-td-r sign-border-td-l">PART DESCRIPTION</th>
                    <th className="bcr-parts-table-header bcr-parts-table-qty sign-border-td-r">QTY</th>
                    <th className="bcr-parts-table-header bcr-parts-table-cost sign-border-td-r">COST</th>
                    <th className="bcr-parts-table-header bcr-parts-table-total">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {(formData.tableRows || []).map((row, index) => (
                    <tr key={index}>
                      <td className="bcr-parts-table-cell bcr-parts-table-center">{index + 1}</td>
                      <td className="bcr-parts-table-cell bcr-parts-table-desc sign-border-td-l sign-border-td-r">
                        <input
                          type="text"
                          value={row.description ?? ''}
                          onChange={(e) => handleTableChange(index, 'description', e.target.value)}
                          disabled={!isEditing}
                          style={{ ...inputStyle(), width: '100%', padding: 0 }}
                        />
                      </td>
                      <td className="bcr-parts-table-cell sign-border-td-r">
                        <input
                          type="text"
                          value={row.qty ?? ''}
                          onChange={(e) => handleTableChange(index, 'qty', e.target.value)}
                          disabled={!isEditing}
                          style={{ ...inputStyle(), width: '100%', padding: 0, textAlign: 'center' }}
                        />
                      </td>
                      <td className="bcr-parts-table-cell sign-border-td-r">
                        <input
                          type="text"
                          value={row.cost ?? ''}
                          onChange={(e) => handleTableChange(index, 'cost', e.target.value)}
                          disabled={!isEditing}
                          style={{ ...inputStyle(), width: '100%', padding: 0, textAlign: 'center' }}
                        />
                      </td>
                      <td className="bcr-parts-table-cell">
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
                    <td className="bcr-parts-table-footer bcr-parts-table-total-label" colSpan="4">TOTAL</td>
                    <td className="bcr-parts-table-footer sign-border-td-l text-center">{grantTotal}.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            <div className="bcr-comments-section">
              <span className="bcr-comments-label">Workshop Manager's Comments/ Work Summary :-</span>
              <input
                type="text"
                value={formData.workshopComments?.line1 ?? ''}
                onChange={(e) => handleInputChange('workshopComments', { ...(formData.workshopComments || {}), line1: e.target.value })}
                disabled={!isEditing}
                className="bcr-comments-text text-data-underline work-summary-line-1"
                style={{ ...inputStyle(), width: 'calc(100% - 4.5rem)' }}
              />
            </div>

            <div className="bcr-cost-summary-section">
              <h3 className="bcr-cost-summary-title">Summary of Costs :</h3>
              <div className="bcr-cost-summary-content">
                {[
                  ['sparePartsCost', 'Spare Parts & Materials'],
                  ['labourCharges', 'Labour Charges'],
                  ['totalCost', 'Total Cost'],
                ].map(([field, label]) => (
                  <div key={field} className="bcr-cost-row">
                    <span className="bcr-cost-label">{label}</span>
                    <div className="bcr-cost-value-container">
                      <span className="price-colon">:</span>
                      <span className="bcr-currency">QR</span>
                      <input
                        type="text"
                        value={isEditing ? formData.costSummary?.[field] ?? '' : (formData.costSummary?.[field] ? `${formData.costSummary[field]}.00` : '')}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        disabled={!isEditing}
                        className="bcr-cost-amount"
                        style={inputStyle()}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bcr-deduction-row">
                <span className="bcr-deduction-label">Approved Cost of Deduction from Supplier :-</span>
                <div className="bcr-deduction-value-container">
                  <span className="price-colon">:</span>
                  <span className="bcr-currency">QR</span>
                  <input
                    type="text"
                    value={isEditing ? formData.costSummary?.approvedDeduction ?? '' : (formData.costSummary?.approvedDeduction ? `${formData.costSummary.approvedDeduction}.00` : '')}
                    onChange={(e) => handleInputChange('approvedDeduction', e.target.value)}
                    disabled={!isEditing}
                    className="bcr-cost-amount"
                    style={inputStyle()}
                  />
                </div>
              </div>
            </div>

            <div className="bcr-auth-section">
              <table className="bcr-auth-table">
                <thead>
                  <tr className="bcr-auth-header-row">
                    <th className="bcr-auth-header">Workshop Manager</th>
                    <th className="bcr-auth-header">Purchase Manager</th>
                    <th className="bcr-auth-header">Operations Manager</th>
                    <th className="bcr-auth-header sign-border-td-r">Authorized Signatory</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {[
                      ['workshopManager', 'bcr-auth-cell bcr-auth-signature-space'],
                      ['purchaseManager', 'bcr-auth-cell'],
                      ['operationsManager', 'bcr-auth-cell'],
                      ['authorizedSignatory', 'bcr-auth-cell sign-border-td-r'],
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
                    <td className="bcr-auth-cell bcr-auth-name sign-border-td-b">Firoz Khan</td>
                    <td className="bcr-auth-cell bcr-auth-name sign-border-td-b">Abdul Malik</td>
                    <td className="bcr-auth-cell bcr-auth-name sign-border-td-b">Suresh Kanth</td>
                    <td className="bcr-auth-cell bcr-auth-name sign-border-td-r sign-border-td-b">
                      {isEditing ? (
                        <span
                          className="toggle-field"
                          style={{ cursor: 'pointer' }}
                          onClick={() =>
                            setShowSignConfirmModal(true)
                          }
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
          </div>
        </div>
      </div>

      <DevModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setEmailFormValues({ email: '', recipientName: '' });
        }}
        type="form"
        title={supplierMail ? 'Confirm Email' : 'Send to Client'}
        message={supplierMail ? 'Sending to saved email. You can change it if needed.' : "Enter the client's email address"}
        buttonText={isSendingEmail ? 'Sending...' : 'Send'}
        onButtonClick={handleSendEmail}
        secondaryButtonText="Cancel"
        onSecondaryClick={() => {
          setShowEmailModal(false);
          setEmailFormValues({ email: '', recipientName: '' });
        }}
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
        onFormChange={(field, value) => setEmailFormValues((prev) => ({ ...prev, [field]: value }))}
      />

      <DevModal
        isOpen={showActivationModal}
        onClose={() => setShowActivationModal(false)}
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

      <DevModal
        isOpen={showTrustModal}
        onClose={() => {}}
        type="success"
        title="Key Activated"
        message="Your activation key is confirmed. Click below to trust this browser and load signatures."
        buttonText="Trust this browser"
        onButtonClick={() => setShowActivationModal(false)}
        preventClose
      />

      <DevModal
        isOpen={showNotTrustedModal}
        onClose={() => setShowNotTrustedModal(false)}
        type="warning"
        title="Device Not Trusted"
        message="This device is activated but not yet trusted. Contact your system administrator."
        buttonText="Close"
        onButtonClick={() => setShowNotTrustedModal(false)}
      />

      <DevModal
        isOpen={showSignConfirmModal}
        onClose={() => setShowSignConfirmModal(false)}
        type="warning"
        title="Confirm Signature"
        message="You are about to sign this backcharge document. This action cannot be undone."
        buttonText="Confirm & Sign"
        onButtonClick={handleConfirmSign}
        secondaryButtonText="Cancel"
        onSecondaryClick={() => setShowSignConfirmModal(false)}
      />

      <DevModal
        isOpen={showUnauthorisedModal}
        onClose={() => setShowUnauthorisedModal(false)}
        type="unauthorized"
        title="Not Authorised"
        message="Your device is not registered as an authorised signatory for backcharge documents."
        unauthorizedReason="Your unique device code does not match any of the four authorised signatories."
        buttonText="Close"
        onButtonClick={() => setShowUnauthorisedModal(false)}
      />

      <DevModal
        isOpen={signResult === 'already_signed'}
        onClose={() => setShowSignConfirmModal(false)}
        type="warning"
        title="Already Signed"
        message="This signature position has already been signed on this document."
        buttonText="OK"
        onButtonClick={() => setShowSignConfirmModal(false)}
      />

      <DevModal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        type="warning"
        title="Signatures Pending"
        message={`The following signatories have not yet signed:\n\n${unsignedAboveRoles.join(', ')}\n\nYou can wait or override and sign now.`}
        buttonText="Override & Sign"
        onButtonClick={() => { setShowOverrideModal(false); handleConfirmSign(true); }}
        secondaryButtonText="Wait"
        onSecondaryClick={() => setShowOverrideModal(false)}
      />

      <DevModal
        isOpen={signResult === 'success'}
        onClose={() => setShowSignConfirmModal(false)}
        type="success"
        title="Document Signed"
        message="Your signature has been recorded successfully."
        buttonText="OK"
        onButtonClick={() => setShowSignConfirmModal(false)}
        autoClose
        autoCloseDelay={3000}
      />
    </div>
  );
}

export default BackchargeReport;
