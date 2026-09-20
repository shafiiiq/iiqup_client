import { useRef } from 'react';

import Controls from '@/shared/components/widgets/controls/Controls';
import A2Paper, { A2PaginationEngine, groupBlocksBySection } from '@/shared/components/widgets/paper/A2Paper';

import { useHireOderForm } from '../hooks/useHireOderForm';
import { formatCurrency } from '../helper/hire.order.form.helper';
import { SHARED_BTN } from '../constants/hire.order.form.constant';
import './HireOrderForm.css';

function SignaturesBlock({ getSignatoryName, toggleCeoMode, ceoMode }) {
  return (
    <>
      <table className="features screen hire order terms-table">
        <tbody>
          <tr>
            <td className="features screen hire order note-row">
              <strong>NOTE:</strong> The hire order copy should be submitted along with the invoice every month for the payment process.
            </td>
          </tr>
        </tbody>
      </table>

      <table className="features screen hire order signatures-table">
        <tbody>
          <tr>
            <td colSpan="4" className="features screen hire order company-footer">AL ANSARI TRANSPORT &amp; ENTERPRISES W.L.L</td>
            <td className="features screen hire order sign-table-l">Subcontractor OR<br />Service Provider</td>
          </tr>
          <tr>
            <td className="features screen hire order sign-table-l">Accounts Dept:</td>
            <td className="features screen hire order sign-table-l">Purchase Manager</td>
            <td className="features screen hire order sign-table-l">Operations Manager</td>
            <td className="features screen hire order sign-table-l">
              Authorized Signatory<br />
              <span className="features screen hire order toggle-field ceo-toggle" onClick={toggleCeoMode}>({ceoMode})</span>
            </td>
            <td className="features screen hire order sign-table-date">(Date &amp; Sign with Stamp)</td>
          </tr>
          <tr className="features screen hire order signature-spaces-large">
            <td className="features screen hire order sign-table-l" /><td className="features screen hire order sign-table-l" />
            <td className="features screen hire order sign-table-l" /><td className="features screen hire order sign-table-l" /><td />
          </tr>
          <tr>
            <td className="features screen hire order sign-table-l">ROSHAN SHA</td>
            <td className="features screen hire order sign-table-l">ABDUL MALIK</td>
            <td className="features screen hire order sign-table-l">SURESHKANTH</td>
            <td className="features screen hire order sign-table-l">{getSignatoryName()}</td>
            <td />
          </tr>
        </tbody>
      </table>
    </>
  );
}

function HireOrderForm({ edit, amendment, amendmentUpdate }) {
  const firstPageRef = useRef();
  const hireOrderForm = useHireOderForm({ edit, amendment, amendmentUpdate });

  const {
    hireOrderData,
    columns,
    paymentTerms,
    subtotal,
    finalTotal,
    customFields,
    showTotalRow,
    manualTotal,
    addCustomField,
    updateCustomFieldLabel,
    updateCustomFieldValue,
    removeCustomField,
    removeTotalRow,
    restoreTotalRow,
    handleManualTotalChange,
    handleManualTotalBlur,
    resetManualTotal,
    showDiscountInTotal,
    showDiscount,
    showAddButton,
    autoCalculateTotal,
    isLoading,
    updateColumnLabel,
    removeColumn,
    addColumn,
    addTotalColumn,
    addItemRow,
    removeItem,
    handleItemChange,
    handleRowMouseEnter,
    handleRowMouseLeave,
    handleDiscountPopup,
    handleDiscountButtonMouseEnter,
    handleDiscountButtonMouseLeave,
    toggleDiscountInTotal,
    updatePaymentTerm,
    removePaymentTerm,
    addPaymentTerm,
  } = hireOrderForm;

  const buildItemRow = (item, absoluteIndex) => (
    <tr key={item.id}>
      <td
        className="features screen hire order sn-cell"
        onMouseEnter={() => handleRowMouseEnter(absoluteIndex)}
        onMouseLeave={handleRowMouseLeave}
      >
        {item.id}
        {showAddButton === absoluteIndex && (
          <Controls
            justify="end"
            wrap={false}
            gap="4px"
            className="features screen hire order row-controls"
            items={[
              {
                ...SHARED_BTN, text: '+', onClick: addItemRow, colorScheme: 'success-700', width: '20px', height: '20px',
                title: 'Add Row', font: 'sm', padding: '0', type: 'submit', cursor: 'allowed'
              },
              ...(hireOrderData.items.length > 1 ? [{
                ...SHARED_BTN, text: '-', onClick: () => removeItem(absoluteIndex), colorScheme: 'error-700', width: '20px', height: '20px',
                title: 'Remove Row', font: 'sm', padding: '0', type: 'submit', cursor: 'allowed',
              }] : []),
            ]}
          />
        )}
      </td>

      {columns.map((col) => (
        <td key={col.id}>
          {col.type === 'calculated' ? (
            autoCalculateTotal ? (
              <span className="features screen hire order calculated-total">{formatCurrency(item[col.id])}</span>
            ) : (
              <input
                type="number"
                className="features screen hire order table-input number-input"
                value={item[col.id] ?? ''}
                onChange={(e) => handleItemChange(absoluteIndex, col.id, e.target.value)}
                step="0.01"
              />
            )
          ) : (
            <input
              type={col.type === 'number' ? 'number' : 'text'}
              className={`features screen hire order table-input ${col.type === 'number' ? 'features screen hire order number-input' : 'features screen hire order description-input'}`}
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
      <td colSpan={columns.length} className="features screen hire order total-label">Discount (QR)</td>
      <td className="features screen hire order calculated-total discount-amount">-{formatCurrency(hireOrderData.discount)}</td>
    </tr>
  );

  const buildTotalRow = () => (
    <tr key="total">
      <td colSpan={columns.length} className="features screen hire order total-label">
        <span
          className="features screen hire order toggle-field"
          onClick={toggleDiscountInTotal}
          title="Click to toggle between with/without discount"
        >
          {showDiscountInTotal ? 'Total Amount After Discount (QR)' : 'Total Amount (QR)'}
        </span>
        {showDiscountInTotal && (
          <div className="features screen hire order discount-controls">
            <Controls
              justify="start"
              wrap={false}
              items={[{
                text: hireOrderData.discount > 0 ? 'Edit Discount' : 'Add Discount',
                onClick: handleDiscountPopup,
                onMouseEnter: handleDiscountButtonMouseEnter,
                onMouseLeave: handleDiscountButtonMouseLeave,
                colorScheme: isLoading ? 'blue-900' : 'blue-800',
                width: '120px', height: '20px', font: 'sm',
                type: isLoading ? 'disabled' : 'submit', cursor: 'allowed', ...SHARED_BTN,
              }]}
            />
            {showDiscount && (
              <div className="features screen hire order discount-info">
                Subtotal: {subtotal.toFixed(2)} QR<br />
                Discount: {hireOrderData.discount.toFixed(2)} QR
              </div>
            )}
          </div>
        )}
        <button
          type="button"
          className="features screen hire order remove-term-btn"
          onClick={removeTotalRow}
          title="Remove total row"
        >
          ×
        </button>
      </td>
      <td className="features screen hire order calculated-total final-total">
        <div className="features screen hire order final-total-wrap">
          <input
            type="number"
            className="features screen hire order table-input number-input final-total-input"
            value={manualTotal !== null ? manualTotal : Number(finalTotal.toFixed(2))}
            onChange={handleManualTotalChange}
            onBlur={handleManualTotalBlur}
            step="0.01"
            title="Auto-calculated. Type to override."
          />
          {manualTotal !== null && (
            <button
              type="button"
              className="features screen hire order reset-total-btn"
              onClick={resetManualTotal}
              title="Back to auto calculation"
            >
              ↺
            </button>
          )}
        </div>
      </td>
    </tr>
  );

  const buildTermLi = (term, absoluteIndex) => (
    <li key={absoluteIndex} className="features screen hire order payment-term-item">
      <span className="features screen hire order term-bullet">•</span>
      <input
        type="text"
        className="features screen hire order payment-term-input"
        value={term}
        onChange={(e) => updatePaymentTerm(absoluteIndex, e.target.value)}
        placeholder="Enter payment term"
      />
      {paymentTerms.length > 1 && (
        <button className="features screen hire order remove-term-btn" onClick={() => removePaymentTerm(absoluteIndex)} title="Remove term">
          ×
        </button>
      )}
    </li>
  );

  const blocks = [
    ...hireOrderData.items.map((item, absoluteIndex) => ({
      key: `item-${item.id}`,
      section: 'item',
      row: buildItemRow(item, absoluteIndex),
      content: <table className="features screen hire order items-table"><tbody>{buildItemRow(item, absoluteIndex)}</tbody></table>,
    })),
    ...(showTotalRow && showDiscountInTotal && hireOrderData.discount > 0 ? [{
      key: 'discount', section: 'item', row: buildDiscountRow(),
      content: <table className="features screen hire order items-table"><tbody>{buildDiscountRow()}</tbody></table>,
    }] : []),
    ...(showTotalRow ? [{
      key: 'total', section: 'item', row: buildTotalRow(),
      content: <table className="features screen hire order items-table"><tbody>{buildTotalRow()}</tbody></table>,
    }] : []),
    ...paymentTerms.map((term, absoluteIndex) => ({
      key: `term-${absoluteIndex}`,
      section: 'term',
      li: buildTermLi(term, absoluteIndex),
      content: (
        <table className="features screen hire order terms-table">
          <tbody><tr><td className="features screen hire order terms-header-large term-measure">
            <ul className="features screen hire order payment-terms-list">{buildTermLi(term, absoluteIndex)}</ul>
          </td></tr></tbody>
        </table>
      ),
    })),
    {
      key: 'closing',
      section: 'closing',
      content: (
        <SignaturesBlock
          getSignatoryName={hireOrderForm.getSignatoryName}
          toggleCeoMode={hireOrderForm.toggleCeoMode}
          ceoMode={hireOrderForm.ceoMode}
        />
      ),
    },
  ];

  const renderItemGroup = (group) => (
    <table key="items" className="features screen hire order items-table">
      <thead>
        <tr>
          <th className="features screen hire order sn-header">SN</th>
          {columns.map((col) => {
            const fixed = col.type === 'calculated';
            return (
              <th key={col.id}>
                {fixed ? (
                  <div className="features screen hire order column-header-cell fixed-column-header">
                    <span className="features screen hire order fixed-column-label">{col.label}</span>
                    <button className="features screen hire order remove-column-btn" onClick={() => removeColumn(col.id)} title="Remove column">×</button>
                  </div>
                ) : (
                  <div className="features screen hire order column-header-cell">
                    <input
                      type="text"
                      className="features screen hire order column-header-input"
                      style={{ width: `${Math.max(col.label.length + 2, 8)}ch` }}
                      value={col.label}
                      onChange={(e) => updateColumnLabel(col.id, e.target.value)}
                    />
                    <button className="features screen hire order remove-column-btn" onClick={() => removeColumn(col.id)} title="Remove column">×</button>
                  </div>
                )}
              </th>
            );
          })}
        </tr>
      </thead>
      <tbody>{group.blocks.map((b) => b.row)}</tbody>
    </table>
  );

  const renderTermGroup = (group) => {
    const showHeader = group.blocks[0]?.key === 'term-0';
    const isLastGroup = paymentTerms.length > 0 && group.blocks.some((b) => b.key === `term-${paymentTerms.length - 1}`);

    return (
      <table key="terms" className="features screen hire order terms-table">
        <tbody>
          <tr className="features screen hire order terms-row-large">
            <td className="features screen hire order terms-header-large">
              <div className="features screen hire order payment-terms-container">
                {showHeader && <div className="features screen hire order payment-terms-header">Terms &amp; Conditions</div>}
                <ul className="features screen hire order payment-terms-list">{group.blocks.map((b) => b.li)}</ul>
                {isLastGroup && (
                  <Controls
                    justify="start"
                    items={[{
                      text: '+ Add Payment Term', onClick: addPaymentTerm, colorScheme: 'lime-800',
                      width: '170px', height: '30px', font: 'sm', type: 'submit', cursor: 'pointer', ...SHARED_BTN,
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
      <div className="features screen hire order top-divider" />
      <div className="features screen hire order title">HIRE ORDER</div>

      <div className="features screen hire order details">
        <table className="features screen hire order details-table">
          <tbody>
            <tr>
              <td className="features screen hire order left-col">
                <div className="features screen hire order detail-item">
                  TO :
                  <span className="features screen hire order dropdown-container" ref={hireOrderForm.companyRef}>
                    <input
                      type="text"
                      className="features screen hire order editable-input company-input"
                      value={hireOrderData.vendor}
                      onChange={hireOrderForm.handleVendorInputChange}
                      placeholder="Enter company name"
                    />
                    {hireOrderForm.companyDropdown && hireOrderForm.filteredCompanies.length > 0 && (
                      <div className="features screen hire order dropdown-menu">
                        <div className="features screen hire order dropdown-options">
                          {hireOrderForm.filteredCompanies.map((company, idx) => (
                            <div key={idx} className="features screen hire order dropdown-option" onClick={() => hireOrderForm.handleCompanySelect(company)}>
                              <div className="features screen hire order company-name">{company.vendor}</div>
                              <div className="features screen hire order company-details">{company.attention} - {company.designation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </span>
                </div>

                <div className="features screen hire order detail-item">
                  ATTN :
                  <span className="features screen hire order dropdown-container" ref={hireOrderForm.attnRef}>
                    <input
                      type="text"
                      className="features screen hire order editable-input attention-input"
                      value={hireOrderData.attention}
                      onChange={hireOrderForm.handleAttentionInputChange}
                      placeholder="Enter attention name"
                    />
                    {hireOrderForm.attnDropdown && hireOrderForm.filteredAttentions.length > 0 && (
                      <div className="features screen hire order dropdown-menu">
                        <div className="features screen hire order dropdown-options">
                          {hireOrderForm.filteredAttentions.map((company, idx) => (
                            <div key={idx} className="features screen hire order dropdown-option" onClick={() => hireOrderForm.handleAttentionSelect(company)}>
                              <div className="features screen hire order attention-name">{company.attention}</div>
                              <div className="features screen hire order attention-designation">{company.designation}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </span>
                </div>

                <div className="features screen hire order detail-item">
                  DESIGNATION :
                  <input
                    type="text"
                    className="features screen hire order editable-input designation-input"
                    value={hireOrderData.designation}
                    onChange={hireOrderForm.handleDesignationChange}
                    placeholder="Enter designation"
                  />
                </div>

                <div className="features screen hire order detail-item">
                  Ref No :
                  <input
                    type="text"
                    className="features screen hire order editable-input designation-input"
                    value={hireOrderData.quoteNo}
                    onChange={hireOrderForm.handleQuoteNoChange}
                    placeholder="Enter Quotation Number"
                  />
                </div>
              </td>

              <td className="features screen hire order right-col">
                <div className="features screen hire order detail-item">DATE : <span className="features screen hire order non-editable">{hireOrderData.date}</span></div>
                {customFields.map((field) => (
                  <div className="features screen hire order detail-item custom-field-item" key={field.id}>
                    <input
                      type="text"
                      className="features screen hire order editable-input custom-field-label-input"
                      value={field.label}
                      onChange={(e) => updateCustomFieldLabel(field.id, e.target.value)}
                      placeholder="Field name"
                    />
                    :
                    <input
                      type="text"
                      className="features screen hire order editable-input custom-field-value-input"
                      value={field.value}
                      onChange={(e) => updateCustomFieldValue(field.id, e.target.value)}
                      placeholder="Field value"
                    />
                    <button
                      type="button"
                      className="features screen hire order remove-term-btn"
                      onClick={() => removeCustomField(field.id)}
                      title="Remove field"
                    >
                      ×
                    </button>
                  </div>
                ))}

                <div className="features screen hire order add-field-row">
                  <Controls
                    justify="start"
                    items={[{
                      text: '+ Add Field', onClick: addCustomField, colorScheme: 'lime-800',
                      width: '120px', height: '28px', font: 'sm', type: 'submit', cursor: 'pointer', ...SHARED_BTN,
                    }]}
                  />
                </div>

                <div className="features screen hire order detail-item">LPO REF NO : <span className="features screen hire order non-editable">{hireOrderData.hireOrderRef}</span></div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="features screen hire order details-divider" />

      <div className="features screen hire order request-text">
        <textarea
          className="features screen hire order request-text-input"
          value={hireOrderData.requestText}
          onChange={hireOrderForm.handleRequestTextChange}
          rows={3}
        />
      </div>

      <div className="features screen hire order add-column-row">
        <Controls
          justify="end"
          gap="8px"
          items={[
            ...(!columns.some((c) => c.type === 'calculated') ? [{
              text: '+ Add Total Price', onClick: addTotalColumn, colorScheme: 'primary-800',
              width: '160px', height: '28px', font: 'sm', type: 'submit', cursor: 'pointer', ...SHARED_BTN,
            }] : []),
            ...(!showTotalRow ? [{
              text: '+ Add Total Row', onClick: restoreTotalRow, colorScheme: 'primary-800',
              width: '140px', height: '28px', font: 'sm', type: 'submit', cursor: 'pointer', ...SHARED_BTN,
            }] : []),
            {
              text: '+ Add Column', onClick: addColumn, colorScheme: 'lime-800',
              width: '140px', height: '28px', font: 'sm', type: 'submit', cursor: 'pointer', ...SHARED_BTN,
            },
          ]}
        />
      </div>
    </>
  );

  return (
    <div className="features screen hire order page-container">
      <Controls
        justify="center"
        margin='0 0 20px 0'
        className="features screen hire order save-controls"
        items={[{
          text: hireOrderForm.isLoading
            ? (hireOrderForm.isAmendmentMode ? 'Processing Amendment...' : hireOrderForm.isEditMode ? 'Updating...' : 'Saving...')
            : (hireOrderForm.isAmendmentMode ? 'Save Amendment & Send for Approval' : hireOrderForm.isEditMode ? 'Update Hire Order' : 'Save Hire Order'),
          onClick: hireOrderForm.saveHireOrderData,
          colorScheme: hireOrderForm.isLoading ? 'success-1000' : 'success-800',
          width: 'fit-content',
          type: hireOrderForm.isLoading ? 'disabled' : 'submit',
          cursor: 'allowed',
          ...SHARED_BTN,
        }]}
      />

      <A2PaginationEngine blocks={blocks} firstPageHeader={headerNode}>
        {(pages) => pages.map((pageBlocks, pageIndex) => (
          <A2Paper key={pageIndex} ref={pageIndex === 0 ? firstPageRef : undefined}>
            {pageIndex === 0 ? headerNode : <div className="features screen hire order continuation-divider" />}
            {groupBlocksBySection(pageBlocks).map((group, i) => <div key={i}>{renderGroup(group)}</div>)}
          </A2Paper>
        ))}
      </A2PaginationEngine>

      {hireOrderForm.showDiscountPopup && (
        <div className="features screen hire order discount-popup-overlay">
          <div className="features screen hire order discount-popup" ref={hireOrderForm.discountPopupRef}>
            <div className="features screen hire order discount-popup-header">
              <h4>Set Discount Amount</h4>
            </div>
            <div className="features screen hire order discount-popup-content">
              <p>Subtotal: {hireOrderForm.subtotal.toFixed(2)} QR</p>
              <div className="features screen hire order discount-input-group">
                <label htmlFor="hire-order-discount-input">Discount Amount (QR):</label>
                <input
                  id="hire-order-discount-input"
                  type="number"
                  value={hireOrderForm.discountInput}
                  onChange={hireOrderForm.handleDiscountInputChange}
                  placeholder="Enter discount amount"
                  min="0"
                  max={hireOrderForm.subtotal}
                  step="0.01"
                  autoFocus
                />
              </div>
              <p className="features screen hire order discount-preview">
                Total after discount: {(hireOrderForm.subtotal - (parseFloat(hireOrderForm.discountInput) || 0)).toFixed(2)} QR
              </p>
            </div>
            <Controls
              justify="end"
              className="features screen hire order discount-popup-actions"
              items={[
                { text: 'Apply', onClick: hireOrderForm.applyDiscount, colorScheme: 'lime-600', width: '100px', font: 'sm', type: hireOrderForm.isLoading ? 'disabled' : 'submit', cursor: 'allowed', ...SHARED_BTN },
                { text: 'Cancel', onClick: hireOrderForm.cancelDiscount, colorScheme: 'primary-700', width: '100px', font: 'sm', type: hireOrderForm.isLoading ? 'disabled' : 'submit', cursor: 'allowed', ...SHARED_BTN },
              ]}
            />
          </div>
        </div>
      )}

      {hireOrderForm.saveStatus && <div className="features screen hire order save-status">{hireOrderForm.saveStatus}</div>}
    </div>
  );
}

export default HireOrderForm;