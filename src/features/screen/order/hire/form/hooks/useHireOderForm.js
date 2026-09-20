import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import {
  fetchLatestHireOrderRef,
  getHireOrderByRef,
  fetchCompanyDetails,
  createOrUpdateHireOrder,
} from '../api/hire.order.form.api';
import {
  buildDefaultItem,
  buildCustomField,
  generateHireOrderRef,
  getNextHireOrderNumber,
  formatDate,
  filterEditableTerms,
  itemHasContent,
  getAutoCalculateTotal,
  calculateSubtotal,
  filterCompaniesByField,
  getModeLabel,
  getStatusTitle,
} from '../helper/hire.order.form.helper';
import {
  DEFAULT_COLUMNS,
  DEFAULT_HIRE_ORDER_DATA,
  DEFAULT_PAYMENT_TERMS,
  MIN_EDITABLE_COLUMNS,
  SIGNATORY_MAP,
  COLUMN_TEMPLATES,
} from '../constants/hire.order.form.constant';

export const useHireOderForm = ({ edit, amendment, amendmentUpdate }) => {
  const navigate = useNavigate();
  const { refNo, complaintId } = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const companyRef = useRef();
  const attnRef = useRef();
  const discountPopupRef = useRef();

  const isEditMode = !!(edit && refNo);
  const isAmendmentEditMode = !!(amendment && amendmentUpdate && refNo);
  const isAmendmentMode = !!(amendment && refNo);

  const [hireOrderData, setHireOrderData] = useState(DEFAULT_HIRE_ORDER_DATA);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [columnTemplate, setColumnTemplate] = useState('DEFAULT');
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
  const [customFields, setCustomFields] = useState([]);
  const [showTotalRow, setShowTotalRow] = useState(true);
  const [manualTotal, setManualTotal] = useState(null);

  const autoCalculateTotal = getAutoCalculateTotal(columns);

  const subtotal = calculateSubtotal(hireOrderData.items);
  const totalAmount = subtotal - (hireOrderData.discount || 0);

  const autoTotal = showDiscountInTotal ? totalAmount : subtotal;
  const parsedManualTotal =
    manualTotal !== null && manualTotal !== '' && !Number.isNaN(parseFloat(manualTotal)) ? parseFloat(manualTotal) : null;
  const finalTotal = parsedManualTotal ?? autoTotal;

  useEffect(() => {
    if (saveStatus) {
      const title = getStatusTitle(saveStatus);
      setHeaderTitle(title);
      setHeaderSubtitle(saveStatus);
    } else {
      const modeLabel = getModeLabel(isAmendmentMode, isEditMode);
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

  const fetchLatestHireOrderNumber = async () => {
    try {
      const data = await fetchLatestHireOrderRef();
      const latestNo = getNextHireOrderNumber(data.data?.latestRef);
      setHireOrderCounter(latestNo);
      setHireOrderData((prev) => ({ ...prev, hireOrderRef: generateHireOrderRef(latestNo) }));
    } catch (error) {
      console.error('[HroForm] fetchLatestHireOrderNumber error:', error);
      setHireOrderData((prev) => ({ ...prev, hireOrderRef: generateHireOrderRef(1) }));
    }
  };

  const fetchHireOrderForEdit = async () => {
    setIsLoading(true);
    try {
      const data = await getHireOrderByRef(refNo);

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
      setCustomFields(ho.customFields?.length ? ho.customFields : []);
      setShowTotalRow(ho.showTotalRow ?? true);
      setManualTotal(ho.manualTotal != null ? String(ho.manualTotal) : null);
    } catch (error) {
      console.error('[HroForm] fetchHireOrderForEdit error:', error);
      setSaveStatus('Error loading hire order data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHireOrderForAmendmentEdit = async () => {
    setIsLoading(true);
    try {
      const data = await getHireOrderByRef(refNo);

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
      setCustomFields(
        latest?.amendedCustomFields?.length
          ? latest.amendedCustomFields
          : (ho.customFields?.length ? ho.customFields : [])
      );
      setShowTotalRow(latest?.amendedShowTotalRow ?? ho.showTotalRow ?? true);
      setManualTotal(latest?.amendedManualTotal != null ? String(latest.amendedManualTotal) : null);
    } catch (error) {
      console.error('[HroForm] fetchHireOrderForAmendmentEdit error:', error);
      setSaveStatus('Error loading hire order data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await fetchCompanyDetails();
      if (data.success) setCompanies(data.data || []);
    } catch (error) {
      console.error('[HroForm] fetchCompanies error:', error);
    }
  };

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
    const isCalculated = columns.find((c) => c.id === colId)?.type === 'calculated';
    const editableCount = columns.filter((c) => c.type !== 'calculated').length;

    if (!isCalculated && editableCount <= MIN_EDITABLE_COLUMNS) {
      setSaveStatus(`Please keep at least ${MIN_EDITABLE_COLUMNS} columns between SN and Total Price`);
      setTimeout(() => setSaveStatus(''), 2500);
      return;
    }

    setColumns((prev) => prev.filter((c) => c.id !== colId));
    if (isCalculated) return;
    setHireOrderData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        const { [colId]: _removed, ...rest } = item;
        return rest;
      }),
    }));
  };

  const handleColumnTemplateChange = (e) => {
    const key = e.target.value;
    const newColumns = COLUMN_TEMPLATES[key] || DEFAULT_COLUMNS;
    setColumnTemplate(key);
    setColumns(newColumns);
    setHireOrderData((prev) => ({ ...prev, items: [buildDefaultItem(newColumns)] }));
  };

  const addTotalColumn = () => {
    if (columns.some((c) => c.type === 'calculated')) return;

    setColumns((prev) => [...prev, { id: 'totalPrice', label: 'Total Price(QR)', type: 'calculated', deletable: true }]);
    setHireOrderData((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({
        ...item,
        totalPrice: item.totalPrice ?? (autoCalculateTotal ? (item.quantity || 0) * (item.unitPrice || 0) : 0),
      })),
    }));
  };

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

  const addCustomField = () => setCustomFields((prev) => [...prev, buildCustomField()]);

  const updateCustomFieldLabel = (id, label) =>
    setCustomFields((prev) => prev.map((field) => (field.id === id ? { ...field, label } : field)));

  const updateCustomFieldValue = (id, value) =>
    setCustomFields((prev) => prev.map((field) => (field.id === id ? { ...field, value } : field)));

  const removeCustomField = (id) => setCustomFields((prev) => prev.filter((field) => field.id !== id));

  const removeTotalRow = () => setShowTotalRow(false);
  const restoreTotalRow = () => setShowTotalRow(true);
  const handleManualTotalChange = (e) => setManualTotal(e.target.value);
  const handleManualTotalBlur = () => { if (manualTotal === '') setManualTotal(null); };
  const resetManualTotal = () => setManualTotal(null);

  const toggleDiscountInTotal = () => setShowDiscountInTotal((prev) => !prev);
  const toggleCeoMode = () => setCeoMode((prev) => (prev === 'CEO' ? 'MANAGING DIRECTOR' : 'CEO'));
  const getSignatoryName = () => SIGNATORY_MAP[ceoMode] || SIGNATORY_MAP.CEO;

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

  const handleVendorInputChange = (e) => handleVendorChange(e.target.value);
  const handleAttentionInputChange = (e) => handleAttentionChange(e.target.value);
  const handleDesignationChange = (e) => setHireOrderData((prev) => ({ ...prev, designation: e.target.value }));
  const handleQuoteNoChange = (e) => setHireOrderData((prev) => ({ ...prev, quoteNo: e.target.value }));
  const handleRequestTextChange = (e) => setHireOrderData((prev) => ({ ...prev, requestText: e.target.value }));
  const handleDiscountInputChange = (e) => setDiscountInput(e.target.value);

  const handleRowMouseEnter = (index) => setShowAddButton(index);
  const handleRowMouseLeave = () => setShowAddButton(null);

  const handleDiscountButtonMouseEnter = () => setShowDiscount(true);
  const handleDiscountButtonMouseLeave = () => setShowDiscount(false);

  const filteredCompanies = filterCompaniesByField(companies, 'vendor', hireOrderData.vendor);
  const filteredAttentions = filterCompaniesByField(companies, 'attention', hireOrderData.attention);

  const saveHireOrderData = async () => {
    if (!hireOrderData.vendor || !hireOrderData.attention || !hireOrderData.designation || !hireOrderData.items.some((item) => itemHasContent(item, columns))) {
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
        customFields,
        requestText: hireOrderData.requestText,
        columns,
        items: hireOrderData.items.filter((item) => itemHasContent(item, columns)),
        termsAndConditions: ['Terms & Conditions', ...paymentTerms],
        hireOrderCounter,
        discount: hireOrderData.discount,
        showTotalRow,
        manualTotal: parsedManualTotal,
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

      if (showDiscountInTotal) payload.totalDiscountAmount = finalTotal;
      else payload.totalAmount = finalTotal;

      if (complaintId) payload.complaintId = complaintId;

      const endpoint = (isEditMode || isAmendmentMode)
        ? `/order/hire/update-hire-order/${encodeURIComponent(hireOrderData.hireOrderRef)}`
        : `/order/hire/add-hire-order`;
      const method = (isEditMode || isAmendmentMode) ? 'PUT' : 'POST';

      const result = await createOrUpdateHireOrder(endpoint, method, payload);

      if (!result.success) {
        setSaveStatus(`Error: ${result.message || 'Operation failed'}`);
        return false;
      }

      const msg = isAmendmentMode ? 'Amendment saved successfully!' : isEditMode ? 'Hire order updated successfully!' : 'Hire order saved successfully!';
      setSaveStatus(msg);
      setTimeout(() => {
        setSaveStatus('');
        if (isAmendmentMode) {
          navigate(`/order/hire/report/${encodeURIComponent(hireOrderData.hireOrderRef)}/amendment/${true}`);
        } else {
          navigate(`/order/hire/report/${encodeURIComponent(hireOrderData.hireOrderRef)}`);
        }
      }, 1500);
      return true;
    } catch (error) {
      console.error('[HroForm] saveHireOrderData error:', error);
      setSaveStatus('Error saving hire order. Please try again.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    companyRef,
    attnRef,
    discountPopupRef,

    isEditMode,
    isAmendmentMode,

    hireOrderData,
    columns,
    columnTemplate,
    paymentTerms,
    hireOrderCounter,
    ceoMode,
    companyDropdown,
    attnDropdown,
    showDiscount,
    showDiscountPopup,
    discountInput,
    showAddButton,
    companies,
    isLoading,
    saveStatus,
    showDiscountInTotal,

    autoCalculateTotal,
    subtotal,
    totalAmount,
    finalTotal,
    customFields,
    showTotalRow,
    manualTotal,
    filteredCompanies,
    filteredAttentions,

    updateColumnLabel,
    handleColumnTemplateChange,
    addColumn,
    addTotalColumn,
    removeColumn,
    addItemRow,
    removeItem,
    handleItemChange,
    handleDiscountPopup,
    applyDiscount,
    cancelDiscount,
    addPaymentTerm,
    updatePaymentTerm,
    removePaymentTerm,
    addCustomField,
    updateCustomFieldLabel,
    updateCustomFieldValue,
    removeCustomField,
    removeTotalRow,
    restoreTotalRow,
    handleManualTotalChange,
    handleManualTotalBlur,
    resetManualTotal,
    toggleDiscountInTotal,
    toggleCeoMode,
    getSignatoryName,
    handleCompanySelect,
    handleAttentionSelect,
    handleVendorInputChange,
    handleAttentionInputChange,
    handleDesignationChange,
    handleQuoteNoChange,
    handleRequestTextChange,
    handleDiscountInputChange,
    handleRowMouseEnter,
    handleRowMouseLeave,
    handleDiscountButtonMouseEnter,
    handleDiscountButtonMouseLeave,
    saveHireOrderData,
  };
};

export default useHireOderForm;