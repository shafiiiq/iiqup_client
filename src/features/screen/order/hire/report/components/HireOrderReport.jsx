import A2Paper from '@/shared/components/widgets/paper/A2Paper';
import A2PaperSkeleton from '@/shared/components/widgets/paper/A2PaperSkeleton';
import Modal from '@/shared/components/widgets/modal/Modal';
import Controls from '@/shared/components/widgets/controls/Controls';

import useHireOrderReport from '../hooks/useHireOrderReport';
import { ITEMS_PER_PAGE, SHARED_BTN, EMAIL_FORM_FIELDS } from '../constants/hire.order.report.constant';
import { formatCurrency, signatoryRole, chunkItems, estimateItemLines, getEffectiveColumns } from '../helper/hire.order.report.helper';
import './HireOrderReport.css';

function SignatureCell({ isSigned, url, alt, imageClassName = 'features screen hire order report signature-image', withSeal = false, sealUrl = '' }) {
  return (
    <td className="features screen hire order report signature-cell features screen hire order report border-left">
      {isSigned && url ? (
        <div className="features screen hire order report signature-image-group">
          <img
            className={imageClassName}
            src={url}
            alt={alt}
            crossOrigin="anonymous"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {withSeal && sealUrl && (
            <img
              className="features screen hire order report company-seal"
              src={sealUrl}
              alt="Company Seal"
              crossOrigin="anonymous"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
        </div>
      ) : (
        <span className="features screen hire order report missing-signature-marker" />
      )}
    </td>
  );
}

function SignaturesTable({ data, signatureFlags, signatureStates }) {
  const { pmSigned, accountsSigned, managerSigned, ceoSigned } = signatureFlags;
  const { pm, accounts, manager, authorized, seal } = signatureStates;

  return (
    <table className="features screen hire order report signatures-table">
      <tbody>
        <tr>
          <td colSpan="4" className="features screen hire order report signatures-company-name features screen hire order report border-right features screen hire order report border-left">
            AL ANSARI TRANSPORT &amp; ENTERPRISES W.L.L
          </td>
          <td className="features screen hire order report service-provider features screen hire order report border-right">
            Subcontractor OR<br />Service Provider
          </td>
        </tr>

        <tr>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-left features screen hire order report border-top features screen hire order report text-center">
            Operations Manager
          </td>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-top features screen hire order report text-center">
            Purchase Manager
          </td>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-top features screen hire order report text-center">
            Accounts Dept:
          </td>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-top features screen hire order report text-center">
            Authorized Signatory<br />{signatoryRole(data.signatures.authorizedSignatoryTitle)}
          </td>
          <td className="features screen hire order report signatures-date-label features screen hire order report border-top features screen hire order report border-right features screen hire order report text-center">
            (Date &amp; Sign with Stamp)
          </td>
        </tr>

        <tr className="features screen hire order report signatures-image-row">
          <SignatureCell isSigned={managerSigned} url={manager.url} alt="Manager Signature" />
          <SignatureCell isSigned={pmSigned} url={pm.url} alt="PM Signature" />
          <SignatureCell isSigned={accountsSigned} url={accounts.url} alt="Accounts Signature" />
          <SignatureCell isSigned={ceoSigned} url={authorized.url} alt="Authorized Signature" withSeal sealUrl={seal.url} />
          <td className="features screen hire order report border-right features screen hire order report border-left" />
        </tr>

        <tr>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-left features screen hire order report border-top features screen hire order report text-center">
            {data.signatures.operationsManager}
          </td>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-top features screen hire order report text-center">
            {data.signatures.purchasingManager}
          </td>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-top features screen hire order report text-center">
            {data.signatures.accountsDept}
          </td>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-top features screen hire order report text-center">
            {data.signatures.authorizedSignatory}
          </td>
          <td className="features screen hire order report border-right features screen hire order report border-bottom" />
        </tr>
      </tbody>
    </table>
  );
}

function TermsAndSignaturesContent({ data, signatureFlags, signatureStates }) {
  return (
    <>
      <table className="features screen hire order report terms-table">
        <tbody>
          <tr className="features screen hire order report terms-row">
            <td className="features screen hire order report terms-content features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-left features screen hire order report border-top">
              <ul>
                {data.termsAndConditions.map((term, idx) => <li key={idx}>{term}</li>)}
              </ul>
            </td>
          </tr>
          <tr>
            <td className="features screen hire order report terms-note features screen hire order report border-right features screen hire order report border-left features screen hire order report border-bottom">
              <strong>NOTE:</strong> The hire order copy should be submitted along with the invoice every month for the payment process.
            </td>
          </tr>
        </tbody>
      </table>

      <SignaturesTable data={data} signatureFlags={signatureFlags} signatureStates={signatureStates} />
    </>
  );
}

function TermsAndSignaturesPage({ data, signatureFlags, signatureStates }) {
  return (
    <A2Paper className="features screen hire order report document-sheet">
      <div className="features screen hire order report divider-header" />
      <TermsAndSignaturesContent data={data} signatureFlags={signatureFlags} signatureStates={signatureStates} />
    </A2Paper>
  );
}

function ItemsTable({ items, startIndex, showHeader, showTotal, data, total, lastItemBorder }) {
  const columns = getEffectiveColumns(data);
  const lastItemIndex = items.length - 1;
  const totalValue = data.showDiscountInTotal ? total - (data.discount || 0) : total;

  return (
    <table className="features screen hire order report items-table">
      {showHeader && (
        <thead>
          <tr>
            <th>SN</th>
            {columns.map((col) => <th key={col.id}>{col.label}</th>)}
          </tr>
        </thead>
      )}
      <tbody>
        {items.map((item, itemIndex) => (
          <tr
            key={item._id || item.id || itemIndex}
            className={lastItemBorder && itemIndex === lastItemIndex ? 'features screen hire order report border-bottom' : ''}
          >
            <td>{startIndex + itemIndex}</td>
            {columns.map((col) => (
              <td key={col.id} className={col.id === 'description' ? 'features screen hire order report items-description-data' : ''}>
                {(col.id === 'unitPrice' || col.type === 'calculated') ? formatCurrency(item[col.id]) : item[col.id]}
              </td>
            ))}
          </tr>
        ))}
        {showTotal && (
          <tr>
            <td colSpan={columns.length} className="features screen hire order report items-total-label">
              {data.totalDiscountAmount != null ? 'Total Amount After Discount (QR)' : 'Total Amount (QR)'}
            </td>
            <td>{formatCurrency(data.totalDiscountAmount ?? data.totalAmount ?? totalValue)}</td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function ReportData({ data, signatureFlags, signatureStates }) {
  const itemPages = chunkItems(data.items, ITEMS_PER_PAGE);
  const lastPageIndex = itemPages.length - 1;
  const total = data.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  const lastPageItemCount = itemPages[lastPageIndex].reduce(
    (sum, item) => sum + estimateItemLines(item.description),
    0
  );
  const showTermsInline = lastPageIndex === 0 ? lastPageItemCount < 14 : lastPageItemCount < 21;

  const termsSharedProps = { data, signatureFlags, signatureStates };

  return (
    <>
      <A2Paper className="features screen hire order report document-sheet">
        {data.isAmendment && data.amendmentDate && (
          <div className="features screen hire order report amendment-banner">[AMENDMENT]</div>
        )}

        <div className="features screen hire order report divider-header" />
        <div className="features screen hire order report title">HIRE ORDER</div>

        <table className="features screen hire order report info-table">
          <tbody>
            <tr>
              <td className="features screen hire order report info-column-left">
                <div className="features screen hire order report info-line">TO : {data.vendor}</div>
                <div className="features screen hire order report info-line">ATTN : {data.attention}</div>
                <div className="features screen hire order report info-line">DESIGNATION : {data.designation}</div>
                <div className="features screen hire order report info-line">Ref No : {data.quoteNo}</div>
              </td>
              <td className="features screen hire order report info-column-right">
                <div className="features screen hire order report info-line">DATE : {data.date}</div>
                <div className="features screen hire order report info-line">HIRE ORDER REF NO : {data.hireOrderRef}</div>
              </td>
            </tr>
          </tbody>
        </table>

        <div className="features screen hire order report divider-details" />
        <div className="features screen hire order report request-note">{data.requestText}</div>

        <ItemsTable
          items={itemPages[0]}
          startIndex={1}
          showHeader
          showTotal={lastPageIndex === 0}
          data={data}
          total={total}
          lastItemBorder={lastPageIndex !== 0}
        />

        {lastPageIndex === 0 && showTermsInline && (
          <TermsAndSignaturesContent {...termsSharedProps} />
        )}
      </A2Paper>

      {itemPages.slice(1).map((pageItems, idx) => {
        const pageIndex = idx + 1;
        const isLastItemPage = pageIndex === lastPageIndex;
        const startIndex = itemPages.slice(0, pageIndex).reduce((sum, p) => sum + p.length, 0) + 1;

        return (
          <A2Paper key={pageIndex} className="features screen hire order report document-sheet">
            <div className="features screen hire order report divider-header" />
            <ItemsTable
              items={pageItems}
              startIndex={startIndex}
              showHeader
              showTotal={isLastItemPage}
              data={data}
              total={total}
              lastItemBorder={!isLastItemPage}
            />

            {isLastItemPage && showTermsInline && (
              <TermsAndSignaturesContent {...termsSharedProps} />
            )}
          </A2Paper>
        );
      })}

      {!showTermsInline && (
        <TermsAndSignaturesPage {...termsSharedProps} />
      )}
    </>
  );
}

function HireOrderReport() {
  const isPdfRender = new URLSearchParams(window.location.search).get('pdf') === '1';
  const h = useHireOrderReport();

  if (h.loading) {
    return (
      <div className="features screen hire order report page">
        <A2PaperSkeleton />
      </div>
    );
  }

  if (h.error) {
    return (
      <div className="features screen hire order report page">
        <div className="features screen hire order report error-state">
          <p className="features screen hire order report error-message">{h.error}</p>
          <p>Reference: {h.refNo ? decodeURIComponent(h.refNo) : 'No reference provided'}</p>
          <button onClick={h.fetchHireOrder} className="features screen hire order report retry-button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="features screen hire order report page" ref={h.componentRef}>

      {!isPdfRender && (
        <Controls
          justify="space-between"
          width="297mm"
          columns={4}
          rows={2}
          margin="0 auto 20px"
          buttons={[
            { ...SHARED_BTN, text: 'Edit', onClick: h.handleEditClick, colorScheme: 'info-800' },
            { ...SHARED_BTN, text: h.isSigningDoc ? 'Signing...' : 'Sign Document', onClick: h.handleSignButtonClick, colorScheme: 'warning-800', disabled: h.isSigningDoc },
            { ...SHARED_BTN, text: 'Download as PDF', onClick: h.handleDownloadPdf, colorScheme: 'success-800' },
            ...(!h.globalActivation.checked
              ? [{ text: 'Checking Status...', disabled: true, colorScheme: 'gray-400' }]
              : !h.globalActivation.isActivated
                ? [{ ...SHARED_BTN, text: 'Activate E-Signs', onClick: h.handleLoadAllSignatures, colorScheme: 'error-800' }]
                : !h.globalActivation.isTrusted
                  ? [{ ...SHARED_BTN, text: 'Device Not Trusted - Contact Admin', onClick: h.handleLoadAllSignatures, colorScheme: 'warning-800' }]
                  : []),
            { ...SHARED_BTN, text: 'Send For Approval', onClick: h.sendToApprove, colorScheme: 'info-800' },
            { ...SHARED_BTN, text: 'Send to Supplier', onClick: h.handleSendToSupplierClick, colorScheme: 'warning-800' },
          ]}
        />
      )}

      <ReportData data={h.hireOrderData} signatureFlags={h.signatureFlags} signatureStates={h.signatureStates} />

      {h.amendmentData && (
        <>
          <div className="features screen hire order report amendment-divider">
            ===== AMENDED DOCUMENT FOLLOWS =====
          </div>
          <ReportData data={h.amendmentData} signatureFlags={h.signatureFlags} signatureStates={h.signatureStates} />
        </>
      )}

      <Modal
        isOpen={h.showActivationModal}
        onClose={h.handleCloseActivationModal}
        type="activation"
        title="Activate Signatures"
        message="Enter your 20-digit activation key to activate all signatures"
        showInput
        useCellInput
        cellCount={20}
        inputValue={h.activationKey}
        onInputChange={h.handleActivationKeyChange}
        inputError={h.activationError}
        deviceInfo={h.deviceInfo}
        buttonText={h.activationLoading ? 'Activating...' : 'Activate'}
        onButtonClick={h.handleActivation}
        preventClose={h.activationLoading}
      />

      <Modal
        isOpen={h.showTrustModal}
        onClose={h.handleTrustModalClose}
        type="success"
        title="Key has been Activated"
        message="Your key has been activated now. You can able to load and use all signatures."
        buttonText="Trust this browser"
        onButtonClick={h.confirmBrowserTrust}
        preventClose
      />

      <Modal
        isOpen={h.showNotTrustedModal}
        onClose={h.handleCloseNotTrustedModal}
        type="warning"
        title="Device Not Trusted"
        message="This device is activated but not yet trusted by the administrator. Please contact your system administrator to enable trust for this device."
        buttonText="Close"
        onButtonClick={h.handleCloseNotTrustedModal}
      />

      <Modal
        isOpen={h.showSignConfirmModal}
        onClose={h.handleCloseSignConfirmModal}
        type="warning"
        title="Confirm Signature"
        message="You are about to sign this Hire Order document. This action cannot be undone."
        buttonText="Confirm & Sign"
        onButtonClick={h.handleConfirmSign}
        secondaryButtonText="Cancel"
        onSecondaryClick={h.handleCloseSignConfirmModal}
      />

      <Modal
        isOpen={h.showUnauthorisedModal}
        onClose={h.handleCloseUnauthorisedModal}
        type="unauthorized"
        title="Not Authorised"
        message="Your account is not registered as an authorised signatory for hire order documents."
        unauthorizedReason="Your user ID does not match any of the four authorised signatories."
        buttonText="Close"
        onButtonClick={h.handleCloseUnauthorisedModal}
      />

      <Modal
        isOpen={h.isNotUploadedModalOpen}
        onClose={h.handleClearSignResult}
        type="warning"
        title="Hire Order Not Ready for Signing"
        message="This hire order has been created but not yet uploaded for approval. Please ask the creator to upload the document first before signing."
        buttonText="OK"
        onButtonClick={h.handleClearSignResult}
      />

      <Modal
        isOpen={h.isAlreadySignedModalOpen}
        onClose={h.handleClearSignResult}
        type="warning"
        title="Already Signed"
        message="This signature position has already been signed on this document."
        buttonText="OK"
        onButtonClick={h.handleClearSignResult}
      />

      <Modal
        isOpen={h.showOverrideModal}
        onClose={h.handleCloseOverrideModal}
        type="warning"
        title="Signatures Pending"
        message={h.overrideModalMessage}
        buttonText="Override & Sign"
        onButtonClick={h.handleOverrideSignClick}
        secondaryButtonText="Wait"
        onSecondaryClick={h.handleCloseOverrideModal}
      />

      <Modal
        isOpen={h.isSignSuccessModalOpen}
        onClose={h.handleClearSignResult}
        type="success"
        title="Document Signed"
        message="Your signature has been recorded successfully."
        buttonText="OK"
        onButtonClick={h.handleClearSignResult}
        autoClose
        autoCloseDelay={3000}
      />

      <Modal
        isOpen={h.showEmailModal}
        onClose={h.handleCloseEmailModal}
        type="form"
        title="Send to Supplier"
        message="Enter recipient email addresses. Add more than one if needed."
        buttonText={h.isSendingEmail ? 'Sending...' : 'Send'}
        onButtonClick={h.handleEmailModalSubmit}
        secondaryButtonText="Cancel"
        onSecondaryClick={h.handleCloseEmailModal}
        formFields={EMAIL_FORM_FIELDS}
        formValues={h.emailFormDisplayValues}
        onFormChange={h.handleEmailFormChange}
      />

      <Modal
        isOpen={h.showUploadSuccessModal}
        onClose={h.handleCloseUploadSuccessModal}
        type="success"
        title="Hire Order Uploaded"
        message="The hire order document has been uploaded successfully for approval."
        buttonText="OK"
        onButtonClick={h.handleCloseUploadSuccessModal}
        autoClose
        autoCloseDelay={3000}
      />

      <Modal
        isOpen={h.showLoadingModal}
        onClose={() => { }}
        type="progress"
        title="Processing..."
        message={h.loadingMessage}
        progress={100}
        preventClose
      />

      <Modal
        isOpen={h.isEmailSentModalOpen}
        onClose={h.handleClearSignResult}
        type="success"
        title="Hire Order Sent Successfully"
        message="Hire order sent successfully to supplier."
        buttonText="OK"
        onButtonClick={h.handleClearSignResult}
        autoClose
        autoCloseDelay={3000}
      />
    </div>
  );
}

export default HireOrderReport;