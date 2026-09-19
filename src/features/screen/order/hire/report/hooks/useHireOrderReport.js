import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getDeviceFingerprint, getLocationInfo } from '@/features/core/device/fingerprint.device';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import {
  getHireOrderByRef,
  verifyDeviceTrust,
  getSignatureKey,
  getPreSignedUrl,
  signHireOrder,
  sendHireOrderEmail,
  activateSignature,
  uploadHireOrder,
  downloadHireOrderPdf,
} from '../api/hire.order.report.api';
import {
  buildPdf,
  buildOverrideMessage,
  extractFirstName,
  getFileName,
  parseValidEmails,
  parseEmailInput,
} from '../helper/hire.order.report.helper';
import {
  SIGN_TYPES,
  DEFAULT_COLUMNS,
  DEFAULT_HIRE_ORDER_DATA,
  DEFAULT_SIGNATURE_FLAGS,
  DEFAULT_SIGNATURE_STATES,
  ROLE_LABELS,
} from '../constants/hire.order.report.constant';

export const useHireOrderReport = () => {
  const navigate = useNavigate();
  const componentRef = useRef();
  const { refNo, amendment } = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

  const [hireOrderData, setHireOrderData] = useState(DEFAULT_HIRE_ORDER_DATA);
  const [amendmentData, setAmendmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const [signatureFlags, setSignatureFlags] = useState(DEFAULT_SIGNATURE_FLAGS);
  const [signatureStates, setSignatureStates] = useState(DEFAULT_SIGNATURE_STATES);

  const [hireOrderAuthSignatoryTitle, setHireOrderAuthSignatoryTitle] = useState('CEO');
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
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  useEffect(() => {
    setHeaderTitle('Hire Order Document');
    setHeaderSubtitle(refNo || 'Hire Order');
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [refNo, setHeaderTitle, setHeaderSubtitle]);

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
        console.error('[HireOrderReport] Failed to initialize device info:', err);
        setGlobalActivation({ isActivated: false, isTrusted: false, checked: true });
      }
    };

    initializeDeviceInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (globalActivation.isActivated && globalActivation.isTrusted && deviceInfo && !loading) {
      loadAllSignatures(deviceInfo, signatureFlags);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalActivation.isTrusted, globalActivation.isActivated, deviceInfo, loading]);

  useEffect(() => {
    if (refNo && globalActivation.checked && deviceInfo) fetchHireOrder();
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
        if (img.complete && img.naturalHeight !== 0) onLoad();
        else { img.addEventListener('load', onLoad); img.addEventListener('error', onLoad); }
      });
    };

    const timer = setTimeout(checkImages, 500);
    return () => clearTimeout(timer);
  }, [hireOrderData, signatureStates]);

  const checkAllSignTypeTrust = async (info) => {
    if (!info) return { isActivated: false, isTrusted: false };

    try {
      let allActivated = true;
      let allTrusted = true;

      for (const signType of SIGN_TYPES) {
        const result = await verifyDeviceTrust(signType, info);
        if (!result.data?.isActivated) allActivated = false;
        if (!result.data?.isTrusted) allTrusted = false;
      }

      return { isActivated: allActivated, isTrusted: allTrusted };
    } catch (err) {
      console.error('[HireOrderReport] checkAllSignTypeTrust error:', err);
      return { isActivated: false, isTrusted: false };
    }
  };

  const loadSignature = async (signType, info, flags, authTitle = hireOrderAuthSignatoryTitle) => {
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

      const keyData = await getSignatureKey(signType, info, authTitle);
      if (!keyData?.data?.sign_key) throw new Error('Failed to get signature key');

      const s3Data = await getPreSignedUrl(keyData.data.sign_key, false, true);
      setSignatureStates((prev) => ({ ...prev, [signType]: { url: s3Data.dataUrl, loading: false } }));
    } catch (err) {
      console.error(`[HireOrderReport] loadSignature(${signType}) error:`, err);
      setSignatureStates((prev) => ({ ...prev, [signType]: { url: '', loading: false } }));
    }
  };

  const loadAllSignatures = (info, flags, authTitle = hireOrderAuthSignatoryTitle) =>
    Promise.all(SIGN_TYPES.map((t) => loadSignature(t, info, flags, authTitle)));

  const handleSignButtonClick = async () => {
    if (!deviceInfo) {
      alert('Device info not ready. Please wait and try again.');
      return;
    }

    try {
      const result = await verifyDeviceTrust('pm', deviceInfo);
      const isActivated = result?.data?.isActivated ?? false;
      const isTrusted = result?.data?.isTrusted ?? false;

      if (!isActivated) { setShowActivationModal(true); return; }
      if (!isTrusted) { setShowNotTrustedModal(true); return; }

      setShowSignConfirmModal(true);
    } catch (err) {
      console.error('[HireOrderReport] handleSignButtonClick error:', err);
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
      const response = await signHireOrder(decodeURIComponent(refNo), {
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
        result.message === 'HIRE_ORDER_NOT_UPLOADED' ? setSignResult('not_uploaded') : setShowUnauthorisedModal(true);
        return;
      }
      if (response.status === 409) { setSignResult('already_signed'); return; }

      if (response.status === 202 && result.requireOverride) {
        const labels = (result.unsignedAbove || []).map((r) => ROLE_LABELS[r] || r);
        setUnsignedAboveRoles(labels);
        setShowOverrideModal(true);
        return;
      }

      if (!response.ok) throw new Error(result.message || 'Signing failed');

      const hireOrder = result.data;
      const newFlags = {
        pmSigned: hireOrder.pmSigned || false,
        accountsSigned: hireOrder.accountsSigned || false,
        managerSigned: hireOrder.managerSigned || false,
        ceoSigned: hireOrder.ceoSigned || false,
      };
      setSignatureFlags(newFlags);
      setSignResult('success');
      await loadAllSignatures(deviceInfo, newFlags);
    } catch (err) {
      console.error('[HireOrderReport] handleConfirmSign error:', err);
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
      console.error('[HireOrderReport] Activation error:', err);
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

  const fetchHireOrder = async () => {
    setLoading(true);
    setError(null);
    setImagesLoaded(false);

    try {
      if (!refNo) throw new Error('No hire order reference number provided');

      const data = await getHireOrderByRef(refNo);

      if (!data.success || !data.data) {
        setError(data.message || 'Hire order not found');
        return;
      }

      const order = data.data;
      const flags = {
        pmSigned: order.pmSigned || false,
        accountsSigned: order.accountsSigned || false,
        managerSigned: order.managerSigned || false,
        ceoSigned: order.ceoSigned || false,
      };

      const builtData = {
        vendor: order.company?.vendor || '',
        date: order.date || '',
        hireOrderRef: order.hireOrderRef || '',
        quoteNo: order.quoteNo || '',
        customFields: order.customFields || [],
        showTotalRow: order.showTotalRow ?? true,
        attention: order.company?.attention || '',
        designation: order.company?.designation || '',
        requestText: order.requestText || '',
        items: order.items || [],
        columns: order.columns?.length ? order.columns : DEFAULT_COLUMNS,
        totalAmount: order.totalAmount || 0,
        discount: order.discount || 0,
        showDiscountInTotal: order.showDiscountInTotal ?? false,
        totalDiscountAmount: order.totalDiscountAmount ?? null,
        isAmendment: amendment === 'true' || amendment === true,
        termsAndConditions: order.termsAndConditions || DEFAULT_HIRE_ORDER_DATA.termsAndConditions,
        signatures: order.signatures || DEFAULT_HIRE_ORDER_DATA.signatures,
      };

      setHireOrderData(builtData);
      setSignatureFlags(flags);
      setHireOrderAuthSignatoryTitle(order.signatures?.authorizedSignatoryTitle || 'CEO');
      setVendorMail(order.vendorMail || null);

      if (order.isAmendmented && order.amendments?.length) {
        const latest = order.amendments[order.amendments.length - 1];
        setAmendmentData({
          ...builtData,
          vendor: latest.amendedCompany?.vendor || order.company?.vendor || '',
          attention: latest.amendedCompany?.attention || order.company?.attention || '',
          designation: latest.amendedCompany?.designation || order.company?.designation || '',
          quoteNo: latest.amendedQuoteNo || order.quoteNo || '',
          customFields: latest.amendedCustomFields?.length ? latest.amendedCustomFields : (order.customFields || []),
          showTotalRow: latest.amendedShowTotalRow ?? order.showTotalRow ?? true,
          totalDiscountAmount: order.totalDiscountAmount != null ? (latest.amendedTotalAmount ?? order.totalDiscountAmount) : null,
          requestText: latest.amendedRequestText || order.requestText || '',
          items: latest.amendedItems?.length ? latest.amendedItems : order.items || [],
          columns: latest.amendedColumns?.length ? latest.amendedColumns : builtData.columns,
          totalAmount: latest.amendedTotalAmount ?? order.totalAmount ?? 0,
          discount: latest.amendedDiscount ?? order.discount ?? 0,
          termsAndConditions: latest.amendedTermsAndConditions?.length ? latest.amendedTermsAndConditions : order.termsAndConditions || [],
          isAmendment: true,
          amendmentDate: new Date(latest.amendmentDate).toLocaleDateString('en-GB'),
        });
      } else {
        setAmendmentData(null);
      }

      if (globalActivation.isActivated && globalActivation.isTrusted && deviceInfo) {
        await loadAllSignatures(deviceInfo, flags, order.signatures?.authorizedSignatoryTitle || 'CEO');
      }
    } catch (err) {
      console.error('[HireOrderReport] fetchHireOrder error:', err);
      setError(`Failed to load hire order: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const guardImagesLoaded = () => {
    if (!imagesLoaded) { alert('Please wait for all images to load before generating PDF'); return false; }
    return true;
  };

  const withControlsHidden = async (action) => {
    const controls = document.querySelector('.shared.controls.bar');
    if (controls) controls.style.visibility = 'hidden';
    try {
      await action();
    } finally {
      if (controls) controls.style.visibility = 'visible';
    }
  };

  const sendToApprove = async () => {
    if (!guardImagesLoaded()) return;

    await withControlsHidden(async () => {
      try {
        const pdf = await buildPdf();
        const pdfBlob = pdf.output('blob');

        const uploadResponse = await uploadHireOrder({
          fileName: `${getFileName(hireOrderData)}.pdf`,
          uploadedBy: 'WORKSHOP_MANAGER',
          hireOrderRef: decodeURIComponent(refNo),
          description: 'Hire order document generated from system',
          isAmendment: hireOrderData.isAmendment || false,
        });

        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadResult.success) {
          throw new Error(uploadResult.message || 'Upload failed');
        }

        setShowUploadSuccessModal(true);
      } catch (err) {
        console.error('[HireOrderReport] sendToApprove error:', err);
        alert(`Upload failed: ${err.message}`);
      }
    });
  };

  const handleDownloadPdf = async () => {
    if (!guardImagesLoaded()) return;

    setShowLoadingModal(true);
    setLoadingMessage('Generating PDF...');

    try {
      const currentPath = window.location.pathname;
      const fileName = `${getFileName(hireOrderData)}.pdf`;

      const blob = await downloadHireOrderPdf(`${currentPath}?pdf=1`, fileName);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error('[HireOrderReport] handleDownloadPdf error:', err);
      alert('Error generating PDF. Please try again.');
    } finally {
      setShowLoadingModal(false);
    }
  };

  const handleSendToSupplierClick = () => {
    if (vendorMail?.length) setEmailFormValues({ emails: vendorMail });
    setShowEmailModal(true);
  };

  const handleEditClick = () => {
    const encodedRef = encodeURIComponent(hireOrderData.hireOrderRef);
    navigate(amendmentData
      ? `/order/hire/form/amendment/update/${encodedRef}`
      : `/order/hire/form/edit/${encodedRef}`
    );
  };

  const handleActivationKeyChange = (val) => setActivationKey(val);
  const handleCloseActivationModal = () => setShowActivationModal(false);
  const handleTrustModalClose = () => { };
  const handleCloseNotTrustedModal = () => setShowNotTrustedModal(false);
  const handleCloseSignConfirmModal = () => setShowSignConfirmModal(false);
  const handleCloseUnauthorisedModal = () => setShowUnauthorisedModal(false);
  const handleClearSignResult = () => setSignResult(null);
  const handleCloseOverrideModal = () => setShowOverrideModal(false);
  const handleOverrideSignClick = () => handleConfirmSign(true);

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setEmailFormValues({ emails: [''] });
  };

  const handleEmailModalSubmit = () => {
    const validEmails = parseValidEmails(emailFormValues.emails);
    if (!validEmails.length) { alert('Please enter at least one valid email'); return; }
    handleSendEmail([]);
  };

  const handleSendEmail = async (extraFiles = []) => {
    const validEmails = parseValidEmails(emailFormValues.emails);
    if (!validEmails.length) { alert('Please enter at least one valid email'); return; }

    setIsSendingEmail(true);

    try {
      await new Promise((r) => setTimeout(r, 200));
      const pdf = await buildPdf();
      const pdfBlob = pdf.output('blob');

      const formDataToSend = new FormData();
      formDataToSend.append('pdf', pdfBlob, `${getFileName(hireOrderData)}.pdf`);
      formDataToSend.append('emails', JSON.stringify(validEmails));
      formDataToSend.append('recipientName', extractFirstName(hireOrderData.attention));
      formDataToSend.append('vendorName', extractFirstName(hireOrderData.vendor));
      formDataToSend.append('hireOrderRef', decodeURIComponent(refNo));

      extraFiles.forEach((file) => formDataToSend.append('attachments', file));

      const response = await sendHireOrderEmail(formDataToSend);

      if (response.ok) {
        setShowEmailModal(false);
        setEmailFormValues({ emails: [''] });
        setSignResult('email_sent');
      } else {
        alert('Failed to send email. Please try again.');
      }
    } catch (err) {
      console.error('[HireOrderReport] handleSendEmail error:', err);
      alert('Error sending email.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleEmailFormChange = (field, value) => {
    setEmailFormValues({ emails: parseEmailInput(value) });
  };

  const handleCloseUploadSuccessModal = () => setShowUploadSuccessModal(false);

  const overrideModalMessage = buildOverrideMessage(unsignedAboveRoles);
  const emailFormDisplayValues = { emails: emailFormValues.emails.join(', ') };

  const isNotUploadedModalOpen = signResult === 'not_uploaded';
  const isAlreadySignedModalOpen = signResult === 'already_signed';
  const isSignSuccessModalOpen = signResult === 'success';
  const isEmailSentModalOpen = signResult === 'email_sent';

  return {
    componentRef,
    refNo,
    deviceInfo,

    hireOrderData,
    amendmentData,
    loading,
    error,

    signatureFlags,
    signatureStates,

    isSigningDoc,
    showSignConfirmModal,
    showUnauthorisedModal,
    vendorMail,
    showEmailModal,
    emailFormValues,
    emailFormDisplayValues,
    isSendingEmail,
    showOverrideModal,
    unsignedAboveRoles,
    overrideModalMessage,
    activationKey,
    activationError,
    activationLoading,
    globalActivation,
    showActivationModal,
    showTrustModal,
    showNotTrustedModal,
    showUploadSuccessModal,
    showLoadingModal,
    loadingMessage,

    isNotUploadedModalOpen,
    isAlreadySignedModalOpen,
    isSignSuccessModalOpen,
    isEmailSentModalOpen,

    handleSignButtonClick,
    handleConfirmSign,
    handleLoadAllSignatures,
    handleActivation,
    confirmBrowserTrust,
    fetchHireOrder,
    sendToApprove,
    handleDownloadPdf,
    handleSendToSupplierClick,
    handleEditClick,
    handleActivationKeyChange,

    handleCloseActivationModal,
    handleTrustModalClose,
    handleCloseNotTrustedModal,
    handleCloseSignConfirmModal,
    handleCloseUnauthorisedModal,
    handleClearSignResult,
    handleCloseOverrideModal,
    handleOverrideSignClick,
    handleCloseEmailModal,
    handleEmailModalSubmit,
    handleEmailFormChange,
    handleCloseUploadSuccessModal,
  };
};

export default useHireOrderReport;