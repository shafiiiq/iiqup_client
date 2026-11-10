import { Fragment } from 'react';
import A2Paper, { A2PaginationEngine, groupBlocksBySection } from '@/shared/components/widgets/paper/A2Paper';
import HireOrderDownloadPicker from './fragments/HireOrderDownloadPicker';
import A2PaperSkeleton from '@/shared/components/widgets/paper/A2PaperSkeleton';
import Modal from '@/shared/components/widgets/modal/Modal';
import Controls from '@/shared/components/widgets/controls/Controls';

import SigningModals from '@/features/core/messaging/signature/components/SigningModals';
import SignatureSlotContent from '@/features/core/messaging/signature/components/SignatureSlotContent';
import useHireOrderReport from '../hooks/useHireOrderReport';
import { SHARED_BTN, EMAIL_FORM_FIELDS, HIRE_ORDER_SIGNATURE_SLOT_ID } from '../constants/hire.order.report.constant';
import { formatCurrency, signatoryRole, getEffectiveColumns, splitHeaderLabel } from '../helper/hire.order.report.helper';
import './HireOrderReport.css';

function SignatureCell({ slot, alt, onSign, isSigning }) {
  return (
    <td className="features screen hire order report signature-cell features screen hire order report border-left">
      <SignatureSlotContent slot={slot} alt={alt} onSign={onSign} isSigning={isSigning} />
    </td>
  );
}

function SignaturesTable({ data, signatureSlots, onSign, isSigning }) {

  return (
    <table className="features screen hire order report signatures-table">
      <tbody>
        <tr>
          <td colSpan="4" className="features screen hire order report signatures-company-name features screen hire order report border-right features screen hire order report border-left">
            AL ANSARI TRANSPORT &amp; ENTERPRISES W.L.L
          </td>
          <td className="features screen hire order report service-provider features screen hire order report border-right">Subcontractor OR<br />Service Provider</td>
        </tr>

        <tr>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-left features screen hire order report border-top features screen hire order report text-center">Operations Manager</td>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-top features screen hire order report text-center">Purchase Manager</td>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-top features screen hire order report text-center">Accounts Dept:</td>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-top features screen hire order report text-center">
            Authorized Signatory<br />{signatoryRole(data.signatures.authorizedSignatoryTitle)}
          </td>
          <td className="features screen hire order report signatures-date-label features screen hire order report border-top features screen hire order report border-right features screen hire order report text-center">(Date &amp; Sign with Stamp)</td>
        </tr>

        <tr className="features screen hire order report signatures-image-row">
          <SignatureCell slot={signatureSlots[HIRE_ORDER_SIGNATURE_SLOT_ID.OPERATIONS_MANAGER]} alt="Manager Signature" onSign={onSign} isSigning={isSigning} />
          <SignatureCell slot={signatureSlots[HIRE_ORDER_SIGNATURE_SLOT_ID.PURCHASE_MANAGER]} alt="PM Signature" onSign={onSign} isSigning={isSigning} />
          <SignatureCell slot={signatureSlots[HIRE_ORDER_SIGNATURE_SLOT_ID.ACCOUNTS]} alt="Accounts Signature" onSign={onSign} isSigning={isSigning} />
          <SignatureCell slot={signatureSlots[HIRE_ORDER_SIGNATURE_SLOT_ID.AUTHORIZED_SIGNATORY]} alt="Authorized Signature" onSign={onSign} isSigning={isSigning} />
          <td className="features screen hire order report border-right features screen hire order report border-left" />
        </tr>

        <tr>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-left features screen hire order report border-top features screen hire order report text-center">{data.signatures.operationsManager}</td>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-top features screen hire order report text-center">{data.signatures.purchasingManager}</td>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-top features screen hire order report text-center">{data.signatures.accountsDept}</td>
          <td className="features screen hire order report role-label features screen hire order report border-right features screen hire order report border-bottom features screen hire order report border-top features screen hire order report text-center">{data.signatures.authorizedSignatory}</td>
          <td className="features screen hire order report border-right features screen hire order report border-bottom" />
        </tr>
      </tbody>
    </table>
  );
}

function ClosingSection({ data, signatureSlots, onSign, isSigning }) {
  return (
    <>
      <table className="features screen hire order report terms-table">
        <tbody>
          <tr>
            <td className="features screen hire order report terms-note features screen hire order report border-right features screen hire order report border-left features screen hire order report border-bottom">
              <strong>NOTE:</strong> The hire order copy should be submitted along with the invoice every month for the payment process.
            </td>
          </tr>
        </tbody>
      </table>

      <SignaturesTable data={data} signatureSlots={signatureSlots} onSign={onSign} isSigning={isSigning} />
    </>
  );
}

function ReportData({ data, signatureSlots, onSign, isSigning }) {
  const columns = getEffectiveColumns(data);
  const total = data.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

  const buildItemRow = (item, absoluteIndex) => (
    <tr key={item._id || item.id || absoluteIndex}>
      <td>{absoluteIndex + 1}</td>
      {columns.map((col) => (
        <td key={col.id} className={col.id === 'description' ? 'features screen hire order report items-description-data' : ''}>
          {(col.id === 'unitPrice' || col.type === 'calculated') ? formatCurrency(item[col.id]) : item[col.id]}
        </td>
      ))}
    </tr>
  );

  const buildTotalRow = () => (
    <tr key="total">
      <td colSpan={columns.length} className="features screen hire order report items-total-label">
        {data.totalDiscountAmount != null ? 'Total Amount After Discount (QR)' : 'Total Amount (QR)'}
      </td>
      <td>{formatCurrency(data.totalDiscountAmount ?? data.totalAmount ?? total)}</td>
    </tr>
  );

  const buildTermLi = (term, absoluteIndex) => <li key={absoluteIndex}>{term}</li>;

  const blocks = [
    ...data.items.map((item, absoluteIndex) => ({
      key: `item-${item._id || item.id || absoluteIndex}`,
      section: 'item',
      row: buildItemRow(item, absoluteIndex),
      content: <table className="features screen hire order report items-table"><tbody>{buildItemRow(item, absoluteIndex)}</tbody></table>,
    })),
    ...(data.showTotalRow !== false ? [{
      key: 'total', section: 'item', row: buildTotalRow(),
      content: <table className="features screen hire order report items-table"><tbody>{buildTotalRow()}</tbody></table>,
    }] : []),
    ...data.termsAndConditions.map((term, absoluteIndex) => ({
      key: `term-${absoluteIndex}`,
      section: 'term',
      li: buildTermLi(term, absoluteIndex),
      content: (
        <table className="features screen hire order report terms-table">
          <tbody><tr className="features screen hire order report terms-row border-left border-right border-bottom">
            <td className="features screen hire order report terms-content term-measure">
              <ul>{buildTermLi(term, absoluteIndex)}
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
      content: <ClosingSection data={data} signatureSlots={signatureSlots} onSign={onSign} isSigning={isSigning} />,
    },
  ];

  const renderGroup = (group) => {
    if (group.section === 'item') {
      return (
        <table key="items" className="features screen hire order report items-table">
          <thead><tr><th>SN</th>{columns.map((col) => (
            <th key={col.id}>
              {splitHeaderLabel(col.label).map((line, i, arr) => (
                <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
              ))}
            </th>
          ))}</tr></thead>
          <tbody>{group.blocks.map((b) => b.row)}</tbody>
        </table>
      );
    }
    if (group.section === 'term') {
      return (
        <table key="terms" className="features screen hire order report terms-table">
          <tbody><tr className="features screen hire order report terms-row border-left border-right border-bottom">
            <td className="features screen hire order report terms-content">
              <ul>{
                group.blocks.map((b) => b.li)}
              </ul>
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
        <div className="features screen hire order report amendment-banner">[AMENDMENT {data.amendmentNumber}]</div>
      )}
      <div className="features screen hire order report divider-header" />
      <div className="features screen hire order report title">PURCHASE ORDER/HIRE ORDER</div>

      <table className="features screen hire order report info-table">
        <tbody>
          <tr>
            <td className="features screen hire order report info-column-left">
              <div className="features screen hire order report info-line">TO : M/S {data.vendor}</div>
              <div className="features screen hire order report info-line">ATTN : M/S {data.attention}</div>
              <div className="features screen hire order report info-line">DESIGNATION : {data.designation}</div>
              <div className="features screen hire order report info-line">QUOTE REF NO : {data.quoteNo}</div>
            </td>
            <td className="features screen hire order report info-column-right">
              <div className="features screen hire order report info-right-block">
                <div className="features screen hire order report info-line">DATE : {data.date}</div>
                <div className="features screen hire order report info-line">
                  {data.isAmendment && data.amendmentNumber > 1
                    ? `REF NO : REV ${data.amendmentNumber - 1} (${data.hireOrderRef})`
                    : `REF NO : ${data.hireOrderRef}`}
                </div>
                {data.isAmendment && data.amendmentNumber > 0 && (
                  <div className="features screen hire order report info-line">
                    AMENDMENT REF NO : REV {data.amendmentNumber} ({data.hireOrderRef})
                  </div>
                )}
                {data.customFields?.map((field, idx) => (
                  <div className="features screen hire order report info-line" key={field.id || idx}>
                    {(field.label || 'FIELD').toUpperCase()} : {field.value}
                  </div>
                ))}
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <div className="features screen hire order report divider-details" />
      <div className="features screen hire order report request-note">{data.requestText}</div>
    </>
  );

  return (
    <A2PaginationEngine blocks={blocks} firstPageHeader={headerNode}>
      {(pages) => pages.map((pageBlocks, pageIndex) => (
        <A2Paper key={pageIndex} className="features screen hire order report document-sheet">
          {pageIndex === 0 ? headerNode : <div className="features screen hire order report divider-header" />}
          {groupBlocksBySection(pageBlocks).map((group, i) => <div key={i}>{renderGroup(group)}</div>)}
        </A2Paper>
      ))}
    </A2PaginationEngine>
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
            { ...SHARED_BTN, text: h.isPdfReady ? 'Download as PDF' : 'Preparing PDF...', onClick: h.handleDownloadClick, colorScheme: 'success-800' },
            ...(h.isActivationAvailable
              ? [{ ...SHARED_BTN, text: 'Activate E-Signs', onClick: h.openActivationModal, colorScheme: 'error-800' }]
              : []),
            ...(h.canRequestFamilyAccess
              ? [{ ...SHARED_BTN, text: 'Request Family Access', onClick: h.requestFamilyAccess, colorScheme: 'info-800', width: 'fit-content' }]
              : []),
            { ...SHARED_BTN, text: h.isSentForApproval ? 'Sent For Approval' : 'Send For Approval', onClick: h.sendToApprove, colorScheme: 'info-800', disabled: h.isSentForApproval },
            { ...SHARED_BTN, text: h.isEmailedToSupplier ? 'Emailed To Supplier' : 'Send to Supplier', onClick: h.handleSendToSupplierClick, colorScheme: 'warning-800' },
          ]}
        />
      )}

      {h.partsDocuments ? (
        h.partsDocuments.map((reportDocument, index) => (
          <Fragment key={reportDocument.key}>
            {index > 0 && <div className="features screen hire order report amendment-divider">===== AMENDED DOCUMENT FOLLOWS =====</div>}
            <ReportData data={reportDocument.data} signatureSlots={h.signatureSlots} />
          </Fragment>
        ))
      ) : (
        <>
          <ReportData data={h.hireOrderData} signatureSlots={h.signatureSlots} onSign={h.handleSignButtonClick} isSigning={h.isSigningDoc} />

          {h.amendmentData && (
            <>
              <div className="features screen hire order report amendment-divider">===== AMENDED DOCUMENT FOLLOWS =====</div>
              <ReportData data={h.amendmentData} signatureSlots={h.signatureSlots} />
            </>
          )}
        </>
      )}

      {h.showDownloadPicker && (
        <HireOrderDownloadPicker
          amendmentCount={h.amendmentCount}
          onConfirm={h.handleDownloadPdf}
          onClose={() => h.setShowDownloadPicker(false)}
        />
      )}

      <SigningModals flow={h.signing} documentLabel="Hire Order" />

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