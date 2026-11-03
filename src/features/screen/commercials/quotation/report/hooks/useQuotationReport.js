import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import useSigningFlow from '@/features/core/messaging/signature/hooks/useSigningFlow';
import useDocumentPdfStatus from '@/features/core/sync/pdf/hooks/useDocumentPdfStatus';
import {
  fetchQuotationByRef,
  downloadQuotationPdf,
  submitQuotationPdf,
  emailQuotationPdf,
} from '../api/quotation.report.api';
import {
  DEFAULT_QUOTATION_DATA,
  DEFAULT_COLUMNS,
  QUOTATION_SIGNATURE_SOURCE_KEY,
  QUOTATION_SIGNATURE_SLOT_ID,
  QUOTATION_PDF_SOURCE_KEY,
} from '../constants/quotation.report.constant';
import { buildReportParts, parsePartTokens } from '../helper/quotation.report.parts.helper';

const useQuotationReport = () => {
  const navigate = useNavigate();
  const componentRef = useRef();
  const { quotationRef, amendment, parts } = useParams();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

  const documentId = quotationRef ? decodeURIComponent(quotationRef) : '';
  const signing = useSigningFlow({ sourceKey: QUOTATION_SIGNATURE_SOURCE_KEY, documentId });
  const { isPdfReady } = useDocumentPdfStatus({ sourceKey: QUOTATION_PDF_SOURCE_KEY, documentId });

  const [quotationData, setQuotationData] = useState(DEFAULT_QUOTATION_DATA);
  const [amendmentData, setAmendmentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [vendorMail, setVendorMail] = useState(null);
  const [partsDocs, setPartsDocs] = useState(null);
  const [amendmentCount, setAmendmentCount] = useState(0);
  const [showDownloadPicker, setShowDownloadPicker] = useState(false);
  const [signResult, setSignResult] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailFormValues, setEmailFormValues] = useState({ emails: [''] });
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [showUploadSuccessModal, setShowUploadSuccessModal] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [isSentForApproval, setIsSentForApproval] = useState(false);
  const [isEmailedToSupplier, setIsEmailedToSupplier] = useState(false);

  useEffect(() => {
    setHeaderTitle('Quotation Document');
    setHeaderSubtitle(quotationData.quotationRef || 'Quotation');
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [quotationData.quotationRef, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    if (quotationRef) fetchQuotationData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quotationRef]);

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
      setIsSentForApproval(q.status === 'sent');
      setIsEmailedToSupplier(Boolean(q.supplierEmailedAt));
      setAmendmentCount(q.isAmendmented ? (q.amendments?.length || 0) : 0);
      setPartsDocs(parts ? buildReportParts(q, parsePartTokens(parts, q.amendments?.length || 0)) : null);

      if (q.isAmendmented && q.amendments?.length) {
        const latest = q.amendments[q.amendments.length - 1];
        setAmendmentData({
          ...builtData,
          signatures: latest.amendedSignatures || q.signatures || DEFAULT_QUOTATION_DATA.signatures,
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
          amendmentNumber: q.amendments.length,
        });
      } else {
        setAmendmentData(null);
      }

      await signing.loadSignatures();
    } catch (err) {
      console.error('[QuotationReport] fetchQuotationData error:', err);
      setError(`Failed to load quotation data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getFileName = () => `Quotation-${quotationData.quotationRef}-${quotationData.vendor}`;

  const handleDownloadClick = () => {
    if (amendmentCount > 0) setShowDownloadPicker(true);
    else handleDownloadPdf();
  };

  const handleDownloadPdf = async (selectedTokens) => {
    const tokens = Array.isArray(selectedTokens) ? selectedTokens : [];
    const partsParam = tokens.length ? tokens.join(',') : null;
    const suffix = tokens.length ? `-${tokens.map((t) => (t === 'original' ? 'Original' : `Rev${t}`)).join('-')}` : '';
    setShowDownloadPicker(false);
    setShowLoadingModal(true);
    setLoadingMessage('Generating PDF...');

    try {
      const response = await downloadQuotationPdf(documentId, partsParam);
      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${getFileName()}${suffix}.pdf`;
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
      const response = await submitQuotationPdf(documentId);
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.message || 'Submit failed');
      setShowUploadSuccessModal(true);
      setIsSentForApproval(true);
    } catch (err) {
      console.error('[QuotationReport] sendToApprove error:', err);
      alert(`Submit failed: ${err.message}`);
    }
  };

  const handleEditQuotation = () => {
    const encodedRef = encodeURIComponent(quotationData.quotationRef);
    navigate(amendmentData
      ? `/quotation/form/amendment/edit/${encodedRef}`
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

      const response = await emailQuotationPdf(documentId, formData);

      if (response.ok) {
        setShowEmailModal(false);
        setEmailFormValues({ emails: [''] });
        setSignResult('email_sent');
        setIsEmailedToSupplier(true);
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
    isPdfReady,
    componentRef,
    quotationData,
    amendmentData,
    loading,
    error,
    signing,
    signatureSlot: signing.signatureSlots[QUOTATION_SIGNATURE_SLOT_ID],
    isSigningDoc: signing.isSigning,
    isActivationAvailable: signing.isActivationAvailable,
    canRequestFamilyAccess: signing.canRequestFamilyAccess,
    openActivationModal: signing.openActivationModal,
    requestFamilyAccess: signing.requestFamilyAccess,
    handleSignButtonClick: signing.handleSignButtonClick,
    signResult,
    setSignResult,
    isSentForApproval,
    isEmailedToSupplier,
    showEmailModal,
    emailFormValues,
    isSendingEmail,
    showUploadSuccessModal,
    setShowUploadSuccessModal,
    showLoadingModal,
    loadingMessage,
    fetchQuotationData,
    handleDownloadPdf,
    handleDownloadClick,
    partsDocs,
    amendmentCount,
    showDownloadPicker,
    setShowDownloadPicker,
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