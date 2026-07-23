import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { API_URI } from '../../constants';
import { apiRequest } from '../../utils/api';
import { useHeaderTitle } from '../../Context/HeaderTitleContext';
import Button from '../../Common/Button/Button';
import logoImage from '../../assets/images/al-ansari-color.png';
import alAnsariText from '../../assets/images/al-ansari-full-address.png';
import footer from '../../assets/images/footer.png';
import './Quotation.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_REQUEST_TEXT = 'You are requested to supply the following manpower and equipment as per the agreed hire terms.';
const DEFAULT_PAYMENT_TERMS = ['Payment will be made within 90 days from the day of submission of invoice'];

/** Minimum number of editable columns that must remain between SN and Total Price. */
const MIN_EDITABLE_COLUMNS = 2;

/** Base line-item columns.
 *  - SN is not part of this list; it's a permanent, non-editable row-number column.
 *  - `totalPrice` (type 'calculated') is the ONLY other permanently fixed column —
 *    its label can't be edited and it can't be removed.
 *  - Every other column (including these defaults) can be renamed or deleted,
 *    as long as at least MIN_EDITABLE_COLUMNS remain.
 *  - `quantity` / `unitPrice` ids are used internally to auto-calculate Total
 *    Price. If either is removed, Total Price becomes a manually-entered field. */
const DEFAULT_COLUMNS = [
  { id: 'description', label: 'Item Description', type: 'text', deletable: true },
  { id: 'quantity', label: 'Qty', type: 'number', deletable: true },
  { id: 'unitPrice', label: 'Unit Price(QR)', type: 'number', deletable: true },
  { id: 'totalPrice', label: 'Total Price(QR)', type: 'calculated', deletable: false },
];

const buildDefaultItem = (columns, id = 1) => {
  const item = { id };
  columns.forEach((col) => {
    item[col.id] = col.type === 'calculated' ? 0 : col.type === 'number' ? null : '';
  });
  return item;
};

const DEFAULT_HIRE_ORDER_DATA = {
  vendor: '',
  date: new Date().toLocaleDateString('en-GB'),
  hireOrderRef: '',
  attention: '',
  designation: '',
  complaintId: '',
  quoteNo: '',
  requestText: DEFAULT_REQUEST_TEXT,
  items: [buildDefaultItem(DEFAULT_COLUMNS)],
  discount: 0,
};

/** Authorised signatory names keyed by CEO mode label. */
const SIGNATORY_MAP = { CEO: 'AHAMMED KAMAL', 'MANAGING DIRECTOR': 'MOHAMMED SHAHEEN' };

const SHARED_BTN = {
  variant: 'gradient',
  font: 'md',
  animation: '',
  squircle: '4xl',
  height: '38px',
  textColor: 'white-200',
  shadowPosition: 'to-bottom',
  shadowColor: 'white-600',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const generateHireOrderRef = (number) => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const padded = String(number).padStart(3, '0');
  return `ATE${padded}/HO/${month}/${year}`;
};

const formatDate = (dateString) => {
  const now = new Date(dateString);
  const day = String(now.getDate() + 1).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${now.getFullYear()}`;
};

const formatCurrency = (value) =>
  (value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Strips the static "Terms & Conditions" header from a stored terms array. */
const filterEditableTerms = (terms = []) => terms.filter((t) => t !== 'Terms & Conditions');

// ─────────────────────────────────────────────────────────────────────────────
// Quotation — Main Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {boolean} props.edit          - True when editing an existing hire order.
 * @param {boolean} props.amendment     - True when creating or editing an amendment.
 * @param {boolean} props.amendmentEdit - True when editing a previously created amendment.
 */
function Quotation({ edit, amendment, amendmentEdit }) {
  const navigate = useNavigate();
  const { refNo, complaintId } = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const componentRef = useRef();
  const companyRef = useRef();
  const attnRef = useRef();
  const discountPopupRef = useRef();

  // ── Derived mode flags ────────────────────────────────────────────────────

  const isEditMode = !!(edit && refNo);
  const isAmendmentEditMode = !!(amendment && amendmentEdit && refNo);
  const isAmendmentMode = !!(amendment && refNo);

  // ── Form state ─────────────────────────────────────────────────────────────

  const [hireOrderData, setHireOrderData] = useState(DEFAULT_HIRE_ORDER_DATA);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [paymentTerms, setPaymentTerms] = useState(DEFAULT_PAYMENT_TERMS);
  const [hireOrderCounter, setHireOrderCounter] = useState(1);
  const [ceoMode, setCeoMode] = useState('CEO');
  const [companyDropdown, setCompanyDropdown] = useState(false);
  const [attnDropdown, setAttnDropdown] = useState(false);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
  const [showAddButton, setShowAddButton] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showDiscountInTotal, setShowDiscountInTotal] = useState(true);

  // Total Price auto-calculates only while BOTH a Qty and a Unit Price column
  // still exist. If the user deletes either one, Total Price becomes a plain
  // manually-entered number field instead.
  const autoCalculateTotal = columns.some((c) => c.id === 'quantity') && columns.some((c) => c.id === 'unitPrice');

  const subtotal = hireOrderData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const totalAmount = subtotal - (hireOrderData.discount || 0);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (saveStatus) {
      const title = saveStatus.includes('Error') ? 'Error' : saveStatus.includes('Please') ? 'Warning' : 'Success';
      setHeaderTitle(title);
      setHeaderSubtitle(saveStatus);
    } else {
      const modeLabel = isAmendmentMode ? 'Amending' : isEditMode ? 'Editing' : 'Creating';
      setHeaderTitle(`${modeLabel} Hire Order`);
      setHeaderSubtitle(`Hire Order Number: ${hireOrderCounter}`);
    }

    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [hireOrderCounter, saveStatus, hireOrderData.hireOrderRef, isAmendmentMode, isEditMode, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    if (isAmendmentEditMode && refNo) fetchHireOrderForAmendmentEdit();
    else if ((isEditMode || isAmendmentMode) && refNo) fetchHireOrderForEdit();
    else fetchLatestHireOrderNumber();

    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refNo, isEditMode, isAmendmentMode]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (companyRef.current && !companyRef.current.contains(event.target)) setCompanyDropdown(false);
      if (attnRef.current && !attnRef.current.contains(event.target)) setAttnDropdown(false);
      if (discountPopupRef.current && !discountPopupRef.current.contains(event.target)) setShowDiscountPopup(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Data fetching
  // ─────────────────────────────────────────────────────────────────────────

  const fetchLatestHireOrderNumber = async () => {
    try {
      const response = await apiRequest(`${API_URI}/hire-order/check-latest-hire-order-ref`);
      const data = await response.json();
      const latestNo = parseInt(data.data?.latestRef?.split('/')[0]?.replace('ATE', '') || 130) + 1;
      setHireOrderCounter(latestNo);
      setHireOrderData((prev) => ({ ...prev, hireOrderRef: generateHireOrderRef(latestNo) }));
    } catch (error) {
      console.error('[Quotation] fetchLatestHireOrderNumber error:', error);
      setHireOrderData((prev) => ({ ...prev, hireOrderRef: generateHireOrderRef(131) }));
    }
  };

  /** Fetches and populates an existing hire order for standard edit mode. */
  const fetchHireOrderForEdit = async () => {
    setIsLoading(true);
    try {
      const decodedRef = decodeURIComponent(refNo);
      const response = await apiRequest(`${API_URI}/hire-order/get-hire-order-by-ref/${decodedRef}`, 'GET');
      const data = await response.json();

      if (!data.success || !data.data) return;
      const ho = data.data;

      const loadedColumns = ho.columns?.length ? ho.columns : DEFAULT_COLUMNS;

      setHireOrderCounter(ho.hireOrderCounter || 1);
      setColumns(loadedColumns);
      setHireOrderData({
        vendor: ho.company?.vendor || '',
        date: ho.date || new Date().toLocaleDateString('en-GB'),
        hireOrderRef: ho.hireOrderRef || '',
        complaintId: ho.complaintId || '',
        attention: ho.company?.attention || '',
        designation: ho.company?.designation || '',
        quoteNo: ho.quoteNo || '',
        requestText: ho.requestText || '',
        items: ho.items?.length ? ho.items : [buildDefaultItem(loadedColumns)],
        discount: ho.discount || 0,
      });

      if (ho.signatures?.authorizedSignatory === 'MOHAMMED SHAHEEN') setCeoMode('MANAGING DIRECTOR');
      if (ho.termsAndConditions?.length) setPaymentTerms(filterEditableTerms(ho.termsAndConditions));
      setShowDiscountInTotal(ho.totalDiscountAmount !== undefined);
    } catch (error) {
      console.error('[Quotation] fetchHireOrderForEdit error:', error);
      setSaveStatus('Error loading hire order data');
    } finally {
      setIsLoading(false);
    }
  };

  /** Fetches and populates the latest amendment data for amendment-edit mode. */
  const fetchHireOrderForAmendmentEdit = async () => {
    setIsLoading(true);
    try {
      const decodedRef = decodeURIComponent(refNo);
      const response = await apiRequest(`${API_URI}/hire-order/get-hire-order-by-ref/${decodedRef}`, 'GET');
      const data = await response.json();

      if (!data.success || !data.data) return;
      const ho = data.data;
      const latest = ho.amendments?.[ho.amendments.length - 1];

      const loadedColumns = latest?.amendedColumns?.length ? latest.amendedColumns : (ho.columns?.length ? ho.columns : DEFAULT_COLUMNS);

      setHireOrderCounter(ho.hireOrderCounter || 1);
      setColumns(loadedColumns);
      setHireOrderData({
        vendor: latest?.amendedCompany?.vendor || '',
        date: latest?.amendmentDate ? formatDate(latest.amendmentDate) : new Date().toLocaleDateString('en-GB'),
        hireOrderRef: ho.hireOrderRef || '',
        complaintId: ho.complaintId || '',
        attention: latest?.amendedCompany?.attention || '',
        designation: latest?.amendedCompany?.designation || '',
        quoteNo: latest?.amendedQuoteNo || ho.quoteNo || '',
        requestText: latest?.amendedRequestText || ho.requestText || '',
        items: latest?.amendedItems?.length ? latest.amendedItems : (ho.items?.length ? ho.items : [buildDefaultItem(loadedColumns)]),
        discount: latest?.amendedDiscount || 0,
      });

      if (ho.signatures?.authorizedSignatory === 'MOHAMMED SHAHEEN') setCeoMode('MANAGING DIRECTOR');

      const rawTerms = latest?.amendedTermsAndConditions || ho.termsAndConditions;
      if (rawTerms?.length) setPaymentTerms(filterEditableTerms(rawTerms));

      setShowDiscountInTotal(latest?.amendedTotalAmount !== undefined || ho.totalDiscountAmount !== undefined);
    } catch (error) {
      console.error('[Quotation] fetchHireOrderForAmendmentEdit error:', error);
      setSaveStatus('Error loading hire order data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await apiRequest(`${API_URI}/lpo/get-company-details`);
      const data = await response.json();
      if (data.success) setCompanies(data.data || []);
    } catch (error) {
      console.error('[Quotation] fetchCompanies error:', error);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Column handlers (add / remove / rename)
  // SN is not a column at all (always fixed). "totalPrice" is the only entry
  // in `columns` that's locked — every other column is freely editable and
  // deletable, down to a minimum of MIN_EDITABLE_COLUMNS.
  // ─────────────────────────────────────────────────────────────────────────

  const updateColumnLabel = (colId, label) => {
    setColumns((prev) => prev.map((c) => (c.id === colId && c.type !== 'calculated' ? { ...c, label } : c)));
  };

  const addColumn = () => {
    const newId = `col_${Date.now()}`;
    const newCol = { id: newId, label: 'New Column', type: 'text', deletable: true };

    setColumns((prev) => {
      const calcIndex = prev.findIndex((c) => c.type === 'calculated');
      const updated = [...prev];
      updated.splice(calcIndex === -1 ? updated.length : calcIndex, 0, newCol);
      return updated;
    });

    setHireOrderData((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({ ...item, [newId]: '' })),
    }));
  };

  const removeColumn = (colId) => {
    const editableCount = columns.filter((c) => c.type !== 'calculated').length;

    if (editableCount <= MIN_EDITABLE_COLUMNS) {
      setSaveStatus(`Please keep at least ${MIN_EDITABLE_COLUMNS} columns between SN and Total Price`);
      setTimeout(() => setSaveStatus(''), 2500);
      return;
    }

    setColumns((prev) => prev.filter((c) => c.id !== colId));
    setHireOrderData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        const { [colId]: _removed, ...rest } = item;
        return rest;
      }),
    }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Line item handlers
  // ─────────────────────────────────────────────────────────────────────────

  const addItemRow = () => {
    setHireOrderData((prev) => ({
      ...prev,
      items: [...prev.items, buildDefaultItem(columns, prev.items.length + 1)],
    }));
  };

  const removeItem = (index) => {
    if (hireOrderData.items.length <= 1) return;
    const updated = hireOrderData.items
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, id: i + 1 }));
    setHireOrderData((prev) => ({ ...prev, items: updated }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...hireOrderData.items];
    const isManualTotalField = field === 'totalPrice' && !autoCalculateTotal;
    const isNumericField = field === 'quantity' || field === 'unitPrice' || isManualTotalField;

    newItems[index] = {
      ...newItems[index],
      [field]: isNumericField ? (parseFloat(value) || null) : value,
    };

    if (autoCalculateTotal) {
      newItems[index].totalPrice = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
    }

    setHireOrderData((prev) => ({ ...prev, items: newItems }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Discount handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleDiscountPopup = () => {
    setDiscountInput(hireOrderData.discount.toString());
    setShowDiscountPopup(true);
  };

  const applyDiscount = () => {
    const value = Math.max(0, Math.min(parseFloat(discountInput) || 0, subtotal));
    setHireOrderData((prev) => ({ ...prev, discount: value }));
    setShowDiscountPopup(false);
    setDiscountInput('');
  };

  const cancelDiscount = () => {
    setShowDiscountPopup(false);
    setDiscountInput('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Payment terms handlers
  // ─────────────────────────────────────────────────────────────────────────

  const addPaymentTerm = () => setPaymentTerms((prev) => [...prev, '']);

  const updatePaymentTerm = (index, value) => {
    const updated = [...paymentTerms];
    updated[index] = value;
    setPaymentTerms(updated);
  };

  const removePaymentTerm = (index) => {
    if (paymentTerms.length <= 1) return;
    setPaymentTerms((prev) => prev.filter((_, i) => i !== index));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Toggle handlers
  // ─────────────────────────────────────────────────────────────────────────

  const toggleDiscountInTotal = () => setShowDiscountInTotal((prev) => !prev);
  const toggleCeoMode = () => setCeoMode((prev) => (prev === 'CEO' ? 'MANAGING DIRECTOR' : 'CEO'));
  const getSignatoryName = () => SIGNATORY_MAP[ceoMode] || SIGNATORY_MAP.CEO;

  // ─────────────────────────────────────────────────────────────────────────
  // Company / attention handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleCompanySelect = (company) => {
    setHireOrderData((prev) => ({ ...prev, vendor: company.vendor, attention: company.attention, designation: company.designation }));
    setCompanyDropdown(false);
  };

  const handleAttentionSelect = (company) => {
    setHireOrderData((prev) => ({ ...prev, attention: company.attention, designation: company.designation }));
    setAttnDropdown(false);
  };

  const handleVendorChange = (value) => {
    setHireOrderData((prev) => ({ ...prev, vendor: value }));
    if (value.trim()) {
      setCompanyDropdown(true);
      if (!companies.length) fetchCompanies();
    } else {
      setCompanyDropdown(false);
    }
  };

  const handleAttentionChange = (value) => {
    setHireOrderData((prev) => ({ ...prev, attention: value }));
    if (value.trim()) {
      setAttnDropdown(true);
      if (!companies.length) fetchCompanies();
    } else {
      setAttnDropdown(false);
    }
  };

  const filteredCompanies = companies.filter((c) => c.vendor.toLowerCase().includes(hireOrderData.vendor.toLowerCase()));
  const filteredAttentions = companies.filter((c) => c.attention.toLowerCase().includes(hireOrderData.attention.toLowerCase()));

  // ─────────────────────────────────────────────────────────────────────────
  // Save / Submit
  // ─────────────────────────────────────────────────────────────────────────

  /** True if an item has content in at least one of its (non-calculated) fields. */
  const itemHasContent = (item) =>
    columns.some((col) => col.type !== 'calculated' && String(item[col.id] ?? '').trim());

  const saveHireOrderData = async () => {
    if (!hireOrderData.vendor || !hireOrderData.attention || !hireOrderData.designation || !hireOrderData.items.some(itemHasContent)) {
      setSaveStatus('Please fill in all required fields');
      return false;
    }

    setIsLoading(true);
    setSaveStatus(isAmendmentMode ? 'Processing Amendment...' : isEditMode ? 'Updating...' : 'Saving...');

    try {
      const payload = {
        hireOrderRef: hireOrderData.hireOrderRef,
        date: hireOrderData.date,
        company: {
          vendor: hireOrderData.vendor,
          attention: hireOrderData.attention,
          designation: hireOrderData.designation,
        },
        quoteNo: hireOrderData.quoteNo,
        requestText: hireOrderData.requestText,
        columns,
        items: hireOrderData.items.filter(itemHasContent),
        termsAndConditions: ['Terms & Conditions', ...paymentTerms],
        hireOrderCounter,
        discount: hireOrderData.discount,
        showDiscountInTotal,
        signatures: {
          accountsDept: 'ROSHAN SHA',
          purchasingManager: 'ABDUL MALIK',
          operationsManager: 'SURESHKANTH',
          authorizedSignatory: getSignatoryName(),
          authorizedSignatoryTitle: ceoMode,
        },
        isAmendmented: isAmendmentMode ? true : false,
        ...(isAmendmentMode && {
          accountsSigned: false,
          managerSigned: false,
          ceoSigned: false,
          isAmendment: true,
          amendmentDate: new Date().toLocaleDateString('en-GB'),
        }),
      };

      if (showDiscountInTotal) payload.totalDiscountAmount = totalAmount;
      else payload.totalAmount = subtotal;

      if (complaintId) payload.complaintId = complaintId;

      const endpoint = (isEditMode || isAmendmentMode)
        ? `${API_URI}/hire-order/update-hire-order/${encodeURIComponent(hireOrderData.hireOrderRef)}`
        : `${API_URI}/hire-order/add-hire-order`;
      const method = (isEditMode || isAmendmentMode) ? 'PUT' : 'POST';

      const response = await apiRequest(endpoint, method, payload);
      const result = await response.json();

      if (!result.success) {
        setSaveStatus(`Error: ${result.message || 'Operation failed'}`);
        return false;
      }

      const msg = isAmendmentMode ? 'Amendment saved successfully!' : isEditMode ? 'Hire order updated successfully!' : 'Hire order saved successfully!';
      setSaveStatus(msg);
      setTimeout(() => {
        setSaveStatus('');
        if (isAmendmentMode) {
          navigate(`/hire-order-doc/${encodeURIComponent(hireOrderData.hireOrderRef)}/amendment/${true}`);
        } else {
          navigate(`/hire-order-doc/${encodeURIComponent(hireOrderData.hireOrderRef)}`);
        }
      }, 1500);
      return true;
    } catch (error) {
      console.error('[Quotation] saveHireOrderData error:', error);
      setSaveStatus('Error saving hire order. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="hire-order-container">

      {/* ── Controls toolbar ── */}
      <div className="hire-order-controls">
        <div className="button-group">
          <Button
            {...SHARED_BTN}
            text={isLoading
              ? (isAmendmentMode ? 'Processing Amendment...' : isEditMode ? 'Updating...' : 'Saving...')
              : (isAmendmentMode ? 'Save Amendment & Send for Approval' : isEditMode ? 'Update Hire Order' : 'Save Hire Order')}
            onClick={saveHireOrderData}
            colorScheme={isLoading ? 'lime-900' : 'lime-800'}
            width="fit-content"
            type={isLoading ? 'disabled' : 'submit'}
            cursor="allowed"
          />
        </div>
      </div>

      {/* ── Hire Order Document (editable form) ── */}
      <div className="hire-order-document-f" ref={componentRef}>

        {/* ── Document header ── */}
        <div className="header-f">
          <div className="logo-placeholder-l">
            <img src={logoImage} alt="Company Logo" />
          </div>
          <div className="company-details-sl company-details-l text-move-to-left">
            <img src={alAnsariText} alt="AL Ansari Transport & Enterprises W.L.L" />
          </div>
        </div>

        <div className="header-divider" />
        <div className="hire-order-title">HIRE ORDER</div>

        {/* ── Hire Order Meta Details ── */}
        <div className="hire-order-details">
          <table className="details-table">
            <tbody>
              <tr>
                <td className="left-col">

                  <div className="detail-item detail-item-form">
                    TO :
                    <span className="dropdown-container" ref={companyRef}>
                      <input
                        type="text"
                        className="editable-input company-input"
                        value={hireOrderData.vendor}
                        onChange={(e) => handleVendorChange(e.target.value)}
                        placeholder="Enter company name"
                      />
                      {companyDropdown && filteredCompanies.length > 0 && (
                        <div className="dropdown-menu">
                          <div className="dropdown-options">
                            {filteredCompanies.map((company, idx) => (
                              <div key={idx} className="dropdown-option" onClick={() => handleCompanySelect(company)}>
                                <div className="company-name">{company.vendor}</div>
                                <div className="company-details">{company.attention} - {company.designation}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </span>
                  </div>

                  <div className="detail-item detail-item-form">
                    ATTN :
                    <span className="dropdown-container" ref={attnRef}>
                      <input
                        type="text"
                        className="editable-input attention-input"
                        value={hireOrderData.attention}
                        onChange={(e) => handleAttentionChange(e.target.value)}
                        placeholder="Enter attention name"
                      />
                      {attnDropdown && filteredAttentions.length > 0 && (
                        <div className="dropdown-menu">
                          <div className="dropdown-options">
                            {filteredAttentions.map((company, idx) => (
                              <div key={idx} className="dropdown-option" onClick={() => handleAttentionSelect(company)}>
                                <div className="attention-name">{company.attention}</div>
                                <div className="attention-designation">{company.designation}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </span>
                  </div>

                  <div className="detail-item detail-item-form">
                    DESIGNATION :
                    <input
                      type="text"
                      className="editable-input designation-input"
                      value={hireOrderData.designation}
                      onChange={(e) => setHireOrderData((prev) => ({ ...prev, designation: e.target.value }))}
                      placeholder="Enter designation"
                    />
                  </div>

                  <div className="detail-item detail-item-form">
                    Ref No :
                    <input
                      type="text"
                      className="editable-input designation-input"
                      value={hireOrderData.quoteNo}
                      onChange={(e) => setHireOrderData((prev) => ({ ...prev, quoteNo: e.target.value }))}
                      placeholder="Enter Quotation Number"
                    />
                  </div>

                </td>

                <td className="right-col">
                  <div className="detail-item detail-item-form">DATE : <span className="non-editable">{hireOrderData.date}</span></div>
                  <div className="detail-item detail-item-form">HIRE ORDER REF NO : <span className="non-editable">{hireOrderData.hireOrderRef}</span></div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="details-divider" />

        {/* ── Request text ── */}
        <div className="request-text-f">
          <textarea
            className="editable-request-text-f"
            value={hireOrderData.requestText}
            onChange={(e) => setHireOrderData((prev) => ({ ...prev, requestText: e.target.value }))}
            rows={3}
          />
        </div>

        {/* ── Add column control ── */}
        <div className="add-column-row">
          <Button
            {...SHARED_BTN}
            text="+ Add Column"
            onClick={addColumn}
            colorScheme="lime-800"
            width="140px"
            height="28px"
            font="sm"
            type="submit"
            cursor="pointer"
          />
        </div>

        {/* ── Line items table ── */}
        <table className="hire-order-items-table">
          <thead>
            <tr>
              <th className="sn-header">SN</th>
              {columns.map((col) => {
                const fixed = col.type === 'calculated';
                return (
                  <th key={col.id}>
                    {fixed ? (
                      <div className="column-header-cell fixed-column-header">
                        <span className="fixed-column-label">{col.label}</span>
                      </div>
                    ) : (
                      <div className="column-header-cell">
                        <input
                          type="text"
                          className="column-header-input"
                          style={{ width: `${Math.max(col.label.length + 2, 8)}ch` }}
                          value={col.label}
                          onChange={(e) => updateColumnLabel(col.id, e.target.value)}
                        />
                        <button
                          className="remove-column-btn"
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
          <tbody>

            {hireOrderData.items.map((item, index) => (
              <tr key={item.id}>

                <td
                  className="sn-cell"
                  onMouseEnter={() => setShowAddButton(index)}
                  onMouseLeave={() => setShowAddButton(null)}
                >
                  {item.id}
                  {showAddButton === index && (
                    <div className="row-controls">
                      <Button
                        {...SHARED_BTN}
                        text='+'
                        onClick={addItemRow}
                        colorScheme='lime-700'
                        width="20px"
                        height='20px'
                        title='Add Row'
                        font='sm'
                        padding='0'
                        type='submit'
                        cursor="allowed"
                      />
                      {hireOrderData.items.length > 1 && (
                        <Button
                          {...SHARED_BTN}
                          text='-'
                          onClick={() => removeItem(index)}
                          colorScheme='red-700'
                          width="20px"
                          height='20px'
                          title='Remove Row'
                          font='sm'
                          padding='0'
                          type='submit'
                          cursor="allowed"
                        />
                      )}
                    </div>
                  )}
                </td>

                {columns.map((col) => (
                  <td key={col.id}>
                    {col.type === 'calculated' ? (
                      autoCalculateTotal ? (
                        <span className="calculated-total">{formatCurrency(item[col.id])}</span>
                      ) : (
                        <input
                          type="number"
                          className="table-input number-input"
                          value={item[col.id] ?? ''}
                          onChange={(e) => handleItemChange(index, col.id, e.target.value)}
                          step="0.01"
                        />
                      )
                    ) : (
                      <input
                        type={col.type === 'number' ? 'number' : 'text'}
                        className={`table-input ${col.type === 'number' ? 'number-input' : 'description-input'}`}
                        value={item[col.id] ?? ''}
                        onChange={(e) => handleItemChange(index, col.id, e.target.value)}
                        step={col.type === 'number' ? '0.01' : undefined}
                        placeholder={col.type === 'text' ? `Enter ${col.label.toLowerCase()}` : undefined}
                      />
                    )}
                  </td>
                ))}
              </tr>
            ))}

            {/* Optional discount row */}
            {showDiscountInTotal && hireOrderData.discount > 0 && (
              <tr>
                <td colSpan={columns.length} className="total-label">Discount (QR)</td>
                <td className="calculated-total discount-amount">-{formatCurrency(hireOrderData.discount)}</td>
              </tr>
            )}

            {/* Total row with discount toggle */}
            <tr>
              <td colSpan={columns.length} className="total-label">
                <span
                  className="toggle-field"
                  onClick={toggleDiscountInTotal}
                  title="Click to toggle between with/without discount"
                >
                  {showDiscountInTotal ? 'Total Amount After Discount (QR)' : 'Total Amount (QR)'}
                </span>
                {showDiscountInTotal && (
                  <div className="discount-controls">
                    <Button
                      {...SHARED_BTN}
                      text={hireOrderData.discount > 0 ? 'Edit Discount' : 'Add Discount'}
                      onClick={handleDiscountPopup}
                      onMouseEnter={() => setShowDiscount(true)}
                      onMouseLeave={() => setShowDiscount(false)}
                      colorScheme={isLoading ? 'blue-900' : 'blue-800'}
                      width="120px"
                      height='20px'
                      font='sm'
                      type={isLoading ? 'disabled' : 'submit'}
                      cursor="allowed"
                    />
                    {showDiscount && (
                      <div className="discount-info">
                        Subtotal: {subtotal.toFixed(2)} QR<br />
                        Discount: {hireOrderData.discount.toFixed(2)} QR
                      </div>
                    )}
                  </div>
                )}
              </td>
              <td className="calculated-total final-total">
                {formatCurrency(showDiscountInTotal ? totalAmount : subtotal)}
              </td>
            </tr>

          </tbody>
        </table>

        {/* ── Discount popup ── */}
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
                <Button
                  {...SHARED_BTN}
                  text='Apply'
                  onClick={applyDiscount}
                  colorScheme='lime-600'
                  width="100px"
                  font='sm'
                  type={isLoading ? 'disabled' : 'submit'}
                  cursor="allowed"
                />
                <Button
                  {...SHARED_BTN}
                  text='Cancel'
                  onClick={cancelDiscount}
                  colorScheme='gray-700'
                  width="100px"
                  font='sm'
                  type={isLoading ? 'disabled' : 'submit'}
                  cursor="allowed"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Terms & conditions table ── */}
        <table className="terms-table">
          <tbody>
            <tr className="hire-order-terms-row-large">
              <td className="terms-header-large">
                <div className="payment-terms-container">
                  <div className="payment-terms-header">Terms &amp; Conditions</div>
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
                          <button className="remove-term-btn" onClick={() => removePaymentTerm(index)} title="Remove term">
                            ×
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  <Button
                    {...SHARED_BTN}
                    text="+ Add Payment Term"
                    onClick={addPaymentTerm}
                    colorScheme="lime-800"
                    width="170px"
                    height="30px"
                    font="sm"
                    type='submit'
                    cursor='pointer'
                  />
                </div>
              </td>
            </tr>
            <tr>
              <td className="note-row">
                <strong>NOTE:</strong> The hire order copy should be submitted along with the invoice every month for the payment process.
              </td>
            </tr>
          </tbody>
        </table>

        {/* ── Signatures table ── */}
        <table className="signatures-table signatures-table-form">
          <tbody>
            <tr>
              <td colSpan="4" className="company-footer">AL ANSARI TRANSPORT &amp; ENTERPRISES W.L.L</td>
              <td className="sign-table-l">Subcontractor OR<br />Service Provider</td>
            </tr>
            <tr>
              <td className="sign-table-l">Accounts Dept:</td>
              <td className="sign-table-l">Purchase Manager</td>
              <td className="sign-table-l">Operations Manager</td>
              <td className="sign-table-l">
                Authorized Signatory<br />
                <span className="toggle-field ceo-toggle" onClick={toggleCeoMode}>({ceoMode})</span>
              </td>
              <td className="date-no-border sign-table-date">(Date &amp; Sign with Stamp)</td>
            </tr>
            <tr className="hire-order-signature-spaces-large">
              <td className="sign-table-l" /><td className="sign-table-l" />
              <td className="sign-table-l" /><td className="sign-table-l" /><td />
            </tr>
            <tr>
              <td className="sign-table-l">ROSHAN SHA</td>
              <td className="sign-table-l">ABDUL MALIK</td>
              <td className="sign-table-l">SURESHKANTH</td>
              <td className="sign-table-l">{getSignatoryName()}</td>
              <td />
            </tr>
          </tbody>
        </table>

        {/* ── Footer ── */}
        <div className="footer">
          <img src={footer} alt="" />
        </div>

      </div>

      {/* ── Save status message ── */}
      {saveStatus && <div className="hire-order-save-status">{saveStatus}</div>}
    </div>
  );
}

export default Quotation;