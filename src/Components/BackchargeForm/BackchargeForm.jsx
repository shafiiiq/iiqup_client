import React, { useEffect, useRef, useState } from 'react';
import logoImage from '../../assets/images/al-ansari-color.png';
import alAnsariText from '../../assets/images/al-ansari-text.png';
import { apiRequest } from '../../utils/api';
import { END_POINT } from '../../constants';
import Button from '../../Common/Button/Button';
import { useHeaderTitle } from '../../Context/HeaderTitleContext';

const BackchargeForm = () => {
    const scopeLine1Ref = useRef(null);
    const workLine1Ref = useRef(null);
    const componentRef = useRef();
    const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [equipmentSuggestions, setEquipmentSuggestions] = useState([]);
    const [supplierSuggestions, setSupplierSuggestions] = useState([]);
    const [siteSuggestions, setSiteSuggestions] = useState([]);
    const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [showSiteDropdown, setShowSiteDropdown] = useState(false);
    const [allBackchargeData, setAllBackchargeData] = useState([]);
    const [isGeneratingRef, setIsGeneratingRef] = useState(false);
    const [ceoMode, setCeoMode] = useState('CEO');
    const toggleCeoMode = () => setCeoMode(prev => prev === 'CEO' ? 'MANAGING DIRECTOR' : 'CEO');
    const getSignatoryName = () => ceoMode === 'CEO' ? 'Ahammed Kamal' : 'Mohammed Shaheen';

    const [formData, setFormData] = useState({
        refNo: '',
        reportNo: '',
        equipmentType: '',
        plateNo: '',
        model: '',
        supplierName: '',
        contactPerson: '',
        siteLocation: '',
        date: '',
        workDate: '',
        scopeOfWork: '',
        scopeLine2Text: '',
        workshopComments: '',
        workSummaryLine2: '',
        sparePartsCost: '',
        labourCharges: '',
        totalCost: '',
        approvedDeduction: '',
        tableRows: Array(7).fill().map(() => ({
            description: '',
            qty: '',
            cost: '',
            total: ''
        }))
    });

    useEffect(() => {
        if (formData.refNo) {
            const title = `Ref No: ${formData.refNo}`
            const subtitle = `Backcharge For: ${formData.supplierName}`;
            setHeaderTitle(title);
            setHeaderSubtitle(subtitle);
        } else {
            setHeaderTitle(null);
            setHeaderSubtitle(null);
        }

        return () => {
            setHeaderTitle(null);
            setHeaderSubtitle(null);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formData.refNo, formData.supplierName]);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const backchargeResponse = await apiRequest(`${END_POINT}/backcharge/get-backcharge-reports`, 'GET');
                if (backchargeResponse.ok) {
                    const data = await backchargeResponse.json();
                    if (data.success && data.data) {
                        setAllBackchargeData(data.data);
                    }
                }

                const refNumber = await generateRefNumber();
                setFormData(prev => ({ ...prev, refNo: refNumber }));
            } catch (error) {
                console.error('Error loading initial data:', error);
            } finally {
                return;
            }
        };

        loadInitialData();
    }, []);

    useEffect(() => {
        const loadImages = async () => {
            try {
                const logoPromise = new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = logoImage;
                });

                const textPromise = new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = alAnsariText;
                });

                await Promise.all([logoPromise, textPromise]);
            } catch (error) {
                console.error('Error loading images:', error);
            }
        };

        loadImages();
    }, []);

    const generateRefNumber = async () => {
        setIsGeneratingRef(true);
        try {
            const response = await apiRequest(`${END_POINT}/backcharge/check-latest-backcharge-ref`, 'GET');
            if (response.ok) {
                const data = await response.json();

                if (data.success && data.data) {
                    const latestNumber = data.data.latestNumber || 140;
                    const currentDate = new Date();
                    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const year = String(currentDate.getFullYear()).slice(-2);
                    const newRefNumber = `ATE${latestNumber + 1}-${month}-${year}`;
                    return newRefNumber;
                }
            }

            const currentDate = new Date();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const year = String(currentDate.getFullYear()).slice(-2);
            return `ATE141-${month}-${year}`;

        } catch (error) {
            console.error('Error generating ref number:', error);
            const currentDate = new Date();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const year = String(currentDate.getFullYear()).slice(-2);
            return `ATE141-${month}-${year}`;
        } finally {
            setIsGeneratingRef(false);
        }
    };

    const searchEquipmentByPlate = (plateNo) => {
        if (!plateNo || plateNo.length < 1) {
            setShowEquipmentDropdown(false);
            return;
        }

        const filteredEquipment = allBackchargeData
            .filter(item => item.plateNo && item.plateNo.toLowerCase().includes(plateNo.toLowerCase()))
            .reduce((acc, current) => {
                const existing = acc.find(item => item.plateNo.toLowerCase() === current.plateNo.toLowerCase());
                if (!existing) {
                    acc.push({
                        plateNo: current.plateNo,
                        equipmentType: current.equipmentType,
                        model: current.model,
                        supplierName: current.supplierName,
                        contactPerson: current.contactPerson
                    });
                }
                return acc;
            }, [])
            .slice(0, 10);

        if (filteredEquipment.length > 0) {
            setEquipmentSuggestions(filteredEquipment);
            setShowEquipmentDropdown(true);
        } else {
            setShowEquipmentDropdown(false);
        }
    };

    const searchSuppliers = (supplierName) => {
        if (!supplierName || supplierName.length < 1) {
            setShowSupplierDropdown(false);
            return;
        }

        const filteredSuppliers = allBackchargeData
            .filter(item => item.supplierName && item.supplierName.toLowerCase().includes(supplierName.toLowerCase()))
            .reduce((acc, current) => {
                const existing = acc.find(item => item.name.toLowerCase() === current.supplierName.toLowerCase());
                if (!existing) {
                    acc.push({
                        name: current.supplierName,
                        contactPerson: current.contactPerson
                    });
                }
                return acc;
            }, [])
            .slice(0, 10);

        if (filteredSuppliers.length > 0) {
            setSupplierSuggestions(filteredSuppliers);
            setShowSupplierDropdown(true);
        } else {
            setShowSupplierDropdown(false);
        }
    };

    const searchSites = (siteLocation) => {
        if (!siteLocation || siteLocation.length < 1) {
            setShowSiteDropdown(false);
            return;
        }

        const filteredSites = allBackchargeData
            .filter(item => item.siteLocation && item.siteLocation.toLowerCase().includes(siteLocation.toLowerCase()))
            .reduce((acc, current) => {
                const existing = acc.find(item => item.location.toLowerCase() === current.siteLocation.toLowerCase());
                if (!existing) {
                    acc.push({
                        location: current.siteLocation
                    });
                }
                return acc;
            }, [])
            .slice(0, 10);

        if (filteredSites.length > 0) {
            setSiteSuggestions(filteredSites);
            setShowSiteDropdown(true);
        } else {
            setShowSiteDropdown(false);
        }
    };

    const handleEquipmentSelect = (equipment) => {
        setFormData(prev => ({
            ...prev,
            plateNo: equipment.plateNo,
            equipmentType: equipment.equipmentType,
            model: equipment.model,
            supplierName: equipment.supplierName,
            contactPerson: equipment.contactPerson
        }));
        setShowEquipmentDropdown(false);
        setEquipmentSuggestions([]);
    };

    const handleSupplierSelect = (supplier) => {
        setFormData(prev => ({
            ...prev,
            supplierName: supplier.name,
            contactPerson: supplier.contactPerson
        }));
        setShowSupplierDropdown(false);
        setSupplierSuggestions([]);
    };

    const handleSiteSelect = (site) => {
        setFormData(prev => ({
            ...prev,
            siteLocation: site.location
        }));
        setShowSiteDropdown(false);
        setSiteSuggestions([]);
    };

    const handleInputChangeWithSearch = (field, value) => {
        handleInputChange(field, value);

        if (field === 'plateNo') {
            clearTimeout(window.plateNoTimeout);
            window.plateNoTimeout = setTimeout(() => searchEquipmentByPlate(value), 300);
        } else if (field === 'supplierName') {
            clearTimeout(window.supplierTimeout);
            window.supplierTimeout = setTimeout(() => searchSuppliers(value), 300);
        } else if (field === 'siteLocation') {
            clearTimeout(window.siteTimeout);
            window.siteTimeout = setTimeout(() => searchSites(value), 300);
        }

        if (!value) {
            if (field === 'plateNo') setShowEquipmentDropdown(false);
            if (field === 'supplierName') setShowSupplierDropdown(false);
            if (field === 'siteLocation') setShowSiteDropdown(false);
        }
    };

    const saveBackchargeData = async () => {
        setIsLoading(true);
        setSaveStatus('');

        try {
            const backchargeData = {
                reportNo: formData.reportNo,
                refNo: formData.refNo,
                equipmentType: formData.equipmentType,
                plateNo: formData.plateNo,
                model: formData.model,
                supplierName: formData.supplierName,
                contactPerson: formData.contactPerson,
                siteLocation: formData.siteLocation,
                date: formData.date,
                workDate: formData.workDate,
                scopeOfWork: formData.scopeOfWork,
                scopeLine2Text: formData.scopeLine2Text,
                workshopComments: formData.workshopComments,
                workSummaryLine2: formData.workSummaryLine2,
                sparePartsCost: formData.sparePartsCost,
                labourCharges: formData.labourCharges,
                totalCost: formData.totalCost,
                approvedDeduction: formData.approvedDeduction,
                authorizedSignatoryMode: ceoMode,
                authorizedSignatoryName: getSignatoryName(),
                tableRows: formData.tableRows.filter(row =>
                    row.description || row.qty || row.cost || row.total
                )
            };

            const response = await apiRequest(`${END_POINT}/backcharge/add-backcharge`, 'POST', backchargeData);

            if (response.ok) {
                setSaveStatus('success');
                setTimeout(() => setSaveStatus(''), 3000);
            } else {
                setSaveStatus('error');
                console.error('Failed to save backcharge data:', response.message);
            }

        } catch (error) {
            setSaveStatus('error');
            console.error('Error saving backcharge data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScopeOverflow = (value) => {
        if (!scopeLine1Ref.current) return;

        const input = scopeLine1Ref.current;
        const maxWidth = input.offsetWidth;

        const temp = document.createElement('span');
        temp.style.font = window.getComputedStyle(input).font;
        temp.style.visibility = 'hidden';
        temp.style.position = 'absolute';
        temp.style.whiteSpace = 'nowrap';
        document.body.appendChild(temp);

        let line1Text = '';
        let line2Text = '';

        for (let i = 0; i < value.length; i++) {
            temp.textContent = line1Text + value[i];
            const newWidth = temp.offsetWidth;

            if (newWidth <= maxWidth - 20) {
                line1Text += value[i];
            } else {
                line2Text = value.substring(i);
                break;
            }
        }

        document.body.removeChild(temp);

        setFormData(prev => ({
            ...prev,
            scopeOfWork: line1Text,
            scopeLine2Text: line2Text
        }));
    };

    const handleWorkSummaryOverflow = (value) => {
        if (!workLine1Ref.current) return;

        const input = workLine1Ref.current;
        const maxWidth = input.offsetWidth;

        const temp = document.createElement('span');
        temp.style.font = window.getComputedStyle(input).font;
        temp.style.visibility = 'hidden';
        temp.style.position = 'absolute';
        temp.style.whiteSpace = 'nowrap';
        document.body.appendChild(temp);

        let line1Text = '';
        let line2Text = '';

        for (let i = 0; i < value.length; i++) {
            temp.textContent = line1Text + value[i];
            const newWidth = temp.offsetWidth;

            if (newWidth <= maxWidth - 20) {
                line1Text += value[i];
            } else {
                line2Text = value.substring(i);
                break;
            }
        }

        document.body.removeChild(temp);

        setFormData(prev => ({
            ...prev,
            workshopComments: line1Text,
            workSummaryLine2: line2Text
        }));
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTableChange = (index, field, value) => {
        setFormData(prev => {
            const newTableRows = prev.tableRows.map((row, i) => {
                if (i === index) {
                    const updatedRow = { ...row, [field]: value };
                    if (field === 'qty' || field === 'cost') {
                        const qty = parseFloat(field === 'qty' ? value : row.qty) || 0;
                        const cost = parseFloat(field === 'cost' ? value : row.cost) || 0;
                        updatedRow.total = (qty * cost).toFixed(2);
                    }

                    return updatedRow;
                }
                return row;
            });

            const grandTotal = newTableRows.reduce((sum, row) => {
                return sum + (parseFloat(row.total) || 0);
            }, 0);

            const labourCharges = parseFloat(prev.labourCharges) || 0;
            const totalCost = grandTotal + labourCharges;

            return {
                ...prev,
                tableRows: newTableRows,
                sparePartsCost: grandTotal.toFixed(2),
                totalCost: totalCost.toFixed(2)
            };
        });
    };

    const handleLabourChargeChange = (value) => {
        setFormData(prev => {
            const labourCharges = parseFloat(value) || 0;
            const sparePartsCost = parseFloat(prev.sparePartsCost) || 0;
            const totalCost = sparePartsCost + labourCharges;

            return {
                ...prev,
                labourCharges: value,
                totalCost: totalCost.toFixed(2)
            };
        });
    };

    const renderTableRows = () => {
        return formData.tableRows.map((row, index) => (
            <tr key={index}>
                <td className="bcr-parts-table-cell bcr-parts-table-center ">{index + 1}</td>
                <td className="bcr-parts-table-cell bcr-parts-table-desc sign-border-td-l sign-border-td-r">
                    <input
                        type="text"
                        value={row.description}
                        onChange={(e) => handleTableChange(index, 'description', e.target.value)}
                        style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 'inherit',
                            padding: '0'
                        }}
                    />
                </td>
                <td className="bcr-parts-table-cell sign-border-td-r">
                    <input
                        type="text"
                        value={row.qty}
                        onChange={(e) => handleTableChange(index, 'qty', e.target.value)}
                        style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 'inherit',
                            padding: '0',
                            textAlign: 'center'
                        }}
                    />
                </td>
                <td className="bcr-parts-table-cell sign-border-td-r">
                    <input
                        type="text"
                        value={row.cost}
                        onChange={(e) => handleTableChange(index, 'cost', e.target.value)}
                        style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 'inherit',
                            padding: '0',
                            textAlign: 'center'
                        }}
                    />
                </td>
                <td className="bcr-parts-table-cell">
                    <input
                        type="text"
                        value={row.total}
                        onChange={(e) => handleTableChange(index, 'total', e.target.value)}
                        style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 'inherit',
                            padding: '0',
                            textAlign: 'center'
                        }}
                    />
                </td>
            </tr>
        ));
    };

    return (
        <div className="bcr-hero-wrapper">
            {/* handle print and donwload html  */}
            <div className="bcr-controls">
                {/* Save Status Display */}
                {saveStatus && (
                    <div className={`bcr-save-status ${saveStatus === 'success' ? 'success' : 'error'}`}>
                        {saveStatus === 'success' ? '✓ Saved successfully!' : '✗ Save failed!'}
                    </div>
                )}

                <div className="bcr-button-group">
                    <Button
                        text={isLoading ? 'Saving...' : 'Save Report'}
                        onClick={saveBackchargeData}
                        colorScheme="lime-700"
                        variant="gradient"
                        font="md"
                        animation=""
                        squircle="4xl"
                        width="160px"
                        height="38px"
                        type={isLoading ? 'didabled' : 'submit'}
                        textColor="white-200"
                        shadowPosition="to-bottom"
                        shadowColor="white-600"
                    />
                </div>
            </div>
            {/* handle print and download html ends */}
            <div ref={componentRef} className="bcr-main-wrapper">
                <div className="bcr-container">
                    <div className="bcr-report-border">
                        {/* Header Section */}
                        <header className="bcr-header-section">
                            <div className="bcr-logo-container">
                                <div className="logo-placeholder-l">
                                    <img src={logoImage} alt="Company Logo" />
                                </div>
                            </div>
                            <div className="company-details-b company-details-l">
                                <img src={alAnsariText} alt="AL Ansari Transport & Enterprises W.L.L" />
                            </div>
                        </header>

                        {/* Document Title */}
                        <h1 className="bcr-document-title">MAINTENANCE BACK CHARGE REPORT</h1>

                        {/* Information Grid */}
                        <div className="bcr-info-grid sign-border-td-l">
                            <div className="bcr-info-full-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="bcr-info-field" style={{ display: 'flex', alignItems: 'center' }}>
                                    <span className="bcr-field-label">Ref No  :</span>
                                    <span className="bcr-field-value">{isGeneratingRef ? 'Generating...' : formData.refNo || 'Loading...'}</span>
                                </div>
                                <div className="bcr-info-field" style={{ display: 'flex', alignItems: 'center' }}>
                                    <span className="bcr-field-label">Date :</span>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => handleInputChange('date', e.target.value)}
                                        style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 'inherit' }}
                                    />
                                </div>
                            </div>
                            <div className='sign-border-td-r sign-border-td-b sign-border-td-t bcr-title-hero'>
                                <div className="bcr-info-full-row">
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Report No</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.reportNo}
                                            onChange={(e) => handleInputChange('reportNo', e.target.value)}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-info-full-row">
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Equipment Type</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.equipmentType}
                                            onChange={(e) => handleInputChange('equipmentType', e.target.value)}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-info-full-row" style={{ position: 'relative' }}>
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Plate No</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.plateNo}
                                            onChange={(e) => handleInputChangeWithSearch('plateNo', e.target.value)}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{ border: 'none', outline: 'none', background: 'transparent' }}
                                            placeholder="Enter plate number..."
                                        />
                                        {showEquipmentDropdown && equipmentSuggestions.length > 0 && (
                                            <div className="dropdown-suggestions">
                                                {equipmentSuggestions.map((equipment, index) => (
                                                    <div key={index} className="dropdown-item" onClick={() => handleEquipmentSelect(equipment)}>
                                                        <strong>{equipment.plateNo}</strong> - {equipment.equipmentType}
                                                        <br />
                                                        <small>{equipment.supplierName}</small>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bcr-info-full-row">
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Model</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.model}
                                            onChange={(e) => handleInputChange('model', e.target.value)}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-info-full-row" style={{ position: 'relative' }}>
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Supplier Name</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.supplierName}
                                            onChange={(e) => handleInputChangeWithSearch('supplierName', e.target.value)}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{ border: 'none', outline: 'none', background: 'transparent' }}
                                            placeholder="Enter supplier name..."
                                        />
                                        {showSupplierDropdown && supplierSuggestions.length > 0 && (
                                            <div className="dropdown-suggestions">
                                                {supplierSuggestions.map((supplier, index) => (
                                                    <div key={index} className="dropdown-item" onClick={() => handleSupplierSelect(supplier)}>
                                                        <strong>{supplier.name}</strong>
                                                        <br />
                                                        <small>Contact: {supplier.contactPerson}</small>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bcr-info-full-row">
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Contact Person</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.contactPerson}
                                            onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-info-full-row" style={{ position: 'relative' }}>
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Site Location</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.siteLocation}
                                            onChange={(e) => handleInputChangeWithSearch('siteLocation', e.target.value)}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{ border: 'none', outline: 'none', background: 'transparent' }}
                                            placeholder="Enter site location..."
                                        />
                                        {showSiteDropdown && siteSuggestions.length > 0 && (
                                            <div className="dropdown-suggestions">
                                                {siteSuggestions.map((site, index) => (
                                                    <div key={index} className="dropdown-item" onClick={() => handleSiteSelect(site)}>
                                                        {site.location}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bcr-info-full-row">
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide ">Work Date</span>
                                        <span>:</span>
                                        <span className="bcr-field-value-bold text-data-underline mr-l-2">
                                            <input
                                                type="date"
                                                value={formData.workDate}
                                                onChange={(e) => handleInputChange('workDate', e.target.value)}
                                                style={{
                                                    border: 'none',
                                                    outline: 'none',
                                                    background: 'transparent',
                                                    fontSize: 'inherit'
                                                }}
                                            />
                                            <span className="bcr-signature-label">Customer Signature & Date : </span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scope of Work */}
                        <div className="bcr-scope-section">
                            <div className='bcr-scope-section-sub'>
                                <span className="bcr-scope-label">Scope of Work :-</span>
                                <input
                                    ref={scopeLine1Ref}
                                    type="text"
                                    value={formData.scopeOfWork}
                                    onChange={(e) => handleScopeOverflow(e.target.value)}
                                    className='text-data-underline scope-value scope-line-1'
                                    style={{
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        fontSize: 'inherit'
                                    }}
                                />

                            </div>
                            <input
                                type="text"
                                value={formData.scopeLine2Text || ''}
                                onChange={(e) => handleInputChange('scopeLine2Text', e.target.value)}
                                className='text-data-underline scope-value-couple scope-line-2'
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    fontSize: 'inherit'
                                }}
                            />
                        </div>

                        {/* Parts and Materials Table */}
                        <div className="bcr-parts-section sign-border-td-l">
                            <h3 className="bcr-parts-header">DETAILS OF SPARE PARTS & OTHER MATERIALS USED :</h3>

                            <table className="bcr-parts-table">
                                <thead>
                                    <tr className="bcr-parts-table-header-row">
                                        <th className="bcr-parts-table-header bcr-parts-table-sl">SL</th>
                                        <th className="bcr-parts-table-header bcr-parts-table-desc-header sign-border-td-r sign-border-td-l">PART DESCRIPTION</th>
                                        <th className="bcr-parts-table-header bcr-parts-table-qty sign-border-td-r">QTY</th>
                                        <th className="bcr-parts-table-header bcr-parts-table-cost sign-border-td-r">COST</th>
                                        <th className="bcr-parts-table-header bcr-parts-table-total">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {renderTableRows()}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td className="bcr-parts-table-footer bcr-parts-table-total-label" colSpan="4">TOTAL</td>
                                        <td className="bcr-parts-table-footer sign-border-td-l">
                                            {formData.tableRows.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0).toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Workshop Manager Comments */}
                        <div className="bcr-comments-section">
                            <span className="bcr-comments-label">Workshop Manager's Comments/ Work Summary :-</span>
                            <input
                                ref={workLine1Ref}
                                type="text"
                                value={formData.workshopComments}
                                onChange={(e) => handleWorkSummaryOverflow(e.target.value)}
                                className="bcr-comments-text text-data-underline work-summary-line-1"
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    width: 'calc(100% - 4.5rem)'
                                }}
                            />
                            <input
                                type="text"
                                value={formData.workSummaryLine2}
                                onChange={(e) => handleInputChange('workSummaryLine2', e.target.value)}
                                className="work-summary-line-2 text-data-underline"
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                }}
                            />
                        </div>

                        {/* Cost Summary */}
                        <div className="bcr-cost-summary-section">
                            <h3 className="bcr-cost-summary-title">Summary of Costs :</h3>
                            <div className="bcr-cost-summary-content">
                                <div className="bcr-cost-row">
                                    <span className="bcr-cost-label">Spare Parts & Materials</span>
                                    <div className="bcr-cost-value-container">
                                        <span className='price-colon'>:</span>
                                        <span className="bcr-currency">QR</span>
                                        <input
                                            type="text"
                                            value={formData.sparePartsCost}
                                            readOnly
                                            className="bcr-cost-amount"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                color: '#666'
                                            }}
                                            title="Auto-calculated from table totals"
                                        />
                                    </div>
                                </div>
                                <div className="bcr-cost-row">
                                    <span className="bcr-cost-label">Labour Charges</span>
                                    <div className="bcr-cost-value-container">
                                        <span className='price-colon'>:</span>
                                        <span className="bcr-currency">QR</span>
                                        <input
                                            type="text"
                                            value={formData.labourCharges}
                                            onChange={(e) => handleLabourChargeChange(e.target.value)}
                                            className="bcr-cost-amount"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-cost-row">
                                    <span className="bcr-cost-label">Total Cost</span>
                                    <div className="bcr-cost-value-container">
                                        <span className='price-colon'>:</span>
                                        <span className="bcr-currency">QR</span>
                                        <input
                                            type="text"
                                            value={formData.totalCost}
                                            readOnly
                                            className="bcr-cost-amount"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                color: '#666'
                                            }}
                                            title="Auto-calculated: Spare Parts + Labour"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bcr-deduction-row">
                                <span className="bcr-deduction-label">Approved Cost of Deduction from Supplier :-</span>
                                <div className="bcr-deduction-value-container">
                                    <span className='price-colon'>:</span>
                                    <span className="bcr-currency">QR</span>
                                    <input
                                        type="text"
                                        value={formData.approvedDeduction}
                                        onChange={(e) => handleInputChange('approvedDeduction', e.target.value)}
                                        className="bcr-cost-amount"
                                        style={{
                                            border: 'none',
                                            outline: 'none',
                                            background: 'transparent'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Authorization Table */}
                        <div className="bcr-auth-section">
                            <table className="bcr-auth-table">
                                <thead>
                                    <tr className="bcr-auth-header-row">
                                        <th className="bcr-auth-header">Workshop Manager</th>
                                        <th className="bcr-auth-header">Purchase Manager</th>
                                        <th className="bcr-auth-header">Operations Manager</th>
                                        <th className="bcr-auth-header sign-border-td-r">Authorized Signatory</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="bcr-auth-cell bcr-auth-signature-space"></td>
                                        <td className="bcr-auth-cell"></td>
                                        <td className="bcr-auth-cell"></td>
                                        <td className="bcr-auth-cell sign-border-td-r"></td>
                                    </tr>
                                    <tr>
                                        <td className="bcr-auth-cell bcr-auth-name sign-border-td-b">Firoz Khan</td>
                                        <td className="bcr-auth-cell bcr-auth-name sign-border-td-b">Abdul Malik</td>
                                        <td className="bcr-auth-cell bcr-auth-name sign-border-td-b">Suresh Kanth</td>
                                        <td className="bcr-auth-cell bcr-auth-name sign-border-td-r sign-border-td-b">
                                            <span className="toggle-field" onClick={toggleCeoMode}>
                                                {getSignatoryName()}
                                            </span>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackchargeForm;