import React, { useState, useRef, useEffect } from 'react';
import './LpoDoc.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logoImage from '../../assets/images/al-ansari-color.png';
import alAnsariText from '../../assets/images/al-ansari-text.png';
import footer from '../../assets/images/footer.png';
import { useParams } from 'react-router-dom';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';

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

  const componentRef = useRef();

  // Fetch LPO data from API
  useEffect(() => {
    if (refNo) {
      fetchLpoData();
    }
  }, [refNo]);

  // Check image loading status
  useEffect(() => {
    if (!componentRef.current) return;

    const images = componentRef.current.querySelectorAll('img');
    if (images.length === 0) {
      setImagesLoaded(true);
      return;
    }

    let loadedCount = 0;
    const checkAllLoaded = () => {
      loadedCount++;
      if (loadedCount === images.length) {
        setImagesLoaded(true);
      }
    };

    images.forEach(img => {
      if (img.complete) {
        checkAllLoaded();
      } else {
        img.addEventListener('load', checkAllLoaded);
        img.addEventListener('error', checkAllLoaded);
      }
    });

    return () => {
      images.forEach(img => {
        img.removeEventListener('load', checkAllLoaded);
        img.removeEventListener('error', checkAllLoaded);
      });
    };
  }, [lpoData]);

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

      const response = await apiRequest(apiUrl, 'GET',);

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

        setLpoData({
          vendor: lpo.company?.vendor || '',
          equipments: lpo.equipments || '',
          date: lpo.date || '',
          lpoRef: lpo.lpoRef || '',
          quoteNo: lpo.quoteNo || '',
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

        setLpoCounter(lpo.lpoCounter || 1);
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
        <div className="button-group">
          <button className="action-button download-button" onClick={sendToApprove}>
            Send For Approval
          </button>
          <button className="action-button download-button" onClick={handleDownloadPdf}>
            Download as PDF
          </button>
          <button className="action-button print-button" onClick={handlePrint}>
            Print
          </button>
        </div>
      </div>

      <div className="lpo-document" ref={componentRef} style={{ background: '#FFFFFF', backgroundImage: 'none' }}>
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
            {lpoData.items.map((item, index) => (
              <tr key={item._id || item.id || index}>
                <td>{index + 1}</td>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{item.unitPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                <td>{item.totalPrice?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
            ))}
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
          </tbody>
        </table>

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
              <td className="note-row sign-border-td-r sign-border-td-r sign-border-td-l">
                <strong>NOTE:</strong> The LPO copy should be submitted along with the invoice every month for the payment process.
              </td>
            </tr>
          </tbody>
        </table>

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
              <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t'>Accounts Dept:</td>
              <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t'>Purchasing Manager</td>
              <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t'>Operations Manager</td>
              <td className='sign-table sign-border-td-r sign-border-td-b sign-border-td-t'>
                Authorized Signatory<br />
                {lpoData.signatures.authorizedSignatory === 'AHAMMED KAMAL' ? '(CEO)' : '(MANAGING DIRECTOR)'}
              </td>
              <td className='sign-table-date sign-border-td-t'>
                (Date & Sign with Stamp)
              </td>
            </tr>
            <tr className="signature-spaces-large">
              <td className='sign-table sign-border-td-r'></td>
              <td className='sign-table sign-border-td-r'></td>
              <td className='sign-table sign-border-td-r'></td>
              <td className='sign-table sign-border-td-r'></td>
              <td></td>
            </tr>
            <tr>
              <td className='sign-table sign-border-td-r sign-border-td-t'>{lpoData.signatures.accountsDept}</td>
              <td className='sign-table sign-border-td-r sign-border-td-t'>{lpoData.signatures.purchasingManager}</td>
              <td className='sign-table sign-border-td-r sign-border-td-t'>{lpoData.signatures.operationsManager}</td>
              <td className='sign-table sign-border-td-r sign-border-td-t'>{lpoData.signatures.authorizedSignatory}</td>
              <td className='date-no-border'></td>
            </tr>
          </tbody>
        </table>

        <div className='footer'>
          <img src={footer} alt="" />
        </div>
      </div>
    </div >
  );
};

export default LpoDoc;