import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import useSigningFlow from '@/features/core/messaging/signature/hooks/useSigningFlow';
import useDocumentPdfStatus from '@/features/core/sync/pdf/hooks/useDocumentPdfStatus';
import {
  getHireOrderByRef,
  sendHireOrderEmail,
  uploadHireOrder,
  downloadHireOrderPdf,
} from '../api/hire.order.report.api';
import {
  buildPdf,
  extractFirstName,
  getFileName,
  parseValidEmails,
  parseEmailInput,
} from '../helper/hire.order.report.helper';
import {
  DEFAULT_COLUMNS,
  DEFAULT_HIRE_ORDER_DATA,
  HIRE_ORDER_SIGNATURE_SOURCE_KEY,
  HIRE_ORDER_PDF_SOURCE_KEY,
} from '../constants/hire.order.report.constant';

export const useHireOrderReport = () => {
  const navigate = useNavigate();
  const componentRef = useRef();
  const { refNo, amendment } = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

  const documentId = refNo ? decodeURIComponent(refNo) : '';
  const signing = useSigningFlow({ sourceKey: HIRE_ORDER_SIGNATURE_SOURCE_KEY, documentId });
  const { isPdfReady } = useDocumentPdfStatus({ sourceKey: HIRE_ORDER_PDF_SOURCE_KEY, documentId });

  const [hireOrderData, setHireOrderData] = useState(DEFAULT_HIRE_ORDER_DATA);
  const [amendmentData, setAmendmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [signResult, setSignResult] = useState(null);
  const [vendorMail, setVendorMail] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailFormValues, setEmailFormValues] = useState({ emails: [''] });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showUploadSuccessModal, setShowUploadSuccessModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isSentForApproval, setIsSentForApproval] = useState(false);
  const [isEmailedToSupplier, setIsEmailedToSupplier] = useState(false);

  useEffect(() => {
    setHeaderTitle('Hire Order Document');
    setHeaderSubtitle(refNo || 'Hire Order');
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [refNo, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    if (refNo) fetchHireOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refNo]);

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
  }, [hireOrderData, signing.signatureSlots]);

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
      setVendorMail(order.vendorMail || null);
      setIsSentForApproval(order.workflowStatus !== 'hire_order_created');
      setIsEmailedToSupplier(Boolean(order.supplierEmailedAt));

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

      await signing.loadSignatures();
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
        const uploadResponse = await uploadHireOrder({
          fileName: `${getFileName(hireOrderData)}.pdf`,
          uploadedBy: 'WORKSHOP_MANAGER',
          hireOrderRef: documentId,
          description: 'Hire order document generated from system',
          isAmendment: hireOrderData.isAmendment || false,
        });

        const uploadResult = await uploadResponse.json();
        if (!uploadResponse.ok || !uploadResult.success) {
          throw new Error(uploadResult.message || 'Upload failed');
        }

        setShowUploadSuccessModal(true);
        setIsSentForApproval(true);
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
      const fileName = `${getFileName(hireOrderData)}.pdf`;

      const blob = await downloadHireOrderPdf(documentId);

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

  const handleCloseEmailModal = () => {
    setShowEmailModal(false);
    setEmailFormValues({ emails: [''] });
  };

  const handleSendEmail = async (extraFiles = []) => {
    const validEmails = parseValidEmails(emailFormValues.emails);
    if (!validEmails.length) { alert('Please enter at least one valid email'); return; }

    setIsSendingEmail(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const pdf = await buildPdf();
      const pdfBlob = pdf.output('blob');

      const formDataToSend = new FormData();
      formDataToSend.append('pdf', pdfBlob, `${getFileName(hireOrderData)}.pdf`);
      formDataToSend.append('emails', JSON.stringify(validEmails));
      formDataToSend.append('recipientName', extractFirstName(hireOrderData.attention));
      formDataToSend.append('vendorName', extractFirstName(hireOrderData.vendor));
      formDataToSend.append('hireOrderRef', documentId);

      extraFiles.forEach((file) => formDataToSend.append('attachments', file));

      const response = await sendHireOrderEmail(formDataToSend);

      if (response.ok) {
        setShowEmailModal(false);
        setEmailFormValues({ emails: [''] });
        setSignResult('email_sent');
        setIsEmailedToSupplier(true);
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

  const handleEmailModalSubmit = () => {
    if (!parseValidEmails(emailFormValues.emails).length) { alert('Please enter at least one valid email'); return; }
    handleSendEmail([]);
  };

  const handleEmailFormChange = (field, value) => {
    setEmailFormValues({ emails: parseEmailInput(value) });
  };

  return {
    componentRef,
    refNo,
    isPdfReady,
    hireOrderData,
    amendmentData,
    loading,
    error,
    signing,
    signatureSlots: signing.signatureSlots,
    isSigningDoc: signing.isSigning,
    isActivationAvailable: signing.isActivationAvailable,
    canRequestFamilyAccess: signing.canRequestFamilyAccess,
    openActivationModal: signing.openActivationModal,
    requestFamilyAccess: signing.requestFamilyAccess,
    handleSignButtonClick: signing.handleSignButtonClick,
    showEmailModal,
    emailFormDisplayValues: { emails: emailFormValues.emails.join(', ') },
    isSendingEmail,
    showUploadSuccessModal,
    showLoadingModal,
    loadingMessage,
    isEmailSentModalOpen: signResult === 'email_sent',
    isSentForApproval,
    isEmailedToSupplier,
    fetchHireOrder,
    sendToApprove,
    handleDownloadPdf,
    handleSendToSupplierClick,
    handleEditClick,
    handleCloseEmailModal,
    handleEmailModalSubmit,
    handleEmailFormChange,
    handleCloseUploadSuccessModal: () => setShowUploadSuccessModal(false),
    handleClearSignResult: () => setSignResult(null),
  };
};

export default useHireOrderReport;