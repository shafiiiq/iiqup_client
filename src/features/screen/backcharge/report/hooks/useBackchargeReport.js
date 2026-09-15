import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { getDeviceFingerprint, getLocationInfo } from '@/features/core/device/fingerprint.device';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import {
  getBackchargeByRef,
  updateBackcharge,
  sendBackchargeEmail,
  verifyDeviceTrust,
  signBackcharge,
  activateSignature,
  downloadBackchargePdf,
} from '../api/backcharge.report.api';
import {
  buildPdf,
  hideControls,
  showControls,
  normaliseTableRows,
  TABLE_ROW_COUNT,
  BLANK_ROW,
} from '../helper/backcharge.report.helper';

const SIGN_TYPE = 'backcharge';
const SIGNED_FROM = 'web';

const INLINE_INPUT_STYLE = {
  border: 'none',
  outline: 'none',
  background: 'transparent',
};

const DEFAULT_FORM_DATA = {
  refNo: '',
  reportNo: '',
  date: '',
  equipmentType: '',
  plateNo: '',
  model: '',
  supplierName: '',
  contactPerson: '',
  siteLocation: '',
  workDate: '',
  scopeOfWork: '',
  workshopComments: '',
  workSummaryLine2: '',
  workSummaryLine3: '',
  workSummaryLine4: '',
  tableRows: Array(TABLE_ROW_COUNT).fill(BLANK_ROW),
  sparePartsCost: 0,
  labourCharges: 0,
  totalCost: 0,
  approvedDeduction: 0,
};

const parseDateParts = (val) => {
  if (!val) return null;
  if (typeof val === 'string' && val.includes('T')) {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return null;
    return {
      yyyy: d.getFullYear(),
      mm: String(d.getMonth() + 1).padStart(2, '0'),
      dd: String(d.getDate()).padStart(2, '0'),
    };
  }

  const isoMatch = String(val).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return { yyyy: isoMatch[1], mm: isoMatch[2], dd: isoMatch[3] };
  }

  const parts = String(val).split(/[-/.]/).map((p) => p.trim());
  if (parts.length === 3) {
    const [p1, p2, p3] = parts;
    if (p1.length === 4) return { yyyy: p1, mm: p2.padStart(2, '0'), dd: p3.padStart(2, '0') };
    if (p3.length === 4) return { yyyy: p3, mm: p1.padStart(2, '0'), dd: p2.padStart(2, '0') };
  }

  return null;
};

const toDisplayDate = (val) => {
  const parts = parseDateParts(val);
  if (!parts) return '';
  return `${parts.dd}/${parts.mm}/${parts.yyyy}`;
};

const toIsoInputDate = (val) => {
  const parts = parseDateParts(val);
  if (!parts) return '';
  return `${parts.yyyy}-${parts.mm}-${parts.dd}`;
};

const firstLineText = (field) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.lines?.[0]?.text ?? field.combinedText ?? '';
};

const lineTextAt = (field, lineNumber) => {
  if (!field || typeof field === 'string') return '';
  return field.lines?.find((l) => l.lineNumber === lineNumber)?.text ?? '';
};

export const useBackchargeReport = () => {
  const { refNo } = useParams();
  const componentRef = useRef();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [grantTotal, setGrantTotal] = useState(0);
  const [documentExists, setDocumentExists] = useState(false);
  const [documentId, setDocumentId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailFormValues, setEmailFormValues] = useState({ email: '', recipientName: '' });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [supplierMail, setSupplierMail] = useState(null);

  const [signatureFlags, setSignatureFlags] = useState({
    workshopManager: false,
    purchaseManager: false,
    operationsManager: false,
    authorizedSignatory: false,
  });
  const [signatureStates, setSignatureStates] = useState({
    workshopManager: { url: '', loading: false },
    purchaseManager: { url: '', loading: false },
    operationsManager: { url: '', loading: false },
    authorizedSignatory: { url: '', loading: false },
  });
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [activationKey, setActivationKey] = useState('');
  const [activationError, setActivationError] = useState('');
  const [activationLoading, setActivationLoading] = useState(false);
  const [globalActivation, setGlobalActivation] = useState({ isActivated: false, isTrusted: false, checked: false });
  const [isSigningDoc, setIsSigningDoc] = useState(false);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [unsignedAboveRoles, setUnsignedAboveRoles] = useState([]);

  const [showActivationModal, setShowActivationModal] = useState(false);
  const [showTrustModal] = useState(false);
  const [showNotTrustedModal, setShowNotTrustedModal] = useState(false);
  const [showSignConfirmModal, setShowSignConfirmModal] = useState(false);
  const [showUnauthorisedModal, setShowUnauthorisedModal] = useState(false);
  const [signResult, setSignResult] = useState(null);

  useEffect(() => {
    if (refNo) {
      setHeaderTitle(`Ref No: ${refNo}`);
      setHeaderSubtitle(`Backcharge Of: ${formData.supplierName}`);
    } else {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    }
    return () => {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    };
  }, [refNo, formData.supplierName, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    const total = formData.tableRows.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0);
    setGrantTotal(total);
  }, [formData.tableRows]);

  const fetchBackchargeData = useCallback(async () => {
    if (!refNo) return;
    try {
      setIsLoading(true);
      const data = await getBackchargeByRef(refNo);
      if (data.success && data.data) {
        const raw = data.data;

        setFormData({
          ...raw,
          tableRows: normaliseTableRows(raw.tableRows),
          scopeOfWork: firstLineText(raw.scopeOfWork),
          workshopComments: firstLineText(raw.workshopComments),
          workSummaryLine2: lineTextAt(raw.workshopComments, 2),
          workSummaryLine3: lineTextAt(raw.workshopComments, 3),
          workSummaryLine4: lineTextAt(raw.workshopComments, 4),
          sparePartsCost: raw.costSummary?.sparePartsCost ?? 0,
          labourCharges: raw.costSummary?.labourCharges ?? 0,
          totalCost: raw.costSummary?.totalCost ?? 0,
          approvedDeduction: raw.costSummary?.approvedDeduction ?? 0,
        });
        setDocumentExists(true);
        setDocumentId(raw._id);
        setSignatureFlags(raw.signatureFlags || {});
        setSignatureStates(raw.signatureStates || {});
        setSupplierMail(raw.supplierEmail);
      }
    } catch (error) {
      console.error('Error fetching backcharge data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [refNo]);

  useEffect(() => {
    if (!refNo) return;
    fetchBackchargeData();
  }, [refNo, fetchBackchargeData]);

  useEffect(() => {
    const initDeviceInfo = async () => {
      try {
        const fingerprint = getDeviceFingerprint();
        const location = await getLocationInfo();
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        const info = {
          userId: user._id || '',
          uniqueCode: fingerprint.uniqueCode,
          deviceFingerprint: fingerprint.uniqueCode,
          ipAddress: location.ipAddress,
          location: `${location.city}, ${location.region}, ${location.country}`,
          userAgent: fingerprint.userAgent,
          browserInfo: fingerprint.browserInfo,
        };

        setDeviceInfo(info);
        const status = await checkActivationStatus(info);
        setGlobalActivation({ ...status, checked: true });
      } catch (err) {
        console.error('[BackchargeReport] device init error:', err);
      }
    };

    initDeviceInfo();
  }, []);

  const updateBackchargeData = async () => {
    try {
      setIsLoading(true);
      const response = await updateBackcharge(formData._id, formData);
      if (response.success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus(''), 2000);
        setIsEditing(false);
      }
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(''), 2000);
      console.error('Error updating backcharge:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkActivationStatus = async (info) => {
    try {
      const response = await verifyDeviceTrust(SIGN_TYPE, info);
      return { isActivated: response.isActivated, isTrusted: response.isTrusted };
    } catch (error) {
      console.error('Error checking activation:', error);
      return { isActivated: false, isTrusted: false };
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const currentPath = window.location.pathname;
      const fileName = `${getFileName()}.pdf`;

      const blob = await downloadBackchargePdf(`${currentPath}?pdf=1`, fileName);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handlePrint = () => window.print();

  const handleSendEmail = async () => {
    const { email, recipientName } = emailFormValues;
    if (!email || !recipientName) return;

    try {
      setIsSendingEmail(true);
      const response = await sendBackchargeEmail({
        backchargeId: documentId,
        recipientEmail: email,
        recipientName: recipientName,
      });

      if (response.success) {
        setShowEmailModal(false);
        setEmailFormValues({ email: '', recipientName: '' });
      }
    } catch (error) {
      console.error('Error sending email:', error);
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTableChange = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      tableRows: prev.tableRows.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    }));
  };

  const handleEdit = () => setIsEditing(true);
  const handleSaveEdit = () => updateBackchargeData();
  const handleCancelEdit = () => setIsEditing(false);

  const handleSignButtonClick = async () => {
    if (!globalActivation.isActivated || !globalActivation.isTrusted) {
      setShowActivationModal(true);
      return;
    }
    setShowSignConfirmModal(true);
  };

  const handleActivation = async () => {
    if (!activationKey.trim()) {
      setActivationError('Activation key is required');
      return;
    }

    try {
      setActivationLoading(true);
      const response = await activateSignature(activationKey, SIGN_TYPE, deviceInfo);
      if (response.success) {
        setGlobalActivation({ isActivated: true, isTrusted: true, checked: true });
        setShowActivationModal(false);
        setActivationKey('');
        setActivationError('');
      } else {
        setActivationError(response.message || 'Activation failed');
      }
    } catch (error) {
      setActivationError('Error during activation');
      console.error('Activation error:', error);
    } finally {
      setActivationLoading(false);
    }
  };

  const handleConfirmSign = async (override = false) => {
    try {
      setIsSigningDoc(true);
      setShowSignConfirmModal(false);

      const response = await signBackcharge(refNo, {
        uniqueCode: deviceInfo?.uniqueCode,
        signedDate: new Date().toISOString(),
        signedFrom: SIGNED_FROM,
        signedIP: deviceInfo?.ipAddress,
        signedDevice: deviceInfo?.userAgent,
        signedLocation: deviceInfo?.location,
        override,
      });

      if (response.success) {
        setSignResult('success');
        await fetchBackchargeData();
      } else if (response.requireOverride) {
        setUnsignedAboveRoles(response.unsignedAbove || []);
        setShowOverrideModal(true);
      } else if (response.message?.includes('already signed')) {
        setSignResult('already_signed');
      }
    } catch (error) {
      console.error('Error signing document:', error);
    } finally {
      setIsSigningDoc(false);
    }
  };

  const getFileName = () => `Backcharge-Report-${formData.reportNo}-${formData.equipmentType}`;

  const inputStyle = () => (isEditing ? INLINE_INPUT_STYLE : { ...INLINE_INPUT_STYLE, cursor: 'default' });

  const handleOpenEmailModal = () => {
    if (supplierMail) {
      setEmailFormValues((prev) => ({ ...prev, email: supplierMail }));
    }
    setShowEmailModal(true);
  };

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setEmailFormValues({ email: '', recipientName: '' });
  };

  const handleEmailFormChange = (field, value) => {
    setEmailFormValues((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenSignConfirmModal = () => setShowSignConfirmModal(true);
  const handleCloseSignConfirmModal = () => setShowSignConfirmModal(false);

  const handleCloseActivationModal = () => setShowActivationModal(false);
  const handleCloseNotTrustedModal = () => setShowNotTrustedModal(false);
  const handleCloseUnauthorisedModal = () => setShowUnauthorisedModal(false);

  const handleCloseOverrideModal = () => setShowOverrideModal(false);
  const handleOverrideAndSign = () => {
    setShowOverrideModal(false);
    handleConfirmSign(true);
  };

  return {
    componentRef,
    formData,
    grantTotal,
    documentExists,
    isEditing,
    isLoading,
    saveStatus,
    showEmailModal,
    emailFormValues,
    isSendingEmail,
    signatureFlags,
    signatureStates,
    globalActivation,
    isSigningDoc,
    showOverrideModal,
    showActivationModal,
    showTrustModal,
    showNotTrustedModal,
    showSignConfirmModal,
    showUnauthorisedModal,
    signResult,
    activationKey,
    activationError,
    activationLoading,
    unsignedAboveRoles,
    supplierMail,
    setFormData,
    setActivationKey,
    setActivationError,
    handleInputChange,
    handleTableChange,
    handleEdit,
    handleSaveEdit,
    handleCancelEdit,
    handleDownloadPdf,
    handlePrint,
    handleSendEmail,
    handleSignButtonClick,
    handleConfirmSign,
    handleActivation,
    getFileName,
    inputStyle,
    toDisplayDate,
    toIsoInputDate,
    handleOpenEmailModal,
    handleCloseEmailModal,
    handleEmailFormChange,
    handleOpenSignConfirmModal,
    handleCloseSignConfirmModal,
    handleCloseActivationModal,
    handleCloseNotTrustedModal,
    handleCloseUnauthorisedModal,
    handleCloseOverrideModal,
    handleOverrideAndSign,
  };
};