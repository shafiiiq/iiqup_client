import React, { useState, useRef, useEffect } from 'react';
import './LpoDoc.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logoImage from '../../assets/images/al-ansari-color.png';
import alAnsariText from '../../assets/images/al-ansari-full-address.png';
import footer from '../../assets/images/footer.png';
import { useParams } from 'react-router-dom';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';
import { getDeviceFingerprint, getLocationInfo } from '../../utils/deviceFingerprint';
import DevModal from '../../common/DevModal';

const LpoDoc = () => {
  const params = useParams();
  const refNo = params.lpoRef;
  const complaintId = params.complaintId;

  const [lpoCounter, setLpoCounter] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [lpoData, setLpoData] = useState({
    vendor: '',
    equipments: [],
    date: '',
    lpoRef: '',
    jobCode: '',
    quoteNo: '',
    attention: '',
    designation: '',
    requestText: '',
    workingHrs: '',
    runningKm: '',
    items: [],
    totalAmount: 0,
    totalDiscountAmount: null,
    termsAndConditions: [
      'Terms & Conditions',
      'Payment will be made within 90 days from the day of submission of invoice'
    ],
    signatures: {
      accountsDept: 'ROSHAN SHA',
      purchasingManager: 'ABDUL MALIK',
      operationsManager: 'SURESHKANTH',
      authorizedSignatory: 'AHAMMED KAMAL'
    }
  });

  const [globalActivation, setGlobalActivation] = useState({
    isActivated: false,
    isTrusted: false,
    checked: false
  });

  const [signatureFlags, setSignatureFlags] = useState({
    pmSigned: false,
    accountsSigned: false,
    managerSigned: false,
    ceoSigned: false
  });

  const [signatureStates, setSignatureStates] = useState({
    accounts: { url: '', loading: false },
    pm: { url: '', loading: false },
    manager: { url: '', loading: false },
    authorized: { url: '', loading: false },
    seal: { url: '', loading: false }
  });

  const [activationModal, setActivationModal] = useState({
    show: false,
    step: 1 // 1: activation key, 2: confirmation
  });

  // Timer states for each signature
  const [timers, setTimers] = useState({
    accounts: 0,
    pm: 0,
    manager: 0,
    authorized: 0,
    seal: 0
  });

  const componentRef = useRef();

  const [activationKey, setActivationKey] = useState('');
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [activationError, setActivationError] = useState('');
  const [activationLoading, setActivationLoading] = useState(false);

  const [showActivationModal, setShowActivationModal] = useState(false);
  const [showTrustModal, setShowTrustModal] = useState(false);
  const [showNotTrustedModal, setShowNotTrustedModal] = useState(false);


  // Add useEffect for device info on mount
  useEffect(() => {
    // In initializeDeviceInfo useEffect
    const initializeDeviceInfo = async () => {
      try {
        const fingerprint = getDeviceFingerprint();
        const location = await getLocationInfo();
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const userId = user._id;

        if (!userId) {
          console.warn('User ID not found in localStorage');
          setGlobalActivation({ isActivated: false, isTrusted: false, checked: true });
          return;
        }

        const info = {
          userId: userId,
          deviceFingerprint: fingerprint.uniqueCode,
          ipAddress: location.ipAddress,
          location: `${location.city}, ${location.region}, ${location.country}`,
          userAgent: fingerprint.userAgent,
          browserInfo: fingerprint.browserInfo
        };

        setDeviceInfo(info);

        const status = await checkSignatureActivationWithInfo(info);
        setGlobalActivation({
          isActivated: status.isActivated,
          isTrusted: status.isTrusted,
          checked: true
        });

        // This part is missing - you need to get the flags from the API response!
        // Add this to your fetchLpoData or get it here

      } catch (error) {
        console.error('Failed to initialize device info:', error);
        setGlobalActivation({ isActivated: false, isTrusted: false, checked: true });
      }
    };

    initializeDeviceInfo();
  }, []);

  // New function: Check activation with provided deviceInfo (doesn't rely on state)
  const checkSignatureActivationWithInfo = async (info) => {
    if (!info) {
      return { isActivated: false, isTrusted: false };
    }

    try {
      const signTypes = ['accounts', 'pm', 'manager', 'authorized', 'seal'];
      let allActivated = true;
      let allTrusted = true;

      // Check all 5 types
      for (const signType of signTypes) {
        const response = await apiRequest(
          `${END_POINT}/users/verify-device-trust`,
          'POST',
          { signType: signType, deviceInfo: info }
        );

        const result = await response.json();

        if (!result.data.isActivated) {
          allActivated = false;
        }
        if (!result.data.isTrusted) {
          allTrusted = false;
        }
      }

      return {
        isActivated: allActivated,
        isTrusted: allTrusted
      };
    } catch (error) {
      console.error('Error checking activation:', error);
      return { isActivated: false, isTrusted: false };
    }
  };

  // New function: Load signature with provided deviceInfo (doesn't rely on state)
  // Modified function signature - add flags parameter
  const loadSignatureWithInfo = async (signType, info, flags) => {
    // Use the passed flags instead of signatureFlags state
    const shouldLoad = {
      'accounts': flags.accountsSigned,
      'pm': flags.pmSigned,
      'manager': flags.managerSigned,
      'authorized': flags.ceoSigned,
      'seal': flags.ceoSigned
    };

    if (!shouldLoad[signType]) {
      return; // Skip loading if flag is false
    }

    setSignatureStates(prev => ({
      ...prev,
      [signType]: { ...prev[signType], loading: true }
    }));

    try {
      const keyResponse = await apiRequest(
        `${END_POINT}/users/doc-0auth-${signType}-sign-key`,
        'POST',
        { deviceInfo: info }
      );

      if (!keyResponse.ok) {
        throw new Error('Failed to get signature key');
      }

      const keyData = await keyResponse.json();

      const s3Response = await apiRequest(
        `${END_POINT}/s3Config/get-pre-signed-url`,
        'POST',
        { key: keyData.data.sign_key, isLong: false, isLpoSign: true }
      );

      if (!s3Response.ok) {
        throw new Error('Failed to get signature URL');
      }

      const s3Data = await s3Response.json();

      setSignatureStates(prev => ({
        ...prev,
        [signType]: {
          url: s3Data.dataUrl,
          loading: false
        }
      }));

    } catch (error) {
      console.error(`Error loading ${signType} signature:`, error);
      setSignatureStates(prev => ({
        ...prev,
        [signType]: { url: '', loading: false }
      }));
    }
  };

  // New function: Check if signature is activated
  const checkSignatureActivation = async () => {
    if (!deviceInfo) {
      return { isActivated: false, isTrusted: false };
    }

    try {
      const signTypes = ['accounts', 'pm', 'manager', 'authorized', 'seal'];
      let allActivated = true;
      let allTrusted = true;

      // Check all 5 types
      for (const signType of signTypes) {
        const response = await apiRequest(
          `${END_POINT}/users/verify-device-trust`,
          'POST',
          { signType: signType, deviceInfo }
        );

        const result = await response.json();

        if (!result.data.isActivated) {
          allActivated = false;
        }
        if (!result.data.isTrusted) {
          allTrusted = false;
        }
      }

      return {
        isActivated: allActivated,
        isTrusted: allTrusted
      };
    } catch (error) {
      console.error('Error checking activation:', error);
      return { isActivated: false, isTrusted: false };
    }
  };


  const handleLoadAllSignatures = async () => {
    const status = await checkSignatureActivation();

    if (!status.isActivated) {
      setShowActivationModal(true);
      return;
    }

    if (!status.isTrusted) {
      setShowNotTrustedModal(true);
      return;
    }

    // Load all signatures
    loadSignature('accounts');
    loadSignature('pm');
    loadSignature('manager');
    loadSignature('authorized');
    loadSignature('seal');
  };


  // New function: Open activation modal
  const openActivationModal = () => {
    setActivationModal({
      show: true,
      step: 1
    });
    setActivationKey('');
    setActivationError('');
  };

  // New function: Handle activation
  const handleActivation = async () => {
    if (activationKey.length !== 20) {
      setActivationError('Please enter a valid 20-digit activation key');
      return;
    }

    setActivationLoading(true);
    setActivationError('');

    try {
      const signTypes = ['accounts', 'pm', 'manager', 'authorized', 'seal'];

      for (const signType of signTypes) {
        const response = await apiRequest(
          `${END_POINT}/users/activate-signature`,
          'POST',
          {
            activationKey,
            signType: signType,
            deviceInfo
          }
        );

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `Failed to activate ${signType}`);
        }
      }

      // Close activation modal and show trust modal
      setShowActivationModal(false);
      setActivationLoading(false);
      setActivationKey('');
      setActivationError('');
      setShowTrustModal(true);

    } catch (error) {
      console.error('Activation error:', error);
      setActivationError(`${error.message}, failed attempt, refresh and try again`);
      setActivationLoading(false);
    }
  };

  // New function: Confirm browser trust
  const confirmBrowserTrust = () => {
    setShowTrustModal(false);
    setGlobalActivation({
      isActivated: true,
      isTrusted: true,
      checked: true
    });

    // Use current signatureFlags state (it should be updated by now)
    loadSignature('accounts');
    loadSignature('pm');
    loadSignature('manager');
    loadSignature('authorized');
    loadSignature('seal');
  };

  //Load signature
  const loadSignature = async (signType) => {
    const shouldLoad = {
      'accounts': signatureFlags.accountsSigned,
      'pm': signatureFlags.pmSigned,
      'manager': signatureFlags.managerSigned,
      'authorized': signatureFlags.ceoSigned,
      'seal': signatureFlags.ceoSigned
    };

    if (!shouldLoad[signType]) {
      return;
    }

    setSignatureStates(prev => ({
      ...prev,
      [signType]: { ...prev[signType], loading: true }
    }));

    try {
      const keyResponse = await apiRequest(
        `${END_POINT}/users/doc-0auth-${signType}-sign-key`,
        'POST',
        { deviceInfo }
      );

      if (!keyResponse.ok) {
        throw new Error('Failed to get signature key');
      }

      const keyData = await keyResponse.json();

      const s3Response = await apiRequest(
        `${END_POINT}/s3Config/get-pre-signed-url`,
        'POST',
        { key: keyData.data.sign_key, isLong: false, isLpoSign: true }
      );

      if (!s3Response.ok) {
        throw new Error('Failed to get signature URL');
      }

      const s3Data = await s3Response.json();

      setSignatureStates(prev => ({
        ...prev,
        [signType]: {
          url: s3Data.dataUrl,
          loading: false
        }
      }));

    } catch (error) {
      console.error(`Error loading ${signType} signature:`, error);
      alert(`Failed to load signature: ${error.message}`);
      setSignatureStates(prev => ({
        ...prev,
        [signType]: { url: '', loading: false }
      }));
    }
  };

  // Fetch LPO data from API
  useEffect(() => {
    // Only fetch when we have checked activation status and have device info
    if (refNo && globalActivation.checked && deviceInfo) {
      fetchLpoData();
    }
  }, [refNo, globalActivation.checked, deviceInfo]);

  // Check image loading status
  useEffect(() => {
    if (!componentRef.current) return;

    const checkImages = () => {
      const images = componentRef.current.querySelectorAll('img');
      if (images.length === 0) {
        setImagesLoaded(true);
        return;
      }

      let loadedCount = 0;
      const totalImages = images.length;

      const checkAllLoaded = () => {
        loadedCount++;
        if (loadedCount === totalImages) {
          setImagesLoaded(true);
        }
      };

      images.forEach(img => {
        if (img.complete && img.naturalHeight !== 0) {
          checkAllLoaded();
        } else {
          img.addEventListener('load', checkAllLoaded);
          img.addEventListener('error', checkAllLoaded);
        }
      });
    };

    // Delay check to ensure signature images are in DOM
    const timeoutId = setTimeout(checkImages, 500);

    return () => clearTimeout(timeoutId);
  }, [lpoData, signatureStates]);

  const fetchLpoData = async () => {
    try {
      setLoading(true);
      setError(null);
      setImagesLoaded(false);

      if (!refNo) {
        throw new Error('No LPO reference number provided in URL');
      }

      const decodedRefNo = decodeURIComponent(refNo);
      const apiUrl = `${END_POINT}/lpo/get-lpo-by-ref/${decodedRefNo}`;

      const response = await apiRequest(apiUrl, 'GET');


      const contentType = response.headers.get('content-type');

      if (!response.ok) {
        const errorText = await response.text();
        if (contentType && contentType.includes('text/html')) {
          throw new Error(`API endpoint not found (${response.status}). Check your backend server and route.`);
        } else {
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
      }

      if (!contentType || !contentType.includes('application/json')) {
        const responseText = await response.text();
        console.error("Non-JSON response:", responseText);
        throw new Error('API returned non-JSON response. Check your backend endpoint.');
      }

      const data = await response.json();

      if (data.success && data.data) {
        const lpo = data.data;

        const complaint = await apiRequest(`${END_POINT}/complaints/get-complaints/${lpo.complaintId}`, 'GET');

        let jobCode = null
        if (complaint) {
          jobCode = complaint.complaintId
        }

        // Create flags object first
        const flags = {
          pmSigned: lpo.pmSigned || false,
          accountsSigned: lpo.accountsSigned || false,
          managerSigned: lpo.managerSigned || false,
          ceoSigned: lpo.ceoSigned || false
        };

        console.log(lpo.pmSigned);
        console.log(lpo.accountsSigned);
        console.log(lpo.managerSigned);
        console.log(lpo.ceoSigned);
        console.log("New signature flags:", flags);

        setLpoData({
          vendor: lpo.company?.vendor || '',
          equipments: lpo.equipments || '',
          date: lpo.date || '',
          lpoRef: lpo.lpoRef || '',
          quoteNo: lpo.quoteNo || '',
          jobCode: jobCode || '',
          attention: lpo.company?.attention || '',
          designation: lpo.company?.designation || '',
          workingHrs: lpo.workingHrs || '',
          runningKm: lpo.runningKm || '',
          requestText: lpo.requestText || '',
          items: lpo.items || [],
          totalAmount: lpo.totalAmount || 0,
          totalDiscountAmount: lpo.totalDiscountAmount || null,
          termsAndConditions: lpo.termsAndConditions || [
            'Terms & Conditions',
            'Payment will be made within 90 days from the day of submission of invoice'
          ],
          signatures: lpo.signatures || {
            accountsDept: 'ROSHAN SHA',
            purchasingManager: 'ABDUL MALIK',
            operationsManager: 'SURESHKANTH',
            authorizedSignatory: 'AHAMMED KAMAL'
          }
        });

        setSignatureFlags(flags); // Update state
        setLpoCounter(lpo.lpoCounter || 1);

        // NOW load signatures if activated and trusted, passing the flags
        if (globalActivation.isActivated && globalActivation.isTrusted && deviceInfo) {
          console.log("Loading signatures with flags:", flags);
          await Promise.all([
            loadSignatureWithInfo('accounts', deviceInfo, flags),
            loadSignatureWithInfo('pm', deviceInfo, flags),
            loadSignatureWithInfo('manager', deviceInfo, flags),
            loadSignatureWithInfo('authorized', deviceInfo, flags),
            loadSignatureWithInfo('seal', deviceInfo, flags)
          ]);
        }
      } else {
        console.error("LPO not found in response:", data);
        setError(data.message || 'LPO not found');
      }
    } catch (err) {
      console.error('Error fetching LPO data:', err);
      setError(`Failed to load LPO data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getFileName = () => {
    return `LPO-${lpoCounter}-${lpoData.vendor}-LPO For - ${lpoData.equipments}`;
  };

  const sendToApprove = async () => {
    if (!imagesLoaded) {
      alert('Please wait for all images to load before generating PDF');
      return;
    }

    const input = componentRef.current;

    try {
      // Hide controls during capture
      const controls = document.querySelector('.controls');
      if (controls) controls.style.visibility = 'hidden';

      // Apply clean styles for PDF generation
      const originalStyles = {
        background: input.style.background,
        backgroundImage: input.style.backgroundImage,
        backgroundSize: input.style.backgroundSize,
        backgroundRepeat: input.style.backgroundRepeat,
        backgroundPosition: input.style.backgroundPosition,
        backgroundAttachment: input.style.backgroundAttachment
      };

      // Remove any background patterns/grids
      input.style.background = '#FFFFFF';
      input.style.backgroundImage = 'none';
      input.style.backgroundSize = 'auto';
      input.style.backgroundRepeat = 'no-repeat';
      input.style.backgroundPosition = 'initial';
      input.style.backgroundAttachment = 'initial';

      // Clean up child elements with grid backgrounds
      const allElements = input.querySelectorAll('*');
      const elementsOriginalStyles = [];

      allElements.forEach((element, index) => {
        elementsOriginalStyles[index] = {
          background: element.style.background,
          backgroundImage: element.style.backgroundImage,
          backgroundSize: element.style.backgroundSize,
          backgroundRepeat: element.style.backgroundRepeat,
          backgroundPosition: element.style.backgroundPosition,
          backgroundAttachment: element.style.backgroundAttachment
        };

        // Remove grid/pattern backgrounds but keep solid colors and borders
        if (element.style.backgroundImage &&
          (element.style.backgroundImage.includes('grid') ||
            element.style.backgroundImage.includes('linear-gradient') ||
            element.style.backgroundImage.includes('repeating'))) {
          element.style.backgroundImage = 'none';
        }
      });

      // Generate canvas from the component
      const canvas = await html2canvas(input, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight,
        backgroundColor: '#FFFFFF',
        ignoreElements: (element) => {
          const computedStyle = window.getComputedStyle(element);
          return computedStyle.backgroundImage &&
            (computedStyle.backgroundImage.includes('grid') ||
              computedStyle.backgroundImage.includes('repeating'));
        },
        removeContainer: true,
        foreignObjectRendering: false
      });

      // Restore original styles
      Object.assign(input.style, originalStyles);
      allElements.forEach((element, index) => {
        Object.assign(element.style, elementsOriginalStyles[index]);
      });

      // Restore controls visibility
      if (controls) controls.style.visibility = 'visible';

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Convert PDF to blob for S3 upload
      const pdfBlob = pdf.output('blob');

      // First get the pre-signed URL from backend
      const uploadResponse = await apiRequest(
        `${END_POINT}/complaints/upload-lpo/${complaintId}`,
        'POST',
        {
          fileName: getFileName() + '.pdf',
          uploadedBy: 'WORKSHOP_MANAGER',
          lpoRef: `LPO-${Date.now()}`,
          description: 'LPO document generated from system'
        },
        { 'Content-Type': 'application/json' }
      );

      const result = await uploadResponse.json();
      console.log('Upload response:', result);

      if (!uploadResponse.ok || result.status !== 200) {
        throw new Error(result.message || 'Upload failed');
      }

      // Now upload the actual file to S3 using the pre-signed URL
      const s3Response = await fetch(result.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf'
        },
        body: pdfBlob
      });

      if (!s3Response.ok) {
        throw new Error(`S3 upload failed: ${s3Response.status} ${s3Response.statusText}`);
      }

      alert('LPO uploaded successfully!');

    } catch (error) {
      console.error('Error uploading LPO:', error);
      alert(`Upload failed: ${error.message}`);
    }
  };

  const sendMail = async () => {
    if (!imagesLoaded) {
      alert('Please wait for all images to load before generating PDF');
      return;
    }

    const input = componentRef.current;

    try {
      // Hide controls during capture
      const controls = document.querySelector('.controls');
      if (controls) controls.style.visibility = 'hidden';

      // Apply clean styles for PDF generation
      const originalStyles = {
        background: input.style.background,
        backgroundImage: input.style.backgroundImage,
        backgroundSize: input.style.backgroundSize,
        backgroundRepeat: input.style.backgroundRepeat,
        backgroundPosition: input.style.backgroundPosition,
        backgroundAttachment: input.style.backgroundAttachment
      };

      // Remove any background patterns/grids
      input.style.background = '#FFFFFF';
      input.style.backgroundImage = 'none';
      input.style.backgroundSize = 'auto';
      input.style.backgroundRepeat = 'no-repeat';
      input.style.backgroundPosition = 'initial';
      input.style.backgroundAttachment = 'initial';

      // Clean up child elements with grid backgrounds
      const allElements = input.querySelectorAll('*');
      const elementsOriginalStyles = [];

      allElements.forEach((element, index) => {
        elementsOriginalStyles[index] = {
          background: element.style.background,
          backgroundImage: element.style.backgroundImage,
          backgroundSize: element.style.backgroundSize,
          backgroundRepeat: element.style.backgroundRepeat,
          backgroundPosition: element.style.backgroundPosition,
          backgroundAttachment: element.style.backgroundAttachment
        };

        if (element.style.backgroundImage &&
          (element.style.backgroundImage.includes('grid') ||
            element.style.backgroundImage.includes('linear-gradient') ||
            element.style.backgroundImage.includes('repeating'))) {
          element.style.backgroundImage = 'none';
        }
      });

      // Generate canvas from the component
      const canvas = await html2canvas(input, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight,
        backgroundColor: '#FFFFFF',
        ignoreElements: (element) => {
          const computedStyle = window.getComputedStyle(element);
          return computedStyle.backgroundImage &&
            (computedStyle.backgroundImage.includes('grid') ||
              computedStyle.backgroundImage.includes('repeating'));
        },
        removeContainer: true,
        foreignObjectRendering: false
      });

      // Restore original styles
      Object.assign(input.style, originalStyles);
      allElements.forEach((element, index) => {
        Object.assign(element.style, elementsOriginalStyles[index]);
      });

      // Restore controls visibility
      if (controls) controls.style.visibility = 'visible';

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      // Convert PDF to blob for email
      const pdfBlob = pdf.output('blob');
      const fileName = getFileName() + '.pdf';

      // Send email with attachment via your backend
      const emailResponse = await apiRequest(
        `${END_POINT}/lpo/send-lpo-email`,
        'POST',
        {
          fileName: fileName,
          subject: fileName,
          body: 'Please find attached LPO.',
          cc: 'malik@ansarigroup.co',
          lpoRef: lpoData.lpoRef
        },
        { 'Content-Type': 'application/json' }
      );

      const result = await emailResponse.json();

      if (!emailResponse.ok || result.status !== 200) {
        throw new Error(result.message || 'Email sending failed');
      }

      // Upload PDF to the pre-signed URL if provided
      if (result.uploadUrl) {
        const s3Response = await fetch(result.uploadUrl, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/pdf'
          },
          body: pdfBlob
        });

        if (!s3Response.ok) {
          throw new Error(`S3 upload failed: ${s3Response.status} ${s3Response.statusText}`);
        }
      }

      alert('Email sent successfully with LPO attachment!');

    } catch (error) {
      console.error('Error sending email:', error);
      alert(`Failed to send email: ${error.message}`);
    }
  };

  const handleDownloadPdf = async () => {
    if (!imagesLoaded) {
      alert('Please wait for all images to load before generating PDF');
      return;
    }

    const input = componentRef.current;

    try {
      // Hide controls during capture
      const controls = document.querySelector('.controls');
      if (controls) controls.style.visibility = 'hidden';

      // Apply clean styles for PDF generation
      const originalStyles = {
        background: input.style.background,
        backgroundImage: input.style.backgroundImage,
        backgroundSize: input.style.backgroundSize,
        backgroundRepeat: input.style.backgroundRepeat,
        backgroundPosition: input.style.backgroundPosition,
        backgroundAttachment: input.style.backgroundAttachment
      };

      // Remove any background patterns/grids
      input.style.background = '#FFFFFF';
      input.style.backgroundImage = 'none';
      input.style.backgroundSize = 'auto';
      input.style.backgroundRepeat = 'no-repeat';
      input.style.backgroundPosition = 'initial';
      input.style.backgroundAttachment = 'initial';

      // Also clean up any child elements that might have grid backgrounds
      const allElements = input.querySelectorAll('*');
      const elementsOriginalStyles = [];

      allElements.forEach((element, index) => {
        elementsOriginalStyles[index] = {
          background: element.style.background,
          backgroundImage: element.style.backgroundImage,
          backgroundSize: element.style.backgroundSize,
          backgroundRepeat: element.style.backgroundRepeat,
          backgroundPosition: element.style.backgroundPosition,
          backgroundAttachment: element.style.backgroundAttachment
        };

        // Remove grid/pattern backgrounds but keep solid colors and borders
        if (element.style.backgroundImage &&
          (element.style.backgroundImage.includes('grid') ||
            element.style.backgroundImage.includes('linear-gradient') ||
            element.style.backgroundImage.includes('repeating'))) {
          element.style.backgroundImage = 'none';
        }
      });

      const canvas = await html2canvas(input, {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: input.scrollWidth,
        windowHeight: input.scrollHeight,
        backgroundColor: '#FFFFFF',
        // Additional options to prevent grid patterns
        ignoreElements: (element) => {
          // Ignore elements with grid or pattern backgrounds
          const computedStyle = window.getComputedStyle(element);
          return computedStyle.backgroundImage &&
            (computedStyle.backgroundImage.includes('grid') ||
              computedStyle.backgroundImage.includes('repeating'));
        },
        // Remove any CSS filters that might cause artifacts
        removeContainer: true,
        foreignObjectRendering: false
      });

      // Restore original styles
      Object.assign(input.style, originalStyles);
      allElements.forEach((element, index) => {
        Object.assign(element.style, elementsOriginalStyles[index]);
      });

      // Restore controls visibility
      if (controls) controls.style.visibility = 'visible';

      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm (slightly reduced for margins)
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(getFileName() + '.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

  // Convert images to base64 for PDF
  const convertImageToBase64 = (url) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = reject;
      img.src = url;
    });
  };

  const handlePrint = async () => {
    try {
      // Hide controls
      const controls = document.querySelector('.controls');
      if (controls) controls.style.display = 'none';

      // Convert images to base64 to ensure they load in PDF
      const logoBase64 = await convertImageToBase64(logoImage);
      const textBase64 = await convertImageToBase64(alAnsariText);
      const footerBase64 = await convertImageToBase64(footer);

      // Create a new window with the document content
      const printWindow = window.open('', '_blank');

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>${getFileName()}</title>
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: Arial, sans-serif;
              font-size: 11pt;
              line-height: 1.3;
              color: #000;
              background: white;
            }
            
            .lpo-document {
              width: 100%;
              background: white;
            }
            
            .header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 10px;
            }
            
            .logo-placeholder-l img {
              width: 120px;
              height: auto;
            }
            
            .company-details-l img {
              width: 200px;
              height: auto;
            }
            
            .header-divider {
              border-top: 0.5pt solid #000;
              margin: 10px 0;
            }
            
            .lpo-title {
              text-align: center;
              font-weight: bold;
              font-size: 18pt;
              margin: 10px 0;
            }
            
            .details-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 10px;
            }
            
            .details-table td {
              vertical-align: top;
              padding: 2px;
              font-size: 10pt;
              font-weight: 600;
            }
            
            .left-col, .right-col {
              width: 50%;
            }
            
            .detail-item {
              margin-bottom: 3px;
            }
            
            .detail-item ul {
              margin: 2px 0;
              padding-left: 15px;
            }
            
            .details-divider {
              border-top: 0.5pt solid #000;
              margin: 5px 0;
            }
            
            .request-text {
              margin: 10px 0;
              text-align: justify;
              font-size: 10pt;
            }
            
            .items-table-lpo {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 0;
            }
            
            .items-table-lpo th,
            .items-table-lpo td {
              border: 0.5pt solid #000;
              padding: 4px;
              text-align: center;
              font-size: 10pt;
              font-weight: 600;
            }
            
            .total-label {
              text-align: right;
              font-weight: bold;
            }
            
            .terms-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: -0.5pt;
            }
            
            .terms-table td {
              border: 0.5pt solid #000;
              padding: 5px;
              font-size: 10pt;
              vertical-align: top;
            }
            
            .terms-row-large-doc {
              height: ${lpoData.items.length < 8 ? '250px' : 'auto'};
            }
            
            .terms-header-large ul {
              margin: 0;
              padding-left: 15px;
              line-height: 1.4;
            }
            
            .terms-header-large li:first-child {
              list-style: none;
              text-decoration: underline;
              font-weight: bold;
              font-size: 11pt;
              margin-bottom: 8px;
              margin-left: -15px;
            }
            
            .terms-header-large li {
              margin-bottom: 5px;
            }
            
            .note-row {
              font-size: 10pt;
            }
            
            .signatures-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: -0.5pt;
            }
            
            .signatures-table td {
              border: 0.5pt solid #000;
              padding: 4px;
              text-align: center;
              font-size: 10pt;
              font-weight: 600;
            }
            
            .company-footer {
              text-align: left;
              font-weight: bold;
              font-size: 12pt;
            }
            
            .signature-spaces-large {
              height: 80px;
            }
            
            .date-no-border {
              border: none !important;
            }
            
            .footer {
              text-align: center;
              margin-top: 20px;
            }
            
            .footer img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>
          <div class="lpo-document">
            <div class="header">
              <div class="logo-placeholder-l">
                <img src="${logoBase64}" alt="Company Logo" />
              </div>
              <div class="company-details-s company-details-l">
                <img src="${textBase64}" alt="AL Ansari Transport & Enterprises W.L.L" />
              </div>
            </div>

            <div class="header-divider"></div>

            <div class="lpo-title">PURCHASE/HIRE ORDER</div>

            <div class="lpo-details">
              <table class="details-table">
                <tbody>
                  <tr>
                    <td class="left-col">
                      <div class="detail-item">TO : ${lpoData.vendor}</div>
                      <div class="detail-item">ATTN : ${lpoData.attention}</div>
                      <div class="detail-item">DESIGNATION : ${lpoData.designation}</div>
                      <div class="detail-item">Ref No : ${lpoData.quoteNo}</div>
                    </td>
                    <td class="right-col">
                      <div class="detail-item">DATE : ${lpoData.date}</div>
                      <div class="detail-item">LPO REF NO : ${lpoData.lpoRef}</div>
                      <div class="detail-item">
                        EQUIPMENT:
                        <ul>
                          ${lpoData.equipments.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                      </div>
                      <div class="detail-item">
                        ${lpoData.workingHrs
          ? `WORKING HRS : ${lpoData.workingHrs}`
          : lpoData.runningKm
            ? `RUNNING KM : ${lpoData.runningKm}`
            : ''
        }
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="details-divider"></div>

            <div class="request-text">
              ${lpoData.requestText}
            </div>

            <table class="items-table-lpo">
              <thead>
                <tr>
                  <th>SN</th>
                  <th>Item Description</th>
                  <th>Qty</th>
                  <th>Unit Price(QR)</th>
                  <th>Total Price(QR)</th>
                </tr>
              </thead>
              <tbody>
                ${lpoData.items.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>${item.description}</td>
                    <td>${item.quantity}</td>
                    <td>${item.unitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${item.totalPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  </tr>
                `).join('')}
                <tr>
                  <td colspan="4" class="total-label">
                    ${lpoData.totalDiscountAmount
          ? 'Total Amount After Discount (QR)'
          : 'Total Amount (QR)'
        }
                  </td>
                  <td>
                    ${lpoData.totalDiscountAmount
          ? (lpoData.totalDiscountAmount || calculateTotal()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : (lpoData.totalAmount || calculateTotal()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        }
                  </td>
                </tr>
              </tbody>
            </table>

            <table class="terms-table">
              <tbody>
                <tr class="terms-row-large-doc">
                  <td class="terms-header-large">
                    <ul>
                      ${lpoData.termsAndConditions.map(term => `<li>${term}</li>`).join('')}
                    </ul>
                  </td>
                </tr>
                <tr>
                  <td class="note-row">
                    <strong>NOTE:</strong> The LPO copy should be submitted along with the invoice every month for the payment process.
                  </td>
                </tr>
              </tbody>
            </table>

            <table class="signatures-table">
              <tbody>
                <tr class="company-name-tr">
                  <td colspan="4" class="company-footer">
                    AL ANSARI TRANSPORT & ENTERPRISES W.L.L
                  </td>
                  <td class="sign-table sign-border-td">
                    Subcontractor OR<br />Service Provider
                  </td>
                </tr>
                <tr>
                  <td class="sign-table sign-border-td">Accounts Dept:</td>
                  <td class="sign-table sign-border-td">Purchasing Manager</td>
                  <td class="sign-table sign-border-td">Operations Manager</td>
                  <td class="sign-table sign-border-td">
                    Authorized Signatory<br />
                    ${lpoData.signatures.authorizedSignatory === 'AHAMMED KAMAL' ? '(CEO)' : '(MANAGING DIRECTOR)'}
                  </td>
                  <td class="date-no-border sign-table-date">
                    (Date & Sign with Stamp)
                  </td>
                </tr>
                <tr class="signature-spaces-large">
                  <td class="sign-table sign-border-td"></td>
                  <td class="sign-table sign-border-td"></td>
                  <td class="sign-table sign-border-td"></td>
                  <td class="sign-table sign-border-td"></td>
                  <td class="date-no-border"></td>
                </tr>
                <tr>
                  <td class="sign-table sign-border-td">${lpoData.signatures.accountsDept}</td>
                  <td class="sign-table sign-border-td">${lpoData.signatures.purchasingManager}</td>
                  <td class="sign-table sign-border-td">${lpoData.signatures.operationsManager}</td>
                  <td class="sign-table sign-border-td">${lpoData.signatures.authorizedSignatory}</td>
                  <td class="date-no-border"></td>
                </tr>
              </tbody>
            </table>

            <div class="footer">
              <img src="${footerBase64}" alt="Footer" />
            </div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for images to load
      printWindow.addEventListener('load', () => {
        setTimeout(() => {
          printWindow.print();
          printWindow.close();
        }, 500);
      });

      // Restore controls
      if (controls) controls.style.display = 'block';

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');

      // Restore controls
      const controls = document.querySelector('.controls');
      if (controls) controls.style.display = 'block';
    }
  };

  const calculateTotal = () => {
    return lpoData.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  };


  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <p>Loading LPO data...</p>
          <p>Reference: {refNo ? decodeURIComponent(refNo) : 'No reference provided'}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-container">
          <p className="error-message">{error}</p>
          <p>Reference: {refNo ? decodeURIComponent(refNo) : 'No reference provided'}</p>
          <button onClick={fetchLpoData} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="controls">
        <p>Current LPO Number: {lpoCounter}</p>
        <p>LPO Reference: {lpoData.lpoRef}</p>

        <div className="activation-buttons-section">
          {!globalActivation.checked ? (
            <div className="status-badge checking">🔄 Checking Status...</div>
          ) : !globalActivation.isActivated ? (
            <button
              onClick={handleLoadAllSignatures}
              className="action-button activation-btn not-activated"
            >
              🔓 Not Activated - Click to Activate
            </button>
          ) : !globalActivation.isTrusted ? (
            <div className="status-badge not-trusted">
              <button
                onClick={handleLoadAllSignatures}
                className="action-button activation-btn not-activated"
              >⚠️ Device Not Trusted - Contact Admin
              </button>
            </div>
          ) : (
            <div className="status-badge activated">✅ Activated & Trusted</div>
          )}
        </div>

        <div className="button-group">
          <button className="action-button download-button" onClick={sendToApprove}>
            Send For Approval
          </button>
          <button className="action-button download-button" onClick={handleDownloadPdf}>
            Download as PDF
          </button>
          <button className="action-button download-button" onClick={sendMail}>
            Send Email
          </button>
          <button className="action-button print-button" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      {/* page 1 */}
      <div className="lpo-document" ref={componentRef} style={{ background: '#FFFFFF', backgroundImage: 'none' }}>
        <div className={signatureFlags.ceoSigned && signatureStates.seal.url ? 'authorized-watermark' : 'draft-watermark'}>
          {signatureFlags.ceoSigned && signatureStates.seal.url ? '' : 'DRAFT'}
        </div>
        <div className="header">
          <div className="logo-placeholder-l">
            <img src={logoImage} alt="Company Logo" />
          </div>
          <div className="company-details-s company-details-l">
            <img src={alAnsariText} alt="AL Ansari Transport & Enterprises W.L.L" />
          </div>
        </div>

        <div className="header-divider"></div>

        <div className="lpo-title">PURCHASE/HIRE ORDER</div>

        <div className="lpo-details">
          <table className="details-table">
            <tbody>
              <tr>
                <td className="left-col">
                  <div className="detail-item">TO : {lpoData.vendor}</div>
                  <div className="detail-item">ATTN : {lpoData.attention}</div>
                  <div className="detail-item">DESIGNATION : {lpoData.designation}</div>
                  <div className="detail-item">Ref No : {lpoData.quoteNo}</div>
                </td>
                <td className="right-col">
                  <div className="detail-item">DATE : {lpoData.date}</div>
                  <div className="detail-item">LPO REF NO : {lpoData.lpoRef}</div>
                  {
                    lpoData.jobCode ? (
                      <div className="detail-item">JOB/COMPLAINT NO : {lpoData.jobCode}</div>
                    ) : ''
                  }
                  <div className="detail-item">
                    EQUIPMENT:
                    <ul>
                      {lpoData.equipments.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="detail-item">
                    {lpoData.workingHrs
                      ? `WORKING HRS : ${lpoData.workingHrs}`
                      : lpoData.runningKm
                        ? `RUNNING KM : ${lpoData.runningKm}`
                        : ''
                    }
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="details-divider"></div>

        <div className="request-text">
          {lpoData.requestText}
        </div>

        <table className="items-table-lpo">
          <thead>
            <tr>
              <th>SN</th>
              <th>Item Description</th>
              <th>Qty</th>
              <th>Unit Price(QR)</th>
              <th>Total Price(QR)</th>
            </tr>
          </thead>
          <tbody>
            {lpoData.items.slice(0, 20).map((item, index, array) => (
              <tr className={`${index === array.length - 1 && lpoData.items.length >= 20 ? 'sign-border-td-b' : ''}`} key={item._id || item.id || index}>
                <td>{index + 1}</td>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{item.unitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>{item.totalPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
            {lpoData.items.length <= 20 && (
              <tr>
                <td colSpan="4" className="total-label">
                  {
                    lpoData.totalDiscountAmount
                      ? 'Total Amount After Discount (QR)'
                      : 'Total Amount (QR)'
                  }
                </td>
                <td>
                  {
                    lpoData.totalDiscountAmount
                      ? (lpoData.totalDiscountAmount || calculateTotal()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      : (lpoData.totalAmount || calculateTotal()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                  }
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {lpoData.items.length <= 20 && (
          <table className="terms-table">
            <tbody>
              <tr className={`${lpoData.items.length < 8 ? 'terms-row-large-doc normal' : 'terms-row-large-doc more'}`}>
                <td className="terms-header-large sign-border-td-r sign-border-td-b sign-border-td-l sign-border-td-t">
                  <ul>
                    {lpoData.termsAndConditions.map((term, index) => (
                      <li key={index}>{term}</li>
                    ))}
                  </ul>
                </td>
              </tr>
              <tr>
                <td className={`note-row sign-border-td-r sign-border-td-r sign-border-td-l ${lpoData.items.length >= 12 && lpoData.items.length <= 20 ? 'sign-border-td-b' : ''}`}>
                  <strong>NOTE:</strong> The LPO copy should be submitted along with the invoice every month for the payment process.
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {lpoData.items.length <= 12 && (
          <>
            <table className="signatures-table">
              <tbody>
                <tr className='company-name-tr'>
                  <td colSpan="4" className="company-footer sign-border-td-r">
                    AL ANSARI TRANSPORT & ENTERPRISES W.L.L
                  </td>
                  <td className='sign-table'>
                    Subcontractor OR<br />Service Provider
                  </td>
                </tr>
                <tr>
                  <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t text-align-center'>Purchasing Manager</td>
                  <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t text-align-center'>Operations Manager</td>
                  <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t text-align-center'>
                    Authorized Signatory<br />
                    {lpoData.signatures.authorizedSignatory === 'AHAMMED KAMAL' ? '(CEO)' : '(MANAGING DIRECTOR)'}
                  </td>
                  <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t text-align-center'>Accounts Dept:</td>
                  <td className='sign-table-date sign-border-td-t'>
                    (Date & Sign with Stamp)
                  </td>
                </tr>

                <tr className="signature-spaces-large">
                  {/* PM */}
                  {signatureFlags.pmSigned && (
                    <td className='sign-table lpo-signs sign-border-td-r'>
                      {signatureStates.pm.url ? (
                        <img
                          className='accounts-sign'
                          src={signatureStates.pm.url}
                          alt="PM Signature"
                          crossOrigin="anonymous"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      ) : (
                        <span className="account-no-signature">Not Signed</span>
                      )}
                    </td>
                  )}
                  {!signatureFlags.pmSigned && (
                    <td className='sign-table lpo-signs sign-border-td-r'>
                      <span className="account-no-signature">Not Signed</span>
                    </td>
                  )}

                  {/* Manager */}
                  {signatureFlags.managerSigned && (
                    <td className='sign-table lpo-signs sign-border-td-r'>
                      {signatureStates.manager.url ? (
                        <img
                          className='accounts-sign'
                          src={signatureStates.manager.url}
                          alt="Manager Signature"
                          crossOrigin="anonymous"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      ) : (
                        <span className="account-no-signature">Not Signed</span>
                      )}
                    </td>
                  )}
                  {!signatureFlags.managerSigned && (
                    <td className='sign-table lpo-signs sign-border-td-r'>
                      <span className="account-no-signature">Not Signed</span>
                    </td>
                  )}

                  {/* Authorized + Seal - Only show if CEO signed */}
                  {signatureFlags.ceoSigned ? (
                    <td className='sign-table lpo-signs sign-border-td-r'>
                      {signatureStates.authorized.url ? (
                        <div className="signature-display">
                          <img
                            className='accounts-sign'
                            src={signatureStates.authorized.url}
                            alt="Authorized Signature"
                            crossOrigin="anonymous"
                            onError={(e) => e.target.style.display = 'none'}
                          />
                          {signatureStates.seal.url && (
                            <img
                              className='company-seal'
                              src={signatureStates.seal.url}
                              alt="Company Seal"
                              crossOrigin="anonymous"
                              onError={(e) => e.target.style.display = 'none'}
                            />
                          )}
                        </div>
                      ) : (
                        <span className="account-no-signature">Not Signed</span>
                      )}
                    </td>
                  ) : (
                    <td className='sign-table lpo-signs sign-border-td-r'>
                      <span className="account-no-signature">Not Signed</span>
                    </td>
                  )}

                  {/* Accounts */}
                  {signatureFlags.accountsSigned && (
                    <td className='sign-table lpo-signs sign-border-td-r'>
                      {signatureStates.accounts.url ? (
                        <img
                          className='accounts-sign'
                          src={signatureStates.accounts.url}
                          alt="Accounts Signature"
                          crossOrigin="anonymous"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      ) : (
                        <span className="account-no-signature">Not Signed</span>
                      )}
                    </td>
                  )}
                  {!signatureFlags.accountsSigned && (
                    <td className='sign-table lpo-signs sign-border-td-r'>
                      <span className="account-no-signature">Not Signed</span>
                    </td>
                  )}
                  <td></td>
                </tr>
                <tr>
                  <td className='sign-table sign-border-td-r sign-border-td-t text-align-center'>{lpoData.signatures.purchasingManager}</td>
                  <td className='sign-table sign-border-td-r sign-border-td-t text-align-center'>{lpoData.signatures.operationsManager}</td>
                  <td className='sign-table sign-border-td-r sign-border-td-t text-align-center'>{lpoData.signatures.authorizedSignatory}</td>
                  <td className='sign-table sign-border-td-r sign-border-td-t text-align-center'>{lpoData.signatures.accountsDept}</td>
                  <td className='date-no-border'></td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        <div className='footer'>
          <img src={footer} alt="" />
        </div>

        <div className="document-timestamp">
          This document was generated by the system on {new Date().toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}, at {new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })}.
        </div>
      </div>

      {/* Second page - only if items > 12 */}
      {lpoData.items.length > 12 && (
        <div className="lpo-document" style={{ background: '#FFFFFF', backgroundImage: 'none' }}>
          <div className={signatureFlags.ceoSigned && signatureStates.seal.url ? 'authorized-watermark' : 'draft-watermark'}>
            {signatureFlags.ceoSigned && signatureStates.seal.url ? '' : 'DRAFT'}
          </div>

          {/* Header */}
          <div className="header">
            <div className="logo-placeholder-l">
              <img src={logoImage} alt="Company Logo" />
            </div>
            <div className="company-details-s company-details-l">
              <img src={alAnsariText} alt="AL Ansari Transport & Enterprises W.L.L" />
            </div>
          </div>

          <div className="header-divider"></div>

          {/* Remaining items from 13 onwards */}
          <table className="items-table-lpo">
            {
              lpoData.items.length > 20 ? (
                <thead>
                  <tr>
                    <th>SN</th>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th>Unit Price(QR)</th>
                    <th>Total Price(QR)</th>
                  </tr>
                </thead>
              ) : ''
            }
            <tbody>
              {lpoData.items.slice(20, 48).map((item, index, array) => (
                <tr className={`${index === array.length - 1 && lpoData.items.length >= 48 ? 'sign-border-td-b' : ''}`} key={item._id || item.id || index}>
                  <td>{index + 21}</td>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>{item.totalPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {lpoData.items.length > 20 && lpoData.items.length <= 48 && (
                <tr>
                  <td colSpan="4" className="total-label">
                    {
                      lpoData.totalDiscountAmount
                        ? 'Total Amount After Discount (QR)'
                        : 'Total Amount (QR)'
                    }
                  </td>
                  <td>
                    {
                      lpoData.totalDiscountAmount
                        ? (lpoData.totalDiscountAmount || calculateTotal()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : (lpoData.totalAmount || calculateTotal()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {
            lpoData.items.length > 20 && lpoData.items.length <= 48 && (
              <table className="terms-table">
                <tbody>
                  <tr className={`${lpoData.items.length < 8 ? 'terms-row-large-doc normal' : 'terms-row-large-doc more'}`}>
                    <td className="terms-header-large sign-border-td-r sign-border-td-b sign-border-td-l sign-border-td-t">
                      <ul>
                        {lpoData.termsAndConditions.map((term, index) => (
                          <li key={index}>{term}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td className={`note-row sign-border-td-r sign-border-td-r sign-border-td-l ${lpoData.items.length > 20 && lpoData.items.length > 12 ? 'sign-border-td-b' : ''}`}>
                      <strong>NOTE:</strong> The LPO copy should be submitted along with the invoice every month for the payment process.
                    </td>
                  </tr>
                </tbody>
              </table>
            )
          }

          {
            lpoData.items.length < 42 && (
              <>
                {/* Signatures table */}
                <table className="signatures-table">
                  <tbody>
                    <tr className='company-name-tr'>
                      <td colSpan="4" className="company-footer sign-border-td-r">
                        AL ANSARI TRANSPORT & ENTERPRISES W.L.L
                      </td>
                      <td className='sign-table'>
                        Subcontractor OR<br />Service Provider
                      </td>
                    </tr>
                    <tr>
                      <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t text-align-center'>Purchasing Manager</td>
                      <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t text-align-center'>Operations Manager</td>
                      <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t text-align-center'>
                        Authorized Signatory<br />
                        {lpoData.signatures.authorizedSignatory === 'AHAMMED KAMAL' ? '(CEO)' : '(MANAGING DIRECTOR)'}
                      </td>
                      <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t text-align-center'>Accounts Dept:</td>
                      <td className='sign-table-date sign-border-td-t'>
                        (Date & Sign with Stamp)
                      </td>
                    </tr>

                    <tr className="signature-spaces-large">
                      {/* PM */}
                      {signatureFlags.pmSigned && (
                        <td className='sign-table lpo-signs sign-border-td-r'>
                          {signatureStates.pm.url ? (
                            <img className='accounts-sign' src={signatureStates.pm.url} alt="PM Signature" crossOrigin="anonymous" onError={(e) => e.target.style.display = 'none'} />
                          ) : (
                            <span className="account-no-signature">Not Signed</span>
                          )}
                        </td>
                      )}
                      {!signatureFlags.pmSigned && (
                        <td className='sign-table lpo-signs sign-border-td-r'>
                          <span className="account-no-signature">Not Signed</span>
                        </td>
                      )}

                      {/* Manager */}
                      {signatureFlags.managerSigned && (
                        <td className='sign-table lpo-signs sign-border-td-r'>
                          {signatureStates.manager.url ? (
                            <img className='accounts-sign' src={signatureStates.manager.url} alt="Manager Signature" crossOrigin="anonymous" onError={(e) => e.target.style.display = 'none'} />
                          ) : (
                            <span className="account-no-signature">Not Signed</span>
                          )}
                        </td>
                      )}
                      {!signatureFlags.managerSigned && (
                        <td className='sign-table lpo-signs sign-border-td-r'>
                          <span className="account-no-signature">Not Signed</span>
                        </td>
                      )}

                      {/* Authorized + Seal */}
                      {signatureFlags.ceoSigned ? (
                        <td className='sign-table lpo-signs sign-border-td-r'>
                          {signatureStates.authorized.url ? (
                            <div className="signature-display">
                              <img className='accounts-sign' src={signatureStates.authorized.url} alt="Authorized Signature" crossOrigin="anonymous" onError={(e) => e.target.style.display = 'none'} />
                              {signatureStates.seal.url && (
                                <img className='company-seal' src={signatureStates.seal.url} alt="Company Seal" crossOrigin="anonymous" onError={(e) => e.target.style.display = 'none'} />
                              )}
                            </div>
                          ) : (
                            <span className="account-no-signature">Not Signed</span>
                          )}
                        </td>
                      ) : (
                        <td className='sign-table lpo-signs sign-border-td-r'>
                          <span className="account-no-signature">Not Signed</span>
                        </td>
                      )}

                      {/* Accounts */}
                      {signatureFlags.accountsSigned && (
                        <td className='sign-table lpo-signs sign-border-td-r'>
                          {signatureStates.accounts.url ? (
                            <img className='accounts-sign' src={signatureStates.accounts.url} alt="Accounts Signature" crossOrigin="anonymous" onError={(e) => e.target.style.display = 'none'} />
                          ) : (
                            <span className="account-no-signature">Not Signed</span>
                          )}
                        </td>
                      )}
                      {!signatureFlags.accountsSigned && (
                        <td className='sign-table lpo-signs sign-border-td-r'>
                          <span className="account-no-signature">Not Signed</span>
                        </td>
                      )}
                      <td></td>
                    </tr>
                    <tr>
                      <td className='sign-table sign-border-td-r sign-border-td-t text-align-center'>{lpoData.signatures.purchasingManager}</td>
                      <td className='sign-table sign-border-td-r sign-border-td-t text-align-center'>{lpoData.signatures.operationsManager}</td>
                      <td className='sign-table sign-border-td-r sign-border-td-t text-align-center'>{lpoData.signatures.authorizedSignatory}</td>
                      <td className='sign-table sign-border-td-r sign-border-td-t text-align-center'>{lpoData.signatures.accountsDept}</td>
                      <td className='date-no-border'></td>
                    </tr>
                  </tbody>
                </table>
              </>
            )
          }

          {/* Footer */}
          <div className='footer'>
            <img src={footer} alt="" />
          </div>

          <div className="document-timestamp">
            This document was generated by the system on {new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}, at {new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}.
          </div>
        </div>
      )}

      {/* Third page - only if items > 43 */}
      {lpoData.items.length > 48 && (
        <div className="lpo-document" style={{ background: '#FFFFFF', backgroundImage: 'none' }}>
          <div className={signatureFlags.ceoSigned && signatureStates.seal.url ? 'authorized-watermark' : 'draft-watermark'}>
            {signatureFlags.ceoSigned && signatureStates.seal.url ? '' : 'DRAFT'}
          </div>

          {/* Header */}
          <div className="header">
            <div className="logo-placeholder-l">
              <img src={logoImage} alt="Company Logo" />
            </div>
            <div className="company-details-s company-details-l">
              <img src={alAnsariText} alt="AL Ansari Transport & Enterprises W.L.L" />
            </div>
          </div>

          <div className="header-divider"></div>

          {/* Remaining items from 13 onwards */}
          <table className="items-table-lpo">
            {
              lpoData.items.length > 20 ? (
                <thead>
                  <tr>
                    <th>SN</th>
                    <th>Item Description</th>
                    <th>Qty</th>
                    <th>Unit Price(QR)</th>
                    <th>Total Price(QR)</th>
                  </tr>
                </thead>
              ) : ''
            }
            <tbody>
              {lpoData.items.slice(49).map((item, index) => (
                <tr key={item._id || item.id || index}>
                  <td>{index + 49}</td>
                  <td>{item.description}</td>
                  <td>{item.quantity}</td>
                  <td>{item.unitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td>{item.totalPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))}
              {lpoData.items.length > 48 && (
                <tr>
                  <td colSpan="4" className="total-label">
                    {
                      lpoData.totalDiscountAmount
                        ? 'Total Amount After Discount (QR)'
                        : 'Total Amount (QR)'
                    }
                  </td>
                  <td>
                    {
                      lpoData.totalDiscountAmount
                        ? (lpoData.totalDiscountAmount || calculateTotal()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                        : (lpoData.totalAmount || calculateTotal()).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {
            lpoData.items.length > 48 && (
              <table className="terms-table">
                <tbody>
                  <tr className={`${lpoData.items.length < 8 ? 'terms-row-large-doc normal' : 'terms-row-large-doc more'}`}>
                    <td className="terms-header-large sign-border-td-r sign-border-td-b sign-border-td-l sign-border-td-t">
                      <ul>
                        {lpoData.termsAndConditions.map((term, index) => (
                          <li key={index}>{term}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                  <tr>
                    <td className={`note-row sign-border-td-r sign-border-td-r sign-border-td-l ${lpoData.items.length > 20 && lpoData.items.length > 12 ? 'sign-border-td-b' : ''}`}>
                      <strong>NOTE:</strong> The LPO copy should be submitted along with the invoice every month for the payment process.
                    </td>
                  </tr>
                </tbody>
              </table>
            )
          }

          {/* Signatures table */}
          <table className="signatures-table">
            <tbody>
              <tr className='company-name-tr'>
                <td colSpan="4" className="company-footer sign-border-td-r">
                  AL ANSARI TRANSPORT & ENTERPRISES W.L.L
                </td>
                <td className='sign-table'>
                  Subcontractor OR<br />Service Provider
                </td>
              </tr>
              <tr>
                <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t text-align-center'>Purchasing Manager</td>
                <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t text-align-center'>Operations Manager</td>
                <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t text-align-center'>
                  Authorized Signatory<br />
                  {lpoData.signatures.authorizedSignatory === 'AHAMMED KAMAL' ? '(CEO)' : '(MANAGING DIRECTOR)'}
                </td>
                <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t text-align-center'>Accounts Dept:</td>
                <td className='sign-table-date sign-border-td-t'>
                  (Date & Sign with Stamp)
                </td>
              </tr>

              <tr className="signature-spaces-large">
                {/* PM */}
                {signatureFlags.pmSigned && (
                  <td className='sign-table lpo-signs sign-border-td-r'>
                    {signatureStates.pm.url ? (
                      <img className='accounts-sign' src={signatureStates.pm.url} alt="PM Signature" crossOrigin="anonymous" onError={(e) => e.target.style.display = 'none'} />
                    ) : (
                      <span className="account-no-signature">Not Signed</span>
                    )}
                  </td>
                )}
                {!signatureFlags.pmSigned && (
                  <td className='sign-table lpo-signs sign-border-td-r'>
                    <span className="account-no-signature">Not Signed</span>
                  </td>
                )}

                {/* Manager */}
                {signatureFlags.managerSigned && (
                  <td className='sign-table lpo-signs sign-border-td-r'>
                    {signatureStates.manager.url ? (
                      <img className='accounts-sign' src={signatureStates.manager.url} alt="Manager Signature" crossOrigin="anonymous" onError={(e) => e.target.style.display = 'none'} />
                    ) : (
                      <span className="account-no-signature">Not Signed</span>
                    )}
                  </td>
                )}
                {!signatureFlags.managerSigned && (
                  <td className='sign-table lpo-signs sign-border-td-r'>
                    <span className="account-no-signature">Not Signed</span>
                  </td>
                )}

                {/* Authorized + Seal */}
                {signatureFlags.ceoSigned ? (
                  <td className='sign-table lpo-signs sign-border-td-r'>
                    {signatureStates.authorized.url ? (
                      <div className="signature-display">
                        <img className='accounts-sign' src={signatureStates.authorized.url} alt="Authorized Signature" crossOrigin="anonymous" onError={(e) => e.target.style.display = 'none'} />
                        {signatureStates.seal.url && (
                          <img className='company-seal' src={signatureStates.seal.url} alt="Company Seal" crossOrigin="anonymous" onError={(e) => e.target.style.display = 'none'} />
                        )}
                      </div>
                    ) : (
                      <span className="account-no-signature">Not Signed</span>
                    )}
                  </td>
                ) : (
                  <td className='sign-table lpo-signs sign-border-td-r'>
                    <span className="account-no-signature">Not Signed</span>
                  </td>
                )}

                {/* Accounts */}
                {signatureFlags.accountsSigned && (
                  <td className='sign-table lpo-signs sign-border-td-r'>
                    {signatureStates.accounts.url ? (
                      <img className='accounts-sign' src={signatureStates.accounts.url} alt="Accounts Signature" crossOrigin="anonymous" onError={(e) => e.target.style.display = 'none'} />
                    ) : (
                      <span className="account-no-signature">Not Signed</span>
                    )}
                  </td>
                )}
                {!signatureFlags.accountsSigned && (
                  <td className='sign-table lpo-signs sign-border-td-r'>
                    <span className="account-no-signature">Not Signed</span>
                  </td>
                )}
                <td></td>
              </tr>
              <tr>
                <td className='sign-table sign-border-td-r sign-border-td-t text-align-center'>{lpoData.signatures.purchasingManager}</td>
                <td className='sign-table sign-border-td-r sign-border-td-t text-align-center'>{lpoData.signatures.operationsManager}</td>
                <td className='sign-table sign-border-td-r sign-border-td-t text-align-center'>{lpoData.signatures.authorizedSignatory}</td>
                <td className='sign-table sign-border-td-r sign-border-td-t text-align-center'>{lpoData.signatures.accountsDept}</td>
                <td className='date-no-border'></td>
              </tr>
            </tbody>
          </table>

          {/* Footer */}
          <div className='footer'>
            <img src={footer} alt="" />
          </div>

          <div className="document-timestamp">
            This document was generated by the system on {new Date().toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}, at {new Date().toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}.
          </div>
        </div>
      )}

      {/* Activation Key Modal */}
      <DevModal
        isOpen={showActivationModal}
        onClose={() => setShowActivationModal(false)}
        type="activation"
        title="Activate Signatures"
        message="Enter your 20-digit activation key to activate all signatures"
        showInput={true}
        useCellInput={true}
        cellCount={20}
        inputValue={activationKey}
        onInputChange={setActivationKey}
        inputError={activationError}
        deviceInfo={deviceInfo}
        buttonText={activationLoading ? "Activating..." : "Activate"}
        onButtonClick={handleActivation}
        preventClose={activationLoading}
      />

      {/* Trust Browser Modal */}
      <DevModal
        isOpen={showTrustModal}
        onClose={() => { }}
        type="success"
        title="Key has been Activated"
        message="Your key has been activated now. You can able to load and use all signatures."
        buttonText="Trust this browser"
        onButtonClick={confirmBrowserTrust}
        preventClose={true}
      />

      {/* Not Trusted Modal */}
      <DevModal
        isOpen={showNotTrustedModal}
        onClose={() => setShowNotTrustedModal(false)}
        type="warning"
        title="Device Not Trusted"
        message="This device is activated but not yet trusted by the administrator. Please contact your system administrator to enable trust for this device."
        buttonText="Close"
        onButtonClick={() => setShowNotTrustedModal(false)}
      />
    </div >
  );
};

export default LpoDoc;