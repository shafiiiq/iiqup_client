import React, { useState, useRef, useEffect } from 'react';
import './Lpo.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logoImage from '../../assets/images/al-ansari.png';
import alAnsariText from '../../assets/images/al-ansari-text.png';
import footer from '../../assets/images/footer.png';
import { END_POINT } from '../../constants';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../../utils/0auth';

const Lpo = ({ isStock, isAllEquip }) => {
  const { regNo } = useParams();
  const isForStock = isStock;
  const isForAllEquipm = isAllEquip;

  const navigate = useNavigate();

  const [lpoCounter, setLpoCounter] = useState(1);
  const [workingHrsMode, setWorkingHrsMode] = useState('WORKING HRS');
  const [ceoMode, setCeoMode] = useState('CEO');
  const [equipmentDropdown, setEquipmentDropdown] = useState(false);
  const [companyDropdown, setCompanyDropdown] = useState(false);
  const [attnDropdown, setAttnDropdown] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [equipments, setEquipments] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showAddButton, setShowAddButton] = useState(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [showDiscountInTotal, setShowDiscountInTotal] = useState(true);
  const [paymentTerms, setPaymentTerms] = useState([
    'Payment will be made within 90 days from the day of submission of invoice'
  ]);

  const [lpoData, setLpoData] = useState({
    vendor: '',
    equipments: [],
    date: new Date().toLocaleDateString('en-GB'),
    lpoRef: '',
    attention: '',
    designation: '',
    quoteNo: '',
    workingHrs: '',
    runningKm: '',
    requestText: 'You are requested to supply the following item for above mentioned material at the terms and conditions described below and submit your bill for settlement.',
    items: [
      {
        id: 1,
        description: '',
        quantity: null,
        unitPrice: null,
        totalPrice: 0
      }
    ],
    discount: 0
  });

  const [currentEquipmentInput, setCurrentEquipmentInput] = useState('');

  const componentRef = useRef();
  const equipmentRef = useRef();
  const companyRef = useRef();
  const attnRef = useRef();
  const discountPopupRef = useRef();

  const generateLpoRef = (lpoNumber) => {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    return `ATE${lpoNumber}/SP/${month}/${year}`;
  };

  useEffect(() => {
    fetchLatestLpoNumber();
    handleRouteSpecificLogic();
  }, [regNo]);

  const handleRouteSpecificLogic = async () => {
    if (isForStock) {
      setLpoData(prev => ({
        ...prev,
        equipments: ['For Stock'], // Set as array with "For Stock" string
        workingHrs: '',
        runningKm: ''
      }));
    } else if (isForAllEquipm) {
      setLpoData(prev => ({
        ...prev,
        equipments: ['For all equipment'], // Set as array with "For all equipment" string
        workingHrs: '',
        runningKm: ''
      }));
    } else if (regNo) {
      try {
        const response = await apiRequest(`${END_POINT}/equipments/get-equipments`, 'GET');
        const data = await response.json();
        const equipment = data.data?.find(eq => eq.regNo === regNo);

        if (equipment) {
          setSelectedEquipment(equipment);
          setLpoData(prev => ({
            ...prev,
            equipments: [`${equipment.regNo} – ${equipment.machine}`] // Set as array with equipment string
          }));
        }
      } catch (error) {
        console.error('Error fetching equipment:', error);
      }
    }
  };

  const fetchLatestLpoNumber = async () => {
    try {
      const response = await apiRequest(`${END_POINT}/lpo/check-latest-lpo-ref`);
      const data = await response.json();

      let latestLpoNumber;

      // Check for latestRef instead of lpoCounter
      if (data.success && data.data && data.data.latestRef) {
        latestLpoNumber = data.data.latestRef;
      }

      const newLpoNumber = parseInt(latestLpoNumber) + 1;

      setLpoCounter(newLpoNumber);
      setLpoData(prev => ({
        ...prev,
        lpoRef: generateLpoRef(newLpoNumber)
      }));
    } catch (error) {
      console.error('Error fetching latest LPO number:', error);
      setLpoData(prev => ({
        ...prev,
        lpoRef: generateLpoRef(131)
      }));
    }
  };

  async function fetchEquipments() {
    try {
      const response = await apiRequest(`${END_POINT}/equipments/get-equipments`, 'GET');
      const data = await response.json();
      setEquipments(data.data || []);
    } catch (error) {
      console.error('Error fetching equipment records:', error);
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await apiRequest(`${END_POINT}/lpo/get-company-details`);
      const data = await response.json();
      if (data.success) {
        setCompanies(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const saveLpoData = async () => {
    const currentFieldValue = workingHrsMode === 'WORKING HRS' ? lpoData.workingHrs : lpoData.runningKm;

    // Skip validation for workingHrs/runningKm if it's for stock or all equipment
    const shouldValidateHrsKm = !isForStock && !isForAllEquipm;

    if (!lpoData.vendor || !lpoData.equipments || !lpoData.attention || !lpoData.designation ||
      (shouldValidateHrsKm && !currentFieldValue)) {
      setSaveStatus('Please fill in all required fields');
      return false;
    }

    if (!lpoData.items.some(item => item.description.trim() !== '')) {
      setSaveStatus('Please add at least one item');
      return false;
    }

    setIsLoading(true);
    setSaveStatus('Saving...');

    try {
      const dataToSave = {
        lpoRef: lpoData.lpoRef,
        date: lpoData.date,
        equipments: lpoData.equipments,
        quoteNo: lpoData.quoteNo,
        requestText: lpoData.requestText,
        company: {
          vendor: lpoData.vendor,
          attention: lpoData.attention,
          designation: lpoData.designation
        },
        items: lpoData.items.filter(item => item.description.trim() !== ''),
        paymentTerms: paymentTerms,
        lpoCounter: lpoCounter,
        signatures: {
          accountsDept: 'ROSHAN SHA',
          purchasingManager: 'ABDUL MALIK',
          operationsManager: 'SURESHKANTH',
          authorizedSignatory: getSignatoryName(),
          authorizedSignatoryTitle: ceoMode
        },
        discount: lpoData.discount,
        showDiscountInTotal: showDiscountInTotal,
        type: isForStock ? 'stock' : isForAllEquipm ? 'all_equipment' : 'specific_equipment'
      };

      // Add the total amount field based on whether discount is shown or not
      if (showDiscountInTotal) {
        dataToSave.totalDiscountAmount = totalAmount; // Total after discount
      } else {
        dataToSave.totalAmount = subtotal; // Total without discount
      }

      // Only include workingHrs or runningKm if not for stock/all equipment
      if (!isForStock && !isForAllEquipm) {
        if (workingHrsMode === 'WORKING HRS') {
          dataToSave.workingHrs = lpoData.workingHrs;
        } else {
          dataToSave.runningKm = lpoData.runningKm;
        }
      }

      const response = await apiRequest(`${END_POINT}/lpo/add-lpo`,
        'POST',
        dataToSave
      );

      const result = await response.json();

      if (result.success) {
        setSaveStatus('LPO saved successfully!');
        setTimeout(() => setSaveStatus(''), 3000);
        navigate(`/lpo-doc/${encodeURIComponent(lpoData.lpoRef)}`);
        return true;
      } else {
        setSaveStatus(`Error: ${result.message || 'Already created with this LPO Number'}`);
        return false;
      }
    } catch (error) {
      console.error('Error saving LPO:', error);
      setSaveStatus('Error saving LPO. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const handleEquipmentSelect = (equipment) => {
    setSelectedEquipment(equipment);
    setCurrentEquipmentInput(`${equipment.regNo} – ${equipment.machine}`);
    setEquipmentDropdown(false);
    setEquipmentSearch('');
  };

  const addEquipment = () => {
    if (currentEquipmentInput.trim() && !lpoData.equipments.includes(currentEquipmentInput)) {
      setLpoData(prev => ({
        ...prev,
        equipments: [...prev.equipments, currentEquipmentInput]
      }));
      setCurrentEquipmentInput('');
    }
  };

  const removeEquipment = (index) => {
    const newEquipments = [...lpoData.equipments];
    newEquipments.splice(index, 1);
    setLpoData(prev => ({
      ...prev,
      equipments: newEquipments
    }));
  };

  const handleEquipmentKeyDown = (e) => {
    if (e.key === 'Enter') {
      addEquipment();
    }
  };

  const handleCompanySelect = (company) => {
    setLpoData(prev => ({
      ...prev,
      vendor: company.vendor,
      attention: company.attention,
      designation: company.designation
    }));
    setCompanyDropdown(false);
  };

  const handleAttentionSelect = (company) => {
    setLpoData(prev => ({
      ...prev,
      attention: company.attention,
      designation: company.designation
    }));
    setAttnDropdown(false);
  };

  const handleVendorChange = (value) => {
    setLpoData(prev => ({
      ...prev,
      vendor: value
    }));

    if (value.trim()) {
      setCompanyDropdown(true);
      if (companies.length === 0) {
        fetchCompanies();
      }
    } else {
      setCompanyDropdown(false);
    }
  };

  const handleAttentionChange = (value) => {
    setLpoData(prev => ({
      ...prev,
      attention: value
    }));

    if (value.trim()) {
      setAttnDropdown(true);
      if (companies.length === 0) {
        fetchCompanies();
      }
    } else {
      setAttnDropdown(false);
    }
  };

  const filteredEquipments = equipments.filter(equipment =>
    equipment.machine.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    equipment.regNo.toLowerCase().includes(equipmentSearch.toLowerCase())
  );

  const filteredCompanies = companies.filter(company =>
    company.vendor.toLowerCase().includes(lpoData.vendor.toLowerCase())
  );

  const filteredAttentions = companies.filter(company =>
    company.attention.toLowerCase().includes(lpoData.attention.toLowerCase())
  );

  const handleItemChange = (index, field, value) => {
    const newItems = [...lpoData.items];
    newItems[index][field] = field === 'quantity' || field === 'unitPrice' ? parseFloat(value) || null : value;

    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice;
    }

    setLpoData(prev => ({
      ...prev,
      items: newItems
    }));
  };

  const addItemRow = () => {
    const newItem = {
      id: lpoData.items.length + 1,
      description: '',
      quantity: 0,
      unitPrice: 0,
      totalPrice: 0
    };

    setLpoData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItemRow = (index) => {
    if (lpoData.items.length > 1) {
      const newItems = lpoData.items.filter((_, i) => i !== index);
      const updatedItems = newItems.map((item, i) => ({
        ...item,
        id: i + 1
      }));

      setLpoData(prev => ({
        ...prev,
        items: updatedItems
      }));
    }
  };

  const subtotal = lpoData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalAmount = subtotal - lpoData.discount;

  const handleDiscountPopup = () => {
    setDiscountInput(lpoData.discount.toString());
    setShowDiscountPopup(true);
  };

  const applyDiscount = () => {
    const discountValue = parseFloat(discountInput) || 0;
    setLpoData(prev => ({
      ...prev,
      discount: Math.max(0, Math.min(discountValue, subtotal))
    }));
    setShowDiscountPopup(false);
    setDiscountInput('');
  };

  const cancelDiscount = () => {
    setShowDiscountPopup(false);
    setDiscountInput('');
  };

  const toggleWorkingHrsMode = () => {
    setWorkingHrsMode(prev => prev === 'WORKING HRS' ? 'RUNNING KM' : 'WORKING HRS');
  };

  const toggleCeoMode = () => {
    setCeoMode(prev => prev === 'CEO' ? 'MANAGING DIRECTOR' : 'CEO');
  };

  const toggleDiscountInTotal = () => {
    setShowDiscountInTotal(prev => !prev);
  };

  const getSignatoryName = () => {
    return ceoMode === 'CEO' ? 'AHAMMED KAMAL' : 'MOHAMMED SHAHEEN';
  };

  const addPaymentTerm = () => {
    setPaymentTerms([...paymentTerms, '']);
  };

  const updatePaymentTerm = (index, value) => {
    const newTerms = [...paymentTerms];
    newTerms[index] = value;
    setPaymentTerms(newTerms);
  };

  const removePaymentTerm = (index) => {
    if (paymentTerms.length > 1) {
      const newTerms = paymentTerms.filter((_, i) => i !== index);
      setPaymentTerms(newTerms);
    }
  };

  const handleSave = async () => {
    await saveLpoData();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (equipmentRef.current && !equipmentRef.current.contains(event.target)) {
        setEquipmentDropdown(false);
      }
      if (companyRef.current && !companyRef.current.contains(event.target)) {
        setCompanyDropdown(false);
      }
      if (attnRef.current && !attnRef.current.contains(event.target)) {
        setAttnDropdown(false);
      }
      if (discountPopupRef.current && !discountPopupRef.current.contains(event.target)) {
        setShowDiscountPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="page-container">
      <div className="controls">
        <p>Current LPO Number: {lpoCounter}</p>
        {saveStatus && (
          <p className={`save-status ${saveStatus.includes('Error') ? 'error' : 'success'}`}>
            {saveStatus}
          </p>
        )}
        <div className="button-group">
          <button className="action-button download-button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save LPO'}
          </button>
        </div>
      </div>

      <div className="lpo-document-f" ref={componentRef}>
        <div className="header-f">
          <div className="logo-placeholder-l">
            <img src={logoImage} alt="Company Logo" />
          </div>
          <div className="company-details-sl company-details-l">
            <img src={alAnsariText} alt="AL Ansari Transport & Enterprises W.L.L" />
          </div>
        </div>

        <div className="header-divider"></div>
        <div className="lpo-title">PURCHASE/HIRE ORDER</div>

        <div className="lpo-details">
          <table className="details-table">
            <tbody>
              <tr>
                <td className="left-col">
                  <div className="detail-item">
                    TO :
                    <span className="dropdown-container" ref={companyRef}>
                      <input
                        type="text"
                        className="editable-input company-input"
                        value={lpoData.vendor}
                        onChange={(e) => handleVendorChange(e.target.value)}
                        placeholder="Enter company name"
                      />
                      {companyDropdown && filteredCompanies.length > 0 && (
                        <div className="dropdown-menu">
                          <div className="dropdown-options">
                            {filteredCompanies.map((company, index) => (
                              <div
                                key={index}
                                className="dropdown-option"
                                onClick={() => handleCompanySelect(company)}
                              >
                                <div className="company-name">{company.vendor}</div>
                                <div className="company-details">
                                  {company.attention} - {company.designation}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </span>
                  </div>
                  <div className="detail-item">
                    ATTN :
                    <span className="dropdown-container" ref={attnRef}>
                      <input
                        type="text"
                        className="editable-input attention-input"
                        value={lpoData.attention}
                        onChange={(e) => handleAttentionChange(e.target.value)}
                        placeholder="Enter attention name"
                      />
                      {attnDropdown && filteredAttentions.length > 0 && (
                        <div className="dropdown-menu">
                          <div className="dropdown-options">
                            {filteredAttentions.map((company, index) => (
                              <div
                                key={index}
                                className="dropdown-option"
                                onClick={() => handleAttentionSelect(company)}
                              >
                                <div className="attention-name">{company.attention}</div>
                                <div className="attention-designation">{company.designation}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </span>
                  </div>
                  <div className="detail-item">
                    DESIGNATION :
                    <input
                      type="text"
                      className="editable-input designation-input"
                      value={lpoData.designation}
                      onChange={(e) => setLpoData(prev => ({ ...prev, designation: e.target.value }))}
                      placeholder="Enter designation"
                    />
                  </div>
                  <div className="detail-item">
                    Ref No :
                    <input
                      type="text"
                      className="editable-input designation-input"
                      value={lpoData.quoteNo}
                      onChange={(e) => setLpoData(prev => ({ ...prev, quoteNo: e.target.value }))}
                      placeholder="Enter Quotion Number"
                    />
                  </div>
                </td>
                <td className="right-col">
                  <div className="detail-item">
                    DATE : <span className="non-editable">{lpoData.date}</span>
                  </div>
                  <div className="detail-item">
                    LPO REF NO : <span className="non-editable">{lpoData.lpoRef}</span>
                  </div>
                  <div className="detail-item">
                    <div className='equip-field'>
                      <span className="equip-field-name">
                        EQUIPMENT :
                      </span>
                    </div>
                    {isForStock || isForAllEquipm ? (
                      <span className="non-editable">{lpoData.equipments[0]}</span>
                    ) : (
                      <div className="equipment-multi-select">
                        {/* Display selected equipments */}
                        <div className="selected-equipments">
                          {lpoData.equipments.map((equipment, index) => (
                            <div key={index} className="equipment-tag">
                              {equipment}
                              <button
                                className="remove-equipment-btn"
                                onClick={() => removeEquipment(index)}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* Equipment input */}
                        <div className="dropdown-container" ref={equipmentRef}>
                          <input
                            type="text"
                            className="editable-input equipment-input"
                            value={currentEquipmentInput}
                            onChange={(e) => setCurrentEquipmentInput(e.target.value)}
                            onKeyDown={handleEquipmentKeyDown}
                            onFocus={() => {
                              setEquipmentDropdown(true);
                              fetchEquipments();
                            }}
                            placeholder={lpoData.equipments.length ? "Add another equipment" : "Select equipment"}
                          />
                          {equipmentDropdown && (
                            <div className="dropdown-menu">
                              <input
                                type="text"
                                placeholder="Search equipments..."
                                value={equipmentSearch}
                                onChange={(e) => setEquipmentSearch(e.target.value)}
                                className="dropdown-search"
                                autoFocus
                              />
                              <div className="dropdown-options">
                                {filteredEquipments.map((equipment, index) => (
                                  <div
                                    key={index}
                                    className="dropdown-option"
                                    onClick={() => handleEquipmentSelect(equipment)}
                                  >
                                    <div className="equipment-reg">{equipment.regNo}</div>
                                    <div className="equipment-machine">{equipment.machine}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <button
                          className="add-equipment-btn"
                          onClick={addEquipment}
                          disabled={!currentEquipmentInput.trim()}
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                  {!isForStock && !isForAllEquipm && (
                    <div className="detail-item">
                      <span
                        className="toggle-field"
                        onClick={toggleWorkingHrsMode}
                      >
                        {workingHrsMode}
                      </span>
                      <span>:</span>
                      <input
                        type="text"
                        className="editable-input"
                        value={workingHrsMode === 'WORKING HRS' ? lpoData.workingHrs : lpoData.runningKm}
                        onChange={(e) => {
                          const fieldName = workingHrsMode === 'WORKING HRS' ? 'workingHrs' : 'runningKm';
                          setLpoData(prev => ({ ...prev, [fieldName]: e.target.value }));
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

        <div className="details-divider"></div>

        <div className="request-text-f">
          <textarea
            className="editable-request-text-f"
            value={lpoData.requestText}
            onChange={(e) => setLpoData(prev => ({ ...prev, requestText: e.target.value }))}
            rows={3}
          />
        </div>

        <table className="items-table">
          <thead>
            <tr>
              <th>SN</th>
              <th>Item Description</th>
              <th>Qty</th>
              <th>Unit Price(QR)</th>
              <th>Total Price(QR)</th>
            </tr>
          </thead>
          <tbody>
            {lpoData.items.map((item, index) => (
              <tr key={item.id}>
                <td
                  className="sn-cell"
                  onMouseEnter={() => setShowAddButton(index)}
                  onMouseLeave={() => setShowAddButton(null)}
                >
                  {item.id}
                  {showAddButton === index && (
                    <div className="row-controls">
                      <button
                        className="add-row-btn"
                        onClick={addItemRow}
                        title="Add Row"
                      >
                        +
                      </button>
                      {lpoData.items.length > 1 && (
                        <button
                          className="remove-row-btn"
                          onClick={() => removeItemRow(index)}
                          title="Remove Row"
                        >
                          -
                        </button>
                      )}
                    </div>
                  )}
                </td>
                <td>
                  <input
                    type="text"
                    className="table-input description-input"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Enter description"
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="table-input number-input"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="table-input number-input"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    step="0.01"
                  />
                </td>
                <td className="calculated-total">
                  {item.totalPrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
              </tr>
            ))}
            {showDiscountInTotal && lpoData.discount > 0 && (
              <tr>
                <td colSpan="4" className="total-label">Discount (QR)</td>
                <td className="calculated-total discount-amount">
                  -{lpoData.discount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}
                </td>
              </tr>
            )}
            <tr>
              <td colSpan="4" className="total-label">
                <span
                  className="toggle-field"
                  onClick={toggleDiscountInTotal}
                  title="Click to toggle between with/without discount"
                >
                  {showDiscountInTotal ? 'Total Amount After Discount (QR)' : 'Total Amount (QR)'}
                </span>
                {showDiscountInTotal && (
                  <div className="discount-controls">
                    <button
                      className="add-discount-btn"
                      onClick={handleDiscountPopup}
                      onMouseEnter={() => setShowDiscount(true)}
                      onMouseLeave={() => setShowDiscount(false)}
                    >
                      {lpoData.discount > 0 ? 'Edit Discount' : 'Add Discount'}
                    </button>
                    {showDiscount && (
                      <div className="discount-info">
                        Subtotal: {subtotal.toFixed(2)} QR<br />
                        Discount: {lpoData.discount.toFixed(2)} QR
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="calculated-total final-total">
                {(showDiscountInTotal ? totalAmount : subtotal).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </td>
            </tr>
          </tbody>
        </table>

        {showDiscountPopup && (
          <div className="discount-popup-overlay">
            <div className="discount-popup" ref={discountPopupRef}>
              <div className="discount-popup-header">
                <h4>Set Discount Amount</h4>
              </div>
              <div className="discount-popup-content">
                <p>Subtotal: {subtotal.toFixed(2)} QR</p>
                <div className="discount-input-group">
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
                <p className="discount-preview">
                  Total after discount: {(subtotal - (parseFloat(discountInput) || 0)).toFixed(2)} QR
                </p>
              </div>
              <div className="discount-popup-actions">
                <button className="discount-apply-btn" onClick={applyDiscount}>
                  Apply
                </button>
                <button className="discount-cancel-btn" onClick={cancelDiscount}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <table className="terms-table">
          <tbody>
            <tr className="terms-row-large">
              <td className="terms-header-large">
                <div className="payment-terms-container">
                  <div className="payment-terms-header">Terms & Conditions</div>
                  <ul className="payment-terms-list">
                    {paymentTerms.map((term, index) => (
                      <li key={index} className="payment-term-item">
                        <span className="term-bullet">•</span>
                        <input
                          type="text"
                          className="payment-term-input"
                          value={term}
                          onChange={(e) => updatePaymentTerm(index, e.target.value)}
                          placeholder="Enter payment term"
                        />
                        {paymentTerms.length > 1 && (
                          <button
                            className="remove-term-btn"
                            onClick={() => removePaymentTerm(index)}
                            title="Remove term"
                          >
                            ×
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  <button className="add-term-btn" onClick={addPaymentTerm}>
                    + Add Payment Term
                  </button>
                </div>
              </td>
            </tr>
            <tr>
              <td className="note-row">
                <strong>NOTE:</strong> The LPO copy should be submitted along with the invoice every month for the payment process.
              </td>
            </tr>
          </tbody>
        </table>

        <table className="signatures-table">
          <tbody>
            <tr>
              <td colSpan="4" className="company-footer">
                AL ANSARI TRANSPORT & ENTERPRISES W.L.L
              </td>
              <td className='sign-table-l'>
                Subcontractor OR<br />Service Provider
              </td>
            </tr>
            <tr>
              <td className='sign-table-l'>Accounts Dept:</td>
              <td className='sign-table-l'>Purchasing Manager</td>
              <td className='sign-table-l'>Operations Manager</td>
              <td className='sign-table-l'>
                Authorized Signatory<br />
                <span
                  className="toggle-field ceo-toggle"
                  onClick={toggleCeoMode}
                >
                  ({ceoMode})
                </span>
              </td>
              <td className='date-no-border sign-table-date'>
                (Date & Sign with Stamp)
              </td>
            </tr>
            <tr className="signature-spaces-large">
              <td className='sign-table-l'></td>
              <td className='sign-table-l'></td>
              <td className='sign-table-l'></td>
              <td className='sign-table-l'></td>
              <td></td>
            </tr>
            <tr>
              <td className='sign-table-l'>ROSHAN SHA</td>
              <td className='sign-table-l'>ABDUL MALIK</td>
              <td className='sign-table-l'>SURESHKANTH</td>
              <td className='sign-table-l'>{getSignatoryName()}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div className='footer'>
          <img src={footer} alt="" />
        </div>
      </div>
    </div>
  );
};

export default Lpo;