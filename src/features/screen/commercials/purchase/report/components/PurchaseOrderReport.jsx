import PaperViewport from '@/shared/components/widgets/paper/PaperViewport';
import QuotationPreview from '@/shared/components/viewer/Pdf/QuotationPreview/QuotationPreview';
import Modal from '@/shared/components/widgets/modal/Modal';
import Controls from '@/shared/components/widgets/controls/Controls';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import SigningModals from '@/features/core/messaging/signature/components/SigningModals';
import usePurchaseOrderReport from '../hooks/usePurchaseOrderReport';
import A2Paper, { A2PaginationEngine, groupBlocksBySection } from '@/shared/components/widgets/paper/A2Paper';
import { SHARED_BTN, PURCHASE_ORDER_SIGNATURE_SLOT_ID } from '../constants/purchase.order.report.constant';
import { isPdfRenderMode } from '@/features/core/sync/pdf/helper/document.pdf.helper';
import { formatCurrency, signatoryRole } from '../helper/purchase.order.report.helper';

import './PurchaseOrderReport.css';
import A2PaperSkeleton from '@/shared/components/widgets/paper/A2PaperSkeleton';

const EMPTY_SIGNATURE_SLOT = {
  isSigned: false,
  imageUrl: '',
  isLegacy: false,
  isContentIntact: null,
  canSign: false,
  canRequestDelegation: false,
  hasPendingDelegation: false,
};
const SIGN_ICON_SIZE = 72;
const SIGN_ICON_COLOR = '#7e2828';

const buildCellProps = (slot = EMPTY_SIGNATURE_SLOT) => ({
  isSigned: slot.isSigned,
  url: slot.imageUrl,
  isLegacy: slot.isLegacy,
  isContentIntact: slot.isContentIntact,
  canSign: slot.canSign,
  canRequestDelegation: slot.canRequestDelegation,
  hasPendingDelegation: slot.hasPendingDelegation,
});

const resolveMarkerText = (isSigned, isLegacy, isContentIntact, hasPendingDelegation) => {
  if (isContentIntact === false) return 'Modified after signing';
  if (isSigned && isLegacy) return 'Signed';
  if (hasPendingDelegation) return 'Waiting for approval';
  return '';
};

function SignatureCell({
  isSigned,
  url,
  alt,
  isLegacy = false,
  isContentIntact = null,
  canSign = false,
  canRequestDelegation = false,
  hasPendingDelegation = false,
  onSign,
  isSigning = false,
}) {
  const showImage = isSigned && url && isContentIntact !== false;

  return (
    <td className="purchase order report signature cell purchase order report border-left">
      {showImage ? (
        <div className="purchase order report signature image group">
          <img
            className="purchase order report signature image"
            src={url}
            alt={alt}
            crossOrigin="anonymous"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      ) : (canSign || canRequestDelegation) && onSign ? (
        <button
          type="button"
          className="purchase order report sign icon button no-print"
          onClick={onSign}
          disabled={isSigning}
          title="Sign here"
        >
          {renderComponentIcon('SignaturePenIcon', SIGN_ICON_SIZE, SIGN_ICON_COLOR)}
        </button>
      ) : (
        <span className="purchase order report missing signature marker">
          {resolveMarkerText(isSigned, isLegacy, isContentIntact, hasPendingDelegation)}
        </span>
      )}
    </td>
  );
}

function SignaturesTable({ data, signatureSlots, onSign, isSigning }) {
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
          <SignatureCell {...buildCellProps(signatureSlots[PURCHASE_ORDER_SIGNATURE_SLOT_ID.OPERATIONS_MANAGER])} alt="Manager Signature" isSigning={isSigning} onSign={onSign && (() => onSign(PURCHASE_ORDER_SIGNATURE_SLOT_ID.OPERATIONS_MANAGER))} />
          <SignatureCell {...buildCellProps(signatureSlots[PURCHASE_ORDER_SIGNATURE_SLOT_ID.PURCHASE_MANAGER])} alt="PM Signature" isSigning={isSigning} onSign={onSign && (() => onSign(PURCHASE_ORDER_SIGNATURE_SLOT_ID.PURCHASE_MANAGER))} />
          <SignatureCell {...buildCellProps(signatureSlots[PURCHASE_ORDER_SIGNATURE_SLOT_ID.ACCOUNTS])} alt="Accounts Signature" isSigning={isSigning} onSign={onSign && (() => onSign(PURCHASE_ORDER_SIGNATURE_SLOT_ID.ACCOUNTS))} />
          <SignatureCell {...buildCellProps(signatureSlots[PURCHASE_ORDER_SIGNATURE_SLOT_ID.AUTHORIZED_SIGNATORY])} alt="Authorized Signature" isSigning={isSigning} onSign={onSign && (() => onSign(PURCHASE_ORDER_SIGNATURE_SLOT_ID.AUTHORIZED_SIGNATORY))} />
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

function TermsAndSignaturesContent({ data, signatureSlots, onSign, isSigning }) {
  return (
    <>
      <table className="purchase order report terms table border-left border-right">
        <tbody>
          <tr>
            <td className="purchase order report terms note purchase order report border-right purchase order report border-left border-bottom border-top">
              <strong>NOTE:</strong> The PurchaseOrder copy should be submitted along with the invoice every month for the payment process.
            </td>
          </tr>
        </tbody>
      </table>

      <SignaturesTable data={data} signatureSlots={signatureSlots} onSign={onSign} isSigning={isSigning} />
    </>
  );
}

function ReportData({ data, signatureSlots, quotationUrl, quotationMime, onSign, isSigning }) {
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
    <tr key="total" className='purchase order report items total row border-bottom'>
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
        <table className="purchase order report terms table border-left border-right">
          <tbody><tr className="purchase order report terms row"><td className="purchase order report terms content terms-measure"><ul>{buildTermLi(term, absoluteIndex)}</ul></td></tr></tbody>
        </table>
      ),
    })),
    {
      key: 'closing',
      section: 'closing',
      content: <TermsAndSignaturesContent data={data} signatureSlots={signatureSlots} onSign={onSign} isSigning={isSigning} />,
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
        <table key="terms" className="purchase order report terms table border-left border-right">
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
                <div className="purchase order report info right block">
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
  const isPdfRender = isPdfRenderMode();
  const {
    refNo,
    isPdfReady,
    signing,
    canRequestFamilyAccess,
    requestFamilyAccess,
    componentRef,
    purchaseorderData,
    amendmentData,
    loading,
    error,
    quotationUrl,
    quotationMime,
    signatureSlots,
    isSigningDoc,
    isActivationAvailable,
    signResult,
    setSignResult,
    showEmailModal,
    emailFormValues,
    isSendingEmail,
    openActivationModal,
    showUploadSuccessModal,
    setShowUploadSuccessModal,
    showAttachmentModal,
    setShowAttachmentModal,
    showLoadingModal,
    loadingMessage,
    alertModal,
    setAlertModal,
    isSentForApproval,
    isEmailedToSupplier,
    fetchPurchaseOrderData,
    handleSignButtonClick,
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
          { ...SHARED_BTN, text: isPdfReady ? 'Download as PDF' : 'Preparing PDF...', onClick: handleDownloadPdf, colorScheme: 'success-800' },
          ...(isActivationAvailable
            ? [{ ...SHARED_BTN, text: 'Activate E-Signs', onClick: openActivationModal, colorScheme: 'error-800' }]
            : []),
          ...(canRequestFamilyAccess
            ? [{ ...SHARED_BTN, text: 'Request Family Access', onClick: requestFamilyAccess, colorScheme: 'info-800' , width: 'fit-content' }]
            : []),
          { ...SHARED_BTN, text: isSentForApproval ? 'Sent For Approval' : 'Send For Approval', onClick: sendToApprove, colorScheme: 'info-800', disabled: isSentForApproval },
          { ...SHARED_BTN, text: isEmailedToSupplier ? 'Emailed To Supplier' : 'Send to Supplier', onClick: handleSendToSupplierClick, colorScheme: 'warning-800' },
          { ...SHARED_BTN, text: 'Print', onClick: handlePrint, colorScheme: 'success-800' },
        ]}
      />}

      <ReportData
        data={purchaseorderData}
        signatureSlots={signatureSlots}
        onSign={handleSignButtonClick}
        isSigning={isSigningDoc}
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
            signatureSlots={signatureSlots}
          />
        </>
      )}

      <SigningModals flow={signing} documentLabel="Purchase Order" />

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
      <Modal
        isOpen={Boolean(alertModal)}
        onClose={() => setAlertModal(null)}
        type={alertModal?.type || 'warning'}
        title={alertModal?.title || ''}
        message={alertModal?.message || ''}
        unauthorizedReason={alertModal?.reason || ''}
        contactEmail={null}
        buttonText="OK"
        onButtonClick={() => setAlertModal(null)}
      />
    </div>
  );
}

export default PurchaseOrderReport;