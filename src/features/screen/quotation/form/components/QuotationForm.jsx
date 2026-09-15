import { useRef } from 'react';

import Controls from '@/shared/components/widgets/controls/Controls';
import A2Paper from '@/shared/components/widgets/paper/A2Paper';

import { useQuotationForm } from '../hooks/useQuotationForm';
import { formatCurrency, chunkItems } from '../helper/quotation.form.helper';
import {
  SHARED_BTN,
  ITEMS_PER_PAGE,
  CONFIRMATION_HEADING,
} from '../constants/quotation.form.constant';
import './QuotationForm.css';

function QuotationItemsTable({
  items,
  columns,
  startIndex,
  showHeader,
  showTotal,
  quotationData,
  subtotal,
  totalAmount,
  showDiscountInTotal,
  showDiscount,
  showAddButton,
  autoCalculateTotal,
  isLoading,
  updateColumnLabel,
  removeColumn,
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
}) {
  return (
    <table className="features screen quotation items-table">
      {showHeader && (
        <thead>
          <tr>
            <th className="features screen quotation sn-header">SN</th>
            {columns.map((col) => {
              const fixed = col.type === 'calculated';
              return (
                <th key={col.id}>
                  {fixed ? (
                    <div className="features screen quotation column-header-cell fixed-column-header">
                      <span className="features screen quotation fixed-column-label">{col.label}</span>
                    </div>
                  ) : (
                    <div className="features screen quotation column-header-cell">
                      <input
                        type="text"
                        className="features screen quotation column-header-input"
                        style={{ width: `${Math.max(col.label.length + 2, 8)}ch` }}
                        value={col.label}
                        onChange={(e) => updateColumnLabel(col.id, e.target.value)}
                      />
                      <button
                        className="features screen quotation remove-column-btn"
                        onClick={() => removeColumn(col.id)}
                        title="Remove column"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
      )}
      <tbody>
        {items.map((item, localIndex) => {
          const absoluteIndex = startIndex - 1 + localIndex;
          return (
            <tr key={item.id}>
              <td
                className="features screen quotation sn-cell"
                onMouseEnter={() => handleRowMouseEnter(absoluteIndex)}
                onMouseLeave={handleRowMouseLeave}
              >
                {item.id}
                {showAddButton === absoluteIndex && (
                  <Controls
                    justify="end"
                    wrap={false}
                    gap="4px"
                    className="features screen quotation row-controls"
                    items={[
                      {
                        text: '+',
                        onClick: addItemRow,
                        colorScheme: 'lime-700',
                        width: '20px',
                        height: '20px',
                        title: 'Add Row',
                        font: 'sm',
                        padding: '0',
                        type: 'submit',
                        cursor: 'allowed',
                        ...SHARED_BTN,
                      },
                      ...(quotationData.items.length > 1 ? [{
                        text: '-',
                        onClick: () => removeItem(absoluteIndex),
                        colorScheme: 'red-700',
                        width: '20px',
                        height: '20px',
                        title: 'Remove Row',
                        font: 'sm',
                        padding: '0',
                        type: 'submit',
                        cursor: 'allowed',
                        ...SHARED_BTN,
                      }] : []),
                    ]}
                  />
                )}
              </td>

              {columns.map((col) => (
                <td key={col.id}>
                  {col.id === 'description' ? (
                    <div
                      className="features screen quotation description-cell"
                      onPaste={(e) => handleDescriptionPaste(e, absoluteIndex)}
                      onDrop={(e) => handleDescriptionDrop(e, absoluteIndex)}
                      onDragOver={handleDescriptionDragOver}
                    >
                      <input
                        type="text"
                        className="features screen quotation table-input description-input"
                        value={item[col.id] ?? ''}
                        onChange={(e) => handleItemChange(absoluteIndex, col.id, e.target.value)}
                        placeholder={`Enter ${col.label.toLowerCase()}, or paste/drop an image here`}
                      />
                      {item.image && (
                        <div className="features screen quotation description-image-wrap">
                          <img
                            src={item.image}
                            alt="Item attachment"
                            className="features screen quotation description-image"
                          />
                          <button
                            type="button"
                            className="features screen quotation remove-description-image-btn"
                            onClick={() => removeItemImage(absoluteIndex)}
                            title="Remove image"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  ) : col.type === 'calculated' ? (
                    autoCalculateTotal ? (
                      <span className="features screen quotation calculated-total">{formatCurrency(item[col.id])}</span>
                    ) : (
                      <input
                        type="number"
                        className="features screen quotation table-input number-input"
                        value={item[col.id] ?? ''}
                        onChange={(e) => handleItemChange(absoluteIndex, col.id, e.target.value)}
                        step="0.01"
                      />
                    )
                  ) : (
                    <input
                      type={col.type === 'number' ? 'number' : 'text'}
                      className={`features screen quotation table-input ${col.type === 'number' ? 'features screen quotation number-input' : 'features screen quotation description-input'}`}
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
        })}

        {showTotal && (
          <>
            {showDiscountInTotal && quotationData.discount > 0 && (
              <tr>
                <td colSpan={columns.length} className="features screen quotation total-label">Discount (QR)</td>
                <td className="features screen quotation calculated-total discount-amount">-{formatCurrency(quotationData.discount)}</td>
              </tr>
            )}

            <tr>
              <td colSpan={columns.length} className="features screen quotation total-label">
                <span
                  className="features screen quotation toggle-field"
                  onClick={toggleDiscountInTotal}
                  title="Click to toggle between with/without discount"
                >
                  {showDiscountInTotal ? 'Total Amount After Discount (QR)' : 'Total Amount (QR)'}
                </span>
                {showDiscountInTotal && (
                  <div className="features screen quotation discount-controls">
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
                      <div className="features screen quotation discount-info">
                        Subtotal: {subtotal.toFixed(2)} QR<br />
                        Discount: {quotationData.discount.toFixed(2)} QR
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="features screen quotation calculated-total final-total">
                {formatCurrency(showDiscountInTotal ? totalAmount : subtotal)}
              </td>
            </tr>
          </>
        )}
      </tbody>
    </table>
  );
}

function TermsListSection({
  terms,
  startIndex,
  showHeader,
  isLastTermsPage,
  updatePaymentTerm,
  removePaymentTerm,
  addPaymentTerm,
}) {
  return (
    <table className="features screen quotation terms-table">
      <tbody>
        <tr className="features screen quotation terms-row-large">
          <td className="features screen quotation terms-header-large">
            <div className="features screen quotation payment-terms-container">
              {showHeader && (
                <div className="features screen quotation payment-terms-header">Terms &amp; Conditions</div>
              )}
              <ul className="features screen quotation payment-terms-list">
                {terms.map((term, localIndex) => {
                  const absoluteIndex = startIndex - 1 + localIndex;
                  return (
                    <li key={absoluteIndex} className="features screen quotation payment-term-item">
                      <span className="features screen quotation term-bullet">{absoluteIndex + 1}.</span>
                      <input
                        type="text"
                        className="features screen quotation payment-term-input"
                        value={term}
                        onChange={(e) => updatePaymentTerm(absoluteIndex, e.target.value)}
                        placeholder="Enter term"
                      />
                      <button className="features screen quotation remove-term-btn" onClick={() => removePaymentTerm(absoluteIndex)} title="Remove term">
                        ×
                      </button>
                    </li>
                  );
                })}
              </ul>
              {isLastTermsPage && (
                <Controls
                  justify="start"
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
                  }]}
                />
              )}
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

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
      <div className="features screen quotation terms-extra">
        <textarea
          className="features screen quotation notice-text-input"
          value={noticeText}
          onChange={handleNoticeTextChange}
          rows={2}
        />
        <textarea
          className="features screen quotation price-statement-input"
          value={priceStatementText}
          onChange={handlePriceStatementTextChange}
          rows={2}
        />
        <textarea
          className="features screen quotation contact-text-input"
          value={contactText}
          onChange={handleContactTextChange}
          rows={2}
        />
      </div>

      <div className="features screen quotation closing-row">
        <div className="features screen quotation closing-left">
          <div className="features screen quotation thank-you-text">Thank You,</div>
          <div className="features screen quotation signature-space" />
          <div className="features screen quotation signatory-name">{getSignatoryName()}</div>
          <span className="features screen quotation toggle-field ceo-toggle" onClick={toggleCeoMode}>({ceoMode})</span>
        </div>

        <div className="features screen quotation closing-right-box">
          <div className="features screen quotation confirmation-heading">{CONFIRMATION_HEADING}</div>
          <div className="features screen quotation confirmation-text">
            Customer {vendor || '__________'} should fully understand and comply with all the above terms and conditions. Any lapse/negligence, supplier AL ANSARI TRANSPORT &amp; ENTERPRISES WLL has full right to withdraw the equipment without any notice.
          </div>
          <div className="features screen quotation confirmation-field">Authorized Person Name &amp; Signature:</div>
          <div className="features screen quotation confirmation-field-row">
            <span>Company Stamp:</span>
            <span>Date:</span>
          </div>
        </div>
      </div>
    </>
  );
}

function QuotationForm({ edit, amendment, amendmentUpdate }) {
  const componentRef = useRef();
  const quotationForm = useQuotationForm({ edit, amendment, amendmentUpdate });

  const itemPages = chunkItems(quotationForm.quotationData.items, ITEMS_PER_PAGE);
  const lastItemPageIndex = itemPages.length - 1;
  const lastItemPageCount = itemPages[lastItemPageIndex].length;

  const remainingCapacityOnLastItemsPage = Math.max(0, ITEMS_PER_PAGE - lastItemPageCount);
  const termsOnLastItemsPage = quotationForm.paymentTerms.slice(0, remainingCapacityOnLastItemsPage);
  const overflowTerms = quotationForm.paymentTerms.slice(remainingCapacityOnLastItemsPage);

  const termsPages = chunkItems(overflowTerms, ITEMS_PER_PAGE);
  const hasOverflowTermsPages = overflowTerms.length > 0;
  const lastTermsPageIndex = termsPages.length - 1;

  const itemsTableSharedProps = {
    columns: quotationForm.columns,
    quotationData: quotationForm.quotationData,
    subtotal: quotationForm.subtotal,
    totalAmount: quotationForm.totalAmount,
    showDiscountInTotal: quotationForm.showDiscountInTotal,
    showDiscount: quotationForm.showDiscount,
    showAddButton: quotationForm.showAddButton,
    autoCalculateTotal: quotationForm.autoCalculateTotal,
    isLoading: quotationForm.isLoading,
    updateColumnLabel: quotationForm.updateColumnLabel,
    removeColumn: quotationForm.removeColumn,
    addItemRow: quotationForm.addItemRow,
    removeItem: quotationForm.removeItem,
    handleItemChange: quotationForm.handleItemChange,
    removeItemImage: quotationForm.removeItemImage,
    handleDescriptionPaste: quotationForm.handleDescriptionPaste,
    handleDescriptionDrop: quotationForm.handleDescriptionDrop,
    handleDescriptionDragOver: quotationForm.handleDescriptionDragOver,
    handleRowMouseEnter: quotationForm.handleRowMouseEnter,
    handleRowMouseLeave: quotationForm.handleRowMouseLeave,
    handleDiscountPopup: quotationForm.handleDiscountPopup,
    handleDiscountButtonMouseEnter: quotationForm.handleDiscountButtonMouseEnter,
    handleDiscountButtonMouseLeave: quotationForm.handleDiscountButtonMouseLeave,
    toggleDiscountInTotal: quotationForm.toggleDiscountInTotal,
  };

  const closingSharedProps = {
    noticeText: quotationForm.quotationData.noticeText,
    priceStatementText: quotationForm.quotationData.priceStatementText,
    contactText: quotationForm.quotationData.contactText,
    handleNoticeTextChange: quotationForm.handleNoticeTextChange,
    handlePriceStatementTextChange: quotationForm.handlePriceStatementTextChange,
    handleContactTextChange: quotationForm.handleContactTextChange,
    vendor: quotationForm.quotationData.vendor,
    getSignatoryName: quotationForm.getSignatoryName,
    toggleCeoMode: quotationForm.toggleCeoMode,
    ceoMode: quotationForm.ceoMode,
  };

  return (
    <div className="features screen quotation page-container">
      <Controls
        justify="center"
        margin='0 0 20px 0'
        className="features screen quotation save-controls"
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

      <A2Paper ref={componentRef}>
        <div className="features screen quotation top-divider" />
        <div className="features screen quotation title">QUOTATION</div>

        <div className="features screen quotation details">
          <table className="features screen quotation details-table">
            <tbody>
              <tr>
                <td className="features screen quotation left-col">

                  <div className="features screen quotation detail-item">
                    TO :
                    <span className="features screen quotation dropdown-container" ref={quotationForm.companyRef}>
                      <input
                        type="text"
                        className="features screen quotation editable-input company-input"
                        value={quotationForm.quotationData.vendor}
                        onChange={quotationForm.handleVendorInputChange}
                        placeholder="Enter company name"
                      />
                      {quotationForm.companyDropdown && quotationForm.filteredCompanies.length > 0 && (
                        <div className="features screen quotation dropdown-menu">
                          <div className="features screen quotation dropdown-options">
                            {quotationForm.filteredCompanies.map((company, idx) => (
                              <div key={idx} className="features screen quotation dropdown-option" onClick={() => quotationForm.handleCompanySelect(company)}>
                                <div className="features screen quotation company-name">{company.vendor}</div>
                                <div className="features screen quotation company-details">{company.attention} - {company.designation}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </span>
                  </div>

                  <div className="features screen quotation detail-item">
                    ATTN :
                    <span className="features screen quotation dropdown-container" ref={quotationForm.attnRef}>
                      <input
                        type="text"
                        className="features screen quotation editable-input attention-input"
                        value={quotationForm.quotationData.attention}
                        onChange={quotationForm.handleAttentionInputChange}
                        placeholder="Enter attention name"
                      />
                      {quotationForm.attnDropdown && quotationForm.filteredAttentions.length > 0 && (
                        <div className="features screen quotation dropdown-menu">
                          <div className="features screen quotation dropdown-options">
                            {quotationForm.filteredAttentions.map((company, idx) => (
                              <div key={idx} className="features screen quotation dropdown-option" onClick={() => quotationForm.handleAttentionSelect(company)}>
                                <div className="features screen quotation attention-name">{company.attention}</div>
                                <div className="features screen quotation attention-designation">{company.designation}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </span>
                  </div>

                  <div className="features screen quotation detail-item">
                    DESIGNATION :
                    <input
                      type="text"
                      className="features screen quotation editable-input designation-input"
                      value={quotationForm.quotationData.designation}
                      onChange={quotationForm.handleDesignationChange}
                      placeholder="Enter designation"
                    />
                  </div>

                </td>

                <td className="features screen quotation right-col">
                  <div className="features screen quotation detail-item">DATE : <span className="features screen quotation non-editable">{quotationForm.quotationData.date}</span></div>

                  <div className="features screen quotation detail-item">
                    LOCATION :
                    <input
                      type="text"
                      className="features screen quotation editable-input designation-input"
                      value={quotationForm.quotationData.location}
                      onChange={quotationForm.handleLocationChange}
                      placeholder="Enter location"
                    />
                  </div>

                  {quotationForm.customFields.map((field) => (
                    <div className="features screen quotation detail-item custom-field-item" key={field.id}>
                      <input
                        type="text"
                        className="features screen quotation editable-input custom-field-label-input"
                        value={field.label}
                        onChange={(e) => quotationForm.updateCustomFieldLabel(field.id, e.target.value)}
                        placeholder="Field name"
                      />
                      :
                      <input
                        type="text"
                        className="features screen quotation editable-input custom-field-value-input"
                        value={field.value}
                        onChange={(e) => quotationForm.updateCustomFieldValue(field.id, e.target.value)}
                        placeholder="Field value"
                      />
                      <button
                        type="button"
                        className="features screen quotation remove-term-btn"
                        onClick={() => quotationForm.removeCustomField(field.id)}
                        title="Remove field"
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <div className="features screen quotation add-field-row">
                    <Controls
                      justify="start"
                      items={[{
                        text: '+ Add Field',
                        onClick: quotationForm.addCustomField,
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

                  <div className="features screen quotation detail-item">QUOTATION REF NO : <span className="features screen quotation non-editable">{quotationForm.quotationData.quotationRef}</span></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="features screen quotation details-divider" />

        <div className="features screen quotation request-text">
          <textarea
            className="features screen quotation request-text-input"
            value={quotationForm.quotationData.requestText}
            onChange={quotationForm.handleRequestTextChange}
            rows={3}
          />
        </div>

        <div className="features screen quotation add-column-row">
          <Controls
            justify="end"
            items={[{
              text: '+ Add Column',
              onClick: quotationForm.addColumn,
              colorScheme: 'lime-800',
              width: '140px',
              height: '28px',
              font: 'sm',
              type: 'submit',
              cursor: 'pointer',
              ...SHARED_BTN,
            }]}
          />
        </div>

        <QuotationItemsTable
          items={itemPages[0]}
          startIndex={1}
          showHeader
          showTotal={lastItemPageIndex === 0}
          {...itemsTableSharedProps}
        />

        {lastItemPageIndex === 0 && termsOnLastItemsPage.length > 0 && (
          <TermsListSection
            terms={termsOnLastItemsPage}
            startIndex={1}
            showHeader
            isLastTermsPage={!hasOverflowTermsPages}
            updatePaymentTerm={quotationForm.updatePaymentTerm}
            removePaymentTerm={quotationForm.removePaymentTerm}
            addPaymentTerm={quotationForm.addPaymentTerm}
          />
        )}

        {lastItemPageIndex === 0 && !hasOverflowTermsPages && termsOnLastItemsPage.length > 0 && (
          <ClosingSection {...closingSharedProps} />
        )}
      </A2Paper>

      {itemPages.slice(1).map((pageItems, idx) => {
        const pageIndex = idx + 1;
        const isLastItemPage = pageIndex === lastItemPageIndex;
        const startIndex = itemPages.slice(0, pageIndex).reduce((sum, p) => sum + p.length, 0) + 1;

        return (
          <A2Paper key={`items-${pageIndex}`}>
            <div className="features screen quotation continuation-divider" />
            <QuotationItemsTable
              items={pageItems}
              startIndex={startIndex}
              showHeader
              showTotal={isLastItemPage}
              {...itemsTableSharedProps}
            />

            {isLastItemPage && termsOnLastItemsPage.length > 0 && (
              <TermsListSection
                terms={termsOnLastItemsPage}
                startIndex={1}
                showHeader
                isLastTermsPage={!hasOverflowTermsPages}
                updatePaymentTerm={quotationForm.updatePaymentTerm}
                removePaymentTerm={quotationForm.removePaymentTerm}
                addPaymentTerm={quotationForm.addPaymentTerm}
              />
            )}

            {isLastItemPage && !hasOverflowTermsPages && termsOnLastItemsPage.length > 0 && (
              <ClosingSection {...closingSharedProps} />
            )}
          </A2Paper>
        );
      })}

      {termsPages.map((termsChunk, idx) => {
        const isLastTermsPage = idx === lastTermsPageIndex;
        const startIndex = termsOnLastItemsPage.length
          + termsPages.slice(0, idx).reduce((sum, p) => sum + p.length, 0) + 1;

        return (
          <A2Paper key={`terms-${idx}`}>
            <div className="features screen quotation continuation-divider" />
            <TermsListSection
              terms={termsChunk}
              startIndex={startIndex}
              showHeader={termsOnLastItemsPage.length === 0 && idx === 0}
              isLastTermsPage={isLastTermsPage}
              updatePaymentTerm={quotationForm.updatePaymentTerm}
              removePaymentTerm={quotationForm.removePaymentTerm}
              addPaymentTerm={quotationForm.addPaymentTerm}
            />

            {isLastTermsPage && <ClosingSection {...closingSharedProps} />}
          </A2Paper>
        );
      })}

      {quotationForm.showDiscountPopup && (
        <div className="features screen quotation discount-popup-overlay">
          <div className="features screen quotation discount-popup" ref={quotationForm.discountPopupRef}>
            <div className="features screen quotation discount-popup-header">
              <h4>Set Discount Amount</h4>
            </div>
            <div className="features screen quotation discount-popup-content">
              <p>Subtotal: {quotationForm.subtotal.toFixed(2)} QR</p>
              <div className="features screen quotation discount-input-group">
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
              <p className="features screen quotation discount-preview">
                Total after discount: {(quotationForm.subtotal - (parseFloat(quotationForm.discountInput) || 0)).toFixed(2)} QR
              </p>
            </div>
            <Controls
              justify="end"
              className="features screen quotation discount-popup-actions"
              items={[
                { text: 'Apply', onClick: quotationForm.applyDiscount, colorScheme: 'lime-600', width: '100px', font: 'sm', type: quotationForm.isLoading ? 'disabled' : 'submit', cursor: 'allowed', ...SHARED_BTN },
                { text: 'Cancel', onClick: quotationForm.cancelDiscount, colorScheme: 'primary-700', width: '100px', font: 'sm', type: quotationForm.isLoading ? 'disabled' : 'submit', cursor: 'allowed', ...SHARED_BTN },
              ]}
            />
          </div>
        </div>
      )}
      {quotationForm.saveStatus && <div className="features screen quotation save-status">{quotationForm.saveStatus}</div>}
    </div>
  );
}

export default QuotationForm;