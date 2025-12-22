import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './BackchargeDoc.css';
import logoImage from '../../assets/images/al-ansari-color.png';
import alAnsariText from '../../assets/images/al-ansari-text.png';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { apiRequest } from '../../utils/0auth';
import { END_POINT } from '../../constants';
import { useHeaderTitle } from '../../context/HeaderTitleContext';
import Button from '../../common/Button/Button';

const BackchargeDoc = () => {
    const { refNo } = useParams();
    const navigate = useNavigate();
    const componentRef = useRef();
    const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();

    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [documentExists, setDocumentExists] = useState(false);
    const [documentId, setDocumentId] = useState(null);
    const [grantTotal, setGrantTotal] = useState(0);
    const [formData, setFormData] = useState({
        reportNo: '',
        equipmentType: '',
        plateNo: '',
        model: '',
        supplierName: '',
        contactPerson: '',
        siteLocation: '',
        date: '',
        scopeOfWork: '',
        scopeLine2Text: '',
        workshopComments: '',
        workSummaryLine2: '',
        sparePartsCost: '',
        labourCharges: '',
        totalCost: '',
        approvedDeduction: '',
        tableRows: Array(7).fill().map(() => ({
            description: '',
            qty: '',
            cost: '',
            total: ''
        }))
    });

    useEffect(() => {
        if (refNo) {
            const title = `Ref No: ${refNo}`
            const subtitle = `Backcharge Of: ${formData.supplierName}`;
            setHeaderTitle(title);
            setHeaderSubtitle(subtitle);
        } else {
            setHeaderTitle(null);
            setHeaderSubtitle(null);
        }

        // Cleanup - reset when component unmounts
        return () => {
            setHeaderTitle(null);
            setHeaderSubtitle(null);
        };
    }, [refNo, formData.supplierName]);

    useEffect(() => {
        const total = formData.tableRows.reduce((sum, row) => {
            const rowTotal = parseFloat(row.total) || 0;
            return sum + rowTotal;
        }, 0);
        setGrantTotal(total);
    }, [formData.tableRows]);

    useEffect(() => {
        const loadImages = async () => {
            try {
                const logoPromise = new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = logoImage;
                });

                const textPromise = new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = alAnsariText;
                });

                await Promise.all([logoPromise, textPromise]);
                setImagesLoaded(true);
            } catch (error) {
                console.error('Error loading images:', error);
                setImagesLoaded(true);
            }
        };

        loadImages();
    }, []);

    // Fetch backcharge data by refNo
    useEffect(() => {
        const fetchBackchargeData = async () => {
            if (!refNo) return;

            setIsLoading(true);
            try {
                const response = await apiRequest(`${END_POINT}/backcharge/get-backcharge-by-ref/${encodeURIComponent(refNo)}`, 'GET');

                if (response.ok) {
                    const data = await response.json();

                    console.log(data);
                    setDocumentExists(true);
                    setDocumentId(data.data._id);

                    // Map the fetched data to form structure
                    setFormData({
                        reportNo: data.data.reportNo || '',
                        equipmentType: data.data.equipmentType || '',
                        plateNo: data.data.plateNo || '',
                        model: data.data.model || '',
                        supplierName: data.data.supplierName || '',
                        contactPerson: data.data.contactPerson || '',
                        siteLocation: data.data.siteLocation || '',
                        date: data.data.date || '',

                        // Handle scope of work lines
                        scopeOfWork: data.data.scopeOfWork?.lines?.find(line => line.lineNumber === 1)?.text || '',
                        scopeLine2Text: data.data.scopeOfWork?.lines?.find(line => line.lineNumber === 2)?.text || '',

                        // Handle workshop comments lines
                        workshopComments: data.data.workshopComments?.lines?.find(line => line.lineNumber === 1)?.text || '',
                        workSummaryLine2: data.workshopComments?.lines?.find(line => line.lineNumber === 2)?.text || '',
                        workSummaryLine2: data.data.workshopComments?.lines?.find(line => line.lineNumber === 2)?.text || '',

                        // Handle cost data
                        sparePartsCost: data.data.costSummary?.sparePartsCost?.toString() || '',
                        labourCharges: data.data.costSummary?.labourCharges?.toString() || '',
                        totalCost: data.data.costSummary?.totalCost?.toString() || '',
                        approvedDeduction: data.data.costSummary?.approvedDeduction?.toString() || '',

                        // Handle table rows
                        tableRows: data.data.sparePartsTable && data.data.sparePartsTable.length > 0
                            ? data.data.sparePartsTable.concat(
                                Array(Math.max(0, 7 - data.data.sparePartsTable.length)).fill().map(() => ({
                                    description: '',
                                    qty: '',
                                    cost: '',
                                    total: ''
                                }))
                            ).slice(0, 7)
                            : Array(7).fill().map(() => ({
                                description: '',
                                qty: '',
                                cost: '',
                                total: ''
                            }))
                    });
                } else {
                    console.error('Backcharge document not found');
                    setDocumentExists(false);
                    alert('Document not found with the provided reference number.');
                    // navigate('/backcharge-list'); // Redirect to list page
                }
            } catch (error) {
                console.error('Error fetching backcharge data:', error);
                setDocumentExists(false);
                alert('Error loading document. Please try again.');
                navigate('/backcharge-list');
            } finally {
                setIsLoading(false);
            }
        };

        fetchBackchargeData();
    }, [refNo, navigate]);

    // API function to update backcharge data
    const updateBackchargeData = async () => {
        if (!documentId) return;

        setIsLoading(true);
        setSaveStatus('');

        try {
            const backchargeData = {
                reportNo: formData.reportNo,
                equipmentType: formData.equipmentType,
                plateNo: formData.plateNo,
                model: formData.model,
                supplierName: formData.supplierName,
                contactPerson: formData.contactPerson,
                siteLocation: formData.siteLocation,
                date: formData.date,

                // Scope of work lines
                scopeOfWork: formData.scopeOfWork,
                scopeLine2Text: formData.scopeLine2Text,

                // Workshop comments lines
                workshopComments: formData.workshopComments,
                workSummaryLine2: formData.workSummaryLine2,

                // Cost data
                sparePartsCost: formData.sparePartsCost,
                labourCharges: formData.labourCharges,
                totalCost: formData.totalCost,
                approvedDeduction: formData.approvedDeduction,

                // Table rows data
                tableRows: formData.tableRows.filter(row =>
                    row.description || row.qty || row.cost || row.total
                )
            };

            const response = await apiRequest(`${END_POINT}/backcharge/update-backcharge/${documentId}`, 'PUT', backchargeData);

            if (response.ok) {
                setSaveStatus('success');
                setIsEditing(false);
                console.log('Backcharge data updated successfully:', response.data);
                setTimeout(() => setSaveStatus(''), 3000);
            } else {
                setSaveStatus('error');
                console.error('Failed to update backcharge data:', response.message);
            }

        } catch (error) {
            setSaveStatus('error');
            console.error('Error updating backcharge data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const getFileName = () => {
        return `Backcharge-Report-${formData.reportNo}-${formData.equipmentType}`;
    };

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

    const handleDownloadPdf = async () => {
        const input = componentRef.current;

        if (!input) {
            console.error('Component ref not found');
            alert('Error: Component reference not found');
            return;
        }

        try {
            console.log('Starting high-quality PDF generation...');

            const controls = document.querySelector('.bcr-controls');
            if (controls) {
                controls.style.display = 'none';
            }

            await new Promise(resolve => setTimeout(resolve, 200));

            const canvas = await html2canvas(input, {
                scale: 3,
                logging: false,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#FFFFFF',
                width: input.offsetWidth,
                height: input.offsetHeight,
                scrollX: 0,
                scrollY: 0,
                foreignObjectRendering: false,
                letterRendering: true,
                dpi: 300,
                onclone: (clonedDoc) => {
                    const clonedControls = clonedDoc.querySelector('.bcr-controls');
                    if (clonedControls) {
                        clonedControls.remove();
                    }

                    const allText = clonedDoc.querySelectorAll('*');
                    allText.forEach(element => {
                        element.style.webkitFontSmoothing = 'antialiased';
                        element.style.mozOsxFontSmoothing = 'grayscale';
                    });
                }
            });

            console.log('High-quality canvas created, generating PDF...');

            const imgData = canvas.toDataURL('image/png', 1.0);

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: false
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            if (imgHeight > pdfHeight) {
                const scaledWidth = (canvas.width * pdfHeight) / canvas.height;
                const scaledHeight = pdfHeight;
                const x = (pdfWidth - scaledWidth) / 2;
                pdf.addImage(imgData, 'PNG', x, 0, scaledWidth, scaledHeight, '', 'FAST');
            } else {
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST');
            }

            console.log('High-quality PDF generated successfully');
            pdf.save(getFileName() + '.pdf');

        } catch (error) {
            console.error('PDF generation error:', error);
            alert(`Error generating PDF: ${error.message || 'Unknown error'}`);
        } finally {
            const controls = document.querySelector('.bcr-controls');
            if (controls) {
                controls.style.display = 'block';
            }
        }
    };

    const handlePrint = async () => {
        try {
            const controls = document.querySelector('.bcr-controls');
            if (controls) controls.style.display = 'none';

            const logoBase64 = await convertImageToBase64(logoImage);
            const textBase64 = await convertImageToBase64(alAnsariText);

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
                    margin: 0;
                }
                
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
                
                :root {
                    --bcr-primary-color: #1d4ed8;
                    --bcr-background-light: #ffffff;
                    --bcr-background-dark: #1a202c;
                    --bcr-text-light: #1f2937;
                    --bcr-text-dark: #f7fafc;
                    --bcr-border-light: #888888;
                    --bcr-border-dark: #000000;
                    --bcr-gray-100: #f3f4f6;
                    --bcr-gray-200: #e5e7eb;
                    --bcr-gray-600: #4b5563;
                    --bcr-gray-700: #374151;
                    --bcr-blue-700: #1d4ed8;
                }
                
                body {
                    margin: 0;
                    padding: 0;
                    background-color: rgb(248, 248, 248);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                }
                
                .bcr-main-wrapper {
                    font-family: 'Roboto', 'Arial', sans-serif;
                    background-color: var(--bcr-background-light);
                    color: var(--bcr-text-light);
                    width: 260mm !important;
                    min-height: 380mm !important;
                    margin: 0 auto !important;
                    padding: 3mm 16px 10mm 16px !important;
                    box-sizing: border-box !important;
                    font-size: 11pt !important;
                    line-height: 1.3 !important;
                    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1) !important;
                    position: relative !important;
                    max-height: 380mm !important;
                    margin-bottom: 2rem !important;
                    overflow: hidden;
                    border-collapse: collapse;
                }
                
                .bcr-container {
                    width: 100%;
                    height: 100%;
                }
                
                .bcr-header-section {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding-bottom: 0.5rem;
                    margin-bottom: 0.5rem;
                }
                
                .bcr-logo-container {
                    display: flex;
                    align-items: center;
                    margin-right: 1rem;
                }
                
                .logo-placeholder-l img {
                    max-width: 200px;
                    object-fit: contain;
                }
                
                .company-details-b {
                    margin-right: 1.5rem;
                    height: 100%;
                    display: flex;
                    align-items: center;
                }
                
                .company-details-b img {
                    width: 22rem;
                }
                
                .bcr-document-title {
                    text-align: center;
                    font-weight: bold;
                    font-size: 20px;
                    text-decoration: underline;
                    margin: 0.1rem 0;
                    color: var(--bcr-text-light);
                }
                
                .bcr-info-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 0;
                    border-left: 1px solid #000;
                }
                
                .bcr-info-full-row {
                    grid-column: 1 / -1;
                    padding: 0.2rem 0.3rem;
                }
                
                .bcr-title-hero {
                    border-right: 1px solid #000;
                    border-bottom: 1px solid #000;
                    border-top: 1px solid #000;
                    padding-bottom: 1rem;
                }
                
                .bcr-info-field {
                    display: grid;
                    grid-template-columns: auto auto 1fr;
                    align-items: center;
                    gap: 0.5rem;
                }
                
                .bcr-field-label {
                    font-weight: 400;
                    font-size: 19px;
                    margin-right: 0.4rem;
                }
                
                .bcr-field-label-wide {
                    font-weight: 400;
                    font-size: 19px;
                    width: 160px;
                }
                
                .bcr-field-value {
                    font-weight: 400;
                    font-size: 19px;
                }
                
                .bcr-field-value-bold {
                    font-weight: 400;
                    font-size: 19px;
                    padding-bottom: 2px;
                    display: inline-block;
                    min-width: 150px;
                    border-bottom: 1px solid #000;
                    margin-left: 2rem;
                }
                
                .bcr-signature-label {
                    font-weight: 400;
                    font-size: 19px;
                    margin-left: 3rem;
                }
                
                .bcr-scope-section {
                    margin-bottom: 1rem;
                    padding: 0.6rem 0;
                    font-weight: 400;
                    font-size: 19px;
                    display: flex;
                    flex-direction: column;
                }
                
                .bcr-scope-section-sub {
                    font-weight: 400;
                    font-size: 19px;
                    display: flex;
                }
                
                .bcr-scope-label {
                    font-weight: bold;
                    width: 20%;
                }
                
                .scope-value {
                    width: 80%;
                    border-bottom: 1px solid #000;
                    padding-bottom: 2px;
                }
                
                .bcr-parts-section {
                    margin: 0.3rem 0;
                    border-left: 1px solid #000;
                }
                
                .bcr-parts-header {
                    font-weight: bold;
                    text-align: center;
                    padding: 0.2rem;
                    border-top: 1px solid #000;
                    margin-bottom: 0;
                    font-size: 19px;
                }
                
                .bcr-parts-table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .bcr-parts-table-header {
                    border-top: 1px solid #000;
                    border-bottom: 1px solid #000;
                    padding: 0.2rem;
                    font-size: 19px;
                    text-align: center;
                    font-weight: bold;
                }
                
                .bcr-parts-table-header.sign-border-td-r,
                .bcr-parts-table-header.sign-border-td-l {
                    border-right: 1px solid #000;
                    border-left: 1px solid #000;
                }
                
                .bcr-parts-table-cell {
                    border-bottom: 1px solid #000;
                    padding: 0.2rem;
                    height: 12px;
                    font-size: 0.76rem;
                    text-align: center;
                    font-weight: 600;
                }
                
                .bcr-parts-table-cell.sign-border-td-l,
                .bcr-parts-table-cell.sign-border-td-r {
                    border-left: 1px solid #000;
                    border-right: 1px solid #000;
                }
                
                .bcr-parts-table-footer {
                    border-bottom: 1px solid #000;
                    padding: 0.2rem;
                    font-size: 14px;
                    text-align: center;
                    font-weight: 600;
                }
                
                .bcr-parts-table-footer.sign-border-td-l {
                    border-left: 1px solid #000;
                }
                
                .bcr-parts-table-total-label {
                    text-align: right;
                    font-weight: bold;
                }
                
                .bcr-comments-section {
                    margin: 0.3rem 0;
                    border: 1px solid #000;
                    padding: 0.2rem 0.5rem 0.5rem 0.5rem;
                }
                
                .bcr-comments-label {
                    font-weight: bold;
                    font-size: 21px;
                }
                
                .bcr-comments-text {
                    margin: 0.6rem 0 0 4.5rem;
                    font-weight: 400;
                    font-size: 19px;
                    border-bottom: 1px solid #000;
                    padding-bottom: 2px;
                }
                
                .work-summary-line-2 {
                    margin-top: 0.6rem;
                    font-weight: 400;
                    font-size: 19px;
                    width: 100%;
                    border-bottom: 1px solid #000;
                    padding-bottom: 2px;
                }
                
                .bcr-cost-summary-section {
                    margin: 0.3rem 0;
                    border: 1px solid #000;
                    padding: 0.8rem 0.2rem 0.7rem 0.2rem;
                }
                
                .bcr-cost-summary-title {
                    font-weight: bold;
                    margin-bottom: 0.3rem;
                    font-size: 21px;
                }
                
                .bcr-cost-summary-content {
                    margin-bottom: 0.3rem;
                    width: 58%;
                    margin-left: auto;
                }
                
                .bcr-cost-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 0.1rem;
                    font-weight: 400;
                    font-size: 21px;
                    padding-top: 0.4rem;
                }
                
                .bcr-cost-value-container {
                    display: flex;
                    align-items: center;
                    min-width: 250px;
                    max-width: 250px;
                }
                
                .bcr-currency {
                    margin-right: 1rem;
                    font-weight: 500;
                }
                
                .bcr-cost-amount {
                    border-bottom: 1px solid #000;
                    padding-bottom: 1px;
                    font-size: 19px;
                    min-width: 100px;
                }
                
                .price-colon {
                    margin-right: 2rem;
                }
                
                .bcr-deduction-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-top: 0.8rem;
                    font-weight: 400;
                    font-size: 19px;
                }
                
                .bcr-deduction-label {
                    flex: 1;
                    font-weight: bold;
                    font-size: 21px;
                }
                
                .bcr-deduction-value-container {
                    display: flex;
                    align-items: center;
                    min-width: 250px;
                    max-width: 250px;
                    font-size: 21px;
                }
                
                .bcr-auth-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 1rem;
                }
                
                .bcr-auth-header {
                    border: 1px solid #000;
                    padding: 0.2rem;
                    text-align: center;
                    font-size: 19px;
                    font-weight: 600;
                }
                
                .bcr-auth-header.sign-border-td-r {
                    border-right: 1px solid #000;
                }
                
                .bcr-auth-cell {
                    border-left: 1px solid #000;
                    border-bottom: 1px solid #000;
                    padding: 0.2rem;
                    text-align: center;
                    font-size: 19px;
                    font-weight: 600;
                }
                
                .bcr-auth-cell.sign-border-td-r {
                    border-right: 1px solid #000;
                }
                
                .bcr-auth-signature-space {
                    height: 120px;
                }
            </style>
        </head>
        <body>
            <div class="bcr-main-wrapper">
                <div class="bcr-container">
                    <div class="bcr-report-border">
                        <header class="bcr-header-section">
                            <div class="bcr-logo-container">
                                <div class="logo-placeholder-l">
                                    <img src="${logoBase64}" alt="Company Logo" />
                                </div>
                            </div>
                            <div class="company-details-b company-details-l">
                                <img src="${textBase64}" alt="AL Ansari Transport & Enterprises W.L.L" />
                            </div>
                        </header>

                        <h1 class="bcr-document-title">MAINTENANCE BACK CHARGE REPORT</h1>

                        <div class="bcr-info-grid">
                            <div class="bcr-info-full-row">
                                <div class="bcr-info-field">
                                    <span class="bcr-field-label">Ref No  :</span>
                                    <span class="bcr-field-value">${refNo}</span>
                                </div>
                            </div>
                            <div class="bcr-title-hero">
                                <div class="bcr-info-full-row">
                                    <div class="bcr-info-field">
                                        <span class="bcr-field-label-wide">Report No</span>
                                        <span>:</span>
                                        <span class="bcr-field-value-bold">${formData.reportNo}</span>
                                    </div>
                                </div>
                                <div class="bcr-info-full-row">
                                    <div class="bcr-info-field">
                                        <span class="bcr-field-label-wide">Equipment Type</span>
                                        <span>:</span>
                                        <span class="bcr-field-value-bold">${formData.equipmentType}</span>
                                    </div>
                                </div>
                                <div class="bcr-info-full-row">
                                    <div class="bcr-info-field">
                                        <span class="bcr-field-label-wide">Plate No</span>
                                        <span>:</span>
                                        <span class="bcr-field-value-bold">${formData.plateNo}</span>
                                    </div>
                                </div>
                                <div class="bcr-info-full-row">
                                    <div class="bcr-info-field">
                                        <span class="bcr-field-label-wide">Model</span>
                                        <span>:</span>
                                        <span class="bcr-field-value-bold">${formData.model}</span>
                                    </div>
                                </div>
                                <div class="bcr-info-full-row">
                                    <div class="bcr-info-field">
                                        <span class="bcr-field-label-wide">Supplier Name</span>
                                        <span>:</span>
                                        <span class="bcr-field-value-bold">${formData.supplierName}</span>
                                    </div>
                                </div>
                                <div class="bcr-info-full-row">
                                    <div class="bcr-info-field">
                                        <span class="bcr-field-label-wide">Contact Person</span>
                                        <span>:</span>
                                        <span class="bcr-field-value-bold">${formData.contactPerson}</span>
                                    </div>
                                </div>
                                <div class="bcr-info-full-row">
                                    <div class="bcr-info-field">
                                        <span class="bcr-field-label-wide">Site Location</span>
                                        <span>:</span>
                                        <span class="bcr-field-value-bold">${formData.siteLocation}</span>
                                    </div>
                                </div>
                                <div class="bcr-info-full-row">
                                    <div class="bcr-info-field">
                                        <span class="bcr-field-label-wide">Date</span>
                                        <span>:</span>
                                        <span class="bcr-field-value-bold">${formData.date}</span>
                                        <span class="bcr-signature-label">Customer Signature & Date : </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="bcr-scope-section">
                            <div class="bcr-scope-section-sub">
                                <span class="bcr-scope-label">Scope of Work :-</span>
                                <span class="scope-value">${formData.scopeOfWork}</span>
                            </div>
                            ${formData.scopeLine2Text ? `<span class="scope-value">${formData.scopeLine2Text}</span>` : ''}
                        </div>

                        <div class="bcr-parts-section">
                            <h3 class="bcr-parts-header">DETAILS OF SPARE PARTS & OTHER MATERIALS USED :</h3>
                            <table class="bcr-parts-table">
                                <thead>
                                    <tr>
                                        <th class="bcr-parts-table-header">SL</th>
                                        <th class="bcr-parts-table-header sign-border-td-r sign-border-td-l">PART DESCRIPTION</th>
                                        <th class="bcr-parts-table-header sign-border-td-r">QTY</th>
                                        <th class="bcr-parts-table-header sign-border-td-r">COST</th>
                                        <th class="bcr-parts-table-header">TOTAL</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${formData.tableRows.map((row, index) => `
                                        <tr>
                                            <td class="bcr-parts-table-cell">${index + 1}</td>
                                            <td class="bcr-parts-table-cell sign-border-td-l sign-border-td-r">${row.description}</td>
                                            <td class="bcr-parts-table-cell sign-border-td-r">${row.qty}</td>
                                            <td class="bcr-parts-table-cell sign-border-td-r">${row.cost}</td>
                                            <td class="bcr-parts-table-cell">${row.total}</td>
                                        </tr>
                                    `).join('')}
                                    <tr>
                                        <td class="bcr-parts-table-footer bcr-parts-table-total-label" colspan="4">TOTAL</td>
                                        <td class="bcr-parts-table-footer sign-border-td-l"></td>
                                    </tr>
                                </tbody>
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
                                <div class="bcr-cost-row">
                                    <span class="bcr-cost-label">Spare Parts & Materials</span>
                                    <div class="bcr-cost-value-container">
                                        <span class="price-colon">:</span>
                                        <span class="bcr-currency">QR</span>
                                        <span class="bcr-cost-amount">${formData.sparePartsCost}</span>
                                    </div>
                                </div>
                                <div class="bcr-cost-row">
                                    <span class="bcr-cost-label">Labour Charges</span>
                                    <div class="bcr-cost-value-container">
                                        <span class="price-colon">:</span>
                                        <span class="bcr-currency">QR</span>
                                        <span class="bcr-cost-amount">${formData.labourCharges}</span>
                                    </div>
                                </div>
                                <div class="bcr-cost-row">
                                    <span class="bcr-cost-label">Total Cost</span>
                                    <div class="bcr-cost-value-container">
                                        <span class="price-colon">:</span>
                                        <span class="bcr-currency">QR</span>
                                        <span class="bcr-cost-amount">${formData.totalCost}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="bcr-deduction-row">
                                <span class="bcr-deduction-label">Approved Cost of Deduction from Supplier :-</span>
                                <div class="bcr-deduction-value-container">
                                    <span class="price-colon">:</span>
                                    <span class="bcr-currency">QR</span>
                                    <span class="bcr-cost-amount">${formData.approvedDeduction}</span>
                                </div>
                            </div>
                        </div>

                        <div class="bcr-auth-section">
                            <table class="bcr-auth-table">
                                <thead>
                                    <tr>
                                        <th class="bcr-auth-header">Workshop Manager</th>
                                        <th class="bcr-auth-header">Purchase Manager</th>
                                        <th class="bcr-auth-header">Operations Manager</th>
                                        <th class="bcr-auth-header sign-border-td-r">Authorized Signatory</th>
                                    </tr>
                                </thead>
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
                                        <td class="bcr-auth-cell sign-border-td-r">Ahammed Kamal</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `;

            printWindow.document.open();
            printWindow.document.write(htmlContent);
            printWindow.document.close();

            printWindow.addEventListener('load', () => {
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 1000);
            });

            if (controls) controls.style.display = 'block';

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');

            const controls = document.querySelector('.bcr-controls');
            if (controls) controls.style.display = 'block';
        }
    };

    const handleInputChange = (field, value) => {
        if (!isEditing) return; // Only allow changes when in edit mode
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTableChange = (index, field, value) => {
        if (!isEditing) return; // Only allow changes when in edit mode
        setFormData(prev => ({
            ...prev,
            tableRows: prev.tableRows.map((row, i) =>
                i === index ? { ...row, [field]: value } : row
            )
        }));
    };

    const renderTableRows = () => {
        return formData.tableRows.map((row, index) => (
            <tr key={index}>
                <td className="bcr-parts-table-cell bcr-parts-table-center">{index + 1}</td>
                <td className="bcr-parts-table-cell bcr-parts-table-desc sign-border-td-l sign-border-td-r">
                    <input
                        type="text"
                        value={row.description}
                        onChange={(e) => handleTableChange(index, 'description', e.target.value)}
                        disabled={!isEditing}
                        style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 'inherit',
                            padding: '0',
                            cursor: isEditing ? 'text' : 'default'
                        }}
                    />
                </td>
                <td className="bcr-parts-table-cell sign-border-td-r">
                    <input
                        type="text"
                        value={row.qty}
                        onChange={(e) => handleTableChange(index, 'qty', e.target.value)}
                        disabled={!isEditing}
                        style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 'inherit',
                            padding: '0',
                            textAlign: 'center',
                            cursor: isEditing ? 'text' : 'default'
                        }}
                    />
                </td>
                <td className="bcr-parts-table-cell sign-border-td-r">
                    <input
                        type="text"
                        value={row.cost}
                        onChange={(e) => handleTableChange(index, 'cost', e.target.value)}
                        disabled={!isEditing}
                        style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 'inherit',
                            padding: '0',
                            textAlign: 'center',
                            cursor: isEditing ? 'text' : 'default'
                        }}
                    />
                </td>
                <td className="bcr-parts-table-cell">
                    <input
                        type="text"
                        value={row.total}
                        onChange={(e) => handleTableChange(index, 'total', e.target.value)}
                        disabled={!isEditing}
                        style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 'inherit',
                            padding: '0',
                            textAlign: 'center',
                            cursor: isEditing ? 'text' : 'default'
                        }}
                    />
                </td>
            </tr>
        ));
    };

    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        // Optionally reload data to discard changes
        window.location.reload();
    };

    const handleSaveEdit = () => {
        updateBackchargeData();
    };

    if (isLoading && !documentExists) {
        return (
            <div className="bcr-hero-wrapper">
                <div className="bcr-controls">
                    <p>Loading document...</p>
                </div>
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

    return (
        <div className="bcr-hero-wrapper">
            <div className="bcr-controls">
                {saveStatus && (
                    <div className={`bcr-save-status ${saveStatus === 'success' ? 'success' : 'error'}`}>
                        {saveStatus === 'success' ? '✓ Updated successfully!' : '✗ Update failed!'}
                    </div>
                )}

                <div className="bcr-button-group">
                    {!isEditing ? (
                        <>
                            <div className='bcr-btn-left'>
                                <Button
                                    text="Edit"
                                    onClick={handleEdit}
                                    colorScheme="lime-700"
                                    variant="gradient"
                                    font="md"
                                    animation=""
                                    rounded="md"
                                    width="160px"
                                    height="38px"
                                    type="submit"
                                    textColor="white-200"
                                    shadowPosition="to-bottom"
                                    shadowColor="white-600"
                                />
                                <Button
                                    text="Download as PDF"
                                    onClick={handleDownloadPdf}
                                    colorScheme="violet-700"
                                    variant="gradient"
                                    font="md"
                                    animation=""
                                    rounded="md"
                                    width="160px"
                                    height="38px"
                                    type="submit"
                                    textColor="white-200"
                                    shadowPosition="to-bottom"
                                    shadowColor="white-600"
                                />
                            </div>
                            <div className='bcr-btn-right'>
                                <Button
                                    text="Print"
                                    onClick={handlePrint}
                                    colorScheme="amber-700"
                                    variant="gradient"
                                    font="md"
                                    animation=""
                                    rounded="md"
                                    width="160px"
                                    height="38px"
                                    type="submit"
                                    textColor="white-200"
                                    shadowPosition="to-bottom"
                                    shadowColor="white-600"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <button
                                className="bcr-action-button bcr-save-button"
                                onClick={handleSaveEdit}
                                disabled={isLoading}
                            >
                                {isLoading ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button className="bcr-action-button bcr-cancel-button" onClick={handleCancelEdit}>
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div ref={componentRef} className="bcr-main-wrapper">
                <div className="bcr-container">
                    <div className="bcr-report-border">
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

                        <div className="bcr-info-grid sign-border-td-l">
                            <div className="bcr-info-full-row">
                                <div className="bcr-info-field">
                                    <span className="bcr-field-label">Ref No  :</span>
                                    <span className="bcr-field-value">{refNo}</span>
                                </div>
                            </div>
                            <div className='sign-border-td-r sign-border-td-b sign-border-td-t bcr-title-hero'>
                                <div className="bcr-info-full-row">
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Report No</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.reportNo}
                                            onChange={(e) => handleInputChange('reportNo', e.target.value)}
                                            disabled={!isEditing}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                cursor: isEditing ? 'text' : 'default'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-info-full-row">
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Equipment Type</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.equipmentType}
                                            onChange={(e) => handleInputChange('equipmentType', e.target.value)}
                                            disabled={!isEditing}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                cursor: isEditing ? 'text' : 'default'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-info-full-row">
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Plate No</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.plateNo}
                                            onChange={(e) => handleInputChange('plateNo', e.target.value)}
                                            disabled={!isEditing}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                cursor: isEditing ? 'text' : 'default'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-info-full-row">
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Model</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.model}
                                            onChange={(e) => handleInputChange('model', e.target.value)}
                                            disabled={!isEditing}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                cursor: isEditing ? 'text' : 'default'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-info-full-row">
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Supplier Name</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.supplierName}
                                            onChange={(e) => handleInputChange('supplierName', e.target.value)}
                                            disabled={!isEditing}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                cursor: isEditing ? 'text' : 'default'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-info-full-row">
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Contact Person</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.contactPerson}
                                            onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                                            disabled={!isEditing}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                cursor: isEditing ? 'text' : 'default'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-info-full-row">
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Site Location</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.siteLocation}
                                            onChange={(e) => handleInputChange('siteLocation', e.target.value)}
                                            disabled={!isEditing}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                cursor: isEditing ? 'text' : 'default'
                                            }}
                                        />
                                    </div>
                                </div>
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
                                                style={{
                                                    border: 'none',
                                                    outline: 'none',
                                                    background: 'transparent',
                                                    fontSize: 'inherit',
                                                    cursor: isEditing ? 'text' : 'default'
                                                }}
                                            />
                                            <span className="bcr-signature-label">Customer Signature & Date : </span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bcr-scope-section">
                            <div className='bcr-scope-section-sub'>
                                <span className="bcr-scope-label">Scope of Work :-</span>
                                <input
                                    type="text"
                                    value={formData.scopeOfWork}
                                    onChange={(e) => handleInputChange('scopeOfWork', e.target.value)}
                                    disabled={!isEditing}
                                    className='text-data-underline scope-value scope-line-1'
                                    style={{
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        fontSize: 'inherit',
                                        cursor: isEditing ? 'text' : 'default'
                                    }}
                                />
                            </div>
                            <input
                                type="text"
                                value={formData.scopeLine2Text || ''}
                                onChange={(e) => handleInputChange('scopeLine2Text', e.target.value)}
                                disabled={!isEditing}
                                className='text-data-underline scope-value-couple scope-line-2'
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    fontSize: 'inherit',
                                    cursor: isEditing ? 'text' : 'default'
                                }}
                            />
                        </div>

                        <div className="bcr-parts-section sign-border-td-l">
                            <h3 className="bcr-parts-header">DETAILS OF SPARE PARTS & OTHER MATERIALS USED :</h3>

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
                                    {renderTableRows()}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td className="bcr-parts-table-footer bcr-parts-table-total-label" colSpan="4">TOTAL</td>
                                        <td className="bcr-parts-table-footer sign-border-td-l text-center">{grantTotal}.00</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        <div className="bcr-comments-section">
                            <span className="bcr-comments-label">Workshop Manager's Comments/ Work Summary :-</span>
                            <input
                                type="text"
                                value={formData.workshopComments}
                                onChange={(e) => handleInputChange('workshopComments', e.target.value)}
                                disabled={!isEditing}
                                className="bcr-comments-text text-data-underline work-summary-line-1"
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    width: 'calc(100% - 4.5rem)',
                                    cursor: isEditing ? 'text' : 'default'
                                }}
                            />
                            <input
                                type="text"
                                value={formData.workSummaryLine2}
                                onChange={(e) => handleInputChange('workSummaryLine2', e.target.value)}
                                disabled={!isEditing}
                                className="work-summary-line-2 text-data-underline"
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    cursor: isEditing ? 'text' : 'default'
                                }}
                            />
                        </div>

                        <div className="bcr-cost-summary-section">
                            <h3 className="bcr-cost-summary-title">Summary of Costs :</h3>
                            <div className="bcr-cost-summary-content">
                                <div className="bcr-cost-row">
                                    <span className="bcr-cost-label">Spare Parts & Materials</span>
                                    <div className="bcr-cost-value-container">
                                        <span className='price-colon'>:</span>
                                        <span className="bcr-currency">QR</span>
                                        <input
                                            type="text"
                                            value={`${formData.sparePartsCost}.00`}
                                            onChange={(e) => handleInputChange('sparePartsCost', e.target.value)}
                                            disabled={!isEditing}
                                            className="bcr-cost-amount"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                cursor: isEditing ? 'text' : 'default'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-cost-row">
                                    <span className="bcr-cost-label">Labour Charges</span>
                                    <div className="bcr-cost-value-container">
                                        <span className='price-colon'>:</span>
                                        <span className="bcr-currency">QR</span>
                                        <input
                                            type="text"
                                            value={`${formData.labourCharges}.00`}
                                            onChange={(e) => handleInputChange('labourCharges', e.target.value)}
                                            disabled={!isEditing}
                                            className="bcr-cost-amount"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                cursor: isEditing ? 'text' : 'default'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-cost-row">
                                    <span className="bcr-cost-label">Total Cost</span>
                                    <div className="bcr-cost-value-container">
                                        <span className='price-colon'>:</span>
                                        <span className="bcr-currency">QR</span>
                                        <input
                                            type="text"
                                            value={`${formData.totalCost}.00`}
                                            onChange={(e) => handleInputChange('totalCost', e.target.value)}
                                            disabled={!isEditing}
                                            className="bcr-cost-amount"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                cursor: isEditing ? 'text' : 'default'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="bcr-deduction-row">
                                <span className="bcr-deduction-label">Approved Cost of Deduction from Supplier :-</span>
                                <div className="bcr-deduction-value-container">
                                    <span className='price-colon'>:</span>
                                    <span className="bcr-currency">QR</span>
                                    <input
                                        type="text"
                                        value={`${formData.approvedDeduction}.00`}
                                        onChange={(e) => handleInputChange('approvedDeduction', e.target.value)}
                                        disabled={!isEditing}
                                        className="bcr-cost-amount"
                                        style={{
                                            border: 'none',
                                            outline: 'none',
                                            background: 'transparent',
                                            cursor: isEditing ? 'text' : 'default'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

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
                                        <td className="bcr-auth-cell bcr-auth-signature-space"></td>
                                        <td className="bcr-auth-cell"></td>
                                        <td className="bcr-auth-cell"></td>
                                        <td className="bcr-auth-cell sign-border-td-r"></td>
                                    </tr>
                                    <tr>
                                        <td className="bcr-auth-cell bcr-auth-name sign-border-td-b">Firoz Khan</td>
                                        <td className="bcr-auth-cell bcr-auth-name sign-border-td-b">Abdul Malik</td>
                                        <td className="bcr-auth-cell bcr-auth-name sign-border-td-b">Suresh Kanth</td>
                                        <td className="bcr-auth-cell bcr-auth-name sign-border-td-r sign-border-td-b">Ahammed Kamal</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BackchargeDoc;