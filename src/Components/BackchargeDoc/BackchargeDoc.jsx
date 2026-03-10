// ─────────────────────────────────────────────────────────────────────────────
// BackchargeDoc.jsx — Maintenance Back Charge Report document viewer / editor.
// Fetches an existing backcharge record by :refNo, renders the printable
// document, and supports:
//   • Inline editing of all fields (toggle via Edit / Save / Cancel)
//   • PDF download via html2canvas + jsPDF
//   • Print via a generated print window with embedded base64 images
//   • Email delivery via FormData POST to the API
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate }       from 'react-router-dom';
import jsPDF                            from 'jspdf';
import html2canvas                      from 'html2canvas';

import logoImage    from '../../assets/images/al-ansari-color.png';
import alAnsariText from '../../assets/images/al-ansari-full-address.png';

import { END_POINT }                             from '../../constants';
import { apiRequest }                            from '../../utils/api';
import { getDeviceFingerprint, getLocationInfo } from '../../utils/deviceFingerprint';
import { useHeaderTitle }                        from '../../Context/HeaderTitleContext';
import Button                                    from '../../Common/Button/Button';
import DevModal                                  from '../../Common/DevModal/DevModal';

import './BackchargeDoc.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Number of spare-parts table rows always shown (padded with blanks). */
const TABLE_ROW_COUNT = 7;

/** Blank spare-parts table row shape. */
const BLANK_ROW = { description: '', qty: '', cost: '', total: '' };

/** Default backcharge form data state. */
const DEFAULT_FORM_DATA = {
  reportNo:                '',
  equipmentType:           '',
  plateNo:                 '',
  model:                   '',
  supplierName:            '',
  contactPerson:           '',
  siteLocation:            '',
  date:                    '',
  scopeOfWork:             '',
  scopeLine2Text:          '',
  workshopComments:        '',
  workSummaryLine2:        '',
  sparePartsCost:          '',
  labourCharges:           '',
  totalCost:               '',
  approvedDeduction:       '',
  authorizedSignatoryName: '',
  authorizedSignatoryMode: 'CEO',
  tableRows:               Array(TABLE_ROW_COUNT).fill(null).map(() => ({ ...BLANK_ROW })),
};

/** Shared Button props applied to every action button in the controls bar. */
const SHARED_BTN = {
  variant:       'gradient',
  font:          'md',
  animation:     '',
  squircle:      '4xl',
  height:        '38px',
  type:          'submit',
  textColor:     'white-200',
  shadowPosition:'to-bottom',
  shadowColor:   'white-600',
};

/** Inline input style applied to every transparent editable field. */
const INLINE_INPUT_STYLE = {
  border:     'none',
  outline:    'none',
  background: 'transparent',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pads or trims a spare-parts table rows array to exactly TABLE_ROW_COUNT rows.
 *
 * @param {Object[]} rows - Raw rows from the API.
 * @returns {Object[]} Exactly TABLE_ROW_COUNT rows.
 */
const normaliseTableRows = (rows = []) => {
  const padded = [
    ...rows,
    ...Array(Math.max(0, TABLE_ROW_COUNT - rows.length)).fill(null).map(() => ({ ...BLANK_ROW })),
  ];
  return padded.slice(0, TABLE_ROW_COUNT);
};

/**
 * Converts an image URL to a base64-encoded PNG data URL.
 * Used to embed images into the print window so they survive cross-origin restrictions.
 *
 * @param {string} url - Image URL.
 * @returns {Promise<string>} Base64 data URL.
 */
const convertImageToBase64 = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });

/**
 * Hides / restores the controls bar around a html2canvas capture.
 * Returns the element so the caller can show it again in finally.
 *
 * @returns {HTMLElement|null} The controls element.
 */
const hideControls = () => {
  const el = document.querySelector('.bcr-controls');
  if (el) el.style.display = 'none';
  return el;
};

const showControls = (el) => {
  if (el) el.style.display = '';
};

/**
 * Captures the document component as a canvas and writes it into a jsPDF
 * instance, fitting the image to A4 while preserving aspect ratio.
 *
 * @param {HTMLElement} element - DOM node to capture.
 * @returns {Promise<jsPDF>} Populated PDF instance.
 */
const buildPdf = async (element) => {
  const canvas = await html2canvas(element, {
    scale:       3,
    useCORS:     true,
    logging:     false,
    allowTaint:  false,
    backgroundColor: '#FFFFFF',
    width:  element.offsetWidth,
    height: element.offsetHeight,
    scrollX: 0,
    scrollY: 0,
    foreignObjectRendering: false,
    letterRendering: true,
    dpi: 300,
    onclone: (clonedDoc) => {
      // Remove controls from the cloned DOM so they don't appear in the PDF.
      clonedDoc.querySelector('.bcr-controls')?.remove();
      // Improve font rendering in the captured image.
      clonedDoc.querySelectorAll('*').forEach((el) => {
        el.style.webkitFontSmoothing = 'antialiased';
        el.style.mozOsxFontSmoothing = 'grayscale';
      });
    },
  });

  const imgData  = canvas.toDataURL('image/png', 1.0);
  const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: false });
  const pdfW     = pdf.internal.pageSize.getWidth();
  const pdfH     = pdf.internal.pageSize.getHeight();
  const imgH     = (canvas.height * pdfW) / canvas.width;

  if (imgH > pdfH) {
    // Image taller than page — scale to fit height and centre horizontally.
    const scaledW = (canvas.width * pdfH) / canvas.height;
    pdf.addImage(imgData, 'PNG', (pdfW - scaledW) / 2, 0, scaledW, pdfH, '', 'FAST');
  } else {
    pdf.addImage(imgData, 'PNG', 0, 0, pdfW, imgH, '', 'FAST');
  }

  return pdf;
};

// ─────────────────────────────────────────────────────────────────────────────
// BackchargeDoc — Main Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * BackchargeDoc — Fetches and renders a Maintenance Back Charge Report.
 * Supports inline editing, PDF export, browser print, and email delivery.
 */
function BackchargeDoc() {
  const { refNo }    = useParams();
  const navigate     = useNavigate();
  const componentRef = useRef();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

  // ── Document state ─────────────────────────────────────────────────────────

  const [formData,       setFormData]       = useState(DEFAULT_FORM_DATA);
  const [grantTotal,     setGrantTotal]     = useState(0);
  const [documentExists, setDocumentExists] = useState(false);
  const [documentId,     setDocumentId]     = useState(null);
  const [isEditing,      setIsEditing]      = useState(false);
  const [isLoading,      setIsLoading]      = useState(false);
  const [saveStatus,     setSaveStatus]     = useState('');  // '' | 'success' | 'error'

  // ── Email modal state ──────────────────────────────────────────────────────

  const [showEmailModal,   setShowEmailModal]   = useState(false);
  const [emailFormValues,  setEmailFormValues]  = useState({ email: '', recipientName: '' });
  const [isSendingEmail,   setIsSendingEmail]   = useState(false);
  const [supplierMail,     setSupplierMail]     = useState(null);

  // ── Signature / activation state ──────────────────────────────────────────

  const [signatureFlags,       setSignatureFlags]       = useState({
    workshopManager:     false,
    purchaseManager:     false,
    operationsManager:   false,
    authorizedSignatory: false,
  });
  const [signatureStates,      setSignatureStates]      = useState({
    workshopManager:     { url: '', loading: false },
    purchaseManager:     { url: '', loading: false },
    operationsManager:   { url: '', loading: false },
    authorizedSignatory: { url: '', loading: false },
  });
  const [deviceInfo,           setDeviceInfo]           = useState(null);
  const [activationKey,        setActivationKey]        = useState('');
  const [activationError,      setActivationError]      = useState('');
  const [activationLoading,    setActivationLoading]    = useState(false);
  const [globalActivation,     setGlobalActivation]     = useState({ isActivated: false, isTrusted: false, checked: false });
  const [isSigningDoc,         setIsSigningDoc]         = useState(false);
  const [showOverrideModal,    setShowOverrideModal]    = useState(false);
   const [unsignedAboveRoles,  setUnsignedAboveRoles]   = useState([]);

  // ── Signature modal visibility ─────────────────────────────────────────────

  const [showActivationModal,  setShowActivationModal]  = useState(false);
  const [showTrustModal,       setShowTrustModal]       = useState(false);
  const [showNotTrustedModal,  setShowNotTrustedModal]  = useState(false);
  const [showSignConfirmModal, setShowSignConfirmModal] = useState(false);
  const [showUnauthorisedModal, setShowUnauthorisedModal] = useState(false);
  const [signResult,           setSignResult]           = useState(null); // 'success' | 'already_signed' | null

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  // ── Effect: Header title / subtitle ───────────────────────────────────────

  useEffect(() => {
    if (refNo) {
      setHeaderTitle(`Ref No: ${refNo}`);
      setHeaderSubtitle(`Backcharge Of: ${formData.supplierName}`);
    } else {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    }
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [refNo, formData.supplierName, setHeaderTitle, setHeaderSubtitle]);

  // ── Effect: Load signature images once device is trusted and flags are known ──

  useEffect(() => {
    if (
      globalActivation.isActivated &&
      globalActivation.isTrusted &&
      deviceInfo &&
      documentExists
    ) {
      loadAllSignatures(signatureFlags);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalActivation.isTrusted, globalActivation.isActivated, deviceInfo, documentExists]);

  // ── Effect: Recalculate grand total whenever table rows change ─────────────

  useEffect(() => {
    const total = formData.tableRows.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0);
    setGrantTotal(total);
  }, [formData.tableRows]);

  // ── Effect: Pre-load header images so html2canvas can capture them ─────────

  useEffect(() => {
    const preload = (src) =>
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload  = resolve;
        img.onerror = reject;
        img.src     = src;
      });

    Promise.all([preload(logoImage), preload(alAnsariText)])
      .catch((err) => console.error('[BackchargeDoc] image preload error:', err));
  }, []);

  // ── Effect: Fetch backcharge document by refNo ────────────────────────────

  useEffect(() => {
    if (!refNo) return;
    fetchBackchargeData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refNo]);

  // ── Effect: Initialise device fingerprint and check activation status ──────

  useEffect(() => {
    const initDeviceInfo = async () => {
      try {
        const fingerprint = getDeviceFingerprint();
        const location    = await getLocationInfo();
        const user        = JSON.parse(localStorage.getItem('user') || '{}');

        const info = {
          userId:            user._id            || '',
          uniqueCode:        fingerprint.uniqueCode,
          deviceFingerprint: fingerprint.uniqueCode,
          ipAddress:         location.ipAddress,
          location:          `${location.city}, ${location.region}, ${location.country}`,
          userAgent:         fingerprint.userAgent,
          browserInfo:       fingerprint.browserInfo,
        };

        setDeviceInfo(info);

        // Check if this device has activated signatures before
        const status = await checkActivationStatus(info);
        setGlobalActivation({ ...status, checked: true });

      } catch (err) {
        console.error('[BackchargeDoc] initDeviceInfo error:', err);
        setGlobalActivation({ isActivated: false, isTrusted: false, checked: true });
      }
    };
    initDeviceInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────────────────

  /** Fetches the backcharge document from the API and populates form state. */
  const fetchBackchargeData = async () => {
    setIsLoading(true);
    try {
      const response = await apiRequest(
        `${END_POINT}/backcharge/get-backcharge-by-ref/${encodeURIComponent(refNo)}`,
        'GET'
      );

      if (!response.ok) {
        setDocumentExists(false);
        alert('Document not found with the provided reference number.');
        return;
      }

      const { data } = await response.json();
      setDocumentExists(true);
      setDocumentId(data._id);
      setSupplierMail(data.supplierMail || null);

            // ── Populate signature flags from document ─────────────────────────────
      const newFlags = {
        workshopManager: data.signatures?.workshopManager?.signed || false,
        purchaseManager: data.signatures?.purchaseManager?.signed || false,
        operationsManager: data.signatures?.operationsManager?.signed || false,
        authorizedSignatory: data.signatures?.authorizedSignatory?.signed || false,
      };
      setSignatureFlags(newFlags);

      // ── Auto-load signature images if device is already trusted ───────────
      if (globalActivation.isActivated && globalActivation.isTrusted && deviceInfo) {
        await loadAllSignatures(newFlags);
      }

      // Helper: extract a specific line from a multi-line text object.
      const getLine = (obj, num) => obj?.lines?.find((l) => l.lineNumber === num)?.text || '';

      setFormData({
        reportNo:                data.reportNo          || '',
        equipmentType:           data.equipmentType     || '',
        plateNo:                 data.plateNo           || '',
        model:                   data.model             || '',
        supplierName:            data.supplierName      || '',
        contactPerson:           data.contactPerson     || '',
        siteLocation:            data.siteLocation      || '',
        date:                    data.date              || '',
        scopeOfWork:             getLine(data.scopeOfWork, 1),
        scopeLine2Text:          getLine(data.scopeOfWork, 2),
        workshopComments:        getLine(data.workshopComments, 1),
        workSummaryLine2:        getLine(data.workshopComments, 2),
        sparePartsCost:          data.costSummary?.sparePartsCost?.toString()    || '',
        labourCharges:           data.costSummary?.labourCharges?.toString()     || '',
        totalCost:               data.costSummary?.totalCost?.toString()         || '',
        approvedDeduction:       data.costSummary?.approvedDeduction?.toString() || '',
        authorizedSignatoryName: data.signatures?.authorizedSignatory?.authorizedSignatoryName || 'Ahammed Kamal',
        authorizedSignatoryMode: data.signatures?.authorizedSignatory?.authorizedSignatoryMode || 'CEO',
        tableRows:               normaliseTableRows(data.sparePartsTable),
      });

    } catch (err) {
      console.error('[BackchargeDoc] fetchBackchargeData error:', err);
      setDocumentExists(false);
      alert('Error loading document. Please try again.');
      navigate('/backcharge-list');
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Save / Update
  // ─────────────────────────────────────────────────────────────────────────

  /** Sends the current form data to the API to update the backcharge record. */
  const updateBackchargeData = async () => {
    if (!documentId) return;

    setIsLoading(true);
    setSaveStatus('');

    try {
      const payload = {
        ...formData,
        tableRows: formData.tableRows.filter((r) => r.description || r.qty || r.cost || r.total),
      };

      const response = await apiRequest(
        `${END_POINT}/backcharge/update-backcharge/${documentId}`,
        'PUT',
        payload
      );

      if (response.ok) {
        setSaveStatus('success');
        setIsEditing(false);
        setTimeout(() => setSaveStatus(''), 3000);
      } else {
        setSaveStatus('error');
        console.error('[BackchargeDoc] updateBackchargeData: API returned error');
      }
    } catch (err) {
      setSaveStatus('error');
      console.error('[BackchargeDoc] updateBackchargeData error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // PDF / Print / Email
  // ─────────────────────────────────────────────────────────────────────────

  /** Generates and downloads the document as a PDF file. */
  const handleDownloadPdf = async () => {
    if (!componentRef.current) {
      console.error('[BackchargeDoc] componentRef not found');
      return;
    }

    const controls = hideControls();
    try {
      await new Promise((r) => setTimeout(r, 200)); // allow repaint
      const pdf = await buildPdf(componentRef.current);
      pdf.save(`${getFileName()}.pdf`);
    } catch (err) {
      console.error('[BackchargeDoc] handleDownloadPdf error:', err);
      alert(`Error generating PDF: ${err.message || 'Unknown error'}`);
    } finally {
      showControls(controls);
    }
  };

  /**
   * Generates a PDF blob, attaches it to a FormData payload, and POSTs it to
   * the email API endpoint.
   */
  const handleSendEmail = async () => {
    const { email } = emailFormValues;
    if (!email || !email.includes('@')) {
      alert('Please enter a valid email');
      return;
    }

    setIsSendingEmail(true);
    const controls = hideControls();

    try {
      await new Promise((r) => setTimeout(r, 200));
      const pdf     = await buildPdf(componentRef.current);
      const pdfBlob = pdf.output('blob');

      const formDataToSend = new FormData();
      formDataToSend.append('pdf', pdfBlob, `${getFileName()}.pdf`);
      const extractName = (str) => str ? str.split('-')[0].trim() : '';
      formDataToSend.append('email', email);
      formDataToSend.append('recipientName', extractName(formData.contactPerson));
      formDataToSend.append('supplierName', extractName(formData.supplierName));
      formDataToSend.append('equipment', `${formData.equipmentType} - ${formData.plateNo}`);
      formDataToSend.append('refNo', refNo);
      
      const response = await apiRequest(
        `${END_POINT}/backcharge/send-via-email`,
        'POST',
        formDataToSend,
        true
      );

      if (response.ok) {
        setShowEmailModal(false);
        setEmailFormValues({ email: '', recipientName: '' });
        alert('Document sent successfully!');
      } else {
        alert('Failed to send email. Please try again.');
      }
    } catch (err) {
      console.error('[BackchargeDoc] handleSendEmail error:', err);
      alert('Error sending email.');
    } finally {
      showControls(controls);
      setIsSendingEmail(false);
    }
  };

    // ─────────────────────────────────────────────────────────────────────────
  // Signature helpers — mirrors LpoDoc activation pattern
  // ─────────────────────────────────────────────────────────────────────────

  /** Backcharge sign types defines */
  const BCR_SIGN_TYPES = ['wm', 'pm', 'manager', 'authorized'];

  /**
   * Checks device activation/trust status for all BCR sign types.
   *
   * @param {Object} info - Device info object.
   * @returns {Promise<{ isActivated: boolean, isTrusted: boolean }>}
   */
  const checkActivationStatus = async (info) => {
    try {
      let allActivated = true;
      let allTrusted = true;

      for (const signType of BCR_SIGN_TYPES) {
        const response = await apiRequest(`${END_POINT}/users/verify-device-trust`, 'POST', { signType, deviceInfo: info });
        const result = await response.json();
        if (!result.data.isActivated) allActivated = false;
        if (!result.data.isTrusted) allTrusted = false;
      }

      return { isActivated: allActivated, isTrusted: allTrusted };
    } catch (err) {
      console.error('[BackchargeDoc] checkActivationStatus error:', err);
      return { isActivated: false, isTrusted: false };
    }
  };

  /**
   * Loads one signature image by fetching its signing key then resolving the S3 URL.
   * Maps BCR role fields to their respective sign key endpoints.
   *
   * @param {string} roleField - One of: workshopManager | purchaseManager | operationsManager | authorizedSignatory
   * @param {Object} flags     - Current signature flags.
   */
  const loadSignatureForRole = async (roleField, flags = signatureFlags) => {
    if (!flags[roleField]) return; // Not signed yet — nothing to load

    // ── Map role field → sign key endpoint ────────────────────────────────
    const endpointMap = {
      workshopManager: 'doc-oauth-wm-sign-key',
      purchaseManager: 'doc-oauth-pm-sign-key',
      operationsManager: 'doc-oauth-manager-sign-key',
      authorizedSignatory: 'doc-oauth-authorized-sign-key',
    };

    const endpoint = endpointMap[roleField];
    if (!endpoint) return;

    setSignatureStates((prev) => ({ ...prev, [roleField]: { ...prev[roleField], loading: true } }));

    try {
      const keyRes = await apiRequest(`${END_POINT}/users/${endpoint}`, 'POST', { deviceInfo });
      if (!keyRes.ok) throw new Error('Failed to get signature key');
      const keyData = await keyRes.json();

      console.log("keyData", keyData);
      const s3Res = await apiRequest(`${END_POINT}/s3/get-pre-signed-url`, 'POST', {
        key: keyData.data.sign_key,
        isLong: false,
        isLpoSign: true,
      });
      if (!s3Res.ok) throw new Error('Failed to get S3 URL');
      const s3Data = await s3Res.json();      

      setSignatureStates((prev) => ({ ...prev, [roleField]: { url: s3Data.dataUrl, loading: false } }));

    } catch (err) {
      console.error(`[BackchargeDoc] loadSignatureForRole(${roleField}) error:`, err);
      setSignatureStates((prev) => ({ ...prev, [roleField]: { url: '', loading: false } }));
    }
  };

  /** Loads all four signature slots in parallel based on current flags. */
  const loadAllSignatures = (flags = signatureFlags) =>
    Promise.all(Object.keys(flags).map((field) => loadSignatureForRole(field, flags)));

  /**
   * Called when "Sign Document" button is clicked.
   * Checks activation → trust → shows confirm modal.
   */
  const handleSignButtonClick = async () => {
    const status = await checkActivationStatus(deviceInfo);

    if (!status.isActivated) { setShowActivationModal(true); return; }
    if (!status.isTrusted) { setShowNotTrustedModal(true); return; }

    // Device is trusted — show confirm modal before committing
    setShowSignConfirmModal(true);
  };

  /**
   * Submits the signature to the backend after user confirms.
   * The server resolves which role is signing via uniqueCode.
   */
  const handleConfirmSign = async (override = false) => {
     if (!deviceInfo) return;

     const user = JSON.parse(localStorage.getItem('user') || '{}');
     if (!user._id) {
       alert('User session not found. Please log in again.');
       return;
     }

     setIsSigningDoc(true);
     setShowSignConfirmModal(false);

     try {
       const response = await apiRequest(
         `${END_POINT}/backcharge/sign/${encodeURIComponent(refNo)}`,
         'POST',
         {
           uniqueCode:     user.uniqueCode,
           signedDate:     new Date().toISOString(),
           signedFrom:     deviceInfo.browserInfo,
           signedIP:       deviceInfo.ipAddress,
           signedDevice:   deviceInfo.userAgent,
           signedLocation: deviceInfo.location,
           override,
         }
       );

       const result = await response.json();

       if (response.status === 403) {
         setShowUnauthorisedModal(true);
         return;
       }

       if (response.status === 409) {
         setSignResult('already_signed');
         return;
       }

       // ── Out-of-order detected — show override prompt ───────────────────
       if (response.status === 202 && result.requireOverride) {
         const roleLabels = {
           WORKSHOP_MANAGER:  'Workshop Manager',
           PURCHASE_MANAGER:  'Purchase Manager',
           MANAGER:           'Operations Manager',
           CEO:               'CEO',
           MANAGING_DIRECTOR: 'Managing Director',
         };
         setUnsignedAboveRoles(result.unsignedAbove.map(r => roleLabels[r] || r));
         setShowOverrideModal(true);
         return;
       }

       if (!response.ok) {
         throw new Error(result.message || 'Signing failed');
       }

       // ── Success: update local flags and reload signatures ──────────────
       const updatedData = result.data;
       const newFlags = {
         workshopManager:     updatedData.signatures?.workshopManager?.signed     || false,
         purchaseManager:     updatedData.signatures?.purchaseManager?.signed     || false,
         operationsManager:   updatedData.signatures?.operationsManager?.signed   || false,
         authorizedSignatory: updatedData.signatures?.authorizedSignatory?.signed || false,
       };

       setSignatureFlags(newFlags);
       setSignResult('success');
       await loadAllSignatures(newFlags);

     } catch (err) {
       console.error('[BackchargeDoc] handleConfirmSign error:', err);
       alert(`Signing failed: ${err.message}`);
     } finally {
       setIsSigningDoc(false);
     }
  };

  /** Submits the 20-digit activation key (same flow as LpoDoc). */
  const handleActivation = async () => {
    if (activationKey.length !== 20) {
      setActivationError('Please enter a valid 20-digit activation key');
      return;
    }

    setActivationLoading(true);
    setActivationError('');

    try {
      for (const signType of BCR_SIGN_TYPES) {
        const response = await apiRequest(
          `${END_POINT}/users/activate-signature`,
          'POST',
          { activationKey, signType, deviceInfo }
        );
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
      console.error('[BackchargeDoc] handleActivation error:', err);
      setActivationError(`${err.message} — refresh and try again`);
    } finally {
      setActivationLoading(false);
    }
  };

  /** Confirms browser trust after activation, then loads all signatures. */
  const confirmBrowserTrust = () => {
    setShowTrustModal(false);
    setGlobalActivation({ isActivated: true, isTrusted: true, checked: true });
    loadAllSignatures();
  };

  /**
   * Opens a browser print window with the document rendered as HTML, using
   * base64-encoded images so they display across all print environments.
   */
  const handlePrint = async () => {
    const controls = hideControls();
    try {
      const [logoBase64, textBase64] = await Promise.all([
        convertImageToBase64(logoImage),
        convertImageToBase64(alAnsariText),
      ]);

      const printWindow = window.open('', '_blank');
      printWindow.document.open();
      printWindow.document.write(buildPrintHtml(logoBase64, textBase64));
      printWindow.document.close();

      printWindow.addEventListener('load', () => {
        setTimeout(() => { printWindow.print(); printWindow.close(); }, 1000);
      });

    } catch (err) {
      console.error('[BackchargeDoc] handlePrint error:', err);
      alert('Error generating print view. Please try again.');
    } finally {
      showControls(controls);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Updates a top-level form field. No-op when not in edit mode.
   *
   * @param {string} field - Field key.
   * @param {string} value - New value.
   */
  const handleInputChange = (field, value) => {
    if (!isEditing) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /**
   * Updates a single cell in the spare-parts table. No-op when not in edit mode.
   *
   * @param {number} index - Row index.
   * @param {string} field - Cell field key.
   * @param {string} value - New value.
   */
  const handleTableChange = (index, field, value) => {
    if (!isEditing) return;
    setFormData((prev) => ({
      ...prev,
      tableRows: prev.tableRows.map((row, i) => i === index ? { ...row, [field]: value } : row),
    }));
  };

  const handleEdit        = () => setIsEditing(true);
  const handleSaveEdit    = () => updateBackchargeData();
  const handleCancelEdit  = () => setIsEditing(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Returns the PDF / print file name based on report number and equipment type.
   *
   * @returns {string} File name without extension.
   */
  const getFileName = () => `Backcharge-Report-${formData.reportNo}-${formData.equipmentType}`;

  /**
   * Builds the inline-input cursor style depending on edit mode.
   *
   * @returns {React.CSSProperties}
   */
  const inputStyle = () => ({ ...INLINE_INPUT_STYLE, cursor: isEditing ? 'text' : 'default' });

  // ─────────────────────────────────────────────────────────────────────────
  // Print HTML builder
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Constructs the full HTML string for the print window, embedding both
   * images as base64 and all current form data values.
   *
   * @param {string} logoBase64 - Base64 logo image.
   * @param {string} textBase64 - Base64 address text image.
   * @returns {string} Full HTML document string.
   */
  const buildPrintHtml = (logoBase64, textBase64) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${getFileName()}</title>
      <style>
        @page { size: A4; margin: 0; }
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
        :root {
          --bcr-primary-color: #1d4ed8;
          --bcr-background-light: #ffffff;
          --bcr-text-light: #1f2937;
          --bcr-border-dark: #000000;
          --bcr-gray-200: #e5e7eb;
        }
        body { margin: 0; padding: 0; background-color: rgb(248,248,248); display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
        .bcr-main-wrapper { font-family: 'Roboto','Arial',sans-serif; background-color: var(--bcr-background-light); color: var(--bcr-text-light); width: 260mm; min-height: 380mm; margin: 0 auto; padding: 3mm 16px 10mm 16px; box-sizing: border-box; font-size: 11pt; line-height: 1.3; box-shadow: 0 0 10px rgba(0,0,0,0.1); overflow: hidden; }
        .bcr-header-section { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; margin-bottom: 0.5rem; }
        .logo-placeholder-l img { max-width: 200px; object-fit: contain; }
        .company-details-b img { width: 22rem; }
        .bcr-document-title { text-align: center; font-weight: bold; font-size: 20px; text-decoration: underline; margin: 0.1rem 0; }
        .bcr-info-grid { display: grid; grid-template-columns: 1fr; gap: 0; border-left: 1px solid #000; }
        .bcr-info-full-row { padding: 0.2rem 0.3rem; }
        .bcr-title-hero { border-right: 1px solid #000; border-bottom: 1px solid #000; border-top: 1px solid #000; padding-bottom: 1rem; }
        .bcr-info-field { display: grid; grid-template-columns: auto auto 1fr; align-items: center; gap: 0.5rem; }
        .bcr-field-label { font-size: 19px; margin-right: 0.4rem; }
        .bcr-field-label-wide { font-size: 19px; width: 160px; }
        .bcr-field-value { font-size: 19px; }
        .bcr-field-value-bold { font-size: 19px; padding-bottom: 2px; display: inline-block; min-width: 150px; border-bottom: 1px solid #000; margin-left: 2rem; }
        .bcr-signature-label { font-size: 19px; margin-left: 3rem; }
        .bcr-scope-section { margin-bottom: 1rem; padding: 0.6rem 0; font-size: 19px; display: flex; flex-direction: column; }
        .bcr-scope-section-sub { font-size: 19px; display: flex; }
        .bcr-scope-label { font-weight: bold; width: 20%; }
        .scope-value { width: 80%; border-bottom: 1px solid #000; padding-bottom: 2px; }
        .bcr-parts-section { margin: 0.3rem 0; border-left: 1px solid #000; }
        .bcr-parts-header { font-weight: bold; text-align: center; padding: 0.2rem; border-top: 1px solid #000; font-size: 19px; }
        .bcr-parts-table { width: 100%; border-collapse: collapse; }
        .bcr-parts-table-header { border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 0.2rem; font-size: 19px; text-align: center; font-weight: bold; }
        .bcr-parts-table-header.sign-border-td-r, .bcr-parts-table-header.sign-border-td-l { border-right: 1px solid #000; border-left: 1px solid #000; }
        .bcr-parts-table-cell { border-bottom: 1px solid #000; padding: 0.2rem; height: 12px; font-size: 0.76rem; text-align: center; font-weight: 600; }
        .bcr-parts-table-cell.sign-border-td-l, .bcr-parts-table-cell.sign-border-td-r { border-left: 1px solid #000; border-right: 1px solid #000; }
        .bcr-parts-table-footer { border-bottom: 1px solid #000; padding: 0.2rem; font-size: 14px; text-align: center; font-weight: 600; }
        .bcr-parts-table-footer.sign-border-td-l { border-left: 1px solid #000; }
        .bcr-parts-table-total-label { text-align: right; font-weight: bold; }
        .bcr-comments-section { margin: 0.3rem 0; border: 1px solid #000; padding: 0.2rem 0.5rem 0.5rem 0.5rem; }
        .bcr-comments-label { font-weight: bold; font-size: 21px; }
        .bcr-comments-text { margin: 0.6rem 0 0 4.5rem; font-size: 19px; border-bottom: 1px solid #000; padding-bottom: 2px; }
        .work-summary-line-2 { margin-top: 0.6rem; font-size: 19px; width: 100%; border-bottom: 1px solid #000; padding-bottom: 2px; }
        .bcr-cost-summary-section { margin: 0.3rem 0; border: 1px solid #000; padding: 0.8rem 0.2rem 0.7rem 0.2rem; }
        .bcr-cost-summary-title { font-weight: bold; margin-bottom: 0.3rem; font-size: 21px; }
        .bcr-cost-summary-content { margin-bottom: 0.3rem; width: 58%; margin-left: auto; }
        .bcr-cost-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.1rem; font-size: 21px; padding-top: 0.4rem; }
        .bcr-cost-value-container { display: flex; align-items: center; min-width: 250px; max-width: 250px; }
        .bcr-currency { margin-right: 1rem; font-weight: 500; }
        .bcr-cost-amount { border-bottom: 1px solid #000; padding-bottom: 1px; font-size: 19px; min-width: 100px; }
        .price-colon { margin-right: 2rem; }
        .bcr-deduction-row { display: flex; justify-content: space-between; align-items: center; margin-top: 0.8rem; font-size: 19px; }
        .bcr-deduction-label { flex: 1; font-weight: bold; font-size: 21px; }
        .bcr-deduction-value-container { display: flex; align-items: center; min-width: 250px; max-width: 250px; font-size: 21px; }
        .bcr-auth-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
        .bcr-auth-header { border: 1px solid #000; padding: 0.2rem; text-align: center; font-size: 19px; font-weight: 600; }
        .bcr-auth-cell { border-left: 1px solid #000; border-bottom: 1px solid #000; padding: 0.2rem; text-align: center; font-size: 19px; font-weight: 600; }
        .bcr-auth-cell.sign-border-td-r { border-right: 1px solid #000; }
        .bcr-auth-signature-space { height: 120px; }
      </style>
    </head>
    <body>
      <div class="bcr-main-wrapper">
        <header class="bcr-header-section">
          <div class="logo-placeholder-l"><img src="${logoBase64}" alt="Company Logo" /></div>
          <div class="company-details-b"><img src="${textBase64}" alt="AL Ansari Transport & Enterprises W.L.L" /></div>
        </header>
        <h1 class="bcr-document-title">MAINTENANCE BACK CHARGE REPORT</h1>
        <div class="bcr-info-grid">
          <div class="bcr-info-full-row"><div class="bcr-info-field"><span class="bcr-field-label">Ref No :</span><span class="bcr-field-value">${refNo}</span></div></div>
          <div class="bcr-title-hero">
            ${[
              ['Report No',       formData.reportNo],
              ['Equipment Type',  formData.equipmentType],
              ['Plate No',        formData.plateNo],
              ['Model',           formData.model],
              ['Supplier Name',   formData.supplierName],
              ['Contact Person',  formData.contactPerson],
              ['Site Location',   formData.siteLocation],
            ].map(([label, value]) => `
              <div class="bcr-info-full-row"><div class="bcr-info-field">
                <span class="bcr-field-label-wide">${label}</span><span>:</span>
                <span class="bcr-field-value-bold">${value}</span>
              </div></div>
            `).join('')}
            <div class="bcr-info-full-row"><div class="bcr-info-field">
              <span class="bcr-field-label-wide">Date</span><span>:</span>
              <span class="bcr-field-value-bold">${formData.date}<span class="bcr-signature-label">Customer Signature &amp; Date :</span></span>
            </div></div>
          </div>
        </div>
        <div class="bcr-scope-section">
          <div class="bcr-scope-section-sub"><span class="bcr-scope-label">Scope of Work :-</span><span class="scope-value">${formData.scopeOfWork}</span></div>
          ${formData.scopeLine2Text ? `<span class="scope-value">${formData.scopeLine2Text}</span>` : ''}
        </div>
        <div class="bcr-parts-section">
          <h3 class="bcr-parts-header">DETAILS OF SPARE PARTS &amp; OTHER MATERIALS USED :</h3>
          <table class="bcr-parts-table">
            <thead><tr>
              <th class="bcr-parts-table-header">SL</th>
              <th class="bcr-parts-table-header sign-border-td-r sign-border-td-l">PART DESCRIPTION</th>
              <th class="bcr-parts-table-header sign-border-td-r">QTY</th>
              <th class="bcr-parts-table-header sign-border-td-r">COST</th>
              <th class="bcr-parts-table-header">TOTAL</th>
            </tr></thead>
            <tbody>
              ${formData.tableRows.map((row, i) => `
                <tr>
                  <td class="bcr-parts-table-cell">${i + 1}</td>
                  <td class="bcr-parts-table-cell sign-border-td-l sign-border-td-r">${row.description}</td>
                  <td class="bcr-parts-table-cell sign-border-td-r">${row.qty}</td>
                  <td class="bcr-parts-table-cell sign-border-td-r">${row.cost}</td>
                  <td class="bcr-parts-table-cell">${row.total}</td>
                </tr>
              `).join('')}
            </tbody>
            <tfoot><tr>
              <td class="bcr-parts-table-footer bcr-parts-table-total-label" colspan="4">TOTAL</td>
              <td class="bcr-parts-table-footer sign-border-td-l"></td>
            </tr></tfoot>
          </table>
        </div>
        <div class="bcr-comments-section">
          <span class="bcr-comments-label">Workshop Manager's Comments/ Work Summary :-</span>
          <div class="bcr-comments-text">${formData.workshopComments}</div>
          ${formData.workSummaryLine2 ? `<div class="work-summary-line-2">${formData.workSummaryLine2}</div>` : ''}
        </div>
        <div class="bcr-cost-summary-section">
          <h3 class="bcr-cost-summary-title">Summary of Costs :</h3>
          <div class="bcr-cost-summary-content">
            ${[
              ['Spare Parts &amp; Materials', formData.sparePartsCost],
              ['Labour Charges',              formData.labourCharges],
              ['Total Cost',                  formData.totalCost],
            ].map(([label, value]) => `
              <div class="bcr-cost-row">
                <span>${label}</span>
                <div class="bcr-cost-value-container">
                  <span class="price-colon">:</span><span class="bcr-currency">QR</span>
                  <span class="bcr-cost-amount">${value}</span>
                </div>
              </div>
            `).join('')}
          </div>
          <div class="bcr-deduction-row">
            <span class="bcr-deduction-label">Approved Cost of Deduction from Supplier :-</span>
            <div class="bcr-deduction-value-container">
              <span class="price-colon">:</span><span class="bcr-currency">QR</span>
              <span class="bcr-cost-amount">${formData.approvedDeduction}</span>
            </div>
          </div>
        </div>
        <table class="bcr-auth-table">
          <thead><tr>
            <th class="bcr-auth-header">Workshop Manager</th>
            <th class="bcr-auth-header">Purchase Manager</th>
            <th class="bcr-auth-header">Operations Manager</th>
            <th class="bcr-auth-header sign-border-td-r">Authorized Signatory</th>
          </tr></thead>
          <tbody>
            <tr>
              <td class="bcr-auth-cell bcr-auth-signature-space"></td>
              <td class="bcr-auth-cell"></td>
              <td class="bcr-auth-cell"></td>
              <td class="bcr-auth-cell sign-border-td-r"></td>
            </tr>
            <tr>
              <td class="bcr-auth-cell">Firoz Khan</td>
              <td class="bcr-auth-cell">Abdul Malik</td>
              <td class="bcr-auth-cell">Suresh Kanth</td>
              <td class="bcr-auth-cell sign-border-td-r">${formData.authorizedSignatoryName || 'Ahammed Kamal'}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;

  // ─────────────────────────────────────────────────────────────────────────
  // Loading / Not-found states
  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading && !documentExists) {
    return (
      <div className="bcr-hero-wrapper">
        <div className="bcr-controls"><p>Loading document...</p></div>
      </div>
    );
  }

  if (!documentExists) {
    return (
      <div className="bcr-hero-wrapper">
        <div className="bcr-controls">
          <p>Document not found</p>
          <button onClick={() => navigate('/backcharge-list')}>Back to List</button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="bcr-hero-wrapper">

      {/* ── Controls toolbar ── */}
      <div className="bcr-controls">
        {saveStatus && (
          <div className={`bcr-save-status ${saveStatus}`}>
            {saveStatus === 'success' ? '✓ Updated successfully!' : '✗ Update failed!'}
          </div>
        )}

        <div className="bcr-button-group">
          {!isEditing ? (
            <>
              {/* ── View mode buttons ── */}
              <div className="bcr-btn-left">
                <Button {...SHARED_BTN} text="Edit"             onClick={handleEdit}                    colorScheme="lime-700"   width="160px" />
                <Button {...SHARED_BTN} text="Download as PDF"  onClick={handleDownloadPdf}             colorScheme="violet-700" width="160px" />
                <Button {...SHARED_BTN} text="Send to client"   onClick={() => {if (supplierMail) {setEmailFormValues(prev => ({ ...prev, email: supplierMail }));}setShowEmailModal(true);}} colorScheme="rose-700"   width="160px" />
              </div>
              <div className="bcr-btn-right">
                <Button {...SHARED_BTN} text={isSigningDoc ? 'Signing...' : 'Sign Document'} onClick={handleSignButtonClick} colorScheme="indigo-700" width="160px" disabled={isSigningDoc} />
                <Button {...SHARED_BTN} text="Print"            onClick={handlePrint}                    colorScheme="amber-700" width="160px" />
              </div>
            </>
          ) : (
            <>
              {/* ── Edit mode buttons ── */}
              <Button {...SHARED_BTN} text={isLoading ? 'Saving...' : 'Save Changes'}  onClick={handleSaveEdit}    colorScheme="lime-700"  width="160px" disabled={isLoading}/>
              <Button {...SHARED_BTN} text="Cancel"                                    onClick={handleCancelEdit}  colorScheme="amber-800"  width="160px" />
            </>
          )}
        </div>
      </div>

      {/* ── Document body (captured by html2canvas) ── */}
      <div ref={componentRef} className="bcr-main-wrapper">
        <div className="bcr-container">
          <div className="bcr-report-border">

            {/* ── Document header: logos ── */}
            <header className="bcr-header-section">
              <div className="bcr-logo-container">
                <div className="logo-placeholder-l">
                  <img src={logoImage} alt="Company Logo" />
                </div>
              </div>
              <div className="company-details-b company-details-l">
                <img src={alAnsariText} alt="AL Ansari Transport & Enterprises W.L.L" />
              </div>
            </header>

            <h1 className="bcr-document-title">MAINTENANCE BACK CHARGE REPORT</h1>

            {/* ── Info grid: ref no + all detail fields ── */}
            <div className="bcr-info-grid sign-border-td-l">
              <div className="bcr-info-full-row">
                <div className="bcr-info-field">
                  <span className="bcr-field-label">Ref No  :</span>
                  <span className="bcr-field-value">{refNo}</span>
                </div>
              </div>

              <div className="sign-border-td-r sign-border-td-b sign-border-td-t bcr-title-hero">
                {/* Render each text field as a labelled inline input row */}
                {[
                  ['reportNo',      'Report No'],
                  ['equipmentType', 'Equipment Type'],
                  ['plateNo',       'Plate No'],
                  ['model',         'Model'],
                  ['supplierName',  'Supplier Name'],
                  ['contactPerson', 'Contact Person'],
                  ['siteLocation',  'Site Location'],
                ].map(([field, label]) => (
                  <div key={field} className="bcr-info-full-row">
                    <div className="bcr-info-field">
                      <span className="bcr-field-label-wide">{label}</span>
                      <span>:</span>
                      <input
                        type="text"
                        value={formData[field]}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        disabled={!isEditing}
                        className="bcr-field-value-bold text-data-underline mr-l-2"
                        style={inputStyle()}
                      />
                    </div>
                  </div>
                ))}

                {/* Date field with customer signature label */}
                <div className="bcr-info-full-row">
                  <div className="bcr-info-field">
                    <span className="bcr-field-label-wide">Date</span>
                    <span>:</span>
                    <span className="bcr-field-value-bold text-data-underline mr-l-2">
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        disabled={!isEditing}
                        style={inputStyle()}
                      />
                      <span className="bcr-signature-label">Customer Signature &amp; Date : </span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Scope of work (two lines) ── */}
            <div className="bcr-scope-section">
              <div className="bcr-scope-section-sub">
                <span className="bcr-scope-label">Scope of Work :-</span>
                <input type="text" value={formData.scopeOfWork}
                  onChange={(e) => handleInputChange('scopeOfWork', e.target.value)}
                  disabled={!isEditing}
                  className="text-data-underline scope-value scope-line-1"
                  style={inputStyle()}
                />
              </div>
              <input type="text" value={formData.scopeLine2Text || ''}
                onChange={(e) => handleInputChange('scopeLine2Text', e.target.value)}
                disabled={!isEditing}
                className="text-data-underline scope-value-couple scope-line-2"
                style={inputStyle()}
              />
            </div>

            {/* ── Spare parts table ── */}
            <div className="bcr-parts-section sign-border-td-l">
              <h3 className="bcr-parts-header">DETAILS OF SPARE PARTS &amp; OTHER MATERIALS USED :</h3>
              <table className="bcr-parts-table">
                <thead>
                  <tr className="bcr-parts-table-header-row">
                    <th className="bcr-parts-table-header bcr-parts-table-sl">SL</th>
                    <th className="bcr-parts-table-header bcr-parts-table-desc-header sign-border-td-r sign-border-td-l">PART DESCRIPTION</th>
                    <th className="bcr-parts-table-header bcr-parts-table-qty sign-border-td-r">QTY</th>
                    <th className="bcr-parts-table-header bcr-parts-table-cost sign-border-td-r">COST</th>
                    <th className="bcr-parts-table-header bcr-parts-table-total">TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.tableRows.map((row, index) => (
                    <tr key={index}>
                      <td className="bcr-parts-table-cell bcr-parts-table-center">{index + 1}</td>
                      <td className="bcr-parts-table-cell bcr-parts-table-desc sign-border-td-l sign-border-td-r">
                        <input type="text" value={row.description}
                          onChange={(e) => handleTableChange(index, 'description', e.target.value)}
                          disabled={!isEditing} style={{ ...inputStyle(), width: '100%', padding: 0 }}
                        />
                      </td>
                      <td className="bcr-parts-table-cell sign-border-td-r">
                        <input type="text" value={row.qty}
                          onChange={(e) => handleTableChange(index, 'qty', e.target.value)}
                          disabled={!isEditing} style={{ ...inputStyle(), width: '100%', padding: 0, textAlign: 'center' }}
                        />
                      </td>
                      <td className="bcr-parts-table-cell sign-border-td-r">
                        <input type="text" value={row.cost}
                          onChange={(e) => handleTableChange(index, 'cost', e.target.value)}
                          disabled={!isEditing} style={{ ...inputStyle(), width: '100%', padding: 0, textAlign: 'center' }}
                        />
                      </td>
                      <td className="bcr-parts-table-cell">
                        <input type="text" value={row.total}
                          onChange={(e) => handleTableChange(index, 'total', e.target.value)}
                          disabled={!isEditing} style={{ ...inputStyle(), width: '100%', padding: 0, textAlign: 'center' }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="bcr-parts-table-footer bcr-parts-table-total-label" colSpan="4">TOTAL</td>
                    <td className="bcr-parts-table-footer sign-border-td-l text-center">{grantTotal}.00</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* ── Workshop comments / work summary ── */}
            <div className="bcr-comments-section">
              <span className="bcr-comments-label">Workshop Manager's Comments/ Work Summary :-</span>
              <input type="text" value={formData.workshopComments}
                onChange={(e) => handleInputChange('workshopComments', e.target.value)}
                disabled={!isEditing}
                className="bcr-comments-text text-data-underline work-summary-line-1"
                style={{ ...inputStyle(), width: 'calc(100% - 4.5rem)' }}
              />
              <input type="text" value={formData.workSummaryLine2}
                onChange={(e) => handleInputChange('workSummaryLine2', e.target.value)}
                disabled={!isEditing}
                className="work-summary-line-2 text-data-underline"
                style={inputStyle()}
              />
            </div>

            {/* ── Cost summary ── */}
            <div className="bcr-cost-summary-section">
              <h3 className="bcr-cost-summary-title">Summary of Costs :</h3>
              <div className="bcr-cost-summary-content">
                {[
                  ['sparePartsCost', 'Spare Parts & Materials'],
                  ['labourCharges',  'Labour Charges'],
                  ['totalCost',      'Total Cost'],
                ].map(([field, label]) => (
                  <div key={field} className="bcr-cost-row">
                    <span className="bcr-cost-label">{label}</span>
                    <div className="bcr-cost-value-container">
                      <span className="price-colon">:</span>
                      <span className="bcr-currency">QR</span>
                      <input type="text" value={isEditing ? formData[field] : (formData[field] ? `${formData[field]}.00` : '')}
                        onChange={(e) => handleInputChange(field, e.target.value)}
                        disabled={!isEditing}
                        className="bcr-cost-amount"
                        style={inputStyle()}
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bcr-deduction-row">
                <span className="bcr-deduction-label">Approved Cost of Deduction from Supplier :-</span>
                <div className="bcr-deduction-value-container">
                  <span className="price-colon">:</span>
                  <span className="bcr-currency">QR</span>
                  <input type="text" value={isEditing ? formData.approvedDeduction : (formData.approvedDeduction ? `${formData.approvedDeduction}.00` : '')}
                    onChange={(e) => handleInputChange('approvedDeduction', e.target.value)}
                    disabled={!isEditing}
                    className="bcr-cost-amount"
                    style={inputStyle()}
                  />
                </div>
              </div>
            </div>

            {/* ── Authorization signatures table ── */}
            <div className="bcr-auth-section">
              <table className="bcr-auth-table">
                <thead>
                  <tr className="bcr-auth-header-row">
                    <th className="bcr-auth-header">Workshop Manager</th>
                    <th className="bcr-auth-header">Purchase Manager</th>
                    <th className="bcr-auth-header">Operations Manager</th>
                    <th className="bcr-auth-header sign-border-td-r">Authorized Signatory</th>
                  </tr>
                </thead>
                <tbody>
                <tr>
                    {[
                      ['workshopManager',     'bcr-auth-cell bcr-auth-signature-space'],
                      ['purchaseManager',     'bcr-auth-cell'],
                      ['operationsManager',   'bcr-auth-cell'],
                      ['authorizedSignatory', 'bcr-auth-cell sign-border-td-r'],
                    ].map(([field, className]) => (
                      <td key={field} className={className}>
                        {signatureFlags[field] && signatureStates[field]?.url ? (
                          <img
                            src={signatureStates[field].url}
                            alt={`${field} signature`}
                            crossOrigin="anonymous"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : null}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="bcr-auth-cell bcr-auth-name sign-border-td-b">Firoz Khan</td>
                    <td className="bcr-auth-cell bcr-auth-name sign-border-td-b">Abdul Malik</td>
                    <td className="bcr-auth-cell bcr-auth-name sign-border-td-b">Suresh Kanth</td>
                    <td className="bcr-auth-cell bcr-auth-name sign-border-td-r sign-border-td-b">
                      {isEditing ? (
                        <span
                          className="toggle-field"
                          style={{ cursor: 'pointer' }}
                          onClick={() =>
                            setFormData((prev) => ({
                              ...prev,
                              authorizedSignatoryMode: prev.authorizedSignatoryMode === 'CEO' ? 'MANAGING DIRECTOR' : 'CEO',
                              authorizedSignatoryName: prev.authorizedSignatoryMode === 'CEO' ? 'Mohammed Shaheen' : 'Ahammed Kamal',
                            }))
                          }
                        >
                          {formData.authorizedSignatoryName || 'Ahammed Kamal'}
                        </span>
                      ) : (
                        formData.authorizedSignatoryName || 'Ahammed Kamal'
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── Email modal: confirm existing OR enter new email ── */}
      <DevModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setEmailFormValues({ email: '', recipientName: '' });
        }}
        type="form"
        title={supplierMail ? 'Confirm Email' : 'Send to Client'}
        message={
          supplierMail
            ? `Sending to saved email. You can change it if needed.`
            : "Enter the client's email address"
        }
        buttonText={isSendingEmail ? 'Sending...' : 'Send'}
        onButtonClick={handleSendEmail}
        secondaryButtonText="Cancel"
        onSecondaryClick={() => {
          setShowEmailModal(false);
          setEmailFormValues({ email: '', recipientName: '' });
        }}
        formFields={[
          {
            name: 'email',
            label: supplierMail ? `Saved Email (tap to edit)` : 'Client Email',
            type: 'email',
            placeholder: 'client@example.com',
            required: true,
          },
        ]}
        formValues={emailFormValues}
        onFormChange={(field, value) => setEmailFormValues((prev) => ({ ...prev, [field]: value }))}
      />

            {/* ── Activation modal ── */}
      <DevModal
        isOpen={showActivationModal}
        onClose={() => setShowActivationModal(false)}
        type="activation"
        title="Activate Signatures"
        message="Enter your 20-digit activation key"
        showInput
        useCellInput
        cellCount={20}
        inputValue={activationKey}
        onInputChange={setActivationKey}
        inputError={activationError}
        deviceInfo={deviceInfo}
        buttonText={activationLoading ? 'Activating...' : 'Activate'}
        onButtonClick={handleActivation}
        preventClose={activationLoading}
      />

      {/* ── Trust confirmation modal ── */}
      <DevModal
        isOpen={showTrustModal}
        onClose={() => { }}
        type="success"
        title="Key Activated"
        message="Your activation key is confirmed. Click below to trust this browser and load signatures."
        buttonText="Trust this browser"
        onButtonClick={confirmBrowserTrust}
        preventClose
      />

      {/* ── Device not trusted modal ── */}
      <DevModal
        isOpen={showNotTrustedModal}
        onClose={() => setShowNotTrustedModal(false)}
        type="warning"
        title="Device Not Trusted"
        message="This device is activated but not yet trusted. Contact your system administrator."
        buttonText="Close"
        onButtonClick={() => setShowNotTrustedModal(false)}
      />

      {/* ── Sign confirmation modal ── */}
      <DevModal
        isOpen={showSignConfirmModal}
        onClose={() => setShowSignConfirmModal(false)}
        type="warning"
        title="Confirm Signature"
        message="You are about to sign this backcharge document. This action cannot be undone."
        buttonText="Confirm & Sign"
        onButtonClick={handleConfirmSign}
        secondaryButtonText="Cancel"
        onSecondaryClick={() => setShowSignConfirmModal(false)}
      />

      {/* ── Unauthorised signatory modal ── */}
      <DevModal
        isOpen={showUnauthorisedModal}
        onClose={() => setShowUnauthorisedModal(false)}
        type="unauthorized"
        title="Not Authorised"
        message="Your device is not registered as an authorised signatory for backcharge documents."
        unauthorizedReason="Your unique device code does not match any of the four authorised signatories."
        buttonText="Close"
        onButtonClick={() => setShowUnauthorisedModal(false)}
      />

      {/* ── Already signed modal ── */}
      <DevModal
        isOpen={signResult === 'already_signed'}
        onClose={() => setSignResult(null)}
        type="warning"
        title="Already Signed"
        message="This signature position has already been signed on this document."
        buttonText="OK"
        onButtonClick={() => setSignResult(null)}
      />

      {/* ── Override modal — out-of-order signing ── */}
      <DevModal
        isOpen={showOverrideModal}
        onClose={() => setShowOverrideModal(false)}
        type="warning"
        title="Signatures Pending"
        message={`The following signatories have not yet signed:\n\n${unsignedAboveRoles.join(', ')}\n\nYou can wait or override and sign now. If you override, office will be notified.`}
        buttonText="Override & Sign"
        onButtonClick={() => { setShowOverrideModal(false); handleConfirmSign(true); }}
        secondaryButtonText="Wait"
        onSecondaryClick={() => setShowOverrideModal(false)}
      />

      {/* ── Sign success modal ── */}
      <DevModal
        isOpen={signResult === 'success'}
        onClose={() => setSignResult(null)}
        type="success"
        title="Document Signed"
        message="Your signature has been recorded successfully."
        buttonText="OK"
        onButtonClick={() => setSignResult(null)}
        autoClose
        autoCloseDelay={3000}
      />
    </div>
  );
}

export default BackchargeDoc;