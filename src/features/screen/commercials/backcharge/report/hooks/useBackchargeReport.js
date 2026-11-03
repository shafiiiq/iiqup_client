import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import useSigningFlow from '@/features/core/messaging/signature/hooks/useSigningFlow';
import useDocumentPdfStatus from '@/features/core/sync/pdf/hooks/useDocumentPdfStatus';
import {
  getBackchargeByRef,
  updateBackcharge,
  sendBackchargeEmail,
  downloadBackchargePdf,
} from '../api/backcharge.report.api';
import { BACKCHARGE_SIGNATURE_SOURCE_KEY, BACKCHARGE_PDF_SOURCE_KEY } from '../constants/backcharge.report.constant';
import {
  normaliseTableRows,
  toDisplayDate,
  toIsoInputDate,
  TABLE_ROW_COUNT,
  BLANK_ROW,
} from '../helper/backcharge.report.helper';

const INLINE_INPUT_STYLE = {
  border: 'none',
  outline: 'none',
  background: 'transparent',
};

const DEFAULT_FORM_DATA = {
  refNo: '',
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

const firstLineText = (field) => {
  if (!field) return '';
  if (typeof field === 'string') return field;
  return field.lines?.[0]?.text ?? field.combinedText ?? '';
};

const lineTextAt = (field, lineNumber) => {
  if (!field || typeof field === 'string') return '';
  return field.lines?.find((line) => line.lineNumber === lineNumber)?.text ?? '';
};

export const useBackchargeReport = () => {
  const { refNo } = useParams();
  const componentRef = useRef();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

  const documentId = refNo ? decodeURIComponent(refNo) : '';
  const signing = useSigningFlow({ sourceKey: BACKCHARGE_SIGNATURE_SOURCE_KEY, documentId });
  const { isPdfReady } = useDocumentPdfStatus({ sourceKey: BACKCHARGE_PDF_SOURCE_KEY, documentId });
  const { loadSignatures } = signing;

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [grantTotal, setGrantTotal] = useState(0);
  const [documentExists, setDocumentExists] = useState(false);
  const [documentId_, setDocumentRecordId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailFormValues, setEmailFormValues] = useState({ email: '', recipientName: '' });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [supplierMail, setSupplierMail] = useState(null);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);
  const [showUploadSuccessModal, setShowUploadSuccessModal] = useState(false);

  useEffect(() => {
    if (refNo) {
      const authStatus = signing.status?.isDeviceActivated ? 'E-Sign Activated' : 'E-Sign Not Activated';
      setHeaderTitle(`Ref No: ${documentId}  •  ${authStatus}`);
      setHeaderSubtitle(`Backcharge Of: ${formData.supplierName}`);
    } else {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    }
    return () => {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    };
  }, [refNo, documentId, formData.supplierName, signing.status?.isDeviceActivated, setHeaderTitle, setHeaderSubtitle]);

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
          tableRows: normaliseTableRows(raw.sparePartsTable || raw.tableRows),
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
        setDocumentRecordId(raw._id);
        setSupplierMail(raw.supplierMail || null);
        await loadSignatures();
      }
    } catch (error) {
      console.error('[BackchargeReport] fetchBackchargeData:', error);
    } finally {
      setIsLoading(false);
    }
  }, [refNo, loadSignatures]);

  useEffect(() => {
    if (refNo) fetchBackchargeData();
  }, [refNo, fetchBackchargeData]);

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
      console.error('[BackchargeReport] updateBackchargeData:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFileName = () => `Backcharge-Report-${formData.refNo}-${formData.equipmentType}`;

  const handleDownloadPdf = async () => {
    try {
      const fileName = `${getFileName()}.pdf`;
      const blob = await downloadBackchargePdf(documentId);

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('[BackchargeReport] handleDownloadPdf:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  const handlePrint = () => window.print();

  const handleSendEmail = async () => {
    const { email } = emailFormValues;
    if (!email) return;

    try {
      setIsSendingEmail(true);
      const pdfBlob = await downloadBackchargePdf(documentId);
      const emailPayload = new FormData();
      emailPayload.append('pdf', pdfBlob, `${getFileName()}.pdf`);
      emailPayload.append('email', email);
      emailPayload.append('recipientName', formData.contactPerson || '');
      emailPayload.append('supplierName', formData.supplierName || '');
      emailPayload.append('equipment', formData.equipmentType || '');
      emailPayload.append('refNo', documentId);

      const response = await sendBackchargeEmail(emailPayload);

      if (response.success) {
        setShowEmailModal(false);
        setEmailFormValues({ email: '', recipientName: '' });
        setFormData((prev) => ({ ...prev, supplierEmailedAt: new Date().toISOString() }));
      }
    } catch (error) {
      console.error('[BackchargeReport] handleSendEmail:', error);
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
      tableRows: prev.tableRows.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row)),
    }));
  };

  const sendToApprove = async () => {
    try {
      setIsSubmittingApproval(true);
      const response = await updateBackcharge(formData._id, { status: 'submitted' });
      if (response.success) {
        setFormData((prev) => ({ ...prev, status: 'submitted' }));
        setShowUploadSuccessModal(true);
      }
    } catch (error) {
      console.error('[BackchargeReport] sendToApprove:', error);
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  const inputStyle = () => (isEditing ? INLINE_INPUT_STYLE : { ...INLINE_INPUT_STYLE, cursor: 'default' });

  const handleOpenEmailModal = () => {
    if (supplierMail) setEmailFormValues((prev) => ({ ...prev, email: supplierMail }));
    setShowEmailModal(true);
  };

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setEmailFormValues({ email: '', recipientName: '' });
  };

  const handleEmailFormChange = (field, value) => {
    setEmailFormValues((prev) => ({ ...prev, [field]: value }));
  };

  return {
    componentRef,
    isPdfReady,
    formData,
    grantTotal,
    documentExists,
    isEditing,
    isLoading,
    saveStatus,
    showEmailModal,
    emailFormValues,
    isSendingEmail,
    signing,
    signatureSlots: signing.signatureSlots,
    isActivationAvailable: signing.isActivationAvailable,
    canRequestFamilyAccess: signing.canRequestFamilyAccess,
    openActivationModal: signing.openActivationModal,
    requestFamilyAccess: signing.requestFamilyAccess,
    isSigningDoc: signing.isSigning,
    handleSignButtonClick: signing.handleSignButtonClick,
    supplierMail,
    isSubmittingApproval,
    showUploadSuccessModal,
    setShowUploadSuccessModal,
    sendToApprove,
    handleInputChange,
    handleTableChange,
    handleEdit: () => setIsEditing(true),
    handleSaveEdit: updateBackchargeData,
    handleCancelEdit: () => setIsEditing(false),
    handleDownloadPdf,
    handlePrint,
    handleSendEmail,
    inputStyle,
    toDisplayDate,
    toIsoInputDate,
    handleOpenEmailModal,
    handleCloseEmailModal,
    handleEmailFormChange,
  };
};