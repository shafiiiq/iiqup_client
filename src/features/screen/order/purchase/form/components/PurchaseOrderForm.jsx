import { useRef } from 'react';

import Controls from '@/shared/components/widgets/controls/Controls';
import Modal from '@/shared/components/widgets/modal/Modal';
import A2Paper from '@/shared/components/widgets/paper/A2Paper';
import PaperViewport from '@/shared/components/widgets/paper/PaperViewport';

import usePurchaseOrderForm from '../hooks/usePurchaseOrderForm';
import { SHARED_BTN, ITEMS_PER_PAGE } from '../constants/purchase.order.form.constant';
import { chunkItems, formatCurrency } from '../helper/purchase.order.form.helper';

import './PurchaseOrderForm.css';

function DescriptionTooltip({ tooltip, items }) {
    if (!tooltip) return null;
    const item = items.find((i) => i.id === tooltip.itemId);
    if (!item) return null;
    return (
        <div
            className="features screens order purchase form description-tooltip"
            style={{ position: 'fixed', top: tooltip.top, left: tooltip.left, transform: tooltip.transform }}
        >
            {item.description}
        </div>
    );
}

function EditableItemsTable({
    items,
    startIndex,
    showHeader,
    showTotal,
    purchaseorderData,
    subtotal,
    totalAmount,
    showDiscountInTotal,
    showDiscount,
    setShowDiscount,
    showAddButton,
    setShowAddButton,
    handleItemChange,
    addItemRow,
    removeItemRow,
    handleDiscountPopup,
    toggleDiscountInTotal,
    isLoading,
    descriptionTooltip,
    onDescriptionHover,
    onDescriptionLeave,
}) {
    return (
        <>
            <table className="features screens order purchase form items-table">
                {showHeader && (
                    <thead>
                        <tr>
                            <th>SN</th>
                            <th>Item Description</th>
                            <th>Qty</th>
                            <th>Unit Price(QR)</th>
                            <th>Total Price(QR)</th>
                        </tr>
                    </thead>
                )}
                <tbody>
                    {items.map((item, localIndex) => {
                        const absoluteIndex = startIndex - 1 + localIndex;
                        return (
                            <tr key={item.id}>
                                <td
                                    className="features screens order purchase form sn-cell"
                                    onMouseEnter={() => setShowAddButton(absoluteIndex)}
                                    onMouseLeave={() => setShowAddButton(null)}
                                >
                                    {item.id}
                                    {showAddButton === absoluteIndex && (
                                        <Controls
                                            justify="end"
                                            wrap={false}
                                            gap="4px"
                                            className="features screens order purchase form row-controls"
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
                                                ...(purchaseorderData.items.length > 1 ? [{
                                                    text: '-',
                                                    onClick: () => removeItemRow(absoluteIndex),
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

                                <td>
                                    <input
                                        type="text"
                                        className="features screens order purchase form table-input description-input"
                                        value={item.description}
                                        onChange={(e) => handleItemChange(absoluteIndex, 'description', e.target.value)}
                                        onMouseEnter={(e) => onDescriptionHover(e, item.id)}
                                        onMouseLeave={onDescriptionLeave}
                                        placeholder="Enter description"
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        className="features screens order purchase form table-input number-input"
                                        value={item.quantity ?? ''}
                                        onChange={(e) => handleItemChange(absoluteIndex, 'quantity', e.target.value)}
                                    />
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        className="features screens order purchase form table-input number-input"
                                        value={item.unitPrice ?? ''}
                                        onChange={(e) => handleItemChange(absoluteIndex, 'unitPrice', e.target.value)}
                                        step="0.01"
                                    />
                                </td>
                                <td className="features screens order purchase form calculated-total">{formatCurrency(item.totalPrice)}</td>
                            </tr>
                        );
                    })}

                    {showTotal && (
                        <>
                            {showDiscountInTotal && purchaseorderData.discount > 0 && (
                                <tr>
                                    <td colSpan="4" className="features screens order purchase form total-label">Discount (QR)</td>
                                    <td className="features screens order purchase form calculated-total discount-amount">-{formatCurrency(purchaseorderData.discount)}</td>
                                </tr>
                            )}

                            <tr>
                                <td colSpan="4" className="features screens order purchase form total-label">
                                    <span
                                        className="features screens order purchase form toggle-field"
                                        onClick={toggleDiscountInTotal}
                                        title="Click to toggle between with/without discount"
                                    >
                                        {showDiscountInTotal ? 'Total Amount After Discount (QR)' : 'Total Amount (QR)'}
                                    </span>
                                    {showDiscountInTotal && (
                                        <div className="features screens order purchase form discount-controls">
                                            <Controls
                                                justify="start"
                                                wrap={false}
                                                items={[{
                                                    text: purchaseorderData.discount > 0 ? 'Edit Discount' : 'Add Discount',
                                                    onClick: handleDiscountPopup,
                                                    onMouseEnter: () => setShowDiscount(true),
                                                    onMouseLeave: () => setShowDiscount(false),
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
                                                <div className="features screens order purchase form discount-info">
                                                    Subtotal: {subtotal.toFixed(2)} QR<br />
                                                    Discount: {purchaseorderData.discount.toFixed(2)} QR
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="features screens order purchase form calculated-total final-total">
                                    {formatCurrency(showDiscountInTotal ? totalAmount : subtotal)}
                                </td>
                            </tr>
                        </>
                    )}
                </tbody>
            </table>
            <DescriptionTooltip tooltip={descriptionTooltip} items={items} />
        </>
    );
}

function TermsAndSignaturesContent({
    paymentTerms,
    updatePaymentTerm,
    removePaymentTerm,
    addPaymentTerm,
    getSignatoryName,
    toggleCeoMode,
    ceoMode,
}) {
    return (
        <>
            <table className="features screens order purchase form terms-table">
                <tbody>
                    <tr className="features screens order purchase form terms-row-large">
                        <td className="features screens order purchase form terms-header-large">
                            <div className="features screens order purchase form payment-terms-container">
                                <div className="features screens order purchase form payment-terms-header">Terms &amp; Conditions</div>
                                <ul className="features screens order purchase form payment-terms-list">
                                    {paymentTerms.map((term, index) => (
                                        <li key={index} className="features screens order purchase form payment-term-item">
                                            <span className="features screens order purchase form term-bullet">•</span>
                                            <input
                                                type="text"
                                                className="features screens order purchase form payment-term-input"
                                                value={term}
                                                onChange={(e) => updatePaymentTerm(index, e.target.value)}
                                                placeholder="Enter payment term"
                                            />
                                            {paymentTerms.length > 1 && (
                                                <button className="features screens order purchase form remove-term-btn" onClick={() => removePaymentTerm(index)} title="Remove term">
                                                    ×
                                                </button>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                                <Controls
                                    justify="start"
                                    items={[{
                                        text: '+ Add Payment Term',
                                        onClick: addPaymentTerm,
                                        colorScheme: 'lime-800',
                                        width: '170px',
                                        height: '30px',
                                        font: 'sm',
                                        type: 'submit',
                                        cursor: 'pointer',
                                        ...SHARED_BTN,
                                    }]}
                                />
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td className="features screens order purchase form note-row">
                            <strong>NOTE:</strong> The PurchaseOrder copy should be submitted along with the invoice every month for the payment process.
                        </td>
                    </tr>
                </tbody>
            </table>

            <table className="features screens order purchase form signatures-table">
                <tbody>
                    <tr>
                        <td colSpan="4" className="features screens order purchase form company-footer">AL ANSARI TRANSPORT &amp; ENTERPRISES W.L.L</td>
                        <td className="features screens order purchase form sign-table-l">Subcontractor OR<br />Service Provider</td>
                    </tr>
                    <tr>
                        <td className="features screens order purchase form sign-table-l">Accounts Dept:</td>
                        <td className="features screens order purchase form sign-table-l">Purchase Manager</td>
                        <td className="features screens order purchase form sign-table-l">Operations Manager</td>
                        <td className="features screens order purchase form sign-table-l">
                            Authorized Signatory<br />
                            <span className="features screens order purchase form toggle-field ceo-toggle" onClick={toggleCeoMode}>({ceoMode})</span>
                        </td>
                        <td className="features screens order purchase form sign-table-date">(Date &amp; Sign with Stamp)</td>
                    </tr>
                    <tr className="features screens order purchase form signature-spaces-large">
                        <td className="features screens order purchase form sign-table-l" /><td className="features screens order purchase form sign-table-l" />
                        <td className="features screens order purchase form sign-table-l" /><td className="features screens order purchase form sign-table-l" /><td />
                    </tr>
                    <tr>
                        <td className="features screens order purchase form sign-table-l">ROSHAN SHA</td>
                        <td className="features screens order purchase form sign-table-l">ABDUL MALIK</td>
                        <td className="features screens order purchase form sign-table-l">SURESHKANTH</td>
                        <td className="features screens order purchase form sign-table-l">{getSignatoryName()}</td>
                        <td />
                    </tr>
                </tbody>
            </table>
        </>
    );
}

function TermsAndSignaturesPage(props) {
    return (
        <A2Paper>
            <div className="features screens order purchase form continuation-divider" />
            <TermsAndSignaturesContent {...props} />
        </A2Paper>
    );
}

function PurchaseOrderForm({ purchaseOrdersOfStocks, purchaseOrderForAllEquipments, isPurchaseOrderUpdate, amendment, amendmentUpdate }) {
    const componentRef = useRef();

    const {
        isForStock,
        isOfAllEquipmentsm,
        isEditMode,
        isAmendmentMode,
        purchaseorderData,
        setPurchaseOrderData,
        paymentTerms,
        workingHrsMode,
        ceoMode,
        showDiscountInTotal,
        equipmentDropdown,
        setEquipmentDropdown,
        companyDropdown,
        attnDropdown,
        equipmentSearch,
        setEquipmentSearch,
        currentEquipmentInput,
        setCurrentEquipmentInput,
        showAddButton,
        setShowAddButton,
        showDiscount,
        setShowDiscount,
        descriptionTooltip,
        handleDescriptionHover,
        hideDescriptionTooltip,
        showDiscountPopup,
        discountInput,
        setDiscountInput,
        showQuotationModal,
        quotationFile,
        quotationPreviewUrl,
        isLoading,
        subtotal,
        totalAmount,
        quotationDisplayMime,
        equipmentRef,
        companyRef,
        attnRef,
        discountPopupRef,
        quotationFileInputRef,
        fetchEquipments,
        savePurchaseOrderData,
        addEquipment,
        removeEquipment,
        handleEquipmentSelect,
        handleEquipmentKeyDown,
        handleCompanySelect,
        handleAttentionSelect,
        handleVendorChange,
        handleAttentionChange,
        handleItemChange,
        addItemRow,
        removeItemRow,
        handleDiscountPopup,
        applyDiscount,
        cancelDiscount,
        handleAttachQuotationYes,
        handleAttachQuotationNo,
        handleQuotationFileChange,
        updatePaymentTerm,
        removePaymentTerm,
        getSignatoryName,
        addPaymentTerm,
        toggleWorkingHrsMode,
        toggleCeoMode,
        toggleDiscountInTotal,
        filteredEquipments,
        filteredCompanies,
        filteredAttentions,
    } = usePurchaseOrderForm({ purchaseOrdersOfStocks, purchaseOrderForAllEquipments, edit: isPurchaseOrderUpdate, amendment, amendmentUpdate });

    const quotationPanel = (quotationFile || purchaseorderData.quotation) && quotationPreviewUrl ? (
        <div className="features screens order purchase form quotation-preview-panel">
            {quotationDisplayMime === 'application/pdf' ? (
                <iframe
                    src={quotationPreviewUrl}
                    title="Quotation Preview"
                    className="features screens order purchase form quotation-preview-frame"
                />
            ) : (
                <img
                    src={quotationPreviewUrl}
                    alt="Quotation Preview"
                    className="features screens order purchase form quotation-preview-image"
                />
            )}
        </div>
    ) : null;

    const itemPages = chunkItems(purchaseorderData.items, ITEMS_PER_PAGE);
    const lastPageIndex = itemPages.length - 1;
    const lastPageItemCount = itemPages[lastPageIndex].length;
    const showTermsInline = lastPageIndex === 0 ? lastPageItemCount < 6 : lastPageItemCount < 13;

    const itemsTableSharedProps = {
        purchaseorderData,
        subtotal,
        totalAmount,
        showDiscountInTotal,
        showDiscount,
        setShowDiscount,
        showAddButton,
        setShowAddButton,
        handleItemChange,
        addItemRow,
        removeItemRow,
        handleDiscountPopup,
        toggleDiscountInTotal,
        isLoading,
        descriptionTooltip,
        onDescriptionHover: handleDescriptionHover,
        onDescriptionLeave: hideDescriptionTooltip,
    };

    const termsSharedProps = {
        paymentTerms,
        updatePaymentTerm,
        removePaymentTerm,
        addPaymentTerm,
        getSignatoryName,
        toggleCeoMode,
        ceoMode,
    };

    return (
        <div className="features screens order purchase form page-container">
            <Controls
                justify="center"
                margin='0 0 20px 0'
                className="features screens order purchase form save-controls"
                items={[{
                    text: isLoading
                        ? (isAmendmentMode ? 'Processing Amendment...' : isEditMode ? 'Updating...' : 'Saving...')
                        : (isAmendmentMode ? 'Save Amendment & Send for Approval' : isEditMode ? 'Update PurchaseOrder' : 'Save PurchaseOrder'),
                    onClick: savePurchaseOrderData,
                    colorScheme: isLoading ? 'success-1000' : 'success-800',
                    width: 'fit-content',
                    type: isLoading ? 'disabled' : 'submit',
                    cursor: 'allowed',
                    ...SHARED_BTN,
                }]}
            />

            <PaperViewport
                left={quotationPanel}
                right={
                    <A2Paper ref={componentRef}>
                        <div className="features screens order purchase form top-divider" />
                        <div className="features screens order purchase form title">PURCHASE/HIRE ORDER</div>

                        <div className="features screens order purchase form details">
                            <table className="features screens order purchase form details-table">
                                <tbody>
                                    <tr>
                                        <td className="features screens order purchase form left-col">

                                            <div className="features screens order purchase form detail-item">
                                                TO :
                                                <span className="features screens order purchase form dropdown-container" ref={companyRef}>
                                                    <input
                                                        type="text"
                                                        className="features screens order purchase form editable-input company-input"
                                                        value={purchaseorderData.vendor}
                                                        onChange={(e) => handleVendorChange(e.target.value)}
                                                        placeholder="Enter company name"
                                                    />
                                                    {companyDropdown && filteredCompanies.length > 0 && (
                                                        <div className="features screens order purchase form dropdown-menu">
                                                            <div className="features screens order purchase form dropdown-options">
                                                                {filteredCompanies.map((company, idx) => (
                                                                    <div key={idx} className="features screens order purchase form dropdown-option" onClick={() => handleCompanySelect(company)}>
                                                                        <div className="features screens order purchase form company-name">{company.vendor}</div>
                                                                        <div className="features screens order purchase form company-details">{company.attention} - {company.designation}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </span>
                                            </div>

                                            <div className="features screens order purchase form detail-item">
                                                ATTN :
                                                <span className="features screens order purchase form dropdown-container" ref={attnRef}>
                                                    <input
                                                        type="text"
                                                        className="features screens order purchase form editable-input attention-input"
                                                        value={purchaseorderData.attention}
                                                        onChange={(e) => handleAttentionChange(e.target.value)}
                                                        placeholder="Enter attention name"
                                                    />
                                                    {attnDropdown && filteredAttentions.length > 0 && (
                                                        <div className="features screens order purchase form dropdown-menu">
                                                            <div className="features screens order purchase form dropdown-options">
                                                                {filteredAttentions.map((company, idx) => (
                                                                    <div key={idx} className="features screens order purchase form dropdown-option" onClick={() => handleAttentionSelect(company)}>
                                                                        <div className="features screens order purchase form attention-name">{company.attention}</div>
                                                                        <div className="features screens order purchase form attention-designation">{company.designation}</div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </span>
                                            </div>

                                            <div className="features screens order purchase form detail-item">
                                                DESIGNATION :
                                                <input
                                                    type="text"
                                                    className="features screens order purchase form editable-input designation-input"
                                                    value={purchaseorderData.designation}
                                                    onChange={(e) => setPurchaseOrderData((prev) => ({ ...prev, designation: e.target.value }))}
                                                    placeholder="Enter designation"
                                                />
                                            </div>

                                            <div className="features screens order purchase form detail-item">
                                                Ref No :
                                                <input
                                                    type="text"
                                                    className="features screens order purchase form editable-input designation-input"
                                                    value={purchaseorderData.quoteNo}
                                                    onChange={(e) => setPurchaseOrderData((prev) => ({ ...prev, quoteNo: e.target.value }))}
                                                    placeholder="Enter Quotation Number"
                                                />
                                            </div>

                                        </td>

                                        <td className="features screens order purchase form right-col">

                                            <div className="features screens order purchase form detail-item">DATE : <span className="features screens order purchase form non-editable">{purchaseorderData.date}</span></div>
                                            <div className="features screens order purchase form detail-item">PurchaseOrder REF NO : <span className="features screens order purchase form non-editable">{purchaseorderData.purchaseorderRef}</span></div>

                                            <div className="features screens order purchase form detail-item">
                                                <div className="features screens order purchase form equip-field">
                                                    <span className="features screens order purchase form equip-field-name">EQUIPMENT :</span>
                                                </div>

                                                {isForStock || isOfAllEquipmentsm ? (
                                                    <span className="features screens order purchase form non-editable">{purchaseorderData.equipments[0]}</span>
                                                ) : (
                                                    <div className="features screens order purchase form equipment-multi-select">

                                                        <div className="features screens order purchase form selected-equipments">
                                                            {purchaseorderData.equipments.map((eq, idx) => (
                                                                <div key={idx} className="features screens order purchase form equipment-tag">
                                                                    {eq}
                                                                    <button className="features screens order purchase form remove-equipment-btn" onClick={() => removeEquipment(idx)}>×</button>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="features screens order purchase form dropdown-container" ref={equipmentRef}>
                                                            <input
                                                                type="text"
                                                                className="features screens order purchase form editable-input equipment-input"
                                                                value={currentEquipmentInput}
                                                                onChange={(e) => setCurrentEquipmentInput(e.target.value)}
                                                                onKeyDown={handleEquipmentKeyDown}
                                                                onFocus={() => { setEquipmentDropdown(true); fetchEquipments(); }}
                                                                placeholder={purchaseorderData.equipments.length ? 'Add another equipment' : 'Select equipment'}
                                                            />
                                                            {equipmentDropdown && (
                                                                <div className="features screens order purchase form dropdown-menu">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Search equipments..."
                                                                        value={equipmentSearch}
                                                                        onChange={(e) => { setEquipmentSearch(e.target.value); fetchEquipments(e.target.value); }}
                                                                        className="features screens order purchase form dropdown-search"
                                                                        autoFocus
                                                                    />
                                                                    <div className="features screens order purchase form dropdown-options">
                                                                        {filteredEquipments.map((eq, idx) => (
                                                                            <div key={idx} className="features screens order purchase form dropdown-option" onClick={() => handleEquipmentSelect(eq)}>
                                                                                <div className="features screens order purchase form equipment-reg">{eq.regNo}</div>
                                                                                <div className="features screens order purchase form equipment-machine">{eq.machine}</div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <Controls
                                                            justify="start"
                                                            wrap={false}
                                                            items={[{
                                                                text: 'Apply',
                                                                onClick: addEquipment,
                                                                colorScheme: 'lime-800',
                                                                width: '100%',
                                                                height: '20px',
                                                                font: 'sm',
                                                                type: currentEquipmentInput.trim() ? 'submit' : 'disabled',
                                                                cursor: currentEquipmentInput.trim() ? 'pointer' : 'not-allowed',
                                                                ...SHARED_BTN,
                                                            }]}
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {!isForStock && !isOfAllEquipmentsm && (
                                                <div className="features screens order purchase form detail-item">
                                                    <span className="features screens order purchase form toggle-field" onClick={toggleWorkingHrsMode}>{workingHrsMode}</span>
                                                    <span>:</span>
                                                    <input
                                                        type="text"
                                                        className="features screens order purchase form editable-input"
                                                        value={workingHrsMode === 'WORKING HRS' ? purchaseorderData.workingHrs : purchaseorderData.runningKm}
                                                        onChange={(e) => {
                                                            const field = workingHrsMode === 'WORKING HRS' ? 'workingHrs' : 'runningKm';
                                                            setPurchaseOrderData((prev) => ({ ...prev, [field]: e.target.value }));
                                                        }}
                                                        placeholder="Enter value"
                                                    />
                                                </div>
                                            )}

                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="features screens order purchase form details-divider" />

                        <div className="features screens order purchase form request-text">
                            <textarea
                                className="features screens order purchase form request-text-input"
                                value={purchaseorderData.requestText}
                                onChange={(e) => setPurchaseOrderData((prev) => ({ ...prev, requestText: e.target.value }))}
                                rows={3}
                            />
                        </div>

                        <EditableItemsTable
                            items={itemPages[0]}
                            startIndex={1}
                            showHeader
                            showTotal={lastPageIndex === 0}
                            {...itemsTableSharedProps}
                        />

                        {lastPageIndex === 0 && showTermsInline && (
                            <TermsAndSignaturesContent {...termsSharedProps} />
                        )}
                    </A2Paper>
                }
            />

            {itemPages.slice(1).map((pageItems, idx) => {
                const pageIndex = idx + 1;
                const isLastItemPage = pageIndex === lastPageIndex;
                const startIndex = itemPages.slice(0, pageIndex).reduce((sum, p) => sum + p.length, 0) + 1;

                return (
                    <A2Paper key={pageIndex}>
                        <div className="features screens order purchase form continuation-divider" />
                        <EditableItemsTable
                            items={pageItems}
                            startIndex={startIndex}
                            showHeader
                            showTotal={isLastItemPage}
                            {...itemsTableSharedProps}
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

            {showDiscountPopup && (
                <div className="features screens order purchase form discount-popup-overlay">
                    <div className="features screens order purchase form discount-popup" ref={discountPopupRef}>
                        <div className="features screens order purchase form discount-popup-header">
                            <h4>Set Discount Amount</h4>
                        </div>
                        <div className="features screens order purchase form discount-popup-content">
                            <p>Subtotal: {subtotal.toFixed(2)} QR</p>
                            <div className="features screens order purchase form discount-input-group">
                                <label htmlFor="discount-input">Discount Amount (QR):</label>
                                <input
                                    id="discount-input"
                                    type="number"
                                    value={discountInput}
                                    onChange={(e) => setDiscountInput(e.target.value)}
                                    placeholder="Enter discount amount"
                                    min="0"
                                    max={subtotal}
                                    step="0.01"
                                    autoFocus
                                />
                            </div>
                            <p className="features screens order purchase form discount-preview">
                                Total after discount: {(subtotal - (parseFloat(discountInput) || 0)).toFixed(2)} QR
                            </p>
                        </div>
                        <Controls
                            justify="end"
                            className="features screens order purchase form discount-popup-actions"
                            items={[
                                { text: 'Apply', onClick: applyDiscount, colorScheme: 'lime-600', width: '100px', font: 'sm', type: isLoading ? 'disabled' : 'submit', cursor: 'allowed', ...SHARED_BTN },
                                { text: 'Cancel', onClick: cancelDiscount, colorScheme: 'primary-700', width: '100px', font: 'sm', type: isLoading ? 'disabled' : 'submit', cursor: 'allowed', ...SHARED_BTN },
                            ]}
                        />
                    </div>
                </div>
            )}

            <input
                type="file"
                ref={quotationFileInputRef}
                style={{ display: 'none' }}
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleQuotationFileChange}
            />

            <Modal
                isOpen={showQuotationModal}
                onClose={handleAttachQuotationNo}
                type="warning"
                title="Attach Quotation"
                message="Do you want to attach a quotation file for this PurchaseOrder?"
                buttonText="Yes, Attach"
                onButtonClick={handleAttachQuotationYes}
                secondaryButtonText="Skip"
                onSecondaryClick={handleAttachQuotationNo}
            />
        </div>
    );
}

export default PurchaseOrderForm;