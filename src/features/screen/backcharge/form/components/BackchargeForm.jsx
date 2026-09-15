import { useRef } from 'react';

import A2Paper from '@/shared/components/widgets/paper/A2Paper';
import Controls from '@/shared/components/widgets/controls/Controls';

import useBackchargeForm from '../hooks/useBackchargeForm';
import { SHARED_BTN } from '../constants/backcharge.form.constant';

import './BackchargeForm.css';

const BackchargeForm = () => {
    const componentRef = useRef();

    const {
        isLoading,
        saveStatus,
        equipmentSuggestions,
        supplierSuggestions,
        siteSuggestions,
        showEquipmentDropdown,
        showSupplierDropdown,
        showSiteDropdown,
        isGeneratingRef,
        toggleCeoMode,
        getSignatoryName,
        formData,
        saveBackchargeData,
        handleScopeOverflow,
        handleWorkSummaryOverflow,
        handleInputChange,
        handleInputChangeWithSearch,
        handleTableChange,
        handleLabourChargeChange,
        handleEquipmentSelect,
        handleSupplierSelect,
        handleSiteSelect,
        grandPartsTotal
    } = useBackchargeForm();

    // Field configuration for the title-hero block. Mirrors the report's
    // static field list, but adds autocomplete-dropdown metadata for the
    // three searchable fields.
    const fieldsConfig = [
        { field: 'reportNo', label: 'Report No' },
        { field: 'equipmentType', label: 'Equipment Type' },
        {
            field: 'plateNo',
            label: 'Plate No',
            dropdown: {
                show: showEquipmentDropdown,
                suggestions: equipmentSuggestions,
                onSelect: handleEquipmentSelect,
                placeholder: 'Enter plate number...',
                renderItem: (equipment) => (
                    <>
                        <strong>{equipment.plateNo}</strong> - {equipment.equipmentType}
                        <br />
                        <small>{equipment.supplierName}</small>
                    </>
                ),
            },
        },
        { field: 'model', label: 'Model' },
        {
            field: 'supplierName',
            label: 'Supplier Name',
            dropdown: {
                show: showSupplierDropdown,
                suggestions: supplierSuggestions,
                onSelect: handleSupplierSelect,
                placeholder: 'Enter supplier name...',
                renderItem: (supplier) => (
                    <>
                        <strong>{supplier.name}</strong>
                        <br />
                        <small>Contact: {supplier.contactPerson}</small>
                    </>
                ),
            },
        },
        { field: 'contactPerson', label: 'Contact Person' },
        {
            field: 'siteLocation',
            label: 'Site Location',
            dropdown: {
                show: showSiteDropdown,
                suggestions: siteSuggestions,
                onSelect: handleSiteSelect,
                placeholder: 'Enter site location...',
                renderItem: (site) => site.location,
            },
        },
    ];

    return (
        <div className="features screens backcharge form page">
            <Controls
                width="297mm"
                justify="flex-end"
                margin="0 auto 20px"
                items={[{
                    text: isLoading ? 'Saving...' : 'Save Report',
                    onClick: saveBackchargeData,
                    colorScheme: isLoading ? 'success-1000' : 'success-800',
                    width: '160px',
                    type: isLoading ? 'disabled' : 'submit',
                    cursor: 'allowed',
                    ...SHARED_BTN,
                }]}
            />

            {saveStatus && (
                <div className={`features screens backcharge form save status features screens backcharge form save status ${saveStatus === 'success' ? 'success' : 'error'}`}>
                    {saveStatus === 'success' ? '✓ Saved successfully!' : '✗ Save failed!'}
                </div>
            )}

            <A2Paper ref={componentRef}>
                <h1 className="features screens backcharge form main title">MAINTENANCE BACK CHARGE REPORT</h1>

                <div className="features screens backcharge form info grid">
                    <div className="features screens backcharge form info full row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div className="features screens backcharge form info field" style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="features screens backcharge form field label">Ref No :</span>
                            <span className="features screens backcharge form field value">{isGeneratingRef ? 'Generating...' : formData.refNo || 'Loading...'}</span>
                        </div>
                        <div className="features screens backcharge form info field" style={{ display: 'flex', alignItems: 'center' }}>
                            <span className="features screens backcharge form field label">Date :</span>
                            <input
                                type="date"
                                value={formData.date}
                                onChange={(e) => handleInputChange('date', e.target.value)}
                                className="features screens backcharge form editable input"
                            />
                        </div>
                    </div>

                    <div className="features screens backcharge form title hero">
                        {fieldsConfig.map(({ field, label, dropdown }) => (
                            <div
                                key={field}
                                className={
                                    dropdown
                                        ? 'features screens backcharge form info full row features screens backcharge form dropdown anchor'
                                        : 'features screens backcharge form info full row'
                                }
                            >
                                <div className="features screens backcharge form info field">
                                    <span className="features screens backcharge form field label wide">{label}</span>
                                    <span>:</span>
                                    <input
                                        type="text"
                                        value={formData[field] ?? ''}
                                        onChange={(e) => (dropdown
                                            ? handleInputChangeWithSearch(field, e.target.value)
                                            : handleInputChange(field, e.target.value))}
                                        className="features screens backcharge form field value bold features screens backcharge form text underline features screens backcharge form editable input"
                                        placeholder={dropdown ? dropdown.placeholder : undefined}
                                    />
                                    {dropdown && dropdown.show && dropdown.suggestions.length > 0 && (
                                        <div className="features screens backcharge form dropdown suggestions">
                                            {dropdown.suggestions.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    className="features screens backcharge form dropdown item"
                                                    onClick={() => dropdown.onSelect(item)}
                                                >
                                                    {dropdown.renderItem(item)}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        <div className="features screens backcharge form info full row">
                            <div className="features screens backcharge form info field">
                                <span className="features screens backcharge form field label wide">Work Date</span>
                                <span>:</span>
                                <span className="features screens backcharge form field value bold features screens backcharge form text underline">
                                    <input
                                        type="date"
                                        value={formData.workDate}
                                        onChange={(e) => handleInputChange('workDate', e.target.value)}
                                        className="features screens backcharge form editable input"
                                    />
                                    <span className="features screens backcharge form signature label">Customer Signature &amp; Date : </span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="features screens backcharge form scope section">
                    <div className="features screens backcharge form scope section sub">
                        <span className="features screens backcharge form scope label">Scope of Work :-</span>
                        <input
                            type="text"
                            value={formData.scopeOfWork}
                            onChange={(e) => handleScopeOverflow(e.target.value)}
                            className="features screens backcharge form text underline features screens backcharge form scope value features screens backcharge form editable input"
                        />
                    </div>
                </div>

                <div className="features screens backcharge form parts section">
                    <h3 className="features screens backcharge form parts header">DETAILS OF SPARE PARTS &amp; OTHER MATERIALS USED :</h3>
                    <table className="features screens backcharge form parts table">
                        <thead>
                            <tr>
                                <th className="features screens backcharge form parts table header features screens backcharge form parts table sl">SL</th>
                                <th className="features screens backcharge form parts table header features screens backcharge form parts table desc header">PART DESCRIPTION</th>
                                <th className="features screens backcharge form parts table header features screens backcharge form parts table qty">QTY</th>
                                <th className="features screens backcharge form parts table header features screens backcharge form parts table cost">COST</th>
                                <th className="features screens backcharge form parts table header features screens backcharge form parts table total">TOTAL</th>
                            </tr>
                        </thead>
                        <tbody>
                            {formData.tableRows.map((row, index) => (
                                <tr key={index}>
                                    <td className="features screens backcharge form parts table cell features screens backcharge form parts table center">{index + 1}</td>
                                    <td className="features screens backcharge form parts table cell features screens backcharge form parts table desc">
                                        <input
                                            type="text"
                                            value={row.description}
                                            onChange={(e) => handleTableChange(index, 'description', e.target.value)}
                                            className="features screens backcharge form table input"
                                            style={{ width: '100%' }}
                                        />
                                    </td>
                                    <td className="features screens backcharge form parts table cell">
                                        <input
                                            type="text"
                                            value={row.qty}
                                            onChange={(e) => handleTableChange(index, 'qty', e.target.value)}
                                            className="features screens backcharge form table input features screens backcharge form text center"
                                            style={{ width: '100%' }}
                                        />
                                    </td>
                                    <td className="features screens backcharge form parts table cell">
                                        <input
                                            type="text"
                                            value={row.cost}
                                            onChange={(e) => handleTableChange(index, 'cost', e.target.value)}
                                            className="features screens backcharge form table input features screens backcharge form text center"
                                            style={{ width: '100%' }}
                                        />
                                    </td>
                                    <td className="features screens backcharge form parts table cell">
                                        <input
                                            type="text"
                                            value={row.total}
                                            onChange={(e) => handleTableChange(index, 'total', e.target.value)}
                                            className="features screens backcharge form table input features screens backcharge form text center"
                                            style={{ width: '100%' }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td className="features screens backcharge form parts table footer features screens backcharge form parts table total label" colSpan="4">TOTAL</td>
                                <td className="features screens backcharge form parts table footer features screens backcharge form text center">{grandPartsTotal}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div className="features screens backcharge form comments section">
                    <span className="features screens backcharge form comments label">Workshop Manager's Comments/ Work Summary :-</span>
                    <input
                        type="text"
                        value={formData.workshopComments}
                        onChange={(e) => handleWorkSummaryOverflow(e.target.value)}
                        className="features screens backcharge form comments text features screens backcharge form text underline"
                        style={{ width: 'calc(100% - 4.5rem)', marginLeft: '4.5rem' }}
                    />
                    <input
                        type="text"
                        value={formData.workSummaryLine2}
                        onChange={(e) => handleInputChange('workSummaryLine2', e.target.value)}
                        className="features screens backcharge form comments text features screens backcharge form text underline"
                        style={{ width: '100%' }}
                    />
                    <input
                        type="text"
                        value={formData.workSummaryLine3}
                        onChange={(e) => handleInputChange('workSummaryLine3', e.target.value)}
                        className="features screens backcharge form comments text features screens backcharge form text underline"
                        style={{ width: '100%' }}
                    />
                    <input
                        type="text"
                        value={formData.workSummaryLine4}
                        onChange={(e) => handleInputChange('workSummaryLine4', e.target.value)}
                        className="features screens backcharge form comments text features screens backcharge form text underline"
                        style={{ width: '100%' }}
                    />
                </div>

                <div className="features screens backcharge form cost summary section">
                    <h3 className="features screens backcharge form cost summary title">Summary of Costs :</h3>
                    <div className="features screens backcharge form cost summary content">
                        <div className="features screens backcharge form cost row">
                            <span className="features screens backcharge form cost label">Spare Parts &amp; Materials</span>
                            <div className="features screens backcharge form cost value container">
                                <span className="features screens backcharge form price colon">:</span>
                                <span className="features screens backcharge form currency">QR</span>
                                <input
                                    type="text"
                                    value={formData.sparePartsCost}
                                    readOnly
                                    className="features screens backcharge form cost amount features screens backcharge form readonly field"
                                    title="Auto-calculated from table totals"
                                />
                            </div>
                        </div>
                        <div className="features screens backcharge form cost row">
                            <span className="features screens backcharge form cost label">Labour Charges</span>
                            <div className="features screens backcharge form cost value container">
                                <span className="features screens backcharge form price colon">:</span>
                                <span className="features screens backcharge form currency">QR</span>
                                <input
                                    type="text"
                                    value={formData.labourCharges}
                                    onChange={(e) => handleLabourChargeChange(e.target.value)}
                                    className="features screens backcharge form cost amount"
                                />
                            </div>
                        </div>
                        <div className="features screens backcharge form cost row">
                            <span className="features screens backcharge form cost label">Total Cost</span>
                            <div className="features screens backcharge form cost value container">
                                <span className="features screens backcharge form price colon">:</span>
                                <span className="features screens backcharge form currency">QR</span>
                                <input
                                    type="text"
                                    value={formData.totalCost}
                                    readOnly
                                    className="features screens backcharge form cost amount features screens backcharge form readonly field"
                                    title="Auto-calculated: Spare Parts + Labour"
                                />
                            </div>
                        </div>
                    </div>
                    <div className="features screens backcharge form deduction row">
                        <span className="features screens backcharge form deduction label">Approved Cost of Deduction from Supplier :-</span>
                        <div className="features screens backcharge form deduction value container">
                            <span className="features screens backcharge form price colon">:</span>
                            <span className="features screens backcharge form currency">QR</span>
                            <input
                                type="text"
                                value={formData.approvedDeduction}
                                onChange={(e) => handleInputChange('approvedDeduction', e.target.value)}
                                className="features screens backcharge form cost amount"
                            />
                        </div>
                    </div>
                </div>

                <div className="features screens backcharge form auth section">
                    <table className="features screens backcharge form auth table">
                        <thead>
                            <tr>
                                <th className="features screens backcharge form auth header">Workshop Manager</th>
                                <th className="features screens backcharge form auth header">Purchase Manager</th>
                                <th className="features screens backcharge form auth header">Operations Manager</th>
                                <th className="features screens backcharge form auth header">Authorized Signatory</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td className="features screens backcharge form auth cell features screens backcharge form auth signature space" />
                                <td className="features screens backcharge form auth cell" />
                                <td className="features screens backcharge form auth cell" />
                                <td className="features screens backcharge form auth cell" />
                            </tr>
                            <tr>
                                <td className="features screens backcharge form auth cell features screens backcharge form auth name">Firoz Khan</td>
                                <td className="features screens backcharge form auth cell features screens backcharge form auth name">Abdul Malik</td>
                                <td className="features screens backcharge form auth cell features screens backcharge form auth name">Suresh Kanth</td>
                                <td className="features screens backcharge form auth cell features screens backcharge form auth name">
                                    <span
                                        className="features screens backcharge form toggle field"
                                        style={{ cursor: 'pointer' }}
                                        onClick={toggleCeoMode}
                                    >
                                        {getSignatoryName()}
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </A2Paper>
        </div>
    );
};

export default BackchargeForm;