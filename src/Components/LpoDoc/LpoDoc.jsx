import React, { useState, useRef, useEffect } from 'react';
import './LpoDoc.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import logoImage from '../../assets/images/al-ansari.png';
import alAnsariText from '../../assets/images/al-ansari-text.png';
import footer from '../../assets/images/footer.png';
import { useParams } from 'react-router-dom';
import { END_POINT } from '../../constants';
import { apiRequest } from '../../utils/0auth';

const LpoDoc = () => {
  const params = useParams();
  const refNo = params.lpoRef;



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

  const handlePrint = () => {
    const originalContents = document.body.innerHTML;
    const printElement = componentRef.current.cloneNode(true);

    // Remove controls from the print version
    const printControls = printElement.querySelector('.controls');
    if (printControls) printControls.remove();

    // Remove any grid patterns for printing
    const allElements = printElement.querySelectorAll('*');
    allElements.forEach(element => {
      if (element.style.backgroundImage &&
        (element.style.backgroundImage.includes('grid') ||
          element.style.backgroundImage.includes('repeating'))) {
        element.style.backgroundImage = 'none';
      }
    });

    document.body.innerHTML = '';
    document.body.appendChild(printElement);

    window.print();

    // Restore original content
    document.body.innerHTML = originalContents;
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
            <tr className="terms-row-large">
              <td className="terms-header-large">
                <ul>
                  {lpoData.termsAndConditions.map((term, index) => (
                    <li key={index}>{term}</li>
                  ))}
                </ul>
              </td>
            </tr>
            <tr>
              <td className="note-row">
                <strong>NOTE:</strong> The LPO copy should be submitted along with the invoice every month for the payment process.
              </td>
            </tr>
          </tbody>
        </table>

        <table className="signatures-table">
          <tbody>
            <tr className='company-name-tr'>
              <td colSpan="4" className="company-footer">
                AL ANSARI TRANSPORT & ENTERPRISES W.L.L
              </td>
              <td className='sign-table'>
                Subcontractor OR<br />Service Provider
              </td>
            </tr>
            <tr>
              <td className='sign-table'>Accounts Dept:</td>
              <td className='sign-table'>Purchasing Manager</td>
              <td className='sign-table'>Operations Manager</td>
              <td className='sign-table'>
                Authorized Signatory<br />
                {lpoData.signatures.authorizedSignatory === 'AHAMMED KAMAL' ? '(CEO)' : '(MANAGING DIRECTOR)'}
              </td>
              <td className='date-no-border sign-table-date'>
                (Date & Sign with Stamp)
              </td>
            </tr>
            <tr className="signature-spaces-large">
              <td className='sign-table'></td>
              <td className='sign-table'></td>
              <td className='sign-table'></td>
              <td className='sign-table'></td>
              <td></td>
            </tr>
            <tr>
              <td className='sign-table'>{lpoData.signatures.accountsDept}</td>
              <td className='sign-table'>{lpoData.signatures.purchasingManager}</td>
              <td className='sign-table'>{lpoData.signatures.operationsManager}</td>
              <td className='sign-table'>{lpoData.signatures.authorizedSignatory}</td>
              <td></td>
            </tr>
          </tbody>
        </table>

        <div className='footer'>
          <img src={footer} alt="" />
        </div>
      </div>
    </div>
  );
};

export default LpoDoc;