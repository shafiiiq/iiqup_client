import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHeaderTitle } from '@/shared/context/TitleContext';

import {
    fetchLatestPurchaseOrderRef as fetchLatestPurchaseOrderRefService,
    fetchPurchaseOrderByRef as fetchPurchaseOrderByRefService,
    fetchEquipments as fetchEquipmentRecords,
    fetchEquipmentByRegNo,
    fetchCompanies as fetchCompanyRecords,
    createOrUpdatePurchaseOrder,
    createComplaintPurchaseOrder,
    getQuotationUploadUrl,
    getPreSignedUrl,
} from '../api/purchase.order.form.api';
import {
    generatePurchaseOrderRef,
    formatDate,
    filterEditableTerms,
} from '../helper/purchase.order.form.helper';
import {
    DEFAULT_PurchaseOrder_DATA,
    DEFAULT_PAYMENT_TERMS,
    SIGNATORY_MAP,
} from '../constants/purchase.order.form.constant';

const usePurchaseOrderForm = ({ purchaseOrdersOfStocks, purchaseOrderForAllEquipments, edit, amendment, amendmentUpdate }) => {
    const navigate = useNavigate();
    const { regNo, complaintId, refNo } = useParams();
    const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

    const equipmentRef = useRef();
    const companyRef = useRef();
    const attnRef = useRef();
    const discountPopupRef = useRef();
    const quotationFileInputRef = useRef();

    const isForStock = purchaseOrdersOfStocks;
    const isOfAllEquipmentsm = purchaseOrderForAllEquipments;
    const isEditMode = !!(edit && refNo);
    const isAmendmentEditMode = !!(amendment && amendmentUpdate && refNo);
    const isAmendmentMode = !!(amendment && refNo);

    const [purchaseorderData, setPurchaseOrderData] = useState(DEFAULT_PurchaseOrder_DATA);
    const [paymentTerms, setPaymentTerms] = useState(DEFAULT_PAYMENT_TERMS);
    const [purchaseorderCounter, setPurchaseOrderCounter] = useState(1);
    const [workingHrsMode, setWorkingHrsMode] = useState('WORKING HRS');
    const [ceoMode, setCeoMode] = useState('CEO');
    const [showDiscountInTotal, setShowDiscountInTotal] = useState(true);

    const [equipmentDropdown, setEquipmentDropdown] = useState(false);
    const [companyDropdown, setCompanyDropdown] = useState(false);
    const [attnDropdown, setAttnDropdown] = useState(false);
    const [equipmentSearch, setEquipmentSearch] = useState('');
    const [currentEquipmentInput, setCurrentEquipmentInput] = useState('');
    const [showAddButton, setShowAddButton] = useState(null);
    const [showDiscount, setShowDiscount] = useState(false);
    const [showDiscountPopup, setShowDiscountPopup] = useState(false);
    const [discountInput, setDiscountInput] = useState('');
    const [showQuotationModal, setShowQuotationModal] = useState(true);
    const [quotationFile, setQuotationFile] = useState(null);
    const [quotationPreviewUrl, setQuotationPreviewUrl] = useState('');
    const [descriptionTooltip, setDescriptionTooltip] = useState(null);

    const [equipments, setEquipments] = useState([]);
    const [companies, setCompanies] = useState([]);

    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');

    const subtotal = purchaseorderData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const totalAmount = subtotal - (purchaseorderData.discount || 0);
    const quotationDisplayMime = quotationFile ? quotationFile.type : (purchaseorderData.quotation?.mimeType || '');

    useEffect(() => {
        if (saveStatus) {
            const title =
                saveStatus.includes('Error') ? 'Error' :
                    saveStatus.includes('Please') ? 'Warning' : 'Success';
            setHeaderTitle(title);
            setHeaderSubtitle(saveStatus);
        } else if (purchaseorderCounter) {
            const modeLabel = isAmendmentMode ? 'Amending' : isEditMode ? 'Editing' : 'Creating';
            setHeaderTitle(`${modeLabel} PurchaseOrder: ${purchaseorderData.purchaseorderRef}`);
            setHeaderSubtitle(`PurchaseOrder Number: ${purchaseorderCounter}`);
        } else {
            setHeaderTitle(null);
            setHeaderSubtitle(null);
        }

        return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
    }, [purchaseorderCounter, saveStatus, purchaseorderData.purchaseorderRef, isAmendmentMode, isEditMode, setHeaderTitle, setHeaderSubtitle]);

    useEffect(() => {
        if (isAmendmentEditMode && refNo) fetchPurchaseOrderForAmendmentEdit();
        else if ((isEditMode || isAmendmentMode) && refNo) fetchPurchaseOrderForEdit();
        else fetchLatestPurchaseOrderNumber();

        handleRouteSpecificLogic();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [regNo, isEditMode, isAmendmentMode, refNo]);

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

    const handleRouteSpecificLogic = async () => {
        if (isForStock) {
            setPurchaseOrderData((prev) => ({ ...prev, equipments: ['For Stock'], workingHrs: '', runningKm: '' }));
            return;
        }

        if (isOfAllEquipmentsm) {
            setPurchaseOrderData((prev) => ({ ...prev, equipments: ['For all equipment'], workingHrs: '', runningKm: '' }));
            return;
        }

        if (!regNo) return;

        try {
            const result = await fetchEquipmentByRegNo(regNo);
            const equipment = result.data;
            if (equipment) {
                setPurchaseOrderData((prev) => ({ ...prev, equipments: [`${equipment.regNo} – ${equipment.machine}`] }));
            }
        } catch (err) {
            console.error('[PurchaseOrderForm] handleRouteSpecificLogic error:', err);
        }
    };

    const fetchLatestPurchaseOrderNumber = async () => {
        try {
            const data = await fetchLatestPurchaseOrderRefService();

            const newPurchaseOrderNumber = parseInt(data.data?.latestRef || 130) + 1;
            setPurchaseOrderCounter(newPurchaseOrderNumber);
            setPurchaseOrderData((prev) => ({ ...prev, purchaseorderRef: generatePurchaseOrderRef(newPurchaseOrderNumber) }));
        } catch (err) {
            console.error('[PurchaseOrderForm] fetchLatestPurchaseOrderNumber error:', err);
            setPurchaseOrderData((prev) => ({ ...prev, purchaseorderRef: generatePurchaseOrderRef(131) }));
        }
    };

    const fetchPurchaseOrderForEdit = async () => {
        setIsLoading(true);
        try {
            const data = await fetchPurchaseOrderByRefService(refNo);

            if (!data.success || !data.data) return;
            const purchaseorder = data.data;

            setPurchaseOrderCounter(purchaseorder.purchaseorderCounter || 1);
            setPurchaseOrderData({
                vendor: purchaseorder.company?.vendor || '',
                equipments: purchaseorder.equipments || [],
                date: purchaseorder.date || new Date().toLocaleDateString('en-GB'),
                purchaseorderRef: purchaseorder.purchaseorderRef || '',
                complaintId: purchaseorder.complaintId || '',
                attention: purchaseorder.company?.attention || '',
                designation: purchaseorder.company?.designation || '',
                quoteNo: purchaseorder.quoteNo || '',
                workingHrs: purchaseorder.workingHrs || '',
                runningKm: purchaseorder.runningKm || '',
                requestText: purchaseorder.requestText || '',
                items: purchaseorder.items || [],
                discount: purchaseorder.discount || 0,
            });

            if (purchaseorder.runningKm) setWorkingHrsMode('RUNNING KM');
            if (purchaseorder.signatures?.authorizedSignatory === 'MOHAMMED SHAHEEN') setCeoMode('MANAGING DIRECTOR');
            if (purchaseorder.termsAndConditions?.length) setPaymentTerms(filterEditableTerms(purchaseorder.termsAndConditions));

            setShowDiscountInTotal(purchaseorder.totalDiscountAmount !== undefined);

            if (purchaseorder.quotation) await loadQuotationPreview(purchaseorder.quotation);

        } catch (err) {
            console.error('[PurchaseOrderForm] fetchPurchaseOrderForEdit error:', err);
            setSaveStatus('Error loading PurchaseOrder data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPurchaseOrderForAmendmentEdit = async () => {
        setIsLoading(true);
        try {
            const data = await fetchPurchaseOrderByRefService(refNo);

            if (!data.success || !data.data) return;
            const purchaseorder = data.data;
            const latest = purchaseorder.amendments?.[purchaseorder.amendments.length - 1];

            setPurchaseOrderCounter(purchaseorder.purchaseorderCounter || 1);
            setPurchaseOrderData({
                vendor: latest?.amendedCompany?.vendor || '',
                equipments: latest?.amendedEquipments || [],
                date: latest?.amendmentDate ? formatDate(latest.amendmentDate) : new Date().toLocaleDateString('en-GB'),
                purchaseorderRef: purchaseorder.purchaseorderRef || '',
                complaintId: purchaseorder.complaintId || '',
                attention: latest?.amendedCompany?.attention || '',
                designation: latest?.amendedCompany?.designation || '',
                quoteNo: latest?.amendedQuoteNo || purchaseorder.quoteNo || '',
                workingHrs: latest?.amendedWorkingHrs || '',
                runningKm: latest?.amendedRunningKm || '',
                requestText: latest?.amendedRequestText || '',
                items: latest?.amendedItems || [],
                discount: latest?.amendedDiscount || 0,
            });

            if (latest?.amendedRunningKm || purchaseorder.runningKm) setWorkingHrsMode('RUNNING KM');
            else if (latest?.amendedWorkingHrs) setWorkingHrsMode('WORKING HRS');

            if (purchaseorder.signatures?.authorizedSignatory === 'MOHAMMED SHAHEEN') setCeoMode('MANAGING DIRECTOR');

            const rawTerms = latest?.amendedTermsAndConditions || purchaseorder.termsAndConditions;
            if (rawTerms?.length) setPaymentTerms(filterEditableTerms(rawTerms));

            setShowDiscountInTotal(
                latest?.amendedTotalAmount !== undefined || purchaseorder.totalDiscountAmount !== undefined
            );

            if (purchaseorder.quotation) await loadQuotationPreview(purchaseorder.quotation);

        } catch (err) {
            console.error('[PurchaseOrderForm] fetchPurchaseOrderForAmendmentEdit error:', err);
            setSaveStatus('Error loading PurchaseOrder data');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEquipments = async (searchTerm = '') => {
        try {
            const data = await fetchEquipmentRecords(searchTerm);
            setEquipments(data.data || []);
            return data;
        } catch (err) {
            console.error('[PurchaseOrderForm] fetchEquipments error:', err);
            return { data: [] };
        }
    };

    const fetchCompanies = async () => {
        try {
            const data = await fetchCompanyRecords();
            if (data.success) setCompanies(data.data || []);
        } catch (err) {
            console.error('[PurchaseOrderForm] fetchCompanies error:', err);
        }
    };

    const getSignatoryName = () => SIGNATORY_MAP[ceoMode] || SIGNATORY_MAP.CEO;
    const calcTooltipPosition = (rect) => {
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        const spaceAbove = rect.top;
        const spaceBelow = viewportH - rect.bottom;
        const placeTop = spaceAbove > 120 || spaceAbove > spaceBelow;

        const spaceLeft = rect.left;
        const spaceRight = viewportW - rect.right;
        const horizontal = spaceLeft < 160 ? 'left' : spaceRight < 160 ? 'right' : 'center';

        const top = placeTop ? rect.top - 8 : rect.bottom + 8;
        const left = horizontal === 'left' ? rect.left : horizontal === 'right' ? rect.right : rect.left + rect.width / 2;

        const vTransform = placeTop ? '-100%' : '0';
        const hTransform = horizontal === 'left' ? '0' : horizontal === 'right' ? '-100%' : '-50%';

        return { top, left, transform: `translate(${hTransform}, ${vTransform})` };
    };

    const handleDescriptionHover = (e, itemId) => {
        if (itemId === undefined || itemId === null) { setDescriptionTooltip(null); return; }
        const rect = e.target.getBoundingClientRect();
        setDescriptionTooltip({ itemId, ...calcTooltipPosition(rect) });
    };

    const hideDescriptionTooltip = () => setDescriptionTooltip(null);

    const savePurchaseOrderData = async () => {
        const currentHrsKmValue = workingHrsMode === 'WORKING HRS' ? purchaseorderData.workingHrs : purchaseorderData.runningKm;
        const requiresHrsKm = !isForStock && !isOfAllEquipmentsm;

        if (!purchaseorderData.vendor || !purchaseorderData.equipments.length || !purchaseorderData.attention || !purchaseorderData.designation ||
            (requiresHrsKm && !currentHrsKmValue)) {
            setSaveStatus('Please fill in all required fields');
            return false;
        }

        if (!purchaseorderData.items.some((item) => item.description.trim())) {
            setSaveStatus('Please add at least one item');
            return false;
        }

        setIsLoading(true);
        setSaveStatus(isAmendmentMode ? 'Processing Amendment...' : isEditMode ? 'Updating...' : 'Saving...');

        try {
            const payload = {
                purchaseorderRef: purchaseorderData.purchaseorderRef,
                date: purchaseorderData.date,
                equipments: purchaseorderData.equipments,
                quoteNo: purchaseorderData.quoteNo,
                requestText: purchaseorderData.requestText,
                company: {
                    vendor: purchaseorderData.vendor,
                    attention: purchaseorderData.attention,
                    designation: purchaseorderData.designation,
                },
                items: purchaseorderData.items.filter((item) => item.description.trim()),
                termsAndConditions: ['Terms & Conditions', ...paymentTerms],
                purchaseorderCounter,
                signatures: {
                    accountsDept: 'ROSHAN SHA',
                    purchasingManager: 'ABDUL MALIK',
                    operationsManager: 'SURESHKANTH',
                    authorizedSignatory: getSignatoryName(),
                    authorizedSignatoryTitle: ceoMode,
                },
                isAmendmented: isAmendmentMode ? true : false,
                discount: purchaseorderData.discount,
                quotation: purchaseorderData.quotation || null,
                showDiscountInTotal,
                type: isForStock ? 'stock' : isOfAllEquipmentsm ? 'all_equipment' : 'specific_equipment',
                ...(isAmendmentMode && {
                    pmSigned: false,
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
            else payload.normalPurchaseOrder = true;

            if (requiresHrsKm) {
                if (workingHrsMode === 'WORKING HRS') {
                    payload.workingHrs = purchaseorderData.workingHrs;
                    payload.runningKm = '';
                } else {
                    payload.runningKm = purchaseorderData.runningKm;
                    payload.workingHrs = '';
                }
            }

            const endpoint = (isEditMode || isAmendmentMode)
                ? `/order/purchase/${encodeURIComponent(purchaseorderData.purchaseorderRef)}`
                : `/order/purchase`;
            const method = (isEditMode || isAmendmentMode) ? 'PUT' : 'POST';

            const result = await createOrUpdatePurchaseOrder(endpoint, method, payload);

            if (!result.success) {
                setSaveStatus(`Error: ${result.message || 'Operation failed'}`);
                return false;
            }

            const needsComplaintPost = complaintId && (!isEditMode);
            if (needsComplaintPost) {
                const complaintPayload = {
                    purchaseorderData: payload,
                    createdBy: 'WSM-4f428b',
                    ...(isAmendmentMode && { isAmendment: true }),
                };

                const complaintResult = await createComplaintPurchaseOrder(complaintId, complaintPayload);

                if (complaintResult.status === 200) {
                    const msg = isAmendmentMode ? 'Amendment saved and sent for approval!' : 'PurchaseOrder saved and sent for approval!';
                    setSaveStatus(msg);
                    setTimeout(() => {
                        setSaveStatus('');
                        navigate(`/order/purchase/report/${encodeURIComponent(purchaseorderData.purchaseorderRef)}/${complaintId}`);
                    }, 2000);
                    return true;
                }
            }

            const msg = isAmendmentMode ? 'Amendment saved successfully!' : isEditMode ? 'PurchaseOrder updated successfully!' : 'PurchaseOrder saved successfully!';
            setSaveStatus(msg);
            setTimeout(() => {
                setSaveStatus('');
                if (isAmendmentMode) {
                    navigate(`/order/purchase/report/${encodeURIComponent(purchaseorderData.purchaseorderRef)}/amendment/${true}/${complaintId || purchaseorderData.complaintId || ''}`);
                } else {
                    navigate(`/order/purchase/report/${encodeURIComponent(purchaseorderData.purchaseorderRef)}/${complaintId || ''}`);
                }
            }, 2000);
            return true;

        } catch (err) {
            console.error('[PurchaseOrderForm] savePurchaseOrderData error:', err);
            setSaveStatus('Error saving PurchaseOrder. Please try again.');
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    const addEquipment = () => {
        if (currentEquipmentInput.trim() && !purchaseorderData.equipments.includes(currentEquipmentInput)) {
            setPurchaseOrderData((prev) => ({ ...prev, equipments: [...prev.equipments, currentEquipmentInput] }));
            setCurrentEquipmentInput('');
        }
    };

    const removeEquipment = (index) => {
        setPurchaseOrderData((prev) => ({
            ...prev,
            equipments: prev.equipments.filter((_, i) => i !== index),
        }));
    };

    const handleEquipmentSelect = (equipment) => {
        setCurrentEquipmentInput(`${equipment.regNo} – ${equipment.machine}`);
        setEquipmentDropdown(false);
        setEquipmentSearch('');
    };

    const handleEquipmentKeyDown = (e) => {
        if (e.key === 'Enter') addEquipment();
    };

    const handleCompanySelect = (company) => {
        setPurchaseOrderData((prev) => ({ ...prev, vendor: company.vendor, attention: company.attention, designation: company.designation }));
        setCompanyDropdown(false);
    };

    const handleAttentionSelect = (company) => {
        setPurchaseOrderData((prev) => ({ ...prev, attention: company.attention, designation: company.designation }));
        setAttnDropdown(false);
    };

    const handleVendorChange = (value) => {
        setPurchaseOrderData((prev) => ({ ...prev, vendor: value }));
        if (value.trim()) {
            setCompanyDropdown(true);
            if (!companies.length) fetchCompanies();
        } else {
            setCompanyDropdown(false);
        }
    };

    const handleAttentionChange = (value) => {
        setPurchaseOrderData((prev) => ({ ...prev, attention: value }));
        if (value.trim()) {
            setAttnDropdown(true);
            if (!companies.length) fetchCompanies();
        } else {
            setAttnDropdown(false);
        }
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...purchaseorderData.items];
        newItems[index] = {
            ...newItems[index],
            [field]: (field === 'quantity' || field === 'unitPrice') ? parseFloat(value) || null : value,
        };
        newItems[index].totalPrice = (newItems[index].quantity || 0) * (newItems[index].unitPrice || 0);
        setPurchaseOrderData((prev) => ({ ...prev, items: newItems }));
    };

    const addItemRow = () => {
        setPurchaseOrderData((prev) => ({
            ...prev,
            items: [
                ...prev.items,
                { id: prev.items.length + 1, description: '', quantity: 0, unitPrice: 0, totalPrice: 0 },
            ],
        }));
    };

    const removeItemRow = (index) => {
        if (purchaseorderData.items.length <= 1) return;
        const updated = purchaseorderData.items
            .filter((_, i) => i !== index)
            .map((item, i) => ({ ...item, id: i + 1 }));
        setPurchaseOrderData((prev) => ({ ...prev, items: updated }));
    };

    const handleDiscountPopup = () => {
        setDiscountInput(purchaseorderData.discount.toString());
        setShowDiscountPopup(true);
    };

    const applyDiscount = () => {
        const value = Math.max(0, Math.min(parseFloat(discountInput) || 0, subtotal));
        setPurchaseOrderData((prev) => ({ ...prev, discount: value }));
        setShowDiscountPopup(false);
        setDiscountInput('');
    };

    const cancelDiscount = () => {
        setShowDiscountPopup(false);
        setDiscountInput('');
    };

    const handleAttachQuotationYes = () => {
        setShowQuotationModal(false);
        quotationFileInputRef.current?.click();
    };

    const handleAttachQuotationNo = () => {
        setShowQuotationModal(false);
    };

    const handleQuotationFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setQuotationFile(file);
        setQuotationPreviewUrl(URL.createObjectURL(file));

        try {
            const result = await getQuotationUploadUrl(file.name, purchaseorderData.purchaseorderRef, file.type);
            if (!result.success) throw new Error(result.message || 'Failed to get upload URL');

            const s3Response = await fetch(result.uploadUrl, {
                method: 'PUT',
                headers: { 'Content-Type': file.type },
                body: file,
            });
            if (!s3Response.ok) throw new Error('S3 upload failed');

            setPurchaseOrderData((prev) => ({ ...prev, quotation: result.data }));
        } catch (err) {
            console.error('[PurchaseOrderForm] quotation upload error:', err);
            setSaveStatus('Error uploading quotation file');
        }
    };

    const loadQuotationPreview = async (quotation) => {
        if (!quotation?.filePath) return;
        try {
            const data = await getPreSignedUrl(quotation.filePath, false);
            setQuotationPreviewUrl(data.dataUrl);
            setShowQuotationModal(false);
        } catch (err) {
            console.error('[PurchaseOrderForm] loadQuotationPreview error:', err);
        }
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

    const toggleWorkingHrsMode = () => setWorkingHrsMode((prev) => prev === 'WORKING HRS' ? 'RUNNING KM' : 'WORKING HRS');
    const toggleCeoMode = () => setCeoMode((prev) => prev === 'CEO' ? 'MANAGING DIRECTOR' : 'CEO');
    const toggleDiscountInTotal = () => setShowDiscountInTotal((prev) => !prev);

    const filteredEquipments = equipments.filter((eq) =>
        eq.machine.toLowerCase().includes(equipmentSearch.toLowerCase()) ||
        eq.regNo.toLowerCase().includes(equipmentSearch.toLowerCase())
    );

    const filteredCompanies = companies.filter((c) => c.vendor.toLowerCase().includes(purchaseorderData.vendor.toLowerCase()));
    const filteredAttentions = companies.filter((c) => c.attention.toLowerCase().includes(purchaseorderData.attention.toLowerCase()));

    return {
        isForStock,
        isOfAllEquipmentsm,
        isEditMode,
        isAmendmentMode,
        purchaseorderData,
        setPurchaseOrderData,
        paymentTerms,
        purchaseorderCounter,
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
        saveStatus,
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
    };
};

export default usePurchaseOrderForm;