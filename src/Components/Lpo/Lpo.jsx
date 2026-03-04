// ─────────────────────────────────────────────────────────────────────────────
// Lpo.jsx — LPO (Local Purchase Order) creation, editing, and amendment form.
// Supports four operational modes driven by props:
//   • Create   — new LPO for a specific equipment, stock, or all equipment
//   • Edit     — update an existing LPO by ref number
//   • Amendment      — raise an amendment against an existing LPO
//   • AmendmentEdit  — edit a previously created amendment
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import logoImage from '../../assets/images/al-ansari-color.png';
import alAnsariText from '../../assets/images/al-ansari-full-address.png';
import footer from '../../assets/images/footer.png';

import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/api';
import { useHeaderTitle } from '../../context/HeaderTitleContext';

import Button from '../../Common/Button/Button';

import './Lpo.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Default request paragraph shown in every new LPO. */
const DEFAULT_REQUEST_TEXT =
  'You are requested to supply the following item for above mentioned material at the terms and conditions described below and submit your bill for settlement.';

/** Default terms and conditions list (the header term is excluded from editable state). */
const DEFAULT_PAYMENT_TERMS = [
  'Payment will be made within 90 days from the day of submission of invoice',
];

/** Default shape for a single line item row. */
const DEFAULT_ITEM = { id: 1, description: '', quantity: null, unitPrice: null, totalPrice: 0 };

/** Default LPO form data state. */
const DEFAULT_LPO_DATA = {
  vendor: '',
  equipments: [],
  date: new Date().toLocaleDateString('en-GB'),
  lpoRef: '',
  attention: '',
  designation: '',
  complaintId: '',
  quoteNo: '',
  workingHrs: '',
  runningKm: '',
  requestText: DEFAULT_REQUEST_TEXT,
  items: [DEFAULT_ITEM],
  discount: 0,
};

/** Authorised signatory names keyed by CEO mode label. */
const SIGNATORY_MAP = { CEO: 'AHAMMED KAMAL', 'MANAGING DIRECTOR': 'MOHAMMED SHAHEEN' };

/** Shared Button props applied to every action button in the controls bar. */
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

/**
 * Generates a formatted LPO reference string from an LPO sequence number.
 * Pattern: ATE{padded3}/SP/{MM}/{YYYY}
 *
 * @param {number} lpoNumber - LPO sequence number.
 * @returns {string} Formatted reference string.
 */
const generateLpoRef = (lpoNumber) => {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const padded = String(lpoNumber).padStart(3, '0');
  return `ATE${padded}/SP/${month}/${year}`;
};

/**
 * Formats an ISO date string to "DD/MM/YYYY".
 * Adds 1 to the day to align with the original implementation's behaviour.
 *
 * @param {string} dateString - Raw date string.
 * @returns {string} Formatted date.
 */
const formatDate = (dateString) => {
  const now = new Date(dateString);
  const day = String(now.getDate() + 1).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}/${now.getFullYear()}`;
};

/**
 * Formats a currency number to a localised string with two decimal places.
 *
 * @param {number} value - Numeric value.
 * @returns {string} Formatted string (e.g. "1,234.50").
 */
const formatCurrency = (value) =>
  (value ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Strips the static "Terms & Conditions" header from a stored terms array.
 * Prevents it from appearing as an editable term row.
 *
 * @param {string[]} terms - Raw terms array from the API.
 * @returns {string[]} Filtered editable terms.
 */
const filterEditableTerms = (terms = []) => terms.filter((t) => t !== 'Terms & Conditions');

// ─────────────────────────────────────────────────────────────────────────────
// Lpo — Main Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Lpo — Multi-mode LPO form component.
 *
 * @param {boolean} props.isStock        - True when creating an LPO for stock items.
 * @param {boolean} props.isAllEquip     - True when creating an LPO for all equipment.
 * @param {boolean} props.edit           - True when editing an existing LPO.
 * @param {boolean} props.amendment      - True when creating or editing an amendment.
 * @param {boolean} props.amendmentEdit  - True when editing a previously created amendment.
 */
function Lpo({ isStock, isAllEquip, edit, amendment, amendmentEdit }) {
  const navigate = useNavigate();
  const { regNo, complaintId, refNo } = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

  // ── DOM refs (for click-outside detection) ────────────────────────────────

  const componentRef = useRef();
  const equipmentRef = useRef();
  const companyRef = useRef();
  const attnRef = useRef();
  const discountPopupRef = useRef();

  // ── Derived mode flags ────────────────────────────────────────────────────

  const isForStock = isStock;
  const isForAllEquipm = isAllEquip;
  const isEditMode = !!(edit && refNo);
  const isAmendmentEditMode = !!(amendment && amendmentEdit && refNo);
  const isAmendmentMode = !!(amendment && refNo);

  // ── Form state ─────────────────────────────────────────────────────────────

  const [lpoData, setLpoData] = useState(DEFAULT_LPO_DATA);
  const [paymentTerms, setPaymentTerms] = useState(DEFAULT_PAYMENT_TERMS);
  const [lpoCounter, setLpoCounter] = useState(1);
  const [workingHrsMode, setWorkingHrsMode] = useState('WORKING HRS');
  const [ceoMode, setCeoMode] = useState('CEO');
  const [showDiscountInTotal, setShowDiscountInTotal] = useState(true);

  // ── UI / dropdown state ────────────────────────────────────────────────────

  const [equipmentDropdown, setEquipmentDropdown] = useState(false);
  const [companyDropdown, setCompanyDropdown] = useState(false);
  const [attnDropdown, setAttnDropdown] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [currentEquipmentInput, setCurrentEquipmentInput] = useState('');
  const [showAddButton, setShowAddButton] = useState(null);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showDiscountPopup, setShowDiscountPopup] = useState(false);
  const [discountInput, setDiscountInput] = useState('');

  // ── Data lists state ───────────────────────────────────────────────────────

  const [equipments, setEquipments] = useState([]);
  const [companies, setCompanies] = useState([]);

  // ── Async state ────────────────────────────────────────────────────────────

  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  // ── Computed values ────────────────────────────────────────────────────────

  const subtotal = lpoData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const totalAmount = subtotal - (lpoData.discount || 0);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  // ── Effect: Sync header title / subtitle ──────────────────────────────────

  useEffect(() => {
    if (saveStatus) {
      const title =
        saveStatus.includes('Error') ? 'Error' :
          saveStatus.includes('Please') ? 'Warning' : 'Success';
      setHeaderTitle(title);
      setHeaderSubtitle(saveStatus);
    } else if (lpoCounter) {
      const modeLabel = isAmendmentMode ? 'Amending' : isEditMode ? 'Editing' : 'Creating';
      setHeaderTitle(`${modeLabel} LPO: ${lpoData.lpoRef}`);
      setHeaderSubtitle(`LPO Number: ${lpoCounter}`);
    } else {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    }

    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [lpoCounter, saveStatus, lpoData.lpoRef, isAmendmentMode, isEditMode, setHeaderTitle, setHeaderSubtitle]);

  // ── Effect: Bootstrap data based on operational mode ──────────────────────

  useEffect(() => {
    if (isAmendmentEditMode && refNo) fetchLpoForAmendmentEdit();
    else if ((isEditMode || isAmendmentMode) && refNo) fetchLpoForEdit();
    else fetchLatestLpoNumber();

    handleRouteSpecificLogic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regNo, isEditMode, isAmendmentMode, refNo]);

  // ── Effect: Click-outside handler to close all dropdowns ──────────────────

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (equipmentRef.current && !equipmentRef.current.contains(event.target)) setEquipmentDropdown(false);
      if (companyRef.current && !companyRef.current.contains(event.target)) setCompanyDropdown(false);
      if (attnRef.current && !attnRef.current.contains(event.target)) setAttnDropdown(false);
      if (discountPopupRef.current && !discountPopupRef.current.contains(event.target)) setShowDiscountPopup(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Applies route-specific equipment defaults.
   * Sets "For Stock", "For all equipment", or resolves the regNo equipment.
   */
  const handleRouteSpecificLogic = async () => {
    if (isForStock) {
      setLpoData((prev) => ({ ...prev, equipments: ['For Stock'], workingHrs: '', runningKm: '' }));
      return;
    }

    if (isForAllEquipm) {
      setLpoData((prev) => ({ ...prev, equipments: ['For all equipment'], workingHrs: '', runningKm: '' }));
      return;
    }

    if (!regNo) return;

    try {
      const response = await apiRequest(`${END_POINT}/equipments/get-equipments?page=1&limit=1000`, 'GET');
      const data = await response.json();
      const equipment = data.data?.find((eq) => eq.regNo === regNo);
      if (equipment) {
        setLpoData((prev) => ({ ...prev, equipments: [`${equipment.regNo} – ${equipment.machine}`] }));
      }
    } catch (err) {
      console.error('[Lpo] handleRouteSpecificLogic error:', err);
    }
  };

  /** Fetches the latest LPO sequence number and generates the new reference. */
  const fetchLatestLpoNumber = async () => {
    try {
      const response = await apiRequest(`${END_POINT}/lpo/check-latest-lpo-ref`);
      const data = await response.json();

      const newLpoNumber = parseInt(data.data?.latestRef || 130) + 1;
      setLpoCounter(newLpoNumber);
      setLpoData((prev) => ({ ...prev, lpoRef: generateLpoRef(newLpoNumber) }));
    } catch (err) {
      console.error('[Lpo] fetchLatestLpoNumber error:', err);
      setLpoData((prev) => ({ ...prev, lpoRef: generateLpoRef(131) }));
    }
  };

  /** Fetches and populates an existing LPO for standard edit mode. */
  const fetchLpoForEdit = async () => {
    setIsLoading(true);
    try {
      const decodedRef = decodeURIComponent(refNo);
      const response = await apiRequest(`${END_POINT}/lpo/get-lpo-by-ref/${decodedRef}`, 'GET');
      const data = await response.json();

      if (!data.success || !data.data) return;
      const lpo = data.data;

      setLpoCounter(lpo.lpoCounter || 1);
      setLpoData({
        vendor: lpo.company?.vendor || '',
        equipments: lpo.equipments || [],
        date: lpo.date || new Date().toLocaleDateString('en-GB'),
        lpoRef: lpo.lpoRef || '',
        complaintId: lpo.complaintId || '',
        attention: lpo.company?.attention || '',
        designation: lpo.company?.designation || '',
        quoteNo: lpo.quoteNo || '',
        workingHrs: lpo.workingHrs || '',
        runningKm: lpo.runningKm || '',
        requestText: lpo.requestText || '',
        items: lpo.items || [],
        discount: lpo.discount || 0,
      });

      if (lpo.runningKm) setWorkingHrsMode('RUNNING KM');
      if (lpo.signatures?.authorizedSignatory === 'MOHAMMED SHAHEEN') setCeoMode('MANAGING DIRECTOR');
      if (lpo.termsAndConditions?.length) setPaymentTerms(filterEditableTerms(lpo.termsAndConditions));

      setShowDiscountInTotal(lpo.totalDiscountAmount !== undefined);

    } catch (err) {
      console.error('[Lpo] fetchLpoForEdit error:', err);
      setSaveStatus('Error loading LPO data');
    } finally {
      setIsLoading(false);
    }
  };

  /** Fetches and populates the latest amendment data for amendment-edit mode. */
  const fetchLpoForAmendmentEdit = async () => {
    setIsLoading(true);
    try {
      const decodedRef = decodeURIComponent(refNo);
      const response = await apiRequest(`${END_POINT}/lpo/get-lpo-by-ref/${decodedRef}`, 'GET');
      const data = await response.json();

      if (!data.success || !data.data) return;
      const lpo = data.data;
      const latest = lpo.amendments?.[lpo.amendments.length - 1];

      setLpoCounter(lpo.lpoCounter || 1);
      setLpoData({
        vendor: latest?.amendedCompany?.vendor || '',
        equipments: latest?.amendedEquipments || [],
        date: latest?.amendmentDate ? formatDate(latest.amendmentDate) : new Date().toLocaleDateString('en-GB'),
        lpoRef: lpo.lpoRef || '',
        complaintId: lpo.complaintId || '',
        attention: latest?.amendedCompany?.attention || '',
        designation: latest?.amendedCompany?.designation || '',
        quoteNo: latest?.amendedQuoteNo || lpo.quoteNo || '',
        workingHrs: latest?.amendedWorkingHrs || '',
        runningKm: latest?.amendedRunningKm || '',
        requestText: latest?.amendedRequestText || '',
        items: latest?.amendedItems || [],
        discount: latest?.amendedDiscount || 0,
      });

      // Resolve working hours mode.
      if (latest?.amendedRunningKm || lpo.runningKm) setWorkingHrsMode('RUNNING KM');
      else if (latest?.amendedWorkingHrs) setWorkingHrsMode('WORKING HRS');

      if (lpo.signatures?.authorizedSignatory === 'MOHAMMED SHAHEEN') setCeoMode('MANAGING DIRECTOR');

      const rawTerms = latest?.amendedTermsAndConditions || lpo.termsAndConditions;
      if (rawTerms?.length) setPaymentTerms(filterEditableTerms(rawTerms));

      setShowDiscountInTotal(
        latest?.amendedTotalAmount !== undefined || lpo.totalDiscountAmount !== undefined
      );

    } catch (err) {
      console.error('[Lpo] fetchLpoForAmendmentEdit error:', err);
      setSaveStatus('Error loading LPO data');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetches equipment records, with optional search term support.
   *
   * @param {string} [searchTerm=''] - Search term to filter equipment.
   */
  const fetchEquipments = async (searchTerm = '') => {
    try {
      const response = searchTerm.trim()
        ? await apiRequest(`${END_POINT}/equipments/search-equipments`, 'POST', { searchTerm, page: 1, limit: 1000 })
        : await apiRequest(`${END_POINT}/equipments/get-equipments?page=1&limit=1000`, 'GET');
      const data = await response.json();
      setEquipments(data.data || []);
    } catch (err) {
      console.error('[Lpo] fetchEquipments error:', err);
    }
  };

  /** Fetches company/vendor records for the autocomplete dropdowns. */
  const fetchCompanies = async () => {
    try {
      const response = await apiRequest(`${END_POINT}/lpo/get-company-details`);
      const data = await response.json();
      if (data.success) setCompanies(data.data || []);
    } catch (err) {
      console.error('[Lpo] fetchCompanies error:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Save / Submit
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns the name of the authorised signatory based on the current CEO mode.
   *
   * @returns {string} Signatory name.
   */
  const getSignatoryName = () => SIGNATORY_MAP[ceoMode] || SIGNATORY_MAP.CEO;

  /**
   * Validates, builds the payload, and submits the LPO to the API.
   * Handles create, edit, amendment, and complaint-linked flows.
   *
   * @returns {Promise<boolean>} True on success, false on validation failure or API error.
   */
  const saveLpoData = async () => {
    const currentHrsKmValue = workingHrsMode === 'WORKING HRS' ? lpoData.workingHrs : lpoData.runningKm;
    const requiresHrsKm = !isForStock && !isForAllEquipm;

    // ── Validation ──
    if (!lpoData.vendor || !lpoData.equipments.length || !lpoData.attention || !lpoData.designation ||
      (requiresHrsKm && !currentHrsKmValue)) {
      setSaveStatus('Please fill in all required fields');
      return false;
    }

    if (!lpoData.items.some((item) => item.description.trim())) {
      setSaveStatus('Please add at least one item');
      return false;
    }

    setIsLoading(true);
    setSaveStatus(isAmendmentMode ? 'Processing Amendment...' : isEditMode ? 'Updating...' : 'Saving...');

    try {
      // ── Build payload ──
      const payload = {
        lpoRef: lpoData.lpoRef,
        date: lpoData.date,
        equipments: lpoData.equipments,
        quoteNo: lpoData.quoteNo,
        requestText: lpoData.requestText,
        company: {
          vendor: lpoData.vendor,
          attention: lpoData.attention,
          designation: lpoData.designation,
        },
        items: lpoData.items.filter((item) => item.description.trim()),
        termsAndConditions: ['Terms & Conditions', ...paymentTerms],
        lpoCounter,
        signatures: {
          accountsDept: 'ROSHAN SHA',
          purchasingManager: 'ABDUL MALIK',
          operationsManager: 'SURESHKANTH',
          authorizedSignatory: getSignatoryName(),
          authorizedSignatoryTitle: ceoMode,
        },
        isAmendmented: isAmendmentMode ? true : false,
        discount: lpoData.discount,
        showDiscountInTotal,
        type: isForStock ? 'stock' : isForAllEquipm ? 'all_equipment' : 'specific_equipment',
        ...(isAmendmentMode && {
          pmSigned: false,
          accountsSigned: false,
          managerSigned: false,
          ceoSigned: false,
          isAmendment: true,
          amendmentDate: new Date().toLocaleDateString('en-GB'),
        }),
      };

      // Apply totals based on discount toggle.
      if (showDiscountInTotal) payload.totalDiscountAmount = totalAmount;
      else payload.totalAmount = subtotal;

      // Link to complaint if present.
      if (complaintId) payload.complaintId = complaintId;
      else payload.normalLPO = true;

      // Apply working hours / running km.
      if (requiresHrsKm) {
        if (workingHrsMode === 'WORKING HRS') {
          payload.workingHrs = lpoData.workingHrs;
          payload.runningKm = '';
        } else {
          payload.runningKm = lpoData.runningKm;
          payload.workingHrs = '';
        }
      }

      const endpoint = (isEditMode || isAmendmentMode)
        ? `${END_POINT}/lpo/update-lpo/${encodeURIComponent(lpoData.lpoRef)}`
        : `${END_POINT}/lpo/add-lpo`;
      const method = (isEditMode || isAmendmentMode) ? 'PUT' : 'POST';

      const response = await apiRequest(endpoint, method, payload);
      const result = await response.json();

      if (!result.success) {
        setSaveStatus(`Error: ${result.message || 'Operation failed'}`);
        return false;
      }

      // ── Complaint-linked flows: send LPO to the complaint record ──
      const needsComplaintPost = complaintId && (!isEditMode);
      if (needsComplaintPost) {
        const complaintPayload = {
          lpoData: payload,
          createdBy: 'WSM-4f428b',
          ...(isAmendmentMode && { isAmendment: true }),
        };

        const complaintResponse = await apiRequest(
          `${END_POINT}/complaints/create-lpo/${complaintId}`,
          'POST',
          complaintPayload
        );
        const complaintResult = await complaintResponse.json();

        if (complaintResult.status === 200) {
          const msg = isAmendmentMode ? 'Amendment saved and sent for approval!' : 'LPO saved and sent for approval!';
          setSaveStatus(msg);
          setTimeout(() => {
            setSaveStatus('');
            navigate(`/lpo-doc/${encodeURIComponent(lpoData.lpoRef)}/${complaintId}`);
          }, 2000);
          return true;
        }
      }

      // ── Standard success navigation ──
      const msg = isAmendmentMode ? 'Amendment saved successfully!' : isEditMode ? 'LPO updated successfully!' : 'LPO saved successfully!';
      setSaveStatus(msg);
      setTimeout(() => {
        setSaveStatus('');
        if (isAmendmentMode) {
          navigate(`/lpo-doc/${encodeURIComponent(lpoData.lpoRef)}/amendment/${true}/${complaintId || lpoData.complaintId || ''}`);
        } else {
          navigate(`/lpo-doc/${encodeURIComponent(lpoData.lpoRef)}/${complaintId || ''}`);
        }
      }, 2000);
      return true;

    } catch (err) {
      console.error('[Lpo] saveLpoData error:', err);
      setSaveStatus('Error saving LPO. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Equipment handlers
  // ─────────────────────────────────────────────────────────────────────────

  /** Adds the currently typed equipment string to the equipment list. */
  const addEquipment = () => {
    if (currentEquipmentInput.trim() && !lpoData.equipments.includes(currentEquipmentInput)) {
      setLpoData((prev) => ({ ...prev, equipments: [...prev.equipments, currentEquipmentInput] }));
      setCurrentEquipmentInput('');
    }
  };

  /**
   * Removes an equipment entry by index.
   *
   * @param {number} index - Index of the equipment to remove.
   */
  const removeEquipment = (index) => {
    setLpoData((prev) => ({
      ...prev,
      equipments: prev.equipments.filter((_, i) => i !== index),
    }));
  };

  /**
   * Selects an equipment from the dropdown and populates the input field.
   *
   * @param {Object} equipment - Equipment record from the API.
   */
  const handleEquipmentSelect = (equipment) => {
    setCurrentEquipmentInput(`${equipment.regNo} – ${equipment.machine}`);
    setEquipmentDropdown(false);
    setEquipmentSearch('');
  };

  /** Triggers addEquipment when the user presses Enter inside the equipment input. */
  const handleEquipmentKeyDown = (e) => {
    if (e.key === 'Enter') addEquipment();
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Company / attention handlers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Selects a company from the dropdown and populates vendor, attention, and designation fields.
   *
   * @param {Object} company - Company record from the API.
   */
  const handleCompanySelect = (company) => {
    setLpoData((prev) => ({ ...prev, vendor: company.vendor, attention: company.attention, designation: company.designation }));
    setCompanyDropdown(false);
  };

  /**
   * Selects an attention person from the dropdown without changing the vendor.
   *
   * @param {Object} company - Company record containing attention and designation.
   */
  const handleAttentionSelect = (company) => {
    setLpoData((prev) => ({ ...prev, attention: company.attention, designation: company.designation }));
    setAttnDropdown(false);
  };

  /**
   * Handles vendor input changes and opens the company autocomplete dropdown.
   *
   * @param {string} value - Current input value.
   */
  const handleVendorChange = (value) => {
    setLpoData((prev) => ({ ...prev, vendor: value }));
    if (value.trim()) {
      setCompanyDropdown(true);
      if (!companies.length) fetchCompanies();
    } else {
      setCompanyDropdown(false);
    }
  };

  /**
   * Handles attention input changes and opens the attention autocomplete dropdown.
   *
   * @param {string} value - Current input value.
   */
  const handleAttentionChange = (value) => {
    setLpoData((prev) => ({ ...prev, attention: value }));
    if (value.trim()) {
      setAttnDropdown(true);
      if (!companies.length) fetchCompanies();
    } else {
      setAttnDropdown(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Line item handlers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Updates a field value on a specific line item and recalculates totalPrice.
   *
   * @param {number} index - Item index.
   * @param {string} field - Field name to update.
   * @param {string} value - New raw value from the input element.
   */
  const handleItemChange = (index, field, value) => {
    const newItems = [...lpoData.items];
    newItems[index] = {
      ...newItems[index],
      [field]: (field === 'quantity' || field === 'unitPrice') ? parseFloat(value) || null : value,
    };
    newItems[index].totalPrice = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
    setLpoData((prev) => ({ ...prev, items: newItems }));
  };

  /** Appends a new blank line item row. */
  const addItemRow = () => {
    setLpoData((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { id: prev.items.length + 1, description: '', quantity: 0, unitPrice: 0, totalPrice: 0 },
      ],
    }));
  };

  /**
   * Removes a line item row by index, then renumbers the remaining items.
   * No-op when only one item remains.
   *
   * @param {number} index - Row index to remove.
   */
  const removeItemRow = (index) => {
    if (lpoData.items.length <= 1) return;
    const updated = lpoData.items
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, id: i + 1 }));
    setLpoData((prev) => ({ ...prev, items: updated }));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Discount handlers
  // ─────────────────────────────────────────────────────────────────────────

  /** Opens the discount popup pre-filled with the current discount value. */
  const handleDiscountPopup = () => {
    setDiscountInput(lpoData.discount.toString());
    setShowDiscountPopup(true);
  };

  /** Applies the discount value from the popup, clamped to [0, subtotal]. */
  const applyDiscount = () => {
    const value = Math.max(0, Math.min(parseFloat(discountInput) || 0, subtotal));
    setLpoData((prev) => ({ ...prev, discount: value }));
    setShowDiscountPopup(false);
    setDiscountInput('');
  };

  /** Cancels the discount popup without saving. */
  const cancelDiscount = () => {
    setShowDiscountPopup(false);
    setDiscountInput('');
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Payment terms handlers
  // ─────────────────────────────────────────────────────────────────────────

  /** Appends a new blank payment term entry. */
  const addPaymentTerm = () => setPaymentTerms((prev) => [...prev, '']);

  /**
   * Updates the text of a payment term at a given index.
   *
   * @param {number} index - Term index.
   * @param {string} value - New term text.
   */
  const updatePaymentTerm = (index, value) => {
    const updated = [...paymentTerms];
    updated[index] = value;
    setPaymentTerms(updated);
  };

  /**
   * Removes a payment term by index. No-op when only one term remains.
   *
   * @param {number} index - Term index.
   */
  const removePaymentTerm = (index) => {
    if (paymentTerms.length <= 1) return;
    setPaymentTerms((prev) => prev.filter((_, i) => i !== index));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Toggle handlers
  // ─────────────────────────────────────────────────────────────────────────

  const toggleWorkingHrsMode = () => setWorkingHrsMode((prev) => prev === 'WORKING HRS' ? 'RUNNING KM' : 'WORKING HRS');
  const toggleCeoMode = () => setCeoMode((prev) => prev === 'CEO' ? 'MANAGING DIRECTOR' : 'CEO');
  const toggleDiscountInTotal = () => setShowDiscountInTotal((prev) => !prev);

  // ─────────────────────────────────────────────────────────────────────────
  // Filtered dropdown lists (derived — no state needed)
  // ─────────────────────────────────────────────────────────────────────────

  const filteredEquipments = equipments.filter((eq) =>
    eq.machine.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
    eq.regNo.toLowerCase().includes(equipmentSearch.toLowerCase())
  );

  const filteredCompanies = companies.filter((c) => c.vendor.toLowerCase().includes(lpoData.vendor.toLowerCase()));
  const filteredAttentions = companies.filter((c) => c.attention.toLowerCase().includes(lpoData.attention.toLowerCase()));

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="page-container">

      {/* ── Controls toolbar ── */}
      <div className="controls">
        <div className="button-group">
          <Button
            {...SHARED_BTN}
            text={isLoading
              ? (isAmendmentMode ? 'Processing Amendment...' : isEditMode ? 'Updating...' : 'Saving...')
              : (isAmendmentMode ? 'Save Amendment & Send for Approval' : isEditMode ? 'Update LPO' : 'Save LPO')}
            onClick={saveLpoData}
            colorScheme={isLoading ? 'lime-900' : 'lime-800'}
            width="fit-content"
            type={isLoading ? 'disabled' : 'submit'}
            cursor="allowed"
          />
        </div>
      </div>

      {/* ── LPO Document (editable form) ── */}
      <div className="lpo-document-f" ref={componentRef}>

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
        <div className="lpo-title">PURCHASE/HIRE ORDER</div>

        {/* ── LPO Meta Details ── */}
        <div className="lpo-details">
          <table className="details-table">
            <tbody>
              <tr>
                {/* ── Left column: vendor, attention, designation, quote ref ── */}
                <td className="left-col">

                  {/* Vendor autocomplete */}
                  <div className="detail-item detail-item-form">
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

                  {/* Attention autocomplete */}
                  <div className="detail-item detail-item-form">
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

                  {/* Designation */}
                  <div className="detail-item detail-item-form">
                    DESIGNATION :
                    <input
                      type="text"
                      className="editable-input designation-input"
                      value={lpoData.designation}
                      onChange={(e) => setLpoData((prev) => ({ ...prev, designation: e.target.value }))}
                      placeholder="Enter designation"
                    />
                  </div>

                  {/* Quote reference */}
                  <div className="detail-item detail-item-form">
                    Ref No :
                    <input
                      type="text"
                      className="editable-input designation-input"
                      value={lpoData.quoteNo}
                      onChange={(e) => setLpoData((prev) => ({ ...prev, quoteNo: e.target.value }))}
                      placeholder="Enter Quotation Number"
                    />
                  </div>

                </td>

                {/* ── Right column: date, LPO ref, equipment, working hrs/km ── */}
                <td className="right-col">

                  <div className="detail-item detail-item-form">DATE : <span className="non-editable">{lpoData.date}</span></div>
                  <div className="detail-item detail-item-form">LPO REF NO : <span className="non-editable">{lpoData.lpoRef}</span></div>

                  {/* Equipment selector */}
                  <div className="detail-item detail-item-form">
                    <div className="equip-field">
                      <span className="equip-field-name">EQUIPMENT :</span>
                    </div>

                    {isForStock || isForAllEquipm ? (
                      <span className="non-editable">{lpoData.equipments[0]}</span>
                    ) : (
                      <div className="equipment-multi-select">

                        {/* Selected equipment tags */}
                        <div className="selected-equipments">
                          {lpoData.equipments.map((eq, idx) => (
                            <div key={idx} className="equipment-tag">
                              {eq}
                              <button className="remove-equipment-btn" onClick={() => removeEquipment(idx)}>×</button>
                            </div>
                          ))}
                        </div>

                        {/* Equipment input + dropdown */}
                        <div className="dropdown-container" ref={equipmentRef}>
                          <input
                            type="text"
                            className="editable-input equipment-input"
                            value={currentEquipmentInput}
                            onChange={(e) => setCurrentEquipmentInput(e.target.value)}
                            onKeyDown={handleEquipmentKeyDown}
                            onFocus={() => { setEquipmentDropdown(true); fetchEquipments(); }}
                            placeholder={lpoData.equipments.length ? 'Add another equipment' : 'Select equipment'}
                          />
                          {equipmentDropdown && (
                            <div className="dropdown-menu">
                              <input
                                type="text"
                                placeholder="Search equipments..."
                                value={equipmentSearch}
                                onChange={(e) => { setEquipmentSearch(e.target.value); fetchEquipments(e.target.value); }}
                                className="dropdown-search"
                                autoFocus
                              />
                              <div className="dropdown-options">
                                {filteredEquipments.map((eq, idx) => (
                                  <div key={idx} className="dropdown-option" onClick={() => handleEquipmentSelect(eq)}>
                                    <div className="equipment-reg">{eq.regNo}</div>
                                    <div className="equipment-machine">{eq.machine}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          {...SHARED_BTN}
                          text="Apply"
                          onClick={addEquipment}
                          colorScheme="lime-800"
                          width="100%"
                          height="20px"
                          font="sm"
                          type={currentEquipmentInput.trim() ? 'submit' : 'disabled'}
                          cursor={currentEquipmentInput.trim() ? 'pointer' : 'not-allowed'}
                        />
                      </div>
                    )}
                  </div>

                  {/* Working hours / running km toggle input */}
                  {!isForStock && !isForAllEquipm && (
                    <div className="detail-item detail-item-form">
                      <span className="toggle-field" onClick={toggleWorkingHrsMode}>{workingHrsMode}</span>
                      <span>:</span>
                      <input
                        type="text"
                        className="editable-input"
                        value={workingHrsMode === 'WORKING HRS' ? lpoData.workingHrs : lpoData.runningKm}
                        onChange={(e) => {
                          const field = workingHrsMode === 'WORKING HRS' ? 'workingHrs' : 'runningKm';
                          setLpoData((prev) => ({ ...prev, [field]: e.target.value }));
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

        <div className="details-divider" />

        {/* ── Request text ── */}
        <div className="request-text-f">
          <textarea
            className="editable-request-text-f"
            value={lpoData.requestText}
            onChange={(e) => setLpoData((prev) => ({ ...prev, requestText: e.target.value }))}
            rows={3}
          />
        </div>

        {/* ── Line items table ── */}
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

                {/* SN cell with hover add/remove controls */}
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
                      {lpoData.items.length > 1 && (
                        <Button
                          {...SHARED_BTN}
                          text='-'
                          onClick={() => removeItemRow(index)}
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
                    value={item.quantity ?? ''}
                    onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    className="table-input number-input"
                    value={item.unitPrice ?? ''}
                    onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)}
                    step="0.01"
                  />
                </td>
                <td className="calculated-total">{formatCurrency(item.totalPrice)}</td>
              </tr>
            ))}

            {/* Optional discount row */}
            {showDiscountInTotal && lpoData.discount > 0 && (
              <tr>
                <td colSpan="4" className="total-label">Discount (QR)</td>
                <td className="calculated-total discount-amount">-{formatCurrency(lpoData.discount)}</td>
              </tr>
            )}

            {/* Total row with discount toggle */}
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
                    <Button
                      {...SHARED_BTN}
                      text={lpoData.discount > 0 ? 'Edit Discount' : 'Add Discount'}
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
                        Discount: {lpoData.discount.toFixed(2)} QR
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
            <tr className="terms-row-large">
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
                <strong>NOTE:</strong> The LPO copy should be submitted along with the invoice every month for the payment process.
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
            <tr className="signature-spaces-large">
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
    </div>
  );
}

export default Lpo;