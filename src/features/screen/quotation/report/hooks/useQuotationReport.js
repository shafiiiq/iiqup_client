import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDeviceFingerprint, getLocationInfo } from '@/features/core/device/fingerprint.device';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import {
  fetchQuotationByRef,
  downloadQuotationPdf,
  submitQuotationPdf,
  emailQuotationPdf,
  verifyDeviceTrust,
  getSignatureKey,
  getPreSignedUrl,
  signQuotationDoc,
  activateSignature,
} from '../api/quotation.report.api';
import {
  DEFAULT_QUOTATION_DATA,
  DEFAULT_COLUMNS,
  SIGN_TYPES,
  DEFAULT_SIGNATURE_FLAGS,
  DEFAULT_SIGNATURE_STATES,
} from '../constants/quotation.report.constant';

const useQuotationReport = () => {
  const navigate = useNavigate();
  const componentRef = useRef();
  const { quotationRef, amendment } = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

  const [quotationData, setQuotationData] = useState(DEFAULT_QUOTATION_DATA);
  const [amendmentData, setAmendmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendorMail, setVendorMail] = useState(null);

  const [signatureFlags, setSignatureFlags] = useState(DEFAULT_SIGNATURE_FLAGS);
  const [signatureStates, setSignatureStates] = useState(DEFAULT_SIGNATURE_STATES);
  const [authSignatoryTitle, setAuthSignatoryTitle] = useState('CEO');
  const [deviceInfo, setDeviceInfo] = useState(null);

  const [isSigningDoc, setIsSigningDoc] = useState(false);
  const [showSignConfirmModal, setShowSignConfirmModal] = useState(false);
  const [showUnauthorisedModal, setShowUnauthorisedModal] = useState(false);
  const [signResult, setSignResult] = useState(null);

  const [activationKey, setActivationKey] = useState('');
  const [activationError, setActivationError] = useState('');
  const [activationLoading, setActivationLoading] = useState(false);
  const [globalActivation, setGlobalActivation] = useState({ isActivated: false, isTrusted: false, checked: false });
  const [showActivationModal, setShowActivationModal] = useState(false);
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [showNotTrustedModal, setShowNotTrustedModal] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailFormValues, setEmailFormValues] = useState({ emails: [''] });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showUploadSuccessModal, setShowUploadSuccessModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    setHeaderTitle('Quotation Document');
    setHeaderSubtitle(quotationData.quotationRef || 'Quotation');
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [quotationData.quotationRef, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    const initializeDeviceInfo = async () => {
      try {
        const fingerprint = getDeviceFingerprint();
        const location = await getLocationInfo();
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!user._id) {
          setGlobalActivation({ isActivated: false, isTrusted: false, checked: true });
          return;
        }

        const isPdfRender = new URLSearchParams(window.location.search).get('pdf') === '1';
        const pdfRenderSecret = isPdfRender ? (localStorage.getItem('pdfRenderSecret') || '') : '';

        const info = {
          userId: user._id,
          deviceFingerprint: fingerprint.uniqueCode,
          ipAddress: location.ipAddress,
          location: `${location.city}, ${location.region}, ${location.country}`,
          userAgent: fingerprint.userAgent,
          browserInfo: fingerprint.browserInfo,
          ...(pdfRenderSecret && { pdfRenderSecret }),
        };

        setDeviceInfo(info);

        const status = isPdfRender
          ? { isActivated: true, isTrusted: true }
          : await checkAllSignTypeTrust(info);
        setGlobalActivation({ ...status, checked: true });
      } catch (err) {
        console.error('[QuotationReport] Failed to initialize device info:', err);
        setGlobalActivation({ isActivated: false, isTrusted: false, checked: true });
      }
    };

    initializeDeviceInfo();
  }, []);

  useEffect(() => {
    if (globalActivation.isActivated && globalActivation.isTrusted && deviceInfo && !loading) {
      loadAllSignatures(deviceInfo, signatureFlags);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalActivation.isTrusted, globalActivation.isActivated, deviceInfo, loading]);

  useEffect(() => {
    if (quotationRef && globalActivation.checked && deviceInfo) fetchQuotationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationRef, globalActivation.checked, deviceInfo]);

  const checkAllSignTypeTrust = async (info) => {
    if (!info) return { isActivated: false, isTrusted: false };

    try {
      let allActivated = true;
      let allTrusted = true;

      for (const signType of SIGN_TYPES) {
        const response = await verifyDeviceTrust(signType, info);
        const result = await response.json();
        if (!result.data?.isActivated) allActivated = false;
        if (!result.data?.isTrusted) allTrusted = false;
      }

      return { isActivated: allActivated, isTrusted: allTrusted };
    } catch (err) {
      console.error('[QuotationReport] checkAllSignTypeTrust error:', err);
      return { isActivated: false, isTrusted: false };
    }
  };

  const loadSignature = async (signType, info, flags, authTitle = authSignatoryTitle) => {
    const flagMap = {
      authorized: flags.authorizedSigned,
      seal: flags.authorizedSigned,
    };

    if (!flagMap[signType]) return;

    setSignatureStates((prev) => ({ ...prev, [signType]: { ...prev[signType], loading: true } }));

    try {
      const authRole = authTitle === 'MANAGING DIRECTOR' ? 'MANAGING_DIRECTOR' : undefined;

      const keyResponse = await getSignatureKey(signType, info, authRole);
      if (!keyResponse.ok) throw new Error('Failed to get signature key');
      const keyData = await keyResponse.json();

      const s3Response = await getPreSignedUrl(keyData.data.sign_key, false, true);
      if (!s3Response.ok) throw new Error('Failed to get signature URL');
      const s3Data = await s3Response.json();

      setSignatureStates((prev) => ({ ...prev, [signType]: { url: s3Data.dataUrl, loading: false } }));
    } catch (err) {
      console.error(`[QuotationReport] loadSignature(${signType}) error:`, err);
      setSignatureStates((prev) => ({ ...prev, [signType]: { url: '', loading: false } }));
    }
  };

  const loadAllSignatures = (info, flags, authTitle = authSignatoryTitle) =>
    Promise.all(SIGN_TYPES.map((t) => loadSignature(t, info, flags, authTitle)));

  const fetchQuotationData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!quotationRef) throw new Error('No quotation reference number provided');

      const response = await fetchQuotationByRef(quotationRef);
      const data = await response.json();

      if (!data.success || !data.data) {
        setError(data.message || 'Quotation not found');
        return;
      }

      const q = data.data;
      const authTitle = q.signatures?.authorizedSignatoryTitle || 'CEO';
      const flags = { authorizedSigned: q.authorizedSigned || false };

      const builtData = {
        vendor: q.company?.vendor || '',
        date: q.date || '',
        quotationRef: q.quotationRef || '',
        attention: q.company?.attention || '',
        designation: q.company?.designation || '',
        location: q.location || '',
        customFields: q.customFields || [],
        requestText: q.requestText || '',
        noticeText: q.noticeText || '',
        priceStatementText: q.priceStatementText || '',
        contactText: q.contactText || '',
        items: q.items || [],
        columns: q.columns?.length ? q.columns : DEFAULT_COLUMNS,
        totalAmount: q.totalAmount || 0,
        discount: q.discount || 0,
        showDiscountInTotal: q.showDiscountInTotal ?? true,
        showTotalRow: q.showTotalRow ?? true,
        termsAndConditions: (q.termsAndConditions || []).filter((t) => t !== 'Terms & Conditions'),
        signatures: q.signatures || DEFAULT_QUOTATION_DATA.signatures,
        isAmendment: amendment === 'true' || amendment === true,
      };

      setQuotationData(builtData);
      setVendorMail(q.vendorMail || null);
      setSignatureFlags(flags);
      setAuthSignatoryTitle(authTitle);

      if (q.isAmendmented && q.amendments?.length) {
        const latest = q.amendments[q.amendments.length - 1];
        setAmendmentData({
          ...builtData,
          vendor: latest.amendedCompany?.vendor || q.company?.vendor || '',
          attention: latest.amendedCompany?.attention || q.company?.attention || '',
          designation: latest.amendedCompany?.designation || q.company?.designation || '',
          location: latest.amendedLocation || q.location || '',
          customFields: latest.amendedCustomFields?.length ? latest.amendedCustomFields : (q.customFields || []),
          requestText: latest.amendedRequestText || q.requestText || '',
          noticeText: latest.amendedNoticeText || q.noticeText || '',
          priceStatementText: latest.amendedPriceStatementText || q.priceStatementText || '',
          contactText: latest.amendedContactText || q.contactText || '',
          items: latest.amendedItems?.length ? latest.amendedItems : q.items || [],
          columns: latest.amendedColumns?.length ? latest.amendedColumns : builtData.columns,
          totalAmount: latest.amendedTotalAmount ?? q.totalAmount ?? 0,
          discount: latest.amendedDiscount ?? q.discount ?? 0,
          showTotalRow: latest.amendedShowTotalRow ?? q.showTotalRow ?? true,
          termsAndConditions: (latest.amendedTermsAndConditions?.length ? latest.amendedTermsAndConditions : q.termsAndConditions || []).filter((t) => t !== 'Terms & Conditions'),
          isAmendment: true,
          amendmentDate: new Date(latest.amendmentDate).toLocaleDateString('en-GB'),
        });
      }

      if (globalActivation.isActivated && globalActivation.isTrusted && deviceInfo) {
        await loadAllSignatures(deviceInfo, flags, authTitle);
      }
    } catch (err) {
      console.error('[QuotationReport] fetchQuotationData error:', err);
      setError(`Failed to load quotation data: ${err.message}`);
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
      const response = await verifyDeviceTrust('authorized', deviceInfo);
      const result = await response.json();

      const isActivated = result?.data?.isActivated ?? false;
      const isTrusted = result?.data?.isTrusted ?? false;

      if (!isActivated) { setShowActivationModal(true); return; }
      if (!isTrusted) { setShowNotTrustedModal(true); return; }

      setShowSignConfirmModal(true);
    } catch (err) {
      console.error('[QuotationReport] handleSignButtonClick error:', err);
      alert(`Could not verify device trust: ${err.message}`);
    }
  };

  const handleConfirmSign = async () => {
    if (!deviceInfo) return;
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user._id) { alert('User session not found. Please log in again.'); return; }

    setIsSigningDoc(true);
    setShowSignConfirmModal(false);

    try {
      const response = await signQuotationDoc(quotationRef, {
        uniqueCode: user.uniqueCode,
        signedDate: new Date().toISOString(),
        signedFrom: deviceInfo.browserInfo,
        signedIP: deviceInfo.ipAddress,
        signedDevice: deviceInfo.userAgent,
        signedLocation: deviceInfo.location,
      });

      const result = await response.json();

      if (response.status === 403) { setShowUnauthorisedModal(true); return; }
      if (response.status === 409) { setSignResult('already_signed'); return; }
      if (!response.ok) throw new Error(result.message || 'Signing failed');

      const newFlags = { authorizedSigned: result.data?.authorizedSigned || true };
      setSignatureFlags(newFlags);
      setSignResult('success');
      await loadAllSignatures(deviceInfo, newFlags);
    } catch (err) {
      console.error('[QuotationReport] handleConfirmSign error:', err);
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
      console.error('[QuotationReport] Activation error:', err);
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

  const getFileName = () => `Quotation-${quotationData.quotationRef}-${quotationData.vendor}`;

  const handleDownloadPdf = async () => {
    setShowLoadingModal(true);
    setLoadingMessage('Generating PDF...');

    try {
      const response = await downloadQuotationPdf(decodeURIComponent(quotationRef));
      if (!response.ok) throw new Error('Failed to generate PDF');

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
      console.error('[QuotationReport] handleDownloadPdf error:', err);
      alert('Error generating PDF. Please try again.');
    } finally {
      setShowLoadingModal(false);
    }
  };

  const handlePrint = () => window.print();

  const sendToApprove = async () => {
    try {
      const response = await submitQuotationPdf(decodeURIComponent(quotationRef));
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Submit failed');
      setShowUploadSuccessModal(true);
    } catch (err) {
      console.error('[QuotationReport] sendToApprove error:', err);
      alert(`Submit failed: ${err.message}`);
    }
  };

  const handleEditQuotation = () => {
    const encodedRef = encodeURIComponent(quotationData.quotationRef);
    navigate(amendmentData
      ? `/quotation/form/amendment/update/${encodedRef}`
      : `/quotation/form/edit/${encodedRef}`
    );
  };

  const handleSendToSupplierClick = () => {
    if (vendorMail?.length) setEmailFormValues({ emails: vendorMail });
    setShowEmailModal(true);
  };

  const handleEmailFormChange = (field, value) =>
    setEmailFormValues({ emails: value.split(',').map((e) => e.trim()).filter(Boolean) });

  const closeEmailModal = () => { setShowEmailModal(false); setEmailFormValues({ emails: [''] }); };

  const handleSendEmail = async () => {
    const validEmails = emailFormValues.emails.filter((e) => e?.includes('@'));
    if (!validEmails.length) { alert('Please enter at least one valid email'); return; }

    setIsSendingEmail(true);

    try {
      const extractName = (str) => (str ? str.split('-')[0].trim() : '');

      const formData = new FormData();
      formData.append('emails', JSON.stringify(validEmails));
      formData.append('recipientName', extractName(quotationData.attention));
      formData.append('vendorName', extractName(quotationData.vendor));

      const response = await emailQuotationPdf(decodeURIComponent(quotationRef), formData);

      if (response.ok) {
        setShowEmailModal(false);
        setEmailFormValues({ emails: [''] });
        setSignResult('email_sent');
      } else {
        alert('Failed to send email. Please try again.');
      }
    } catch (err) {
      console.error('[QuotationReport] handleSendEmail error:', err);
      alert('Error sending email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return {
    quotationRef,
    componentRef,
    deviceInfo,
    quotationData,
    amendmentData,
    loading,
    error,
    signatureFlags,
    signatureStates,
    authSignatoryTitle,
    isSigningDoc,
    showSignConfirmModal,
    setShowSignConfirmModal,
    showUnauthorisedModal,
    setShowUnauthorisedModal,
    signResult,
    setSignResult,
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
    showEmailModal,
    emailFormValues,
    isSendingEmail,
    showUploadSuccessModal,
    setShowUploadSuccessModal,
    showLoadingModal,
    loadingMessage,
    fetchQuotationData,
    handleSignButtonClick,
    handleConfirmSign,
    handleLoadAllSignatures,
    handleActivation,
    confirmBrowserTrust,
    handleDownloadPdf,
    handlePrint,
    sendToApprove,
    handleEditQuotation,
    handleSendToSupplierClick,
    handleEmailFormChange,
    closeEmailModal,
    handleSendEmail,
  };
};

export default useQuotationReport;