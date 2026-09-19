import PaperViewport from '@/shared/components/widgets/paper/PaperViewport';
import QuotationPreview from '@/shared/components/viewer/Pdf/QuotationPreview/QuotationPreview';
import Modal from '@/shared/components/widgets/modal/Modal';
import Controls from '@/shared/components/widgets/controls/Controls';

import usePurchaseOrderReport from '../hooks/usePurchaseOrderReport';
import A2Paper, { A2PaginationEngine, groupBlocksBySection } from '@/shared/components/widgets/paper/A2Paper';
import { SHARED_BTN } from '../constants/purchase.order.report.constant';
import { formatCurrency, signatoryRole } from '../helper/purchase.order.report.helper';

import './PurchaseOrderReport.css';
import A2PaperSkeleton from '@/shared/components/widgets/paper/A2PaperSkeleton';

function SignatureCell({ isSigned, url, alt, imageClassName = 'purchase order report signature image', withSeal = false, sealUrl = '' }) {
  return (
    <td className="purchase order report signature cell purchase order report border-left">
      {isSigned && url ? (
        <div className="purchase order report signature image group">
          <img
            className={imageClassName}
            src={url}
            alt={alt}
            crossOrigin="anonymous"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          {withSeal && sealUrl && (
            <img
              className="purchase order report company seal"
              src={sealUrl}
              alt="Company Seal"
              crossOrigin="anonymous"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}
        </div>
      ) : (
        <span className="purchase order report missing signature marker" />
      )}
    </td>
  );
}

function SignaturesTable({ data, signatureFlags, signatureStates }) {
  const { pmSigned, accountsSigned, managerSigned, ceoSigned } = signatureFlags;
  const { pm, accounts, manager, authorized, seal } = signatureStates;

  return (
    <table className="purchase order report signatures table">
      <tbody>
        <tr className="purchase order report signatures header row">
          <td colSpan="4" className="purchase order report signatures company name purchase order report border-right border-left">
            AL ANSARI TRANSPORT &amp; ENTERPRISES W.L.L
          </td>
          <td className="purchase order report service-provider border-right">Subcontractor OR<br />Service Provider</td>
        </tr>

        <tr>
          <td className="purchase order report role label purchase order report border-right purchase order report border-bottom border-left purchase order report border-top purchase order report text-center">
            Operations Manager
          </td>
          <td className="purchase order report role label purchase order report border-right purchase order report border-bottom purchase order report border-top purchase order report text-center">
            Purchase Manager
          </td>
          <td className="purchase order report role label purchase order report border-right purchase order report border-bottom purchase order report border-top purchase order report text-center">
            Accounts Dept:
          </td>
          <td className="purchase order report role label purchase order report border-right purchase order report border-bottom purchase order report border-top purchase order report text-center">
            Authorized Signatory<br />{signatoryRole(data.signatures.authorizedSignatory)}
          </td>
          <td className="purchase order report signatures date label purchase order report border-top border-right text-center">(Date &amp; Sign with Stamp)</td>
        </tr>

        <tr className="purchase order report signatures image row">
          <SignatureCell isSigned={managerSigned} url={manager.url} alt="Manager Signature" />
          <SignatureCell isSigned={pmSigned} url={pm.url} alt="PM Signature" />
          <SignatureCell isSigned={accountsSigned} url={accounts.url} alt="Accounts Signature" />
          <SignatureCell isSigned={ceoSigned} url={authorized.url} alt="Authorized Signature" withSeal sealUrl={seal.url} />
          <td className="purchase order report border-right border-left " />
        </tr>

        <tr>
          <td className="purchase order report role label purchase order report border-right border-bottom border-left purchase order report border-top purchase order report text-center">
            {data.signatures.operationsManager}
          </td>
          <td className="purchase order report role label purchase order report border-right border-bottom purchase order report border-top purchase order report text-center">
            {data.signatures.purchasingManager}
          </td>
          <td className="purchase order report role label purchase order report border-right border-bottom purchase order report border-top purchase order report text-center">
            {data.signatures.accountsDept}
          </td>
          <td className="purchase order report role label purchase order report border-right border-bottom purchase order report border-top purchase order report text-center">
            {data.signatures.authorizedSignatory}
          </td>
          <td className="purchase order report border-right border-bottom" />
        </tr>
      </tbody>
    </table>
  );
}

function TermsAndSignaturesContent({ data, signatureFlags, signatureStates }) {
  return (
    <>
      <table className="purchase order report terms table">
        <tbody>
          <tr>
            <td className="purchase order report terms note purchase order report border-right purchase order report border-left border-bottom">
              <strong>NOTE:</strong> The PurchaseOrder copy should be submitted along with the invoice every month for the payment process.
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
    <A2Paper className="purchase order report document sheet">
      <div className="purchase order report divider header" />
      <TermsAndSignaturesContent data={data} signatureFlags={signatureFlags} signatureStates={signatureStates} />
    </A2Paper>
  );
}

function ReportData({ data, signatureFlags, signatureStates, quotationUrl, quotationMime }) {
  const total = data.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  const buildItemRow = (item, absoluteIndex) => (
    <tr key={item._id || item.id || absoluteIndex}>
      <td>{absoluteIndex + 1}</td>
      <td className='purchase order report items description data'>{item.description}</td>
      <td>{item.quantity}</td>
      <td>{formatCurrency(item.unitPrice)}</td>
      <td>{formatCurrency(item.totalPrice)}</td>
    </tr>
  );

  const buildTotalRow = () => (
    <tr key="total">
      <td colSpan="4" className="purchase order report items total label">
        {data.totalDiscountAmount ? 'Total Amount After Discount (QR)' : 'Total Amount (QR)'}
      </td>
      <td>{formatCurrency(data.totalDiscountAmount || data.totalAmount || total)}</td>
    </tr>
  );

  const buildTermLi = (term, absoluteIndex) => (
    <li key={absoluteIndex} className={absoluteIndex === 0 ? 'purchase order report terms-first-line' : ''}>{term}</li>
  );

  const blocks = [
    ...data.items.map((item, absoluteIndex) => ({
      key: `item-${item._id || item.id || absoluteIndex}`,
      section: 'item',
      row: buildItemRow(item, absoluteIndex),
      content: <table className="purchase order report items table"><tbody>{buildItemRow(item, absoluteIndex)}</tbody></table>,
    })),
    {
      key: 'total', section: 'item', row: buildTotalRow(),
      content: <table className="purchase order report items table"><tbody>{buildTotalRow()}</tbody></table>,
    },
    ...data.termsAndConditions.map((term, absoluteIndex) => ({
      key: `term-${absoluteIndex}`,
      section: 'term',
      li: buildTermLi(term, absoluteIndex),
      content: (
        <table className="purchase order report terms table">
          <tbody><tr className="purchase order report terms row"><td className="purchase order report terms content terms-measure"><ul>{buildTermLi(term, absoluteIndex)}</ul></td></tr></tbody>
        </table>
      ),
    })),
    {
      key: 'closing',
      section: 'closing',
      content: <TermsAndSignaturesContent data={data} signatureFlags={signatureFlags} signatureStates={signatureStates} closingOnly />,
    },
  ];

  const renderGroup = (group) => {
    if (group.section === 'item') {
      return (
        <table key="items" className="purchase order report items table">
          <thead><tr><th>SN</th><th>Item Description</th><th>Qty</th><th>Unit Price(QR)</th><th>Total Price(QR)</th></tr></thead>
          <tbody>{group.blocks.map((b) => b.row)}</tbody>
        </table>
      );
    }
    if (group.section === 'term') {
      return (
        <table key="terms" className="purchase order report terms table">
          <tbody><tr className="purchase order report terms row"><td className="purchase order report terms content"><ul>{group.blocks.map((b) => b.li)}</ul></td></tr></tbody>
        </table>
      );
    }
    return group.blocks[0].content;
  };

  const headerNode = (
    <>
      {data.isAmendment && data.amendmentDate && (
        <div style={{ textAlign: 'center', padding: '8px', margin: '10px 0', fontWeight: 'bold' }}>[AMENDMENT 1]</div>
      )}
      <div className="purchase order report divider header" />
      <div className="purchase order report title">PURCHASE/HIRE ORDER</div>

      <div className="purchase order report info panel">
        <table className="purchase order report info table">
          <tbody>
            <tr>
              <td className="purchase order report info column left">
                <div className="purchase order report info line">TO : {data.vendor}</div>
                <div className="purchase order report info line">ATTN : {data.attention}</div>
                <div className="purchase order report info line">DESIGNATION : {data.designation}</div>
                <div className="purchase order report info line">Ref No : {data.quoteNo}</div>
              </td>
              <td className="purchase order report info column right">
                <div className="purchase order report info line">DATE : {data.date}</div>
                <div className="purchase order report info line">REF NO : {data.purchaseorderRef}</div>
                {data.jobCode && <div className="purchase order report info line">JOB/COMPLAINT NO : {data.jobCode}</div>}
                <div className="purchase order report info line">
                  <span>EQUIPMENT:</span>
                  <ul>{data.equipments.map((equipment, equipmentIndex) => <li key={equipmentIndex}>{equipment}</li>)}</ul>
                </div>
                <div className="purchase order report info line">
                  {data.workingHrs ? `WORKING HRS : ${data.workingHrs}` : data.runningKm ? `RUNNING KM : ${data.runningKm}` : ''}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="purchase order report divider details" />
      <div className="purchase order report request note">{data.requestText}</div>
    </>
  );

  return (
    <A2PaginationEngine blocks={blocks} firstPageHeader={headerNode}>
      {(pages) => pages.map((pageBlocks, pageIndex) => (
        pageIndex === 0 ? (
          <PaperViewport
            key={pageIndex}
            left={quotationUrl && (
              <div className="purchase order report quotation preview panel no-print">
                <QuotationPreview url={quotationUrl} mimeType={quotationMime} />
              </div>
            )}
            right={
              <A2Paper className="purchase order report document sheet">
                {headerNode}
                {groupBlocksBySection(pageBlocks).map((group, i) => <div key={i}>{renderGroup(group)}</div>)}
              </A2Paper>
            }
          />
        ) : (
          <A2Paper key={pageIndex} className="purchase order report document sheet">
            <div className="purchase order report divider header" />
            {groupBlocksBySection(pageBlocks).map((group, i) => <div key={i}>{renderGroup(group)}</div>)}
          </A2Paper>
        )
      ))}
    </A2PaginationEngine>
  );
}

function PurchaseOrderReport() {
  const isPdfRender = new URLSearchParams(window.location.search).get('pdf') === '1';
  const {
    refNo,
    componentRef,
    deviceInfo,
    purchaseorderData,
    amendmentData,
    loading,
    error,
    quotationUrl,
    quotationMime,
    signatureFlags,
    signatureStates,
    isSigningDoc,
    showSignConfirmModal,
    setShowSignConfirmModal,
    showUnauthorisedModal,
    setShowUnauthorisedModal,
    signResult,
    setSignResult,
    showEmailModal,
    emailFormValues,
    isSendingEmail,
    showOverrideModal,
    setShowOverrideModal,
    unsignedAboveRoles,
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
    showUploadSuccessModal,
    setShowUploadSuccessModal,
    showAttachmentModal,
    setShowAttachmentModal,
    showLoadingModal,
    loadingMessage,
    fetchPurchaseOrderData,
    handleSignButtonClick,
    handleConfirmSign,
    handleLoadAllSignatures,
    handleActivation,
    confirmBrowserTrust,
    handleDownloadPdf,
    handlePrint,
    sendToApprove,
    handleEditPurchaseOrder,
    handleSendEmail,
    handleEmailFormChange,
    handleEmailButtonClick,
    handleSendToSupplierClick,
    closeEmailModal,
    skipAttachmentModal,
  } = usePurchaseOrderReport();

  if (loading) {
    return (
      <div className="purchase order report page">
        <div className="purchase order report loading state">
          <A2PaperSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="purchase order report page">
        <div className="purchase order report error state">
          <p className="purchase order report error message">{error}</p>
          <p>Reference: {refNo ? decodeURIComponent(refNo) : 'No reference provided'}</p>
          <button onClick={fetchPurchaseOrderData} className="purchase order report retry button">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="purchase order report page" ref={componentRef}>

      {!isPdfRender && <Controls
        justify="space-between"
        width="297mm"
        columns={4}
        rows={2}
        margin="0 auto 20px"
        buttons={[
          { ...SHARED_BTN, text: 'Edit', onClick: handleEditPurchaseOrder, colorScheme: 'info-800' },
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
      />}

      <ReportData
        data={purchaseorderData}
        signatureFlags={signatureFlags}
        signatureStates={signatureStates}
        quotationUrl={quotationUrl}
        quotationMime={quotationMime}
      />

      {amendmentData && (
        <>
          <div className="purchase order report amendment divider">
            ===== AMENDED DOCUMENT FOLLOWS =====
          </div>
          <ReportData
            data={amendmentData}
            signatureFlags={signatureFlags}
            signatureStates={signatureStates}
          />
        </>
      )}

      <Modal
        isOpen={showActivationModal}
        onClose={() => setShowActivationModal(false)}
        type="activation"
        title="Activate Signatures"
        message="Enter your 20-digit activation key to activate all signatures"
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
        message="Your key has been activated now. You can able to load and use all signatures."
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
        message="You are about to sign this PurchaseOrder document. This action cannot be undone."
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
        message="Your account is not registered as an authorised signatory for PurchaseOrder documents."
        unauthorizedReason="Your user ID does not match any of the four authorised signatories."
        buttonText="Close"
        onButtonClick={() => setShowUnauthorisedModal(false)}
      />

      <Modal
        isOpen={signResult === 'not_uploaded'}
        onClose={() => setSignResult(null)}
        type="warning"
        title="PurchaseOrder Not Ready for Signing"
        message="This PurchaseOrder has been created but not yet uploaded for approval. Please ask the creator to upload the document first before signing."
        buttonText="OK"
        onButtonClick={() => setSignResult(null)}
      />

      <Modal
        isOpen={signResult === 'already_signed'}
        onClose={() => setSignResult(null)}
        type="warning"
        title="Already Signed"
        message="This signature position has already been signed on this document."
        buttonText="OK"
        onButtonClick={() => setSignResult(null)}
      />

      <Modal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        type="warning"
        title="Signatures Pending"
        message={`The following ${unsignedAboveRoles.length > 1 ? 'people have' : 'person has'} not yet signed this document:\n\n${unsignedAboveRoles.join(', ')}\n\nYou can wait for them to sign first, or override and sign now. If you override, they will be notified to sign.`}
        buttonText="Override & Sign"
        onButtonClick={() => handleConfirmSign(true)}
        secondaryButtonText="Wait"
        onSecondaryClick={() => setShowOverrideModal(false)}
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
        onButtonClick={handleEmailButtonClick}
        secondaryButtonText="Cancel"
        onSecondaryClick={closeEmailModal}
        formFields={[{ name: 'emails', label: 'Recipient Emails (comma-separated)', type: 'text', placeholder: 'vendor@example.com, other@example.com', required: true }]}
        formValues={{ emails: emailFormValues.emails.join(', ') }}
        onFormChange={handleEmailFormChange}
      />

      <Modal
        isOpen={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        type="fileupload"
        title="Attach Documents"
        message="Add any additional documents to send with the PurchaseOrder, or skip to send now."
        buttonText={isSendingEmail ? 'Sending...' : 'Send'}
        onButtonClick={(files) => handleSendEmail(files || [])}
        secondaryButtonText="Skip"
        onSecondaryClick={skipAttachmentModal}
      />

      <Modal
        isOpen={showUploadSuccessModal}
        onClose={() => setShowUploadSuccessModal(false)}
        type="success"
        title="PurchaseOrder Uploaded"
        message="The PurchaseOrder document has been uploaded successfully for approval."
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
        title="PurchaseOrder Sent Successfully"
        message="PurchaseOrder sent successfully to supplier."
        buttonText="OK"
        onButtonClick={() => setSignResult(null)}
        autoClose
        autoCloseDelay={3000}
      />
    </div>
  );
}

export default PurchaseOrderReport;