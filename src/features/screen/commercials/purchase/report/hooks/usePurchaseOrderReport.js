import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import { resolveIsSentForApproval } from '../helper/purchase.order.report.helper';
import { buildOriginalPurchaseOrderDocument, buildAmendedPurchaseOrderDocument } from '../helper/purchase.order.report.document.helper';
import { buildReportParts, parsePartTokens } from '../helper/purchase.order.report.parts.helper';
import useSigningFlow from '@/features/core/messaging/signature/hooks/useSigningFlow';
import useDocumentPdfStatus from '@/features/core/sync/pdf/hooks/useDocumentPdfStatus';
import {
    fetchPurchaseOrderByRef,
    getPreSignedUrl,
    downloadPurchaseOrderPdf,
    submitPurchaseOrderPdf,
    emailPurchaseOrderPdf,
} from '../api/purchase.order.report.api';
import {
    DEFAULT_PurchaseOrder_DATA,
    PURCHASE_ORDER_SIGNATURE_SOURCE_KEY,
    PURCHASE_ORDER_PDF_SOURCE_KEY,
} from '../constants/purchase.order.report.constant';

const usePurchaseOrderReport = () => {
    const navigate = useNavigate();
    const componentRef = useRef();
    const { purchaseorderRef: refNo, amendment, parts } = useParams();
    const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

    const documentId = refNo ? decodeURIComponent(refNo) : '';
    const signing = useSigningFlow({ sourceKey: PURCHASE_ORDER_SIGNATURE_SOURCE_KEY, documentId });
    const { isPdfReady } = useDocumentPdfStatus({ sourceKey: PURCHASE_ORDER_PDF_SOURCE_KEY, documentId });

    const [purchaseorderData, setPurchaseOrderData] = useState(DEFAULT_PurchaseOrder_DATA);
    const [amendmentData, setAmendmentData] = useState(null);
    const [purchaseorderCounter, setPurchaseOrderCounter] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [quotationUrl, setQuotationUrl] = useState('');
    const [quotationMime, setQuotationMime] = useState('');
    const [partsDocuments, setPartsDocuments] = useState(null);
    const [amendmentCount, setAmendmentCount] = useState(0);
    const [showDownloadPicker, setShowDownloadPicker] = useState(false);

    const [signResult, setSignResult] = useState(null);
    const [vendorMail, setVendorMail] = useState(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailFormValues, setEmailFormValues] = useState({ emails: [''] });
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const [showUploadSuccessModal, setShowUploadSuccessModal] = useState(false);
    const [showAttachmentModal, setShowAttachmentModal] = useState(false);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [alertModal, setAlertModal] = useState(null);
    const [isSentForApproval, setIsSentForApproval] = useState(false);
    const [isEmailedToSupplier, setIsEmailedToSupplier] = useState(false);
    const showAlert = (title, message, type = 'warning', reason = '') => setAlertModal({ title, message, type, reason });

    useEffect(() => {
        if (!purchaseorderCounter) {
            setHeaderTitle(null);
            setHeaderSubtitle(null);
            return;
        }
        setHeaderTitle(signing.status?.isDeviceActivated ? 'E-Signs Activated' : 'Please Activate the Sign');
        setHeaderSubtitle(`Purchase Order Document: ${purchaseorderData.purchaseorderRef}`);

        return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
    }, [purchaseorderCounter, purchaseorderData.purchaseorderRef, signing.status?.isDeviceActivated, setHeaderTitle, setHeaderSubtitle]);

    useEffect(() => {
        if (refNo) fetchPurchaseOrderData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refNo]);

    const loadQuotationPreview = async (quotation) => {
        if (!quotation?.filePath) return;
        try {
            const response = await getPreSignedUrl(quotation.filePath, false);
            const data = await response.json();
            setQuotationUrl(data.dataUrl);
            setQuotationMime(quotation.mimeType || '');
        } catch (err) {
            console.error('[PurchaseOrderReport] loadQuotationPreview error:', err);
        }
    };

    const fetchPurchaseOrderData = async () => {
        setLoading(true);
        setError(null);

        try {
            if (!refNo) throw new Error('No Purchase Order reference number provided in URL');

            const response = await fetchPurchaseOrderByRef(refNo);
            const contentType = response.headers.get('content-type');

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(
                    contentType?.includes('text/html')
                        ? `API endpoint not found (${response.status}). Check your backend server and route.`
                        : `HTTP error ${response.status} — ${errorText}`
                );
            }

            if (!contentType?.includes('application/json')) {
                throw new Error('API returned non-JSON response. Check your backend endpoint.');
            }

            const data = await response.json();
            if (!data.success || !data.data) {
                setError(data.message || 'Purchase Order not found');
                return;
            }

            const purchaseOrder = data.data;

            const builtPurchaseOrderData = {
                ...buildOriginalPurchaseOrderDocument(purchaseOrder),
                isAmendment: amendment === 'true' || amendment === true,
            };

            setPurchaseOrderData(builtPurchaseOrderData);
            setPurchaseOrderCounter(purchaseOrder.purchaseorderCounter || 1);
            setVendorMail(purchaseOrder.vendorMail || null);
            setIsSentForApproval(resolveIsSentForApproval(purchaseOrder));
            setIsEmailedToSupplier(Boolean(purchaseOrder.supplierEmailedAt));

            if (purchaseOrder.quotation) await loadQuotationPreview(purchaseOrder.quotation);

            const loadedAmendmentCount = purchaseOrder.isAmendmented ? purchaseOrder.amendments?.length || 0 : 0;
            setAmendmentCount(loadedAmendmentCount);
            setPartsDocuments(parts ? buildReportParts(purchaseOrder, parsePartTokens(parts, loadedAmendmentCount)) : null);

            if (loadedAmendmentCount > 0) {
                setAmendmentData(buildAmendedPurchaseOrderDocument(purchaseOrder, builtPurchaseOrderData, loadedAmendmentCount));
            }

            await signing.loadSignatures();
        } catch (err) {
            console.error('[PurchaseOrderReport] fetchPurchaseOrderData error:', err);
            setError(`Failed to load Purchase Order data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const getFileName = () => `Purchase Order - ${purchaseorderCounter}-${purchaseorderData.vendor} For - ${purchaseorderData.equipments}`;

    const handleDownloadClick = () => {
        if (amendmentCount > 0) setShowDownloadPicker(true);
        else handleDownloadPdf();
    };

    const handleDownloadPdf = async (selectedTokens) => {
        const tokens = Array.isArray(selectedTokens) ? selectedTokens : [];
        const partsParam = tokens.length ? tokens.join(',') : null;
        const fileNameSuffix = tokens.length
            ? `-${tokens.map((token) => (token === 'original' ? 'Original' : `Rev${token}`)).join('-')}`
            : '';

        setShowDownloadPicker(false);
        setShowLoadingModal(true);
        setLoadingMessage('Generating PDF...');

        try {
            const response = await downloadPurchaseOrderPdf(decodeURIComponent(refNo), {
                isAmendment: purchaseorderData.isAmendment,
                parts: partsParam,
            });
            if (!response.ok) throw new Error('Failed to generate PDF');
            if (!response.headers.get('content-type')?.includes('application/pdf')) {
                throw new Error('Server returned a non-PDF response');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${getFileName()}${fileNameSuffix}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('[PurchaseOrderReport] handleDownloadPdf error:', err);
            showAlert('Download Failed', 'The PDF could not be generated. Please try again in a moment.', 'error');
        } finally {
            setShowLoadingModal(false);
        }
    };

    const handlePrint = () => window.print();

    const sendToApprove = async () => {
        try {
            const response = await submitPurchaseOrderPdf(decodeURIComponent(refNo), {
                uploadedBy: 'WORKSHOP_MANAGER',
                description: 'Purchase Order document generated from system',
                isAmendment: purchaseorderData.isAmendment || Boolean(amendmentData),
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Upload failed');

            setShowUploadSuccessModal(true);
            setIsSentForApproval(true);
        } catch (err) {
            console.error('[PurchaseOrderReport] sendToApprove error:', err);
            showAlert('Could Not Send For Approval', err.message || 'The document could not be sent for approval. Please try again.', 'error');
        }
    };

    const handleEditPurchaseOrder = () => {
        const encodedRef = encodeURIComponent(purchaseorderData.purchaseorderRef);
        navigate(amendmentData
            ? `/order/purchase/form/update/true/${encodedRef}`
            : `/order/purchase/form/edit/${encodedRef}`
        );
    };

    const handleSendEmail = async (extraFiles = []) => {
        const validEmails = emailFormValues.emails.filter(e => e?.includes('@'));
        if (!validEmails.length) { showAlert('Email Required', 'Please enter at least one valid email address to continue.'); return; }

        setIsSendingEmail(true);
        setShowAttachmentModal(false);

        try {
            const extractName = (str) => str ? str.split('-')[0].trim() : '';

            const formDataToSend = new FormData();
            formDataToSend.append('emails', JSON.stringify(validEmails));
            formDataToSend.append('recipientName', extractName(purchaseorderData.attention));
            formDataToSend.append('vendorName', extractName(purchaseorderData.vendor));
            formDataToSend.append('equipment', purchaseorderData.equipments.join(', '));
            extraFiles.forEach((file) => formDataToSend.append('attachments', file));

            const response = await emailPurchaseOrderPdf(decodeURIComponent(refNo), formDataToSend);

            if (response.ok) {
                setShowEmailModal(false);
                setEmailFormValues({ emails: [''] });
                setSignResult('email_sent');
                setIsEmailedToSupplier(true);
            } else {
                showAlert('Email Not Sent', 'The Purchase Order could not be sent to the supplier. Please try again.', 'error');
            }
        } catch (err) {
            console.error('[PurchaseOrderReport] handleSendEmail error:', err);
            showAlert('Email Not Sent', 'Something went wrong while sending the email. Please check your connection and try again.', 'error');
        } finally {
            setIsSendingEmail(false);
        }
    };

    const handleEmailFormChange = (field, value) => setEmailFormValues({ emails: value.split(',').map(e => e.trim()).filter(Boolean) });

    const handleEmailButtonClick = () => {
        const validEmails = emailFormValues.emails.filter(e => e?.includes('@'));
        if (!validEmails.length) { showAlert('Email Required', 'Please enter at least one valid email address to continue.'); return; }
        setShowEmailModal(false);
        setShowAttachmentModal(true);
    };

    const handleSendToSupplierClick = () => {
        if (vendorMail?.length) setEmailFormValues({ emails: vendorMail });
        setShowEmailModal(true);
    };

    const closeEmailModal = () => { setShowEmailModal(false); setEmailFormValues({ emails: [''] }); };

    const skipAttachmentModal = () => { setShowAttachmentModal(false); handleSendEmail([]); };

    return {
        refNo,
        isPdfReady,
        componentRef,
        purchaseorderData,
        amendmentData,
        partsDocuments,
        amendmentCount,
        showDownloadPicker,
        setShowDownloadPicker,
        loading,
        error,
        quotationUrl,
        quotationMime,
        signing,
        signatureSlots: signing.signatureSlots,
        isSigningDoc: signing.isSigning,
        isActivationAvailable: signing.isActivationAvailable,
        canRequestFamilyAccess: signing.canRequestFamilyAccess,
        openActivationModal: signing.openActivationModal,
        requestFamilyAccess: signing.requestFamilyAccess,
        signResult,
        setSignResult,
        showEmailModal,
        emailFormValues,
        isSendingEmail,
        showUploadSuccessModal,
        setShowUploadSuccessModal,
        showAttachmentModal,
        setShowAttachmentModal,
        showLoadingModal,
        loadingMessage,
        alertModal,
        setAlertModal,
        isSentForApproval,
        isEmailedToSupplier,
        fetchPurchaseOrderData,
        handleSignButtonClick: signing.handleSignButtonClick,
        handleDownloadPdf,
        handleDownloadClick,
        handlePrint,
        sendToApprove,
        handleEditPurchaseOrder,
        handleSendEmail,
        handleEmailFormChange,
        handleEmailButtonClick,
        handleSendToSupplierClick,
        closeEmailModal,
        skipAttachmentModal,
    };
};

export default usePurchaseOrderReport;