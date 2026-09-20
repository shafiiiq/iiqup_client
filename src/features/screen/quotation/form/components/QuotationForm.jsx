import { useRef } from 'react';

import Controls from '@/shared/components/widgets/controls/Controls';
import A2Paper, { A2PaginationEngine, groupBlocksBySection } from '@/shared/components/widgets/paper/A2Paper';

import { useQuotationForm } from '../hooks/useQuotationForm';
import { formatCurrency, isTermHeading, getTermText, buildTermNumbers } from '../helper/quotation.form.helper';
import { SHARED_BTN, CONFIRMATION_HEADING } from '../constants/quotation.form.constant';
import './QuotationForm.css';

function ClosingSection({
  noticeText,
  priceStatementText,
  contactText,
  handleNoticeTextChange,
  handlePriceStatementTextChange,
  handleContactTextChange,
  vendor,
  getSignatoryName,
  toggleCeoMode,
  ceoMode,
}) {
  return (
    <>
      <div className="features screen quotation form terms-extra">
        <textarea
          className="features screen quotation form notice-text-input"
          value={noticeText}
          onChange={handleNoticeTextChange}
          rows={2}
        />
        <textarea
          className="features screen quotation form price-statement-input"
          value={priceStatementText}
          onChange={handlePriceStatementTextChange}
          rows={2}
        />
        <textarea
          className="features screen quotation form contact-text-input"
          value={contactText}
          onChange={handleContactTextChange}
          rows={2}
        />
      </div>

      <div className="features screen quotation form closing-row">
        <div className="features screen quotation form closing-left">
          <div className="features screen quotation form thank-you-text">Thank You,</div>
          <div className="features screen quotation form signature-space" />
          <div className="features screen quotation form signatory-name">{getSignatoryName()}</div>
          <span className="features screen quotation form toggle-field ceo-toggle" onClick={toggleCeoMode}>({ceoMode})</span>
        </div>

        <div className="features screen quotation form closing-right-box">
          <div className="features screen quotation form confirmation-heading">{CONFIRMATION_HEADING}</div>
          <div className="features screen quotation form confirmation-text">
            Customer {vendor || '__________'} should fully understand and comply with all the above terms and conditions. Any lapse/negligence, supplier AL ANSARI TRANSPORT &amp; ENTERPRISES WLL has full right to withdraw the equipment without any notice.
          </div>
          <div className="features screen quotation form confirmation-field">Authorized Person Name &amp; Signature:</div>
          <div className="features screen quotation form confirmation-field-row">
            <span>Company Stamp:</span>
            <span>Date:</span>
          </div>
        </div>
      </div>
    </>
  );
}

function QuotationForm({ edit, amendment, amendmentUpdate }) {
  const firstPageRef = useRef();
  const quotationForm = useQuotationForm({ edit, amendment, amendmentUpdate });

  const {
    quotationData,
    columns,
    paymentTerms,
    customFields,
    subtotal,
    finalTotal,
    showTotalRow,
    manualTotal,
    removeTotalRow,
    restoreTotalRow,
    handleManualTotalChange,
    handleManualTotalBlur,
    resetManualTotal,
    showDiscountInTotal,
    showDiscount,
    showAddButton,
    isLoading,
    updateColumnLabel,
    removeColumn,
    addColumn,
    addTotalColumn,
    addItemRow,
    removeItem,
    handleItemChange,
    removeItemImage,
    handleDescriptionPaste,
    handleDescriptionDrop,
    handleDescriptionDragOver,
    handleRowMouseEnter,
    handleRowMouseLeave,
    handleDiscountPopup,
    handleDiscountButtonMouseEnter,
    handleDiscountButtonMouseLeave,
    toggleDiscountInTotal,
    updatePaymentTerm,
    removePaymentTerm,
    addPaymentTerm,
    addPaymentTermHeading,
    updateCustomFieldLabel,
    updateCustomFieldValue,
    removeCustomField,
    addCustomField,
  } = quotationForm;

  const termNumbers = buildTermNumbers(paymentTerms);

  const buildItemRow = (item, absoluteIndex) => (
    <tr key={item.id}>
      <td
        className="features screen quotation form sn-cell"
        onMouseEnter={() => handleRowMouseEnter(absoluteIndex)}
        onMouseLeave={handleRowMouseLeave}
      >
        {item.id}
        {showAddButton === absoluteIndex && (
          <Controls
            justify="end"
            wrap={false}
            gap="4px"
            className="features screen quotation form row-controls"
            items={[
              {
                ...SHARED_BTN,
                text: '+',
                onClick: addItemRow,
                colorScheme: 'success-700',
                width: '20px',
                height: '20px',
                title: 'Add Row',
                font: 'sm',
                padding: '0',
                type: 'submit',
                cursor: 'allowed',
              },
              ...(quotationData.items.length > 1 ? [{
                ...SHARED_BTN,
                text: '-',
                onClick: () => removeItem(absoluteIndex),
                colorScheme: 'error-700',
                width: '20px',
                height: '20px',
                title: 'Remove Row',
                font: 'sm',
                padding: '0',
                type: 'submit',
                cursor: 'allowed',
              }] : []),
            ]}
          />
        )}
      </td>

      {columns.map((col) => (
        <td key={col.id}>
          {col.id === 'description' ? (
            <div
              className="features screen quotation form description-cell"
              onPaste={(e) => handleDescriptionPaste(e, absoluteIndex)}
              onDrop={(e) => handleDescriptionDrop(e, absoluteIndex)}
              onDragOver={handleDescriptionDragOver}
            >
              <input
                type="text"
                className="features screen quotation form table-input description-input"
                value={item[col.id] ?? ''}
                onChange={(e) => handleItemChange(absoluteIndex, col.id, e.target.value)}
                placeholder={`Enter ${col.label.toLowerCase()}, or paste/drop an image here`}
              />
              {item.image && (
                <div className="features screen quotation form description-image-wrap">
                  <img
                    src={item.image}
                    alt="Item attachment"
                    className="features screen quotation form description-image"
                  />
                  <button
                    type="button"
                    className="features screen quotation form remove-description-image-btn"
                    onClick={() => removeItemImage(absoluteIndex)}
                    title="Remove image"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          ) : col.type === 'calculated' ? (
            <span className="features screen quotation form calculated-total">{formatCurrency(item[col.id])}</span>
          ) : (
            <input
              type={col.type === 'number' ? 'number' : 'text'}
              className={`features screen quotation form table-input ${col.type === 'number' ? 'features screen quotation form number-input' : 'features screen quotation form description-input'}`}
              value={item[col.id] ?? ''}
              onChange={(e) => handleItemChange(absoluteIndex, col.id, e.target.value)}
              step={col.type === 'number' ? '0.01' : undefined}
              placeholder={col.type === 'text' ? `Enter ${col.label.toLowerCase()}` : undefined}
            />
          )}
        </td>
      ))}
    </tr>
  );

  const buildDiscountRow = () => (
    <tr key="discount">
      <td colSpan={columns.length} className="features screen quotation form total-label">Discount (QR)</td>
      <td className="features screen quotation form calculated-total discount-amount">-{formatCurrency(quotationData.discount)}</td>
    </tr>
  );

  const buildTotalRow = () => (
    <tr key="total">
      <td colSpan={columns.length} className="features screen quotation form total-label">
        <span
          className="features screen quotation form toggle-field"
          onClick={toggleDiscountInTotal}
          title="Click to toggle between with/without discount"
        >
          {showDiscountInTotal ? 'Total Amount After Discount (QR)' : 'Total Amount (QR)'}
        </span>
        {showDiscountInTotal && (
          <div className="features screen quotation form discount-controls">
            <Controls
              justify="start"
              wrap={false}
              items={[{
                text: quotationData.discount > 0 ? 'Edit Discount' : 'Add Discount',
                onClick: handleDiscountPopup,
                onMouseEnter: handleDiscountButtonMouseEnter,
                onMouseLeave: handleDiscountButtonMouseLeave,
                colorScheme: isLoading ? 'blue-900' : 'blue-800',
                width: '120px',
                height: '20px',
                font: 'sm',
                type: isLoading ? 'disabled' : 'submit',
                cursor: 'allowed',
                ...SHARED_BTN,
              }]}
            />
            {showDiscount && (
              <div className="features screen quotation form discount-info">
                Subtotal: {subtotal.toFixed(2)} QR<br />
                Discount: {quotationData.discount.toFixed(2)} QR
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          className="features screen quotation form remove-term-btn"
          onClick={removeTotalRow}
          title="Remove total row"
        >
          ×
        </button>
      </td>
      <td className="features screen quotation form calculated-total final-total">
        <div className="features screen quotation form final-total-wrap">
          <input
            type="number"
            className="features screen quotation form table-input number-input final-total-input"
            value={manualTotal !== null ? manualTotal : Number(finalTotal.toFixed(2))}
            onChange={handleManualTotalChange}
            onBlur={handleManualTotalBlur}
            step="0.01"
            title="Auto-calculated. Type to override."
          />
          {manualTotal !== null && (
            <button
              type="button"
              className="features screen quotation form reset-total-btn"
              onClick={resetManualTotal}
              title="Back to auto calculation"
            >
              ↺
            </button>
          )}
        </div>
      </td>
    </tr >
  );

  const buildTermLi = (term, absoluteIndex, number) => {
    const heading = isTermHeading(term);
    return (
      <li key={absoluteIndex} className={`features screen quotation form payment-term-item${heading ? ' term-heading' : ''}`}>
        {!heading && <span className="features screen quotation form term-bullet">{number}.</span>}
        <input
          type="text"
          className={`features screen quotation form payment-term-input${heading ? ' term-heading-input' : ''}`}
          value={getTermText(term)}
          onChange={(e) => updatePaymentTerm(absoluteIndex, e.target.value)}
          placeholder={heading ? 'Enter sub heading' : 'Enter term'}
        />
        <button className="features screen quotation form remove-term-btn" onClick={() => removePaymentTerm(absoluteIndex)} title="Remove term">
          ×
        </button>
      </li>
    );
  };

  const blocks = [
    ...quotationData.items.map((item, absoluteIndex) => ({
      key: `item-${item.id}`,
      section: 'item',
      row: buildItemRow(item, absoluteIndex),
      content: (
        <table className="features screen quotation form items-table">
          <tbody>{buildItemRow(item, absoluteIndex)}</tbody>
        </table>
      ),
    })),
    ...(showTotalRow && showDiscountInTotal && quotationData.discount > 0 ? [{
      key: 'discount',
      section: 'item',
      row: buildDiscountRow(),
      content: (
        <table className="features screen quotation form items-table">
          <tbody>{buildDiscountRow()}</tbody>
        </table>
      ),
    }] : []),
    ...(showTotalRow ? [{
      key: 'total',
      section: 'item',
      row: buildTotalRow(),
      content: (
        <table className="features screen quotation form items-table">
          <tbody>{buildTotalRow()}</tbody>
        </table>
      ),
    }] : []),
    ...paymentTerms.map((term, absoluteIndex) => ({
      key: `term-${absoluteIndex}`,
      section: 'term',
      li: buildTermLi(term, absoluteIndex, termNumbers[absoluteIndex]),
      content: (
        <table className="features screen quotation form terms-table">
          <tbody>
            <tr>
              <td className="features screen quotation form terms-header-large term-measure">
                <ul className="features screen quotation form payment-terms-list">
                  {buildTermLi(term, absoluteIndex, termNumbers[absoluteIndex])}
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
      content: (
        <ClosingSection
          noticeText={quotationData.noticeText}
          priceStatementText={quotationData.priceStatementText}
          contactText={quotationData.contactText}
          handleNoticeTextChange={quotationForm.handleNoticeTextChange}
          handlePriceStatementTextChange={quotationForm.handlePriceStatementTextChange}
          handleContactTextChange={quotationForm.handleContactTextChange}
          vendor={quotationData.vendor}
          getSignatoryName={quotationForm.getSignatoryName}
          toggleCeoMode={quotationForm.toggleCeoMode}
          ceoMode={quotationForm.ceoMode}
        />
      ),
    },
  ];

  const renderItemGroup = (group) => (
    <table key="items" className="features screen quotation form items-table">
      <thead>
        <tr>
          <th className="features screen quotation form sn-header">SN</th>
          {columns.map((col) => (
            <th key={col.id}>
              <div className="features screen quotation form column-header-cell">
                {col.type === 'calculated' ? (
                  <span className="features screen quotation form fixed-column-label">{col.label}</span>
                ) : (
                  <input
                    type="text"
                    className="features screen quotation form column-header-input"
                    style={{ width: `${Math.max(col.label.length + 2, 8)}ch` }}
                    value={col.label}
                    onChange={(e) => updateColumnLabel(col.id, e.target.value)}
                  />
                )}
                <button
                  className="features screen quotation form remove-column-btn"
                  onClick={() => removeColumn(col.id)}
                  title="Remove column"
                >
                  ×
                </button>
              </div>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{group.blocks.map((b) => b.row)}</tbody>
    </table>
  );

  const renderTermGroup = (group) => {
    const showHeader = group.blocks[0]?.key === 'term-0';
    const isLastTermsGroup = paymentTerms.length > 0 && group.blocks.some((b) => b.key === `term-${paymentTerms.length - 1}`);

    return (
      <table key="terms" className="features screen quotation form terms-table">
        <tbody>
          <tr className="features screen quotation form terms-row-large">
            <td className="features screen quotation form terms-header-large">
              <div className="features screen quotation form payment-terms-container">
                {showHeader && (
                  <div className="features screen quotation form payment-terms-header">Terms &amp; Conditions</div>
                )}
                <ul className="features screen quotation form payment-terms-list">{group.blocks.map((b) => b.li)}</ul>
                {isLastTermsGroup && (
                  <Controls
                    justify="start"
                    gap="8px"
                    items={[{
                      text: '+ Add Term',
                      onClick: addPaymentTerm,
                      colorScheme: 'lime-800',
                      width: '140px',
                      height: '30px',
                      font: 'sm',
                      type: 'submit',
                      cursor: 'pointer',
                      ...SHARED_BTN,
                    }, {
                      text: '+ Add Heading',
                      onClick: addPaymentTermHeading,
                      colorScheme: 'primary-800',
                      width: '140px',
                      height: '30px',
                      font: 'sm',
                      type: 'submit',
                      cursor: 'pointer',
                      ...SHARED_BTN,
                    }]}
                  />
                )}
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    );
  };

  const renderGroup = (group) => {
    if (group.section === 'item') return renderItemGroup(group);
    if (group.section === 'term') return renderTermGroup(group);
    return group.blocks[0].content;
  };

  const headerNode = (
    <>
      <div className="features screen quotation form top-divider" />
      <div className="features screen quotation form title">QUOTATION</div>

      <div className="features screen quotation form details">
        <table className="features screen quotation form details-table">
          <tbody>
            <tr>
              <td className="features screen quotation form left-col">

                <div className="features screen quotation form detail-item">
                  TO :
                  <span className="features screen quotation form dropdown-container" ref={quotationForm.companyRef}>
                    <input
                      type="text"
                      className="features screen quotation form editable-input company-input"
                      value={quotationData.vendor}
                      onChange={quotationForm.handleVendorInputChange}
                      placeholder="Enter company name"
                    />
                    {quotationForm.companyDropdown && quotationForm.filteredCompanies.length > 0 && (
                      <div className="features screen quotation form dropdown-menu">
                        <div className="features screen quotation form dropdown-options">
                          {quotationForm.filteredCompanies.map((company, idx) => (
                            <div key={idx} className="features screen quotation form dropdown-option" onClick={() => quotationForm.handleCompanySelect(company)}>
                              <div className="features screen quotation form company-name">{company.vendor}</div>
                              <div className="features screen quotation form company-details">{company.attention} - {company.designation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </span>
                </div>

                <div className="features screen quotation form detail-item">
                  ATTN :
                  <span className="features screen quotation form dropdown-container" ref={quotationForm.attnRef}>
                    <input
                      type="text"
                      className="features screen quotation form editable-input attention-input"
                      value={quotationData.attention}
                      onChange={quotationForm.handleAttentionInputChange}
                      placeholder="Enter attention name"
                    />
                    {quotationForm.attnDropdown && quotationForm.filteredAttentions.length > 0 && (
                      <div className="features screen quotation form dropdown-menu">
                        <div className="features screen quotation form dropdown-options">
                          {quotationForm.filteredAttentions.map((company, idx) => (
                            <div key={idx} className="features screen quotation form dropdown-option" onClick={() => quotationForm.handleAttentionSelect(company)}>
                              <div className="features screen quotation form attention-name">{company.attention}</div>
                              <div className="features screen quotation form attention-designation">{company.designation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </span>
                </div>

                <div className="features screen quotation form detail-item">
                  DESIGNATION :
                  <input
                    type="text"
                    className="features screen quotation form editable-input designation-input"
                    value={quotationData.designation}
                    onChange={quotationForm.handleDesignationChange}
                    placeholder="Enter designation"
                  />
                </div>

              </td>

              <td className="features screen quotation form right-col">
                <div className="features screen quotation form detail-item">DATE : <span className="features screen quotation form non-editable">{quotationData.date}</span></div>

                <div className="features screen quotation form detail-item">
                  LOCATION :
                  <input
                    type="text"
                    className="features screen quotation form editable-input designation-input"
                    value={quotationData.location}
                    onChange={quotationForm.handleLocationChange}
                    placeholder="Enter location"
                  />
                </div>

                {customFields.map((field) => (
                  <div className="features screen quotation form detail-item custom-field-item" key={field.id}>
                    <input
                      type="text"
                      className="features screen quotation form editable-input custom-field-label-input"
                      value={field.label}
                      onChange={(e) => updateCustomFieldLabel(field.id, e.target.value)}
                      placeholder="Field name"
                    />
                    :
                    <input
                      type="text"
                      className="features screen quotation form editable-input custom-field-value-input"
                      value={field.value}
                      onChange={(e) => updateCustomFieldValue(field.id, e.target.value)}
                      placeholder="Field value"
                    />
                    <button
                      type="button"
                      className="features screen quotation form remove-term-btn"
                      onClick={() => removeCustomField(field.id)}
                      title="Remove field"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <div className="features screen quotation form detail-item">QUOTATION REF NO : <span className="features screen quotation form non-editable">{quotationData.quotationRef}</span></div>
                <div className="features screen quotation form add-field-row">
                  <Controls
                    justify="start"
                    items={[{
                      text: '+ Add Field',
                      onClick: addCustomField,
                      colorScheme: 'lime-800',
                      width: '120px',
                      height: '28px',
                      font: 'sm',
                      type: 'submit',
                      cursor: 'pointer',
                      ...SHARED_BTN,
                    }]}
                  />
                </div>

              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="features screen quotation form details-divider" />

      <div className="features screen quotation form request-text">
        <textarea
          className="features screen quotation form request-text-input"
          value={quotationData.requestText}
          onChange={quotationForm.handleRequestTextChange}
          rows={3}
        />
      </div>

      <div className="features screen quotation form add-column-row">
        <Controls
          justify="end"
          gap="8px"
          items={[
            ...(!columns.some((c) => c.type === 'calculated') ? [{
              text: '+ Add Total Price',
              onClick: addTotalColumn,
              colorScheme: 'primary-800',
              width: '160px',
              height: '28px',
              font: 'sm',
              type: 'submit',
              cursor: 'pointer',
              ...SHARED_BTN,
            }] : []),
            ...(!showTotalRow ? [{
              text: '+ Add Total Row',
              onClick: restoreTotalRow,
              colorScheme: 'primary-800',
              width: '140px',
              height: '28px',
              font: 'sm',
              type: 'submit',
              cursor: 'pointer',
              ...SHARED_BTN,
            }] : []),
            {
              text: '+ Add Column',
              onClick: addColumn,
              colorScheme: 'lime-800',
              width: '140px',
              height: '28px',
              font: 'sm',
              type: 'submit',
              cursor: 'pointer',
              ...SHARED_BTN,
            },
          ]}
        />
      </div>
    </>
  );

  return (
    <div className="features screen quotation form page-container">
      <Controls
        justify="center"
        margin='0 0 20px 0'
        className="features screen quotation form save-controls"
        items={[{
          text: quotationForm.isLoading
            ? (quotationForm.isAmendmentMode ? 'Processing Amendment...' : quotationForm.isEditMode ? 'Updating...' : 'Saving...')
            : (quotationForm.isAmendmentMode ? 'Save Amendment & Send for Approval' : quotationForm.isEditMode ? 'Update' : 'Save'),
          onClick: quotationForm.saveQuotationData,
          colorScheme: quotationForm.isLoading ? 'success-1000' : 'success-800',
          width: 'fit-content',
          type: quotationForm.isLoading ? 'disabled' : 'submit',
          cursor: 'allowed',
          ...SHARED_BTN,
        }]}
      />

      <A2PaginationEngine blocks={blocks} firstPageHeader={headerNode}>
        {(pages) => pages.map((pageBlocks, pageIndex) => (
          <A2Paper key={pageIndex} ref={pageIndex === 0 ? firstPageRef : undefined}>
            {pageIndex === 0 ? headerNode : <div className="features screen quotation form continuation-divider" />}
            {groupBlocksBySection(pageBlocks).map((group, i) => (
              <div key={i}>{renderGroup(group)}</div>
            ))}
          </A2Paper>
        ))}
      </A2PaginationEngine>

      {quotationForm.showDiscountPopup && (
        <div className="features screen quotation form discount-popup-overlay">
          <div className="features screen quotation form discount-popup" ref={quotationForm.discountPopupRef}>
            <div className="features screen quotation form discount-popup-header">
              <h4>Set Discount Amount</h4>
            </div>
            <div className="features screen quotation form discount-popup-content">
              <p>Subtotal: {quotationForm.subtotal.toFixed(2)} QR</p>
              <div className="features screen quotation form discount-input-group">
                <label htmlFor="quotation-discount-input">Discount Amount (QR):</label>
                <input
                  id="quotation-discount-input"
                  type="number"
                  value={quotationForm.discountInput}
                  onChange={quotationForm.handleDiscountInputChange}
                  placeholder="Enter discount amount"
                  min="0"
                  max={quotationForm.subtotal}
                  step="0.01"
                  autoFocus
                />
              </div>
              <p className="features screen quotation form discount-preview">
                Total after discount: {(quotationForm.subtotal - (parseFloat(quotationForm.discountInput) || 0)).toFixed(2)} QR
              </p>
            </div>
            <Controls
              justify="end"
              className="features screen quotation form discount-popup-actions"
              items={[
                { text: 'Apply', onClick: quotationForm.applyDiscount, colorScheme: 'lime-600', width: '100px', font: 'sm', type: quotationForm.isLoading ? 'disabled' : 'submit', cursor: 'allowed', ...SHARED_BTN },
                { text: 'Cancel', onClick: quotationForm.cancelDiscount, colorScheme: 'primary-700', width: '100px', font: 'sm', type: quotationForm.isLoading ? 'disabled' : 'submit', cursor: 'allowed', ...SHARED_BTN },
              ]}
            />
          </div>
        </div>
      )}
      {quotationForm.saveStatus && <div className="features screen quotation form save-status">{quotationForm.saveStatus}</div>}
    </div>
  );
}

export default QuotationForm;