import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import useHireOrderHistory from './useHireOrderHistory';
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
  filterEditableTerms,
  itemHasContent,
  getAutoCalculateTotal,
  calculateSubtotal,
  filterCompaniesByField,
  getModeLabel,
  getStatusTitle,
  generateTermKey,
  isTermHeading,
} from '../helper/hire.order.form.helper';
import {
  DEFAULT_COLUMNS,
  DEFAULT_HIRE_ORDER_DATA,
  DEFAULT_PAYMENT_TERMS,
  MIN_EDITABLE_COLUMNS,
  SIGNATORY_MAP,
  COLUMN_TEMPLATES,
  OPERATIONS_SUPERVISOR_NAME,
  PREPARED_BY_OPTIONS,
} from '../constants/hire.order.form.constant';

export const useHireOderForm = ({ edit, amendment, editAmendment, duplicate }) => {
  const navigate = useNavigate();
  const { refNo } = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const companyRef = useRef();
  const attnRef = useRef();
  const discountPopupRef = useRef();

  const isEditMode = !!(edit && refNo);
  const isEditAmendmentMode = !!(editAmendment && refNo);
  const isAmendmentMode = !!(amendment && refNo);
  const isDuplicateMode = !!(duplicate && refNo);

  const [hireOrderData, setHireOrderData] = useState(DEFAULT_HIRE_ORDER_DATA);
  const [columns, setColumns] = useState(DEFAULT_COLUMNS);
  const [columnTemplate, setColumnTemplate] = useState('DEFAULT');
  const [paymentTerms, setPaymentTerms] = useState(DEFAULT_PAYMENT_TERMS);
  const [hireOrderCounter, setHireOrderCounter] = useState(1);
  const [ceoMode, setCeoMode] = useState('CEO');
  const [preparedBy, setPreparedBy] = useState(PREPARED_BY_OPTIONS[0]);
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
  const [amendmentNumber, setAmendmentNumber] = useState(0);
  const [showImport, setShowImport] = useState(false);
  const [termKeys, setTermKeys] = useState(() => DEFAULT_PAYMENT_TERMS.map(() => generateTermKey()));

  const historySnapshot = useMemo(
    () => ({
      hireOrderData,
      columns,
      columnTemplate,
      paymentTerms,
      termKeys,
      customFields,
      showTotalRow,
      manualTotal,
      showDiscountInTotal,
      ceoMode,
      preparedBy,
    }),
    [hireOrderData, columns, columnTemplate, paymentTerms, termKeys, customFields, showTotalRow, manualTotal, showDiscountInTotal, ceoMode, preparedBy]
  );

  const applyHistorySnapshot = (snapshot) => {
    setHireOrderData(snapshot.hireOrderData);
    setColumns(snapshot.columns);
    setColumnTemplate(snapshot.columnTemplate);
    setPaymentTerms(snapshot.paymentTerms);
    setTermKeys(snapshot.termKeys);
    setCustomFields(snapshot.customFields);
    setShowTotalRow(snapshot.showTotalRow);
    setManualTotal(snapshot.manualTotal);
    setShowDiscountInTotal(snapshot.showDiscountInTotal);
    setCeoMode(snapshot.ceoMode);
    setPreparedBy(snapshot.preparedBy);
  };

  const history = useHireOrderHistory({ snapshot: historySnapshot, applySnapshot: applyHistorySnapshot });

  const replacePaymentTerms = (terms) => {
    setPaymentTerms(terms);
    setTermKeys(terms.map(() => generateTermKey()));
  };

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
    history.suppressNext();
    if (isDuplicateMode) {
      fetchLatestHireOrderNumber();
      loadSourceHireOrder(refNo);
    } else if (isAmendmentMode) fetchHireOrderForAmendmentEdit();
    else if (isEditMode) fetchHireOrderForEdit();
    else fetchLatestHireOrderNumber();

    fetchCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refNo, isEditMode, isAmendmentMode, isDuplicateMode]);

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
        attention: ho.company?.attention || '',
        designation: ho.company?.designation || '',
        quoteNo: ho.quoteNo || '',
        requestText: ho.requestText || '',
        items: ho.items?.length ? ho.items : [buildDefaultItem(loadedColumns)],
        discount: ho.discount || 0,
      });

      if (ho.signatures?.authorizedSignatory === 'MOHAMMED SHAHEEN') setCeoMode('MANAGING DIRECTOR');
      setPreparedBy(ho.signatures?.preparedBy || PREPARED_BY_OPTIONS[0]);
      if (ho.termsAndConditions?.length) replacePaymentTerms(filterEditableTerms(ho.termsAndConditions));
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
      const amendmentCount = ho.amendments?.length || 0;
      const latest = amendmentCount ? ho.amendments[amendmentCount - 1] : null;
      setAmendmentNumber(isEditAmendmentMode ? amendmentCount : amendmentCount + 1);

      const loadedColumns = latest?.amendedColumns?.length ? latest.amendedColumns : (ho.columns?.length ? ho.columns : DEFAULT_COLUMNS);

      setHireOrderCounter(ho.hireOrderCounter || 1);
      setColumns(loadedColumns);
      setHireOrderData({
        vendor: latest?.amendedCompany?.vendor || ho.company?.vendor || '',
        date: isEditAmendmentMode && latest
          ? new Date(latest.amendmentDate).toLocaleDateString('en-GB')
          : new Date().toLocaleDateString('en-GB'),
        hireOrderRef: ho.hireOrderRef || '',
        attention: latest?.amendedCompany?.attention || ho.company?.attention || '',
        designation: latest?.amendedCompany?.designation || ho.company?.designation || '',
        quoteNo: latest?.amendedQuoteNo || ho.quoteNo || '',
        requestText: latest?.amendedRequestText || ho.requestText || '',
        items: latest?.amendedItems?.length ? latest.amendedItems : (ho.items?.length ? ho.items : [buildDefaultItem(loadedColumns)]),
        discount: latest ? latest.amendedDiscount || 0 : ho.discount || 0,
      });

      if (ho.signatures?.authorizedSignatory === 'MOHAMMED SHAHEEN') setCeoMode('MANAGING DIRECTOR');

      setPreparedBy(ho.signatures?.preparedBy || PREPARED_BY_OPTIONS[0]);
      const rawTerms = latest?.amendedTermsAndConditions?.length ? latest.amendedTermsAndConditions : ho.termsAndConditions;
      if (rawTerms?.length) replacePaymentTerms(filterEditableTerms(rawTerms));

      setShowDiscountInTotal(latest ? (latest.amendedDiscount || 0) > 0 : ho.totalDiscountAmount !== undefined);
      setCustomFields(
        latest?.amendedCustomFields?.length
          ? latest.amendedCustomFields
          : (ho.customFields?.length ? ho.customFields : [])
      );
      setShowTotalRow(latest?.amendedShowTotalRow ?? ho.showTotalRow ?? true);
      const loadedManualTotal = latest ? latest.amendedManualTotal : ho.manualTotal;
      setManualTotal(loadedManualTotal != null ? String(loadedManualTotal) : null);
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

  const applySourceHireOrder = (sourceHireOrder) => {
    const latest = sourceHireOrder.amendments?.length
      ? sourceHireOrder.amendments[sourceHireOrder.amendments.length - 1]
      : null;
    const loadedColumns = latest?.amendedColumns?.length
      ? latest.amendedColumns
      : (sourceHireOrder.columns?.length ? sourceHireOrder.columns : DEFAULT_COLUMNS);
    const loadedItems = latest?.amendedItems?.length
      ? latest.amendedItems
      : (sourceHireOrder.items?.length ? sourceHireOrder.items : [buildDefaultItem(loadedColumns)]);
    const rawTerms = latest?.amendedTermsAndConditions?.length
      ? latest.amendedTermsAndConditions
      : (sourceHireOrder.termsAndConditions || []);
    const loadedTerms = filterEditableTerms(rawTerms);
    const company = latest?.amendedCompany?.vendor ? latest.amendedCompany : sourceHireOrder.company;
    const loadedManualTotal = latest ? latest.amendedManualTotal : sourceHireOrder.manualTotal;

    setColumns(loadedColumns);
    setHireOrderData((prev) => ({
      ...prev,
      vendor: company?.vendor || '',
      attention: company?.attention || '',
      designation: company?.designation || '',
      quoteNo: latest?.amendedQuoteNo || sourceHireOrder.quoteNo || '',
      requestText: latest?.amendedRequestText || sourceHireOrder.requestText || '',
      items: loadedItems.map((item, index) => ({ ...item, id: index + 1 })),
      discount: latest ? latest.amendedDiscount || 0 : sourceHireOrder.discount || 0,
    }));
    setCustomFields(
      latest?.amendedCustomFields?.length ? latest.amendedCustomFields : (sourceHireOrder.customFields || [])
    );
    setCeoMode(sourceHireOrder.signatures?.authorizedSignatoryTitle === 'MANAGING DIRECTOR' ? 'MANAGING DIRECTOR' : 'CEO');
    setPreparedBy(sourceHireOrder.signatures?.preparedBy || PREPARED_BY_OPTIONS[0]);
    if (loadedTerms.length) replacePaymentTerms(loadedTerms);
    setShowDiscountInTotal(latest ? (latest.amendedDiscount || 0) > 0 : sourceHireOrder.totalDiscountAmount !== undefined);
    setShowTotalRow(latest?.amendedShowTotalRow ?? sourceHireOrder.showTotalRow ?? true);
    setManualTotal(loadedManualTotal != null ? String(loadedManualTotal) : null);
  };

  const loadSourceHireOrder = async (sourceRef) => {
    setIsLoading(true);
    try {
      const data = await getHireOrderByRef(sourceRef);
      if (!data.success || !data.data) {
        setSaveStatus('Error loading hire order data');
        return;
      }
      applySourceHireOrder(data.data);
    } catch (error) {
      console.error('[HroForm] loadSourceHireOrder error:', error);
      setSaveStatus('Error loading hire order data');
    } finally {
      setIsLoading(false);
    }
  };

  const openImport = () => setShowImport(true);
  const closeImport = () => setShowImport(false);
  const importHireOrder = async (sourceRef) => {
    setShowImport(false);
    await loadSourceHireOrder(sourceRef);
  };

  const moveColumn = (fromIndex, toIndex) => {
    setColumns((prev) => {
      if (toIndex < 0 || toIndex >= prev.length) return prev;
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const updateColumnLabel = (colId, label) => {
    setColumns((prev) => prev.map((c) => (c.id === colId && c.type !== 'calculated' ? { ...c, label } : c)));
  };

  const addColumn = (afterColumnId) => {
    const newId = `col_${Date.now()}`;
    const newCol = { id: newId, label: 'New Column', type: 'text', deletable: true };

    setColumns((prev) => {
      const updated = [...prev];
      const afterIndex = typeof afterColumnId === 'string' ? updated.findIndex((c) => c.id === afterColumnId) : -1;
      const calculatedIndex = updated.findIndex((c) => c.type === 'calculated');
      const fallbackIndex = calculatedIndex === -1 ? updated.length : calculatedIndex;
      updated.splice(afterIndex !== -1 ? afterIndex + 1 : fallbackIndex, 0, newCol);
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

  const addItemRow = (afterIndex) => {
    setHireOrderData((prev) => {
      const items = [...prev.items];
      const insertAt = typeof afterIndex === 'number' ? afterIndex + 1 : items.length;
      items.splice(insertAt, 0, buildDefaultItem(columns, 0));
      return { ...prev, items: items.map((item, index) => ({ ...item, id: index + 1 })) };
    });
  };

  const moveItem = (fromIndex, toIndex) => {
    setHireOrderData((prev) => {
      if (toIndex < 0 || toIndex >= prev.items.length) return prev;
      const items = [...prev.items];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      return { ...prev, items: items.map((item, index) => ({ ...item, id: index + 1 })) };
    });
  };

  const moveItemUp = (index) => moveItem(index, index - 1);
  const moveItemDown = (index) => moveItem(index, index + 1);

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

  const addPaymentTerm = () => {
    setPaymentTerms((prev) => [...prev, '']);
    setTermKeys((prev) => [...prev, generateTermKey()]);
  };

  const addPaymentTermHeading = () => {
    setPaymentTerms((prev) => [...prev, '## ']);
    setTermKeys((prev) => [...prev, generateTermKey()]);
  };

  const updatePaymentTerm = (index, value) => {
    const updated = [...paymentTerms];
    updated[index] = isTermHeading(updated[index]) ? `## ${value}` : value;
    setPaymentTerms(updated);
  };

  const removePaymentTerm = (index) => {
    if (paymentTerms.length <= 1) return;
    setPaymentTerms((prev) => prev.filter((_, i) => i !== index));
    setTermKeys((prev) => prev.filter((_, i) => i !== index));
  };

  const moveTerm = (fromIndex, toIndex) => {
    const reorder = (list) => {
      if (toIndex < 0 || toIndex >= list.length) return list;
      const updated = [...list];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    };
    setPaymentTerms(reorder);
    setTermKeys(reorder);
  };

  const moveTermUp = (index) => moveTerm(index, index - 1);
  const moveTermDown = (index) => moveTerm(index, index + 1);

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
  const togglePreparedBy = () =>
    setPreparedBy((previous) => PREPARED_BY_OPTIONS[(PREPARED_BY_OPTIONS.indexOf(previous) + 1) % PREPARED_BY_OPTIONS.length]);
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
          operationsSupervisor: OPERATIONS_SUPERVISOR_NAME,
          preparedBy,
          authorizedSignatory: getSignatoryName(),
          authorizedSignatoryTitle: ceoMode,
        },
        isAmendmented: isAmendmentMode ? true : false,
        editLastAmendment: isEditAmendmentMode,
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
    isDuplicateMode,
    amendmentNumber,
    showImport,
    openImport,
    closeImport,
    importHireOrder,
    termKeys,
    undo: history.undo,
    redo: history.redo,
    canUndo: history.canUndo,
    canRedo: history.canRedo,

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
    moveColumn,
    addItemRow,
    moveItemUp,
    moveItemDown,
    removeItem,
    handleItemChange,
    handleDiscountPopup,
    applyDiscount,
    cancelDiscount,
    addPaymentTerm,
    addPaymentTermHeading,
    updatePaymentTerm,
    removePaymentTerm,
    moveTermUp,
    moveTermDown,
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
    preparedBy,
    togglePreparedBy,
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