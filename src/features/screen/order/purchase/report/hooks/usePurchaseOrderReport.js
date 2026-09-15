// hooks 
import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDeviceFingerprint, getLocationInfo } from '@/features/core/device/fingerprint.device';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import {
    verifyDeviceTrust,
    getSignatureKey,
    getPreSignedUrl,
    fetchPurchaseOrderByRef,
    fetchComplaintById,
    signPurchaseOrder,
    activateSignature,
    uploadPurchaseOrder,
    sendPurchaseOrderViaEmail,
    downloadPurchaseOrderPdf,
    submitPurchaseOrderPdf,
    emailPurchaseOrderPdf,
} from '../api/purchase.order.report.api';
import { buildPdf } from '../helper/purchase.order.report.helper';
import {
    SIGN_TYPES,
    DEFAULT_PurchaseOrder_DATA,
    DEFAULT_SIGNATURE_FLAGS,
    DEFAULT_SIGNATURE_STATES,
} from '../constants/purchase.order.report.constant';

const usePurchaseOrderReport = () => {
    const navigate = useNavigate();
    const componentRef = useRef();
    const { purchaseorderRef: refNo, complaintId, amendment } = useParams();
    const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

    const [purchaseorderData, setPurchaseOrderData] = useState(DEFAULT_PurchaseOrder_DATA);
    const [amendmentData, setAmendmentData] = useState(null);
    const [purchaseorderCounter, setPurchaseOrderCounter] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [quotationUrl, setQuotationUrl] = useState('');
    const [quotationMime, setQuotationMime] = useState('');

    const [signatureFlags, setSignatureFlags] = useState(DEFAULT_SIGNATURE_FLAGS);
    const [signatureStates, setSignatureStates] = useState(DEFAULT_SIGNATURE_STATES);
    const [purchaseorderAuthSignatoryTitle, setPurchaseOrderAuthSignatoryTitle] = useState('CEO');
    const [isSigningDoc, setIsSigningDoc] = useState(false);
    const [showSignConfirmModal, setShowSignConfirmModal] = useState(false);
    const [showUnauthorisedModal, setShowUnauthorisedModal] = useState(false);
    const [signResult, setSignResult] = useState(null);
    const [vendorMail, setVendorMail] = useState(null);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [emailFormValues, setEmailFormValues] = useState({ emails: [''] });
    const [isSendingEmail, setIsSendingEmail] = useState(false);
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [unsignedAboveRoles, setUnsignedAboveRoles] = useState([]);

    const [deviceInfo, setDeviceInfo] = useState(null);
    const [activationKey, setActivationKey] = useState('');
    const [activationError, setActivationError] = useState('');
    const [activationLoading, setActivationLoading] = useState(false);
    const [globalActivation, setGlobalActivation] = useState({ isActivated: false, isTrusted: false, checked: false });

    const [showActivationModal, setShowActivationModal] = useState(false);
    const [showTrustModal, setShowTrustModal] = useState(false);
    const [showNotTrustedModal, setShowNotTrustedModal] = useState(false);
    const [showUploadSuccessModal, setShowUploadSuccessModal] = useState(false);
    const [showAttachmentModal, setShowAttachmentModal] = useState(false);
    const [showLoadingModal, setShowLoadingModal] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    useEffect(() => {
        if (!purchaseorderCounter) {
            setHeaderTitle(null);
            setHeaderSubtitle(null);
            return;
        }
        setHeaderTitle(globalActivation.isTrusted ? 'E-Signs Activated' : 'Please Activate the Sign');
        setHeaderSubtitle(`Purchase Order Document: ${purchaseorderData.purchaseorderRef}`);

        return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
    }, [purchaseorderCounter, purchaseorderData.purchaseorderRef, globalActivation.isTrusted, setHeaderTitle, setHeaderSubtitle]);

    useEffect(() => {
        if (globalActivation.isActivated && globalActivation.isTrusted && deviceInfo && !loading) {
            loadAllSignatures(deviceInfo, signatureFlags);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [globalActivation.isTrusted, globalActivation.isActivated, deviceInfo, loading]);

    useEffect(() => {
        const initializeDeviceInfo = async () => {
            try {
                const fingerprint = getDeviceFingerprint();
                const location = await getLocationInfo();
                const user = JSON.parse(localStorage.getItem('user') || '{}');

                if (!user._id) {
                    console.warn('[PurchaseOrderReport] User ID not found in localStorage');
                    setGlobalActivation({ isActivated: false, isTrusted: false, checked: true });
                    return;
                }

                const info = {
                    userId: user._id,
                    deviceFingerprint: fingerprint.uniqueCode,
                    ipAddress: location.ipAddress,
                    location: `${location.city}, ${location.region}, ${location.country}`,
                    userAgent: fingerprint.userAgent,
                    browserInfo: fingerprint.browserInfo,
                };

                setDeviceInfo(info);

                const status = await checkAllSignTypeTrust(info);
                setGlobalActivation({ ...status, checked: true });

            } catch (err) {
                console.error('[PurchaseOrderReport] Failed to initialize device info:', err);
                setGlobalActivation({ isActivated: false, isTrusted: false, checked: true });
            }
        };

        initializeDeviceInfo();
    }, []);

    useEffect(() => {
        if (refNo && globalActivation.checked && deviceInfo) {
            fetchPurchaseOrderData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refNo, globalActivation.checked, deviceInfo]);

    useEffect(() => {
        if (!componentRef.current) { setImagesLoaded(true); return; }

        const checkImages = () => {
            const images = componentRef.current.querySelectorAll('img');
            if (!images.length) { setImagesLoaded(true); return; }

            let loadedCount = 0;
            const onLoad = () => { if (++loadedCount === images.length) setImagesLoaded(true); };

            images.forEach((img) => {
                if (img.complete && img.naturalHeight !== 0) { onLoad(); }
                else { img.addEventListener('load', onLoad); img.addEventListener('error', onLoad); }
            });
        };

        const timer = setTimeout(checkImages, 500);
        return () => clearTimeout(timer);
    }, [purchaseorderData, signatureStates]);

    const checkAllSignTypeTrust = async (info) => {
        if (!info) return { isActivated: false, isTrusted: false };

        try {
            let allActivated = true;
            let allTrusted = true;

            for (const signType of SIGN_TYPES) {
                const response = await verifyDeviceTrust(signType, info);
                const result = await response.json();
                if (!result.data.isActivated) allActivated = false;
                if (!result.data.isTrusted) allTrusted = false;
            }

            return { isActivated: allActivated, isTrusted: allTrusted };
        } catch (err) {
            console.error('[PurchaseOrderReport] checkAllSignTypeTrust error:', err);
            return { isActivated: false, isTrusted: false };
        }
    };

    const loadSignature = async (signType, info, flags, authTitle = purchaseorderAuthSignatoryTitle) => {
        const flagMap = {
            accounts: flags.accountsSigned,
            pm: flags.pmSigned,
            manager: flags.managerSigned,
            authorized: flags.ceoSigned,
            seal: flags.ceoSigned,
        };

        if (!flagMap[signType]) return;

        setSignatureStates((prev) => ({ ...prev, [signType]: { ...prev[signType], loading: true } }));

        try {
            const payload = { deviceInfo: info };
            if (signType === 'authorized' && authTitle === 'MANAGING DIRECTOR') {
                payload.authRole = 'MANAGING_DIRECTOR';
            }

            const keyResponse = await getSignatureKey(signType, info, authTitle);
            if (!keyResponse.ok) throw new Error('Failed to get signature key');
            const keyData = await keyResponse.json();

            const s3Response = await getPreSignedUrl(keyData.data.sign_key, false, true);
            if (!s3Response.ok) throw new Error('Failed to get signature URL');
            const s3Data = await s3Response.json();

            setSignatureStates((prev) => ({ ...prev, [signType]: { url: s3Data.dataUrl, loading: false } }));

        } catch (err) {
            console.error(`[PurchaseOrderReport] loadSignature(${signType}) error:`, err);
            setSignatureStates((prev) => ({ ...prev, [signType]: { url: '', loading: false } }));
        }
    };

    const loadAllSignatures = (info, flags, authTitle = purchaseorderAuthSignatoryTitle) =>
        Promise.all(SIGN_TYPES.map((t) => loadSignature(t, info, flags, authTitle)));

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
        setImagesLoaded(false);

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

            let jobCode = null;
            try {
                if (!purchaseOrder.complaintId) throw new Error('No complaint ID');
                const complaintRes = await fetchComplaintById(purchaseOrder.complaintId);
                if (complaintRes.ok) {
                    const complaintData = await complaintRes.json();
                    jobCode = complaintData.complaintId || null;
                }
            } catch (_) { }

            const flags = {
                pmSigned: purchaseOrder.pmSigned || false,
                accountsSigned: purchaseOrder.accountsSigned || false,
                managerSigned: purchaseOrder.managerSigned || false,
                ceoSigned: purchaseOrder.ceoSigned || false,
            };
            const authSignatoryTitle = purchaseOrder.signatures?.authorizedSignatoryTitle || 'CEO';

            const builtPurchaseOrderData = {
                vendor: purchaseOrder.company?.vendor || '',
                equipments: purchaseOrder.equipments || [],
                date: purchaseOrder.date || '',
                purchaseorderRef: purchaseOrder.purchaseorderRef || '',
                quoteNo: purchaseOrder.quoteNo || '',
                jobCode: jobCode || '',
                complaintId: purchaseOrder.complaintId || '',
                attention: purchaseOrder.company?.attention || '',
                designation: purchaseOrder.company?.designation || '',
                workingHrs: purchaseOrder.workingHrs || '',
                runningKm: purchaseOrder.runningKm || '',
                requestText: purchaseOrder.requestText || '',
                items: purchaseOrder.items || [],
                totalAmount: purchaseOrder.totalAmount || 0,
                isAmendment: amendment === 'true' || amendment === true,
                totalDiscountAmount: purchaseOrder.totalDiscountAmount || null,
                termsAndConditions: purchaseOrder.termsAndConditions || DEFAULT_PurchaseOrder_DATA.termsAndConditions,
                signatures: purchaseOrder.signatures || DEFAULT_PurchaseOrder_DATA.signatures,
                quotation: purchaseOrder.quotation || null,
            };

            setPurchaseOrderData(builtPurchaseOrderData);
            setSignatureFlags(flags);
            setPurchaseOrderAuthSignatoryTitle(authSignatoryTitle);
            setPurchaseOrderCounter(purchaseOrder.purchaseorderCounter || 1);
            setVendorMail(purchaseOrder.vendorMail || null);

            if (purchaseOrder.quotation) await loadQuotationPreview(purchaseOrder.quotation);

            if (purchaseOrder.isAmendmented && purchaseOrder.amendments?.length) {
                const latest = purchaseOrder.amendments[purchaseOrder.amendments.length - 1];
                setAmendmentData({
                    ...builtPurchaseOrderData,
                    vendor: latest.amendedCompany?.vendor || purchaseOrder.company?.vendor || '',
                    equipments: latest.amendedEquipments || purchaseOrder.equipments || [],
                    quoteNo: latest.amendedQuoteNo || purchaseOrder.quoteNo || '',
                    attention: latest.amendedCompany?.attention || purchaseOrder.company?.attention || '',
                    designation: latest.amendedCompany?.designation || purchaseOrder.company?.designation || '',
                    requestText: latest.amendedRequestText || purchaseOrder.requestText || '',
                    items: latest.amendedItems || purchaseOrder.items || [],
                    totalAmount: latest.amendedTotalAmount || purchaseOrder.totalAmount || 0,
                    totalDiscountAmount: latest.amendedDiscount || purchaseOrder.totalDiscountAmount || null,
                    termsAndConditions: latest.amendedTermsAndConditions || purchaseOrder.termsAndConditions || DEFAULT_PurchaseOrder_DATA.termsAndConditions,
                    isAmendment: true,
                    amendmentDate: new Date(latest.amendmentDate).toLocaleDateString('en-GB'),
                    amendmentReason: latest.reason || 'Amendment requested',
                });
            }

            if (globalActivation.isActivated && globalActivation.isTrusted && deviceInfo) {
                await loadAllSignatures(deviceInfo, flags, authSignatoryTitle);
            }

        } catch (err) {
            console.error('[PurchaseOrderReport] fetchPurchaseOrderData error:', err);
            setError(`Failed to load Purchase Order data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handleSignButtonClick = async () => {
        if (!deviceInfo) {
            alert('Device info not ready. Please wait and try again.');
            return;
        }

        try {
            const response = await verifyDeviceTrust('pm', deviceInfo);
            const result = await response.json();

            const isActivated = result?.data?.isActivated ?? result?.isActivated ?? false;
            const isTrusted = result?.data?.isTrusted ?? result?.isTrusted ?? false;

            if (!isActivated) { setShowActivationModal(true); return; }
            if (!isTrusted) { setShowNotTrustedModal(true); return; }

            setShowSignConfirmModal(true);
        } catch (err) {
            console.error('[PurchaseOrderReport] handleSignButtonClick error:', err);
            alert(`Could not verify device trust: ${err.message}`);
        }
    };

    const handleConfirmSign = async (override = false) => {
        if (!deviceInfo) return;
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (!user._id) { alert('User session not found. Please log in again.'); return; }

        setIsSigningDoc(true);
        setShowSignConfirmModal(false);
        setShowOverrideModal(false);

        try {
            const response = await signPurchaseOrder(refNo, {
                uniqueCode: user.uniqueCode,
                signedDate: new Date().toISOString(),
                signedFrom: deviceInfo.browserInfo,
                signedIP: deviceInfo.ipAddress,
                signedDevice: deviceInfo.userAgent,
                signedLocation: deviceInfo.location,
                override,
            });

            const result = await response.json();

            if (response.status === 403) {
                result.message === 'PurchaseOrder_NOT_UPLOADED' ? setSignResult('not_uploaded') : setShowUnauthorisedModal(true);
                return;
            }
            if (response.status === 409) { setSignResult('already_signed'); return; }

            if (response.status === 202 && result.requireOverride) {
                const roleLabels = {
                    PURCHASE_MANAGER: 'Purchase Manager',
                    MANAGER: 'Operations Manager',
                    CEO: 'CEO',
                    MANAGING_DIRECTOR: 'Managing Director',
                    ACCOUNTS: 'Accounts Dept',
                };
                const labels = (result.unsignedAbove || []).map(r => roleLabels[r] || r);
                setUnsignedAboveRoles(labels);
                setShowOverrideModal(true);
                return;
            }

            if (!response.ok) throw new Error(result.message || 'Signing failed');

            const purchaseOrder = result.data;
            const newFlags = {
                pmSigned: purchaseOrder.pmSigned || false,
                accountsSigned: purchaseOrder.accountsSigned || false,
                managerSigned: purchaseOrder.managerSigned || false,
                ceoSigned: purchaseOrder.ceoSigned || false,
            };
            setSignatureFlags(newFlags);
            setSignResult('success');
            await loadAllSignatures(deviceInfo, newFlags);

        } catch (err) {
            console.error('[PurchaseOrderReport] handleConfirmSign error:', err);
            alert(`Signing failed: ${err.message}`);
        } finally {
            setIsSigningDoc(false);
        }
    };

    const handleLoadAllSignatures = async () => {
        const status = await checkAllSignTypeTrust(deviceInfo);

        if (!status.isActivated) { setShowActivationModal(true); return; }
        if (!status.isTrusted) { setShowNotTrustedModal(true); return; }

        await loadAllSignatures();
    };

    const handleActivation = async () => {
        if (activationKey.length !== 20) {
            setActivationError('Please enter a valid 20-digit activation key');
            return;
        }

        setActivationLoading(true);
        setActivationError('');

        try {
            for (const signType of SIGN_TYPES) {
                const response = await activateSignature(activationKey, signType, deviceInfo);
                if (!response.ok) {
                    const errData = await response.json();
                    throw new Error(errData.message || `Failed to activate ${signType}`);
                }
            }

            setShowActivationModal(false);
            setActivationKey('');
            setActivationError('');
            setShowTrustModal(true);

        } catch (err) {
            console.error('[PurchaseOrderReport] Activation error:', err);
            setActivationError(`${err.message}, failed attempt, refresh and try again`);
        } finally {
            setActivationLoading(false);
        }
    };

    const confirmBrowserTrust = () => {
        setShowTrustModal(false);
        setGlobalActivation({ isActivated: true, isTrusted: true, checked: true });
        loadAllSignatures(deviceInfo, signatureFlags);
    };

    const guardImagesLoaded = () => {
        if (!imagesLoaded) { alert('Please wait for all images to load before generating PDF'); return false; }
        return true;
    };

    const withControlsHidden = async (action) => {
        const controls = document.querySelector('.shared.controls.bar');
        const quotations = document.querySelectorAll('.purchase.order.report.quotation.preview.panel');
        if (controls) controls.style.visibility = 'hidden';
        quotations.forEach((el) => { el.style.display = 'none'; });
        try {
            await action();
        } finally {
            if (controls) controls.style.visibility = 'visible';
            quotations.forEach((el) => { el.style.display = ''; });
        }
    };

    const getFileName = () => `Purchase Order - ${purchaseorderCounter}-${purchaseorderData.vendor} For - ${purchaseorderData.equipments}`;

    const handleDownloadPdf = async () => {
        setShowLoadingModal(true);
        setLoadingMessage('Generating PDF...');

        try {
            const response = await downloadPurchaseOrderPdf(decodeURIComponent(refNo), {
                isAmendment: purchaseorderData.isAmendment,
                complaintId: complaintId || purchaseorderData.complaintId,
            });
            if (!response.ok) throw new Error('Failed to generate PDF');
            if (!response.headers.get('content-type')?.includes('application/pdf')) {
                throw new Error('Server returned a non-PDF response');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${getFileName()}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error('[PurchaseOrderReport] handleDownloadPdf error:', err);
            alert('Error generating PDF. Please try again.');
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
                isAmendment: purchaseorderData.isAmendment || false,
                complaintId: complaintId || purchaseorderData.complaintId,
            });
            const result = await response.json();
            if (!response.ok || !result.success) throw new Error(result.message || 'Upload failed');

            setShowUploadSuccessModal(true);
        } catch (err) {
            console.error('[PurchaseOrderReport] sendToApprove error:', err);
            alert(`Upload failed: ${err.message}`);
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
        if (!validEmails.length) { alert('Please enter at least one valid email'); return; }

        setIsSendingEmail(true);
        setShowAttachmentModal(false);

        try {
            const extractName = (str) => str ? str.split('-')[0].trim() : '';

            const formDataToSend = new FormData();
            formDataToSend.append('emails', JSON.stringify(validEmails));
            formDataToSend.append('recipientName', extractName(purchaseorderData.attention));
            formDataToSend.append('vendorName', extractName(purchaseorderData.vendor));
            formDataToSend.append('equipment', purchaseorderData.equipments.join(', '));
            if (complaintId || purchaseorderData.complaintId) formDataToSend.append('complaintId', complaintId || purchaseorderData.complaintId);
            extraFiles.forEach((file) => formDataToSend.append('attachments', file));

            const response = await emailPurchaseOrderPdf(decodeURIComponent(refNo), formDataToSend);

            if (response.ok) {
                setShowEmailModal(false);
                setEmailFormValues({ emails: [''] });
                setSignResult('email_sent');
            } else {
                alert('Failed to send email. Please try again.');
            }
        } catch (err) {
            console.error('[PurchaseOrderReport] handleSendEmail error:', err);
            alert('Error sending email.');
        } finally {
            setIsSendingEmail(false);
        }
    };


    const handleEmailFormChange = (field, value) => setEmailFormValues({ emails: value.split(',').map(e => e.trim()).filter(Boolean) });

    const handleEmailButtonClick = () => {
        const validEmails = emailFormValues.emails.filter(e => e?.includes('@'));
        if (!validEmails.length) { alert('Please enter at least one valid email'); return; }
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
        componentRef,
        deviceInfo,
        purchaseorderData,
        amendmentData,
        loading,
        error,
        quotationUrl,
        quotationMime,
        signatureFlags,
        signatureStates,
        isSigningDoc,
        showSignConfirmModal,
        setShowSignConfirmModal,
        showUnauthorisedModal,
        setShowUnauthorisedModal,
        signResult,
        setSignResult,
        showEmailModal,
        emailFormValues,
        isSendingEmail,
        showOverrideModal,
        setShowOverrideModal,
        unsignedAboveRoles,
        activationKey,
        setActivationKey,
        activationError,
        activationLoading,
        globalActivation,
        showActivationModal,
        setShowActivationModal,
        showTrustModal,
        showNotTrustedModal,
        setShowNotTrustedModal,
        showUploadSuccessModal,
        setShowUploadSuccessModal,
        showAttachmentModal,
        setShowAttachmentModal,
        showLoadingModal,
        loadingMessage,
        fetchPurchaseOrderData,
        handleSignButtonClick,
        handleConfirmSign,
        handleLoadAllSignatures,
        handleActivation,
        confirmBrowserTrust,
        handleDownloadPdf,
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