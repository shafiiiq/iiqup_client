import A2Paper, { A2PaginationEngine, groupBlocksBySection } from '@/shared/components/widgets/paper/A2Paper';
import A2PaperSkeleton from '@/shared/components/widgets/paper/A2PaperSkeleton';
import Modal from '@/shared/components/widgets/modal/Modal';
import Controls from '@/shared/components/widgets/controls/Controls';

import useQuotationReport from '../hooks/useQuotationReport';
import { SHARED_BTN, CONFIRMATION_HEADING } from '../constants/quotation.report.constant';
import { formatCurrency, isTermHeading, getTermText, buildTermNumbers, splitHeaderLabel } from '../helper/quotation.report.helper';
import './QuotationReport.css';

const buildItemRow = (item, absoluteIndex, columns) => (
  <tr key={item._id || item.id || absoluteIndex}>
    <td>{absoluteIndex + 1}</td>
    {columns.map((col) => (
      <td
        key={col.id}
        className={col.id === 'description' ? 'features screen quotation report items-description-data' : ''}
      >
        {(col.id === 'unitPrice' || col.type === 'calculated') ? formatCurrency(item[col.id]) : item[col.id]}
        {col.id === 'description' && item.image && (
          <div className="features screen quotation report item-image-wrap">
            <img src={item.image} alt="Item attachment" className="features screen quotation report item-image" />
          </div>
        )}
      </td>
    ))}
  </tr>
);

const buildDiscountRow = (data, columns) => (
  <tr key="discount">
    <td colSpan={columns.length} className="features screen quotation report total-label">Discount (QR)</td>
    <td>-{formatCurrency(data.discount)}</td>
  </tr>
);

const buildTotalRow = (data, columns, total) => {
  const totalValue = data.showDiscountInTotal ? total - (data.discount || 0) : total;
  return (
    <tr key="total">
      <td colSpan={columns.length} className="features screen quotation report total-label">
        {data.showDiscountInTotal ? 'Total Amount After Discount (QR)' : 'Total Amount (QR)'}
      </td>
      <td>{formatCurrency(data.totalAmount || totalValue)}</td>
    </tr>
  );
};

const buildTermLi = (term, absoluteIndex, number) => (
  <li
    key={absoluteIndex}
    className={isTermHeading(term) ? 'features screen quotation report term-heading' : 'features screen quotation report term-item'}
  >
    {!isTermHeading(term) && <span className="features screen quotation report term-number">{number}.</span>}
    <span className="features screen quotation report term-text">{getTermText(term)}</span>
  </li>
);

function ClosingSection({ data, signatureFlags, signatureStates }) {
  const isSigned = signatureFlags?.authorizedSigned && signatureStates?.authorized?.url;

  return (
    <>
      <div className="features screen quotation report terms-extra">
        {data.noticeText && <div className="features screen quotation report notice-text">{data.noticeText}</div>}
        {data.priceStatementText && <div className="features screen quotation report price-statement-text">{data.priceStatementText}</div>}
        {data.contactText && <div className="features screen quotation report contact-text">{data.contactText}</div>}
      </div>

      <div className="features screen quotation report closing-row">
        <div className="features screen quotation report closing-left">
          <div className="features screen quotation report thank-you-text">Thank You,</div>

          {isSigned ? (
            <div className="features screen quotation report signature-image-wrap">
              <img
                className="features screen quotation report signature-image"
                src={signatureStates.authorized.url}
                alt="Authorized Signature"
                crossOrigin="anonymous"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          ) : (
            <div className="features screen quotation report signature-space" />
          )}

          <div className="features screen quotation report signatory-name">{data.signatures?.authorizedSignatory}</div>
          <span>({data.signatures?.authorizedSignatoryTitle})</span>
        </div>

        <div className="features screen quotation report closing-right-box">
          <div className="features screen quotation report confirmation-heading">{CONFIRMATION_HEADING}</div>
          <div className="features screen quotation report confirmation-text">
            Customer {data.vendor || '__________'} should fully understand and comply with all the above terms and conditions. Any lapse/negligence, supplier AL ANSARI TRANSPORT &amp; ENTERPRISES WLL has full right to withdraw the equipment without any notice.
          </div>
          <div className="features screen quotation report confirmation-field">Authorized Person Name &amp; Signature:</div>
          <div className="features screen quotation report confirmation-field-row">
            <span>Company Stamp:</span>
            <span>Date:</span>
          </div>
        </div>
      </div>
    </>
  );
}

function ReportData({ data, signatureFlags, signatureStates }) {
  const columns = data.columns;
  const total = data.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const termNumbers = buildTermNumbers(data.termsAndConditions);

  const blocks = [
    ...data.items.map((item, absoluteIndex) => ({
      key: `item-${item._id || item.id || absoluteIndex}`,
      section: 'item',
      row: buildItemRow(item, absoluteIndex, columns),
      content: (
        <table className="features screen quotation report items-table">
          <tbody>{buildItemRow(item, absoluteIndex, columns)}</tbody>
        </table>
      ),
    })),
    ...(data.showTotalRow !== false && data.showDiscountInTotal && data.discount > 0 ? [{
      key: 'discount',
      section: 'item',
      row: buildDiscountRow(data, columns),
      content: (
        <table className="features screen quotation report items-table">
          <tbody>{buildDiscountRow(data, columns)}</tbody>
        </table>
      ),
    }] : []),
    ...(data.showTotalRow !== false ? [{
      key: 'total',
      section: 'item',
      row: buildTotalRow(data, columns, total),
      content: (
        <table className="features screen quotation report items-table">
          <tbody>{buildTotalRow(data, columns, total)}</tbody>
        </table>
      ),
    }] : []),
    ...data.termsAndConditions.map((term, absoluteIndex) => ({
      key: `term-${absoluteIndex}`,
      section: 'term',
      li: buildTermLi(term, absoluteIndex, termNumbers[absoluteIndex]),
      content: (
        <table className="features screen quotation report terms-table">
          <tbody>
            <tr>
              <td className="features screen quotation report terms-content term-measure">
                <ul>{buildTermLi(term, absoluteIndex, termNumbers[absoluteIndex])}
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      ),
    })),
    {
      key: 'closing',
      section: 'closing',
      content: <ClosingSection data={data} signatureFlags={signatureFlags} signatureStates={signatureStates} />,
    },
  ];

  const renderGroup = (group) => {
    if (group.section === 'item') {
      return (
        <table key="items" className="features screen quotation report items-table">
          <thead>
            <tr>
              <th>SN</th>
              {columns.map((col) => (
                <th key={col.id}>
                  {splitHeaderLabel(col.label).map((line, i, arr) => (
                    <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
                  ))}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{group.blocks.map((b) => b.row)}</tbody>
        </table>
      );
    }

    if (group.section === 'term') {
      const showHeader = group.blocks[0]?.key === 'term-0';
      return (
        <table key="terms" className="features screen quotation report terms-table">
          <tbody>
            <tr>
              <td className="features screen quotation report terms-content">
                {showHeader && <div className="features screen quotation report terms-header">Terms &amp; Conditions</div>}
                <ul>{group.blocks.map((b) => b.li)}</ul>
              </td>
            </tr>
          </tbody>
        </table>
      );
    }

    return group.blocks[0].content;
  };

  const headerNode = (
    <>
      {data.isAmendment && data.amendmentDate && (
        <div className="features screen quotation report amendment-banner">[AMENDMENT]</div>
      )}
      <div className="features screen quotation report divider-header" />
      <div className="features screen quotation report title">QUOTATION</div>

      <table className="features screen quotation report info-table">
        <tbody>
          <tr>
            <td className="features screen quotation report info-column-left">
              <div className="features screen quotation report info-line">TO : M/S {data.vendor}</div>
              <div className="features screen quotation report info-line">ATTN : {data.attention}</div>
              <div className="features screen quotation report info-line">DESIGNATION : {data.designation}</div>
            </td>
            <td className="features screen quotation report info-column-right">
              <div className="features screen quotation report info-line">DATE : {data.date}</div>
              <div className="features screen quotation report info-line">LOCATION : {data.location}</div>
              {data.customFields?.map((field, idx) => (
                <div className="features screen quotation report info-line" key={field.id || idx}>
                  {(field.label || 'FIELD').toUpperCase()} : {field.value}
                </div>
              ))}
              <div className="features screen quotation report info-line">REF NO : {data.quotationRef}</div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="features screen quotation report divider-details" />
      <div className="features screen quotation report request-text">{data.requestText}</div>
    </>
  );

  return (
    <A2PaginationEngine blocks={blocks} firstPageHeader={headerNode}>
      {(pages) => pages.map((pageBlocks, pageIndex) => (
        <A2Paper key={pageIndex} className="features screen quotation report document-sheet">
          {pageIndex === 0 ? headerNode : <div className="features screen quotation report divider-header" />}
          {groupBlocksBySection(pageBlocks).map((group, i) => (
            <div key={i}>{renderGroup(group)}</div>
          ))}
        </A2Paper>
      ))}
    </A2PaginationEngine>
  );
}

function QuotationReport() {
  const {
    quotationRef,
    componentRef,
    deviceInfo,
    quotationData,
    amendmentData,
    loading,
    error,
    signatureFlags,
    signatureStates,
    isSigningDoc,
    showSignConfirmModal,
    setShowSignConfirmModal,
    showUnauthorisedModal,
    setShowUnauthorisedModal,
    signResult,
    setSignResult,
    activationKey,
    setActivationKey,
    activationError,
    activationLoading,
    globalActivation,
    showActivationModal,
    setShowActivationModal,
    showTrustModal,
    showNotTrustedModal,
    setShowNotTrustedModal,
    showEmailModal,
    emailFormValues,
    isSendingEmail,
    showUploadSuccessModal,
    setShowUploadSuccessModal,
    showLoadingModal,
    loadingMessage,
    fetchQuotationData,
    handleSignButtonClick,
    handleConfirmSign,
    handleLoadAllSignatures,
    handleActivation,
    confirmBrowserTrust,
    handleDownloadPdf,
    handlePrint,
    sendToApprove,
    handleEditQuotation,
    handleSendToSupplierClick,
    handleEmailFormChange,
    closeEmailModal,
    handleSendEmail,
  } = useQuotationReport();

  if (loading) {
    return (
      <div className="features screen quotation report page">
        <A2PaperSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="features screen quotation report page">
        <div className="features screen quotation report error-state">
          <p className="features screen quotation report error-message">{error}</p>
          <p>Reference: {quotationRef ? decodeURIComponent(quotationRef) : 'No reference provided'}</p>
          <button onClick={fetchQuotationData} className="features screen quotation report retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="features screen quotation report page" ref={componentRef}>
      <Controls
        width="297mm"
        columns={4}
        rows={2}
        margin="0 auto 20px"
        buttons={[
          { ...SHARED_BTN, text: 'Edit', onClick: handleEditQuotation, colorScheme: 'info-800' },
          { ...SHARED_BTN, text: isSigningDoc ? 'Signing...' : 'Sign Document', onClick: handleSignButtonClick, colorScheme: 'warning-800', disabled: isSigningDoc },
          { ...SHARED_BTN, text: 'Download as PDF', onClick: handleDownloadPdf, colorScheme: 'success-800' },
          ...(!globalActivation.checked
            ? [{ text: 'Checking Status...', disabled: true, colorScheme: 'gray-400' }]
            : !globalActivation.isActivated
              ? [{ ...SHARED_BTN, text: 'Activate E-Signs', onClick: handleLoadAllSignatures, colorScheme: 'error-800' }]
              : !globalActivation.isTrusted
                ? [{ ...SHARED_BTN, text: 'Device Not Trusted - Contact Admin', onClick: handleLoadAllSignatures, colorScheme: 'warning-800' }]
                : []),
          { ...SHARED_BTN, text: 'Send For Approval', onClick: sendToApprove, colorScheme: 'info-800' },
          { ...SHARED_BTN, text: 'Send to Supplier', onClick: handleSendToSupplierClick, colorScheme: 'warning-800' },
          { ...SHARED_BTN, text: 'Print', onClick: handlePrint, colorScheme: 'success-800' },
        ]}
      />

      <ReportData data={quotationData} signatureFlags={signatureFlags} signatureStates={signatureStates} />

      {amendmentData && (
        <>
          <div className="features screen quotation report amendment-divider">===== AMENDED DOCUMENT FOLLOWS =====</div>
          <ReportData data={amendmentData} signatureFlags={signatureFlags} signatureStates={signatureStates} />
        </>
      )}

      <Modal
        isOpen={showActivationModal}
        onClose={() => setShowActivationModal(false)}
        type="activation"
        title="Activate Signature"
        message="Enter your 20-digit activation key to activate your signature"
        showInput
        useCellInput
        cellCount={20}
        inputValue={activationKey}
        onInputChange={setActivationKey}
        inputError={activationError}
        deviceInfo={deviceInfo}
        buttonText={activationLoading ? 'Activating...' : 'Activate'}
        onButtonClick={handleActivation}
        preventClose={activationLoading}
      />

      <Modal
        isOpen={showTrustModal}
        onClose={() => { }}
        type="success"
        title="Key has been Activated"
        message="Your key has been activated now. You can now load and use your signature."
        buttonText="Trust this browser"
        onButtonClick={confirmBrowserTrust}
        preventClose
      />

      <Modal
        isOpen={showNotTrustedModal}
        onClose={() => setShowNotTrustedModal(false)}
        type="warning"
        title="Device Not Trusted"
        message="This device is activated but not yet trusted by the administrator. Please contact your system administrator to enable trust for this device."
        buttonText="Close"
        onButtonClick={() => setShowNotTrustedModal(false)}
      />

      <Modal
        isOpen={showSignConfirmModal}
        onClose={() => setShowSignConfirmModal(false)}
        type="warning"
        title="Confirm Signature"
        message="You are about to sign this quotation document. This action cannot be undone."
        buttonText="Confirm & Sign"
        onButtonClick={handleConfirmSign}
        secondaryButtonText="Cancel"
        onSecondaryClick={() => setShowSignConfirmModal(false)}
      />

      <Modal
        isOpen={showUnauthorisedModal}
        onClose={() => setShowUnauthorisedModal(false)}
        type="unauthorized"
        title="Not Authorised"
        message="Your account is not registered as the authorised signatory for this quotation."
        unauthorizedReason="Your user ID does not match the designated CEO or Managing Director."
        buttonText="Close"
        onButtonClick={() => setShowUnauthorisedModal(false)}
      />

      <Modal
        isOpen={signResult === 'already_signed'}
        onClose={() => setSignResult(null)}
        type="warning"
        title="Already Signed"
        message="This quotation has already been signed."
        buttonText="OK"
        onButtonClick={() => setSignResult(null)}
      />

      <Modal
        isOpen={signResult === 'success'}
        onClose={() => setSignResult(null)}
        type="success"
        title="Document Signed"
        message="Your signature has been recorded successfully."
        buttonText="OK"
        onButtonClick={() => setSignResult(null)}
        autoClose
        autoCloseDelay={3000}
      />

      <Modal
        isOpen={showEmailModal}
        onClose={closeEmailModal}
        type="form"
        title="Send to Supplier"
        message="Enter recipient email addresses. Add more than one if needed."
        buttonText={isSendingEmail ? 'Sending...' : 'Send'}
        onButtonClick={handleSendEmail}
        secondaryButtonText="Cancel"
        onSecondaryClick={closeEmailModal}
        formFields={[{ name: 'emails', label: 'Recipient Emails (comma-separated)', type: 'text', placeholder: 'vendor@example.com, other@example.com', required: true }]}
        formValues={{ emails: emailFormValues.emails.join(', ') }}
        onFormChange={handleEmailFormChange}
      />

      <Modal
        isOpen={showUploadSuccessModal}
        onClose={() => setShowUploadSuccessModal(false)}
        type="success"
        title="Quotation Sent"
        message="The quotation has been marked as sent."
        buttonText="OK"
        onButtonClick={() => setShowUploadSuccessModal(false)}
        autoClose
        autoCloseDelay={3000}
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

      <Modal
        isOpen={signResult === 'email_sent'}
        onClose={() => setSignResult(null)}
        type="success"
        title="Quotation Sent Successfully"
        message="Quotation sent successfully to supplier."
        buttonText="OK"
        onButtonClick={() => setSignResult(null)}
        autoClose
        autoCloseDelay={3000}
      />
    </div>
  );
}

export default QuotationReport;