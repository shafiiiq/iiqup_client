import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import {
  fetchLatestQuotationRef,
  getQuotationByRef,
  fetchCompanyDetails,
  createOrUpdateQuotation,
} from '../api/quotation.form.api';
import {
  buildDefaultItem,
  buildCustomField,
  generateQuotationRef,
  decodeSequenceNumber,
  formatDate,
  filterEditableTerms,
  itemHasContent,
  getAutoCalculateTotal,
  calculateSubtotal,
  filterCompaniesByField,
  getModeLabel,
  getStatusTitle,
  isTermHeading,
  compressImageDataUrl,
} from '../helper/quotation.form.helper';
import {
  DEFAULT_COLUMNS,
  DEFAULT_QUOTATION_DATA,
  DEFAULT_PAYMENT_TERMS,
  DEFAULT_NOTICE_TEXT,
  DEFAULT_PRICE_STATEMENT_TEXT,
  DEFAULT_CONTACT_TEXT,
  MIN_EDITABLE_COLUMNS,
  SIGNATORY_MAP,
  TERM_TEMPLATES,
} from '../constants/quotation.form.constant';

export const useQuotationForm = ({ edit, amendment, amendmentUpdate }) => {
  const navigate = useNavigate();
  const { quotationRef, complaintId } = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const companyRef = useRef();
  const attnRef = useRef();
  const discountPopupRef = useRef();

  const isEditMode = !!(edit && quotationRef);
  const isAmendmentEditMode = !!(amendment && amendmentUpdate && quotationRef);
  const isAmendmentMode = !!(amendment && quotationRef);

  const [quotationData, setQuotationData] = useState(DEFAULT_QUOTATION_DATA);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [paymentTerms, setPaymentTerms] = useState(DEFAULT_PAYMENT_TERMS);
  const [termTemplate, setTermTemplate] = useState('WITH_OPERATOR');
  const [customFields, setCustomFields] = useState([]);
  const [quotationCounter, setQuotationCounter] = useState(1);
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
  const [showTotalRow, setShowTotalRow] = useState(true);
  const [manualTotal, setManualTotal] = useState(null);

  const autoCalculateTotal = getAutoCalculateTotal(columns);

  const subtotal = calculateSubtotal(quotationData.items);
  const totalAmount = subtotal - (quotationData.discount || 0);

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
      setHeaderTitle(`${modeLabel} Quotation`);
      setHeaderSubtitle(`Quotation Number: ${quotationCounter}`);
    }

    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [quotationCounter, saveStatus, quotationData.quotationRef, isAmendmentMode, isEditMode, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    if (isAmendmentEditMode && quotationRef) fetchHireOrderForAmendmentEdit();
    else if ((isEditMode || isAmendmentMode) && quotationRef) fetchHireOrderForEdit();
    else fetchLatestHireOrderNumber();

    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationRef, isEditMode, isAmendmentMode]);

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
      const data = await fetchLatestQuotationRef();
      const latestRef = data.data?.latestRef;
      const sequencePart = latestRef && latestRef !== 'No Quotation found' ? latestRef.split('-').pop() : null;
      const latestNo = sequencePart ? decodeSequenceNumber(sequencePart) + 1 : 1;
      setQuotationCounter(latestNo);
      setQuotationData((prev) => ({ ...prev, quotationRef: generateQuotationRef(latestNo) }));
    } catch (error) {
      console.error('[Quotation] fetchLatestHireOrderNumber error:', error);
      setQuotationData((prev) => ({ ...prev, quotationRef: generateQuotationRef(1) }));
    }
  };

  const fetchHireOrderForEdit = async () => {
    setIsLoading(true);
    try {
      const data = await getQuotationByRef(quotationRef);

      if (!data.success || !data.data) return;
      const ho = data.data;

      const loadedColumns = ho.columns?.length ? ho.columns : DEFAULT_COLUMNS;

      setQuotationCounter(ho.quotationCounter || 1);
      setColumns(loadedColumns);
      setQuotationData({
        vendor: ho.company?.vendor || '',
        date: ho.date || new Date().toLocaleDateString('en-GB'),
        quotationRef: ho.quotationRef || '',
        complaintId: ho.complaintId || '',
        attention: ho.company?.attention || '',
        designation: ho.company?.designation || '',
        location: ho.location || '',
        requestText: ho.requestText || '',
        items: ho.items?.length ? ho.items : [buildDefaultItem(loadedColumns)],
        discount: ho.discount || 0,
        noticeText: ho.noticeText || DEFAULT_NOTICE_TEXT,
        priceStatementText: ho.priceStatementText || DEFAULT_PRICE_STATEMENT_TEXT,
        contactText: ho.contactText || DEFAULT_CONTACT_TEXT,
      });

      setCustomFields(ho.customFields?.length ? ho.customFields : []);

      if (ho.signatures?.authorizedSignatory === 'MOHAMMED SHAHEEN') setCeoMode('MANAGING DIRECTOR');
      if (ho.termsAndConditions?.length) setPaymentTerms(filterEditableTerms(ho.termsAndConditions));
      setShowDiscountInTotal(ho.totalDiscountAmount !== undefined);
      setShowTotalRow(ho.showTotalRow ?? true);
      setManualTotal(ho.manualTotal != null ? String(ho.manualTotal) : null);
    } catch (error) {
      console.error('[Quotation] fetchHireOrderForEdit error:', error);
      setSaveStatus('Error loading quotation data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHireOrderForAmendmentEdit = async () => {
    setIsLoading(true);
    try {
      const data = await getQuotationByRef(quotationRef);

      if (!data.success || !data.data) return;
      const ho = data.data;
      const latest = ho.amendments?.[ho.amendments.length - 1];

      const loadedColumns = latest?.amendedColumns?.length ? latest.amendedColumns : (ho.columns?.length ? ho.columns : DEFAULT_COLUMNS);

      setQuotationCounter(ho.quotationCounter || 1);
      setColumns(loadedColumns);
      setQuotationData({
        vendor: latest?.amendedCompany?.vendor || '',
        date: latest?.amendmentDate ? formatDate(latest.amendmentDate) : new Date().toLocaleDateString('en-GB'),
        quotationRef: ho.quotationRef || '',
        complaintId: ho.complaintId || '',
        attention: latest?.amendedCompany?.attention || '',
        designation: latest?.amendedCompany?.designation || '',
        location: latest?.amendedLocation || ho.location || '',
        requestText: latest?.amendedRequestText || ho.requestText || '',
        items: latest?.amendedItems?.length ? latest.amendedItems : (ho.items?.length ? ho.items : [buildDefaultItem(loadedColumns)]),
        discount: latest?.amendedDiscount || 0,
        noticeText: latest?.amendedNoticeText || ho.noticeText || DEFAULT_NOTICE_TEXT,
        priceStatementText: latest?.amendedPriceStatementText || ho.priceStatementText || DEFAULT_PRICE_STATEMENT_TEXT,
        contactText: latest?.amendedContactText || ho.contactText || DEFAULT_CONTACT_TEXT,
      });

      setCustomFields(
        latest?.amendedCustomFields?.length
          ? latest.amendedCustomFields
          : (ho.customFields?.length ? ho.customFields : [])
      );

      if (ho.signatures?.authorizedSignatory === 'MOHAMMED SHAHEEN') setCeoMode('MANAGING DIRECTOR');

      const rawTerms = latest?.amendedTermsAndConditions || ho.termsAndConditions;
      if (rawTerms?.length) setPaymentTerms(filterEditableTerms(rawTerms));

      setShowDiscountInTotal(latest?.amendedTotalAmount !== undefined || ho.totalDiscountAmount !== undefined);
      setShowTotalRow(latest?.amendedShowTotalRow ?? ho.showTotalRow ?? true);
      setManualTotal(latest?.amendedManualTotal != null ? String(latest.amendedManualTotal) : null);
    } catch (error) {
      console.error('[Quotation] fetchHireOrderForAmendmentEdit error:', error);
      setSaveStatus('Error loading quotation data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await fetchCompanyDetails();
      if (data.success) setCompanies(data.data || []);
    } catch (error) {
      console.error('[Quotation] fetchCompanies error:', error);
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

    setQuotationData((prev) => ({
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
    setQuotationData((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        const { [colId]: _removed, ...rest } = item;
        return rest;
      }),
    }));
  };

  const addTotalColumn = () => {
    if (columns.some((c) => c.type === 'calculated')) return;

    setColumns((prev) => [...prev, { id: 'totalPrice', label: 'Total Price(QR)', type: 'calculated', deletable: true }]);
    setQuotationData((prev) => ({
      ...prev,
      items: prev.items.map((item) => ({
        ...item,
        totalPrice: item.totalPrice ?? (autoCalculateTotal ? (item.quantity || 0) * (item.unitPrice || 0) : 0),
      })),
    }));
  };

  const addItemRow = () => {
    setQuotationData((prev) => ({
      ...prev,
      items: [...prev.items, buildDefaultItem(columns, prev.items.length + 1)],
    }));
  };

  const removeItem = (index) => {
    if (quotationData.items.length <= 1) return;
    const updated = quotationData.items
      .filter((_, i) => i !== index)
      .map((item, i) => ({ ...item, id: i + 1 }));
    setQuotationData((prev) => ({ ...prev, items: updated }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...quotationData.items];
    const isManualTotalField = field === 'totalPrice' && !autoCalculateTotal;
    const isNumericField = field === 'quantity' || field === 'unitPrice' || isManualTotalField;

    newItems[index] = {
      ...newItems[index],
      [field]: isNumericField ? (parseFloat(value) || null) : value,
    };

    if (autoCalculateTotal) {
      newItems[index].totalPrice = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
    }

    setQuotationData((prev) => ({ ...prev, items: newItems }));
  };

  const readImageFileForItem = (file, index) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const compressed = await compressImageDataUrl(reader.result);
      handleItemImageChange(index, compressed);
    };
    reader.readAsDataURL(file);
  };

  const handleItemImageChange = (index, dataUrl) => {
    setQuotationData((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], image: dataUrl };
      return { ...prev, items };
    });
  };

  const removeItemImage = (index) => {
    setQuotationData((prev) => {
      const items = [...prev.items];
      items[index] = { ...items[index], image: undefined };
      return { ...prev, items };
    });
  };

  const handleDescriptionPaste = (e, index) => {
    const clipboardItems = e.clipboardData?.items;

    if (clipboardItems) {
      for (const clipboardItem of clipboardItems) {
        if (clipboardItem.type.startsWith('image/')) {
          const file = clipboardItem.getAsFile();
          readImageFileForItem(file, index);
          e.preventDefault();
          return;
        }
      }
    }

    const clipboardFiles = e.clipboardData?.files;
    if (clipboardFiles?.length) {
      for (const file of clipboardFiles) {
        if (file.type.startsWith('image/')) {
          readImageFileForItem(file, index);
          e.preventDefault();
          return;
        }
      }
    }
  };

  const handleDescriptionDrop = (e, index) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    readImageFileForItem(file, index);
  };

  const handleDescriptionDragOver = (e) => e.preventDefault();

  const handleDiscountPopup = () => {
    setDiscountInput(quotationData.discount.toString());
    setShowDiscountPopup(true);
  };

  const applyDiscount = () => {
    const value = Math.max(0, Math.min(parseFloat(discountInput) || 0, subtotal));
    setQuotationData((prev) => ({ ...prev, discount: value }));
    setShowDiscountPopup(false);
    setDiscountInput('');
  };

  const cancelDiscount = () => {
    setShowDiscountPopup(false);
    setDiscountInput('');
  };

  const handleTermTemplateChange = (e) => {
    const key = e.target.value;
    setTermTemplate(key);
    setPaymentTerms(TERM_TEMPLATES[key] || DEFAULT_PAYMENT_TERMS);
  };

  const addPaymentTerm = () => setPaymentTerms((prev) => [...prev, '']);
  const addPaymentTermHeading = () => setPaymentTerms((prev) => [...prev, '## ']);

  const updatePaymentTerm = (index, value) => {
    const updated = [...paymentTerms];
    updated[index] = isTermHeading(updated[index]) ? `## ${value}` : value;
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
    setQuotationData((prev) => ({ ...prev, vendor: company.vendor, attention: company.attention, designation: company.designation }));
    setCompanyDropdown(false);
  };

  const handleAttentionSelect = (company) => {
    setQuotationData((prev) => ({ ...prev, attention: company.attention, designation: company.designation }));
    setAttnDropdown(false);
  };

  const handleVendorChange = (value) => {
    setQuotationData((prev) => ({ ...prev, vendor: value }));
    if (value.trim()) {
      setCompanyDropdown(true);
      if (!companies.length) fetchCompanies();
    } else {
      setCompanyDropdown(false);
    }
  };

  const handleAttentionChange = (value) => {
    setQuotationData((prev) => ({ ...prev, attention: value }));
    if (value.trim()) {
      setAttnDropdown(true);
      if (!companies.length) fetchCompanies();
    } else {
      setAttnDropdown(false);
    }
  };

  const handleVendorInputChange = (e) => handleVendorChange(e.target.value);
  const handleAttentionInputChange = (e) => handleAttentionChange(e.target.value);
  const handleDesignationChange = (e) => setQuotationData((prev) => ({ ...prev, designation: e.target.value }));
  const handleLocationChange = (e) => setQuotationData((prev) => ({ ...prev, location: e.target.value }));
  const handleRequestTextChange = (e) => setQuotationData((prev) => ({ ...prev, requestText: e.target.value }));
  const handleNoticeTextChange = (e) => setQuotationData((prev) => ({ ...prev, noticeText: e.target.value }));
  const handlePriceStatementTextChange = (e) => setQuotationData((prev) => ({ ...prev, priceStatementText: e.target.value }));
  const handleContactTextChange = (e) => setQuotationData((prev) => ({ ...prev, contactText: e.target.value }));
  const handleDiscountInputChange = (e) => setDiscountInput(e.target.value);

  const handleRowMouseEnter = (index) => setShowAddButton(index);
  const handleRowMouseLeave = () => setShowAddButton(null);

  const handleDiscountButtonMouseEnter = () => setShowDiscount(true);
  const handleDiscountButtonMouseLeave = () => setShowDiscount(false);

  const filteredCompanies = filterCompaniesByField(companies, 'vendor', quotationData.vendor);
  const filteredAttentions = filterCompaniesByField(companies, 'attention', quotationData.attention);

  const saveQuotationData = async () => {
    if (!quotationData.vendor || !quotationData.attention || !quotationData.designation || !quotationData.items.some((item) => itemHasContent(item, columns))) {
      setSaveStatus('Please fill in all required fields');
      return false;
    }

    setIsLoading(true);
    setSaveStatus(isAmendmentMode ? 'Processing Amendment...' : isEditMode ? 'Updating...' : 'Saving...');

    try {
      const payload = {
        quotationRef: quotationData.quotationRef,
        date: quotationData.date,
        company: {
          vendor: quotationData.vendor,
          attention: quotationData.attention,
          designation: quotationData.designation,
        },
        location: quotationData.location,
        customFields,
        requestText: quotationData.requestText,
        noticeText: quotationData.noticeText,
        priceStatementText: quotationData.priceStatementText,
        contactText: quotationData.contactText,
        columns,
        items: quotationData.items.filter((item) => itemHasContent(item, columns)),
        termsAndConditions: ['Terms & Conditions', ...paymentTerms],
        quotationCounter,
        discount: quotationData.discount,
        showTotalRow,
        manualTotal: parsedManualTotal,
        showDiscountInTotal,
        signatures: {
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
        ? `/quotation/${encodeURIComponent(quotationData.quotationRef)}`
        : `/quotation`;
      const method = (isEditMode || isAmendmentMode) ? 'PUT' : 'POST';

      const result = await createOrUpdateQuotation(endpoint, method, payload);

      if (!result.success) {
        setSaveStatus(`Error: ${result.message || 'Operation failed'}`);
        return false;
      }

      const msg = isAmendmentMode ? 'Amendment saved successfully!' : isEditMode ? 'Quotation updated successfully!' : 'Quotation saved successfully!';
      setSaveStatus(msg);
      setTimeout(() => {
        setSaveStatus('');
        if (isAmendmentMode) {
          navigate(`/quotation/report/${encodeURIComponent(quotationData.quotationRef)}/amendment/${true}`);
        } else {
          navigate(`/quotation/report/${encodeURIComponent(quotationData.quotationRef)}`);
        }
      }, 1500);
      return true;
    } catch (error) {
      console.error('[Quotation] saveQuotationData error:', error);
      setSaveStatus('Error saving quotation. Please try again.');
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

    quotationData,
    columns,
    paymentTerms,
    termTemplate,
    customFields,
    quotationCounter,
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
    showTotalRow,
    manualTotal,
    filteredCompanies,
    filteredAttentions,

    updateColumnLabel,
    addColumn,
    addTotalColumn,
    removeColumn,
    addItemRow,
    removeItem,
    handleItemChange,
    handleItemImageChange,
    removeItemImage,
    handleDescriptionPaste,
    handleDescriptionDrop,
    handleDescriptionDragOver,
    handleDiscountPopup,
    applyDiscount,
    cancelDiscount,
    addPaymentTerm,
    addPaymentTermHeading,
    handleTermTemplateChange,
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
    handleLocationChange,
    handleRequestTextChange,
    handleNoticeTextChange,
    handlePriceStatementTextChange,
    handleContactTextChange,
    handleDiscountInputChange,
    handleRowMouseEnter,
    handleRowMouseLeave,
    handleDiscountButtonMouseEnter,
    handleDiscountButtonMouseLeave,
    saveQuotationData,
  };
};

export default useQuotationForm;