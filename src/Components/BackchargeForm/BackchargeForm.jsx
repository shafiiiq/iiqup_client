import React, { useEffect, useRef, useState } from 'react';
import './BackchargeForm.css';
import logoImage from '../../assets/images/al-ansari-color.png';
import alAnsariText from '../../assets/images/al-ansari-text.png';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { apiRequest } from '../../utils/0auth';
import { END_POINT } from '../../constants';
import Button from '../../common/Button/Button';
import { useHeaderTitle } from '../../context/HeaderTitleContext';

const BackchargeForm = () => {
    const scopeLine1Ref = useRef(null);
    const workLine1Ref = useRef(null);
    const componentRef = useRef();
    const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
    const [imagesLoaded, setImagesLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [saveStatus, setSaveStatus] = useState('');
    const [equipmentSuggestions, setEquipmentSuggestions] = useState([]);
    const [supplierSuggestions, setSupplierSuggestions] = useState([]);
    const [siteSuggestions, setSiteSuggestions] = useState([]);
    const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
    const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
    const [showSiteDropdown, setShowSiteDropdown] = useState(false);
    const [allBackchargeData, setAllBackchargeData] = useState([]);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isGeneratingRef, setIsGeneratingRef] = useState(false);

    // State for form data
    const [formData, setFormData] = useState({
        refNo: '', // Will be auto-filled
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
        if (formData.refNo) {
            const title = `Ref No: ${formData.refNo}`
            const subtitle = `Backcharge For: ${formData.supplierName}`;
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
    }, [formData.refNo, formData.supplierName]);

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoadingData(true);
            try {
                // Load all backcharge reports for filtering
                const backchargeResponse = await apiRequest(`${END_POINT}/backcharge/get-backcharge-reports`, 'GET');
                if (backchargeResponse.ok) {
                    const data = await backchargeResponse.json();
                    if (data.success && data.data) {
                        setAllBackchargeData(data.data);
                    }
                }

                // Auto-generate reference number
                const refNumber = await generateRefNumber();
                setFormData(prev => ({ ...prev, refNo: refNumber }));
            } catch (error) {
                console.error('Error loading initial data:', error);
            } finally {
                setIsLoadingData(false);
            }
        };

        loadInitialData();
    }, []);

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
                setImagesLoaded(true); // Continue anyway
            }
        };

        loadImages();
    }, []);

    // Generate automatic reference number
    const generateRefNumber = async () => {
        setIsGeneratingRef(true);
        try {
            const response = await apiRequest(`${END_POINT}/backcharge/check-latest-backcharge-ref`, 'GET');
            if (response.ok) {
                const data = await response.json();

                if (data.success && data.data) {
                    const latestNumber = data.data.latestNumber || 140;
                    const currentDate = new Date();
                    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const year = String(currentDate.getFullYear()).slice(-2);

                    // Generate format: ATE194-09-25 (no dash between ATE and number)
                    const newRefNumber = `ATE${latestNumber + 1}-${month}-${year}`;
                    return newRefNumber;
                }
            }

            // Fallback if API fails
            const currentDate = new Date();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const year = String(currentDate.getFullYear()).slice(-2);
            return `ATE141-${month}-${year}`;

        } catch (error) {
            console.error('Error generating ref number:', error);
            const currentDate = new Date();
            const month = String(currentDate.getMonth() + 1).padStart(2, '0');
            const year = String(currentDate.getFullYear()).slice(-2);
            return `ATE141-${month}-${year}`;
        } finally {
            setIsGeneratingRef(false);
        }
    };

    // Search functions using frontend filtering
    const searchEquipmentByPlate = (plateNo) => {
        if (!plateNo || plateNo.length < 1) {
            setShowEquipmentDropdown(false);
            return;
        }

        const filteredEquipment = allBackchargeData
            .filter(item => item.plateNo && item.plateNo.toLowerCase().includes(plateNo.toLowerCase()))
            .reduce((acc, current) => {
                const existing = acc.find(item => item.plateNo.toLowerCase() === current.plateNo.toLowerCase());
                if (!existing) {
                    acc.push({
                        plateNo: current.plateNo,
                        equipmentType: current.equipmentType,
                        model: current.model,
                        supplierName: current.supplierName,
                        contactPerson: current.contactPerson
                    });
                }
                return acc;
            }, [])
            .slice(0, 10);

        if (filteredEquipment.length > 0) {
            setEquipmentSuggestions(filteredEquipment);
            setShowEquipmentDropdown(true);
        } else {
            setShowEquipmentDropdown(false);
        }
    };

    const searchSuppliers = (supplierName) => {
        if (!supplierName || supplierName.length < 1) {
            setShowSupplierDropdown(false);
            return;
        }

        const filteredSuppliers = allBackchargeData
            .filter(item => item.supplierName && item.supplierName.toLowerCase().includes(supplierName.toLowerCase()))
            .reduce((acc, current) => {
                const existing = acc.find(item => item.name.toLowerCase() === current.supplierName.toLowerCase());
                if (!existing) {
                    acc.push({
                        name: current.supplierName,
                        contactPerson: current.contactPerson
                    });
                }
                return acc;
            }, [])
            .slice(0, 10);

        if (filteredSuppliers.length > 0) {
            setSupplierSuggestions(filteredSuppliers);
            setShowSupplierDropdown(true);
        } else {
            setShowSupplierDropdown(false);
        }
    };

    const searchSites = (siteLocation) => {
        if (!siteLocation || siteLocation.length < 1) {
            setShowSiteDropdown(false);
            return;
        }

        const filteredSites = allBackchargeData
            .filter(item => item.siteLocation && item.siteLocation.toLowerCase().includes(siteLocation.toLowerCase()))
            .reduce((acc, current) => {
                const existing = acc.find(item => item.location.toLowerCase() === current.siteLocation.toLowerCase());
                if (!existing) {
                    acc.push({
                        location: current.siteLocation
                    });
                }
                return acc;
            }, [])
            .slice(0, 10);

        if (filteredSites.length > 0) {
            setSiteSuggestions(filteredSites);
            setShowSiteDropdown(true);
        } else {
            setShowSiteDropdown(false);
        }
    };

    // Selection handlers
    const handleEquipmentSelect = (equipment) => {
        setFormData(prev => ({
            ...prev,
            plateNo: equipment.plateNo,
            equipmentType: equipment.equipmentType,
            model: equipment.model,
            supplierName: equipment.supplierName,
            contactPerson: equipment.contactPerson
        }));
        setShowEquipmentDropdown(false);
        setEquipmentSuggestions([]);
    };

    const handleSupplierSelect = (supplier) => {
        setFormData(prev => ({
            ...prev,
            supplierName: supplier.name,
            contactPerson: supplier.contactPerson
        }));
        setShowSupplierDropdown(false);
        setSupplierSuggestions([]);
    };

    const handleSiteSelect = (site) => {
        setFormData(prev => ({
            ...prev,
            siteLocation: site.location
        }));
        setShowSiteDropdown(false);
        setSiteSuggestions([]);
    };

    // Enhanced input handler with search
    const handleInputChangeWithSearch = (field, value) => {
        handleInputChange(field, value);

        if (field === 'plateNo') {
            clearTimeout(window.plateNoTimeout);
            window.plateNoTimeout = setTimeout(() => searchEquipmentByPlate(value), 300);
        } else if (field === 'supplierName') {
            clearTimeout(window.supplierTimeout);
            window.supplierTimeout = setTimeout(() => searchSuppliers(value), 300);
        } else if (field === 'siteLocation') {
            clearTimeout(window.siteTimeout);
            window.siteTimeout = setTimeout(() => searchSites(value), 300);
        }

        if (!value) {
            if (field === 'plateNo') setShowEquipmentDropdown(false);
            if (field === 'supplierName') setShowSupplierDropdown(false);
            if (field === 'siteLocation') setShowSiteDropdown(false);
        }
    };

    // API function to save backcharge data
    const saveBackchargeData = async () => {
        setIsLoading(true);
        setSaveStatus('');

        try {
            // Prepare data structure according to your backend schema
            const backchargeData = {
                reportNo: formData.reportNo,
                refNo: formData.refNo,
                equipmentType: formData.equipmentType,
                plateNo: formData.plateNo,
                model: formData.model,
                supplierName: formData.supplierName,
                contactPerson: formData.contactPerson,
                siteLocation: formData.siteLocation,
                date: formData.date,

                // Scope of work - line 1
                scopeOfWork: formData.scopeOfWork,
                // Scope of work - line 2
                scopeLine2Text: formData.scopeLine2Text,

                // Workshop comments - line 1
                workshopComments: formData.workshopComments,
                // Workshop comments - line 2
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

            const response = await apiRequest(`${END_POINT}/backcharge/add-backcharge`, 'POST', backchargeData);

            if (response.ok) {
                setSaveStatus('success');
                // Optional: Clear form or show success message
                setTimeout(() => setSaveStatus(''), 3000);
            } else {
                setSaveStatus('error');
                console.error('Failed to save backcharge data:', response.message);
            }

        } catch (error) {
            setSaveStatus('error');
            console.error('Error saving backcharge data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // handle print and download 
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
            // Hide controls during capture
            const controls = document.querySelector('.bcr-controls');
            if (controls) {
                controls.style.display = 'none';
            }

            // Wait for UI to update
            await new Promise(resolve => setTimeout(resolve, 200));

            // High-quality canvas capture
            const canvas = await html2canvas(input, {
                scale: 3, // Higher scale for better quality
                logging: false,
                useCORS: true,
                allowTaint: false,
                backgroundColor: '#FFFFFF',
                width: input.offsetWidth,
                height: input.offsetHeight,
                scrollX: 0,
                scrollY: 0,
                foreignObjectRendering: false,
                // Better text rendering
                letterRendering: true,
                // Higher DPI
                dpi: 300,
                onclone: (clonedDoc) => {
                    // Remove controls from cloned document
                    const clonedControls = clonedDoc.querySelector('.bcr-controls');
                    if (clonedControls) {
                        clonedControls.remove();
                    }

                    // Enhance text quality in cloned document
                    const allText = clonedDoc.querySelectorAll('*');
                    allText.forEach(element => {
                        element.style.webkitFontSmoothing = 'antialiased';
                        element.style.mozOsxFontSmoothing = 'grayscale';
                    });
                }
            });

            // Use maximum quality for image conversion
            const imgData = canvas.toDataURL('image/png', 1.0);

            // Create PDF with better settings
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: false // Disable compression for better quality
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();

            // Calculate dimensions maintaining aspect ratio
            const imgWidth = pdfWidth;
            const imgHeight = (canvas.height * pdfWidth) / canvas.width;

            // Add image with high quality
            if (imgHeight > pdfHeight) {
                // If content is taller than page, scale it to fit
                const scaledWidth = (canvas.width * pdfHeight) / canvas.height;
                const scaledHeight = pdfHeight;
                const x = (pdfWidth - scaledWidth) / 2;
                pdf.addImage(imgData, 'PNG', x, 0, scaledWidth, scaledHeight, '', 'FAST');
            } else {
                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight, '', 'FAST');
            }
            pdf.save(getFileName() + '.pdf');

        } catch (error) {
            console.error('PDF generation error:', error);
            alert(`Error generating PDF: ${error.message || 'Unknown error'}`);
        } finally {
            // Always restore controls
            const controls = document.querySelector('.bcr-controls');
            if (controls) {
                controls.style.display = 'block';
            }
        }
    };

    const handlePrint = async () => {
        try {
            // Hide controls
            const controls = document.querySelector('.bcr-controls');
            if (controls) controls.style.display = 'none';

            // Convert images to base64 to ensure they load in PDF
            const logoBase64 = await convertImageToBase64(logoImage);
            const textBase64 = await convertImageToBase64(alAnsariText);

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
                                    <span class="bcr-field-value">${formData.refNo}</span>
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

            // Wait for images to load
            printWindow.addEventListener('load', () => {
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 1000); // Increased timeout to ensure complete loading
            });

            // Restore controls
            if (controls) controls.style.display = 'block';

        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('Error generating PDF. Please try again.');

            // Restore controls
            const controls = document.querySelector('.bcr-controls');
            if (controls) controls.style.display = 'block';
        }
    };

    // handle print and download ends 

    const handleScopeOverflow = (value) => {
        if (!scopeLine1Ref.current) return;

        const input = scopeLine1Ref.current;
        const maxWidth = input.offsetWidth;

        const temp = document.createElement('span');
        temp.style.font = window.getComputedStyle(input).font;
        temp.style.visibility = 'hidden';
        temp.style.position = 'absolute';
        temp.style.whiteSpace = 'nowrap';
        document.body.appendChild(temp);

        let line1Text = '';
        let line2Text = '';

        for (let i = 0; i < value.length; i++) {
            temp.textContent = line1Text + value[i];
            const newWidth = temp.offsetWidth;

            if (newWidth <= maxWidth - 20) {
                line1Text += value[i];
            } else {
                line2Text = value.substring(i);
                break;
            }
        }

        document.body.removeChild(temp);

        setFormData(prev => ({
            ...prev,
            scopeOfWork: line1Text,
            scopeLine2Text: line2Text
        }));
    };

    const handleWorkSummaryOverflow = (value) => {
        if (!workLine1Ref.current) return;

        const input = workLine1Ref.current;
        const maxWidth = input.offsetWidth;

        const temp = document.createElement('span');
        temp.style.font = window.getComputedStyle(input).font;
        temp.style.visibility = 'hidden';
        temp.style.position = 'absolute';
        temp.style.whiteSpace = 'nowrap';
        document.body.appendChild(temp);

        let line1Text = '';
        let line2Text = '';

        for (let i = 0; i < value.length; i++) {
            temp.textContent = line1Text + value[i];
            const newWidth = temp.offsetWidth;

            if (newWidth <= maxWidth - 20) {
                line1Text += value[i];
            } else {
                line2Text = value.substring(i);
                break;
            }
        }

        document.body.removeChild(temp);

        setFormData(prev => ({
            ...prev,
            workshopComments: line1Text,
            workSummaryLine2: line2Text
        }));
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleTableChange = (index, field, value) => {
        setFormData(prev => {
            const newTableRows = prev.tableRows.map((row, i) => {
                if (i === index) {
                    const updatedRow = { ...row, [field]: value };

                    // Auto-calculate total for this row when qty or cost changes
                    if (field === 'qty' || field === 'cost') {
                        const qty = parseFloat(field === 'qty' ? value : row.qty) || 0;
                        const cost = parseFloat(field === 'cost' ? value : row.cost) || 0;
                        updatedRow.total = (qty * cost).toFixed(2);
                    }

                    return updatedRow;
                }
                return row;
            });

            // Calculate grand total of all row totals
            const grandTotal = newTableRows.reduce((sum, row) => {
                return sum + (parseFloat(row.total) || 0);
            }, 0);

            // Auto-calculate total cost (spare parts + labour)
            const labourCharges = parseFloat(prev.labourCharges) || 0;
            const totalCost = grandTotal + labourCharges;

            return {
                ...prev,
                tableRows: newTableRows,
                sparePartsCost: grandTotal.toFixed(2),
                totalCost: totalCost.toFixed(2)
            };
        });
    };

    const handleLabourChargeChange = (value) => {
        setFormData(prev => {
            const labourCharges = parseFloat(value) || 0;
            const sparePartsCost = parseFloat(prev.sparePartsCost) || 0;
            const totalCost = sparePartsCost + labourCharges;

            return {
                ...prev,
                labourCharges: value,
                totalCost: totalCost.toFixed(2)
            };
        });
    };

    const renderTableRows = () => {
        return formData.tableRows.map((row, index) => (
            <tr key={index}>
                <td className="bcr-parts-table-cell bcr-parts-table-center ">{index + 1}</td>
                <td className="bcr-parts-table-cell bcr-parts-table-desc sign-border-td-l sign-border-td-r">
                    <input
                        type="text"
                        value={row.description}
                        onChange={(e) => handleTableChange(index, 'description', e.target.value)}
                        style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 'inherit',
                            padding: '0'
                        }}
                    />
                </td>
                <td className="bcr-parts-table-cell sign-border-td-r">
                    <input
                        type="text"
                        value={row.qty}
                        onChange={(e) => handleTableChange(index, 'qty', e.target.value)}
                        style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 'inherit',
                            padding: '0',
                            textAlign: 'center'
                        }}
                    />
                </td>
                <td className="bcr-parts-table-cell sign-border-td-r">
                    <input
                        type="text"
                        value={row.cost}
                        onChange={(e) => handleTableChange(index, 'cost', e.target.value)}
                        style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 'inherit',
                            padding: '0',
                            textAlign: 'center'
                        }}
                    />
                </td>
                <td className="bcr-parts-table-cell">
                    <input
                        type="text"
                        value={row.total}
                        onChange={(e) => handleTableChange(index, 'total', e.target.value)}
                        style={{
                            width: '100%',
                            border: 'none',
                            outline: 'none',
                            background: 'transparent',
                            fontSize: 'inherit',
                            padding: '0',
                            textAlign: 'center'
                        }}
                    />
                </td>
            </tr>
        ));
    };

    return (
        <div className="bcr-hero-wrapper">
            {/* handle print and donwload html  */}
            <div className="bcr-controls">
                {/* Save Status Display */}
                {saveStatus && (
                    <div className={`bcr-save-status ${saveStatus === 'success' ? 'success' : 'error'}`}>
                        {saveStatus === 'success' ? '✓ Saved successfully!' : '✗ Save failed!'}
                    </div>
                )}

                <div className="bcr-button-group">
                    <Button
                        text={isLoading ? 'Saving...' : 'Save Report'}
                        onClick={saveBackchargeData}
                        colorScheme="lime-700"
                        variant="gradient"
                        font="md"
                        animation=""
                        squircle="4xl"
                        width="160px"
                        height="38px"
                        type={isLoading ? 'didabled' : 'submit'}
                        textColor="white-200"
                        shadowPosition="to-bottom"
                        shadowColor="white-600"
                    />
                </div>
            </div>
            {/* handle print and download html ends */}
            <div ref={componentRef} className="bcr-main-wrapper">
                <div className="bcr-container">
                    <div className="bcr-report-border">
                        {/* Header Section */}
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

                        {/* Document Title */}
                        <h1 className="bcr-document-title">MAINTENANCE BACK CHARGE REPORT</h1>

                        {/* Information Grid */}
                        <div className="bcr-info-grid sign-border-td-l">
                            <div className="bcr-info-full-row">
                                <div className="bcr-info-field">
                                    <span className="bcr-field-label">Ref No  :</span>
                                    <span className="bcr-field-value">
                                        {isGeneratingRef ? 'Generating...' : formData.refNo || 'Loading...'}
                                    </span>
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
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent'
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
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-info-full-row" style={{ position: 'relative' }}>
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Plate No</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.plateNo}
                                            onChange={(e) => handleInputChangeWithSearch('plateNo', e.target.value)}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{ border: 'none', outline: 'none', background: 'transparent' }}
                                            placeholder="Enter plate number..."
                                        />
                                        {showEquipmentDropdown && equipmentSuggestions.length > 0 && (
                                            <div className="dropdown-suggestions">
                                                {equipmentSuggestions.map((equipment, index) => (
                                                    <div key={index} className="dropdown-item" onClick={() => handleEquipmentSelect(equipment)}>
                                                        <strong>{equipment.plateNo}</strong> - {equipment.equipmentType}
                                                        <br />
                                                        <small>{equipment.supplierName}</small>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-info-full-row" style={{ position: 'relative' }}>
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Supplier Name</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.supplierName}
                                            onChange={(e) => handleInputChangeWithSearch('supplierName', e.target.value)}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{ border: 'none', outline: 'none', background: 'transparent' }}
                                            placeholder="Enter supplier name..."
                                        />
                                        {showSupplierDropdown && supplierSuggestions.length > 0 && (
                                            <div className="dropdown-suggestions">
                                                {supplierSuggestions.map((supplier, index) => (
                                                    <div key={index} className="dropdown-item" onClick={() => handleSupplierSelect(supplier)}>
                                                        <strong>{supplier.name}</strong>
                                                        <br />
                                                        <small>Contact: {supplier.contactPerson}</small>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
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
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent'
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="bcr-info-full-row" style={{ position: 'relative' }}>
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide">Site Location</span>
                                        <span>:</span>
                                        <input
                                            type="text"
                                            value={formData.siteLocation}
                                            onChange={(e) => handleInputChangeWithSearch('siteLocation', e.target.value)}
                                            className="bcr-field-value-bold text-data-underline mr-l-2"
                                            style={{ border: 'none', outline: 'none', background: 'transparent' }}
                                            placeholder="Enter site location..."
                                        />
                                        {showSiteDropdown && siteSuggestions.length > 0 && (
                                            <div className="dropdown-suggestions">
                                                {siteSuggestions.map((site, index) => (
                                                    <div key={index} className="dropdown-item" onClick={() => handleSiteSelect(site)}>
                                                        {site.location}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="bcr-info-full-row">
                                    <div className="bcr-info-field">
                                        <span className="bcr-field-label-wide ">Date</span>
                                        <span>:</span>
                                        <span className="bcr-field-value-bold text-data-underline mr-l-2">
                                            <input
                                                type="date"
                                                value={formData.date}
                                                onChange={(e) => handleInputChange('date', e.target.value)}
                                                style={{
                                                    border: 'none',
                                                    outline: 'none',
                                                    background: 'transparent',
                                                    fontSize: 'inherit'
                                                }}
                                            />
                                            <span className="bcr-signature-label">Customer Signature & Date : </span>
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Scope of Work */}
                        <div className="bcr-scope-section">
                            <div className='bcr-scope-section-sub'>
                                <span className="bcr-scope-label">Scope of Work :-</span>
                                <input
                                    ref={scopeLine1Ref}
                                    type="text"
                                    value={formData.scopeOfWork}
                                    onChange={(e) => handleScopeOverflow(e.target.value)}
                                    className='text-data-underline scope-value scope-line-1'
                                    style={{
                                        border: 'none',
                                        outline: 'none',
                                        background: 'transparent',
                                        fontSize: 'inherit'
                                    }}
                                />

                            </div>
                            <input
                                type="text"
                                value={formData.scopeLine2Text || ''}
                                onChange={(e) => handleInputChange('scopeLine2Text', e.target.value)}
                                className='text-data-underline scope-value-couple scope-line-2'
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    fontSize: 'inherit'
                                }}
                            />
                        </div>

                        {/* Parts and Materials Table */}
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
                                        <td className="bcr-parts-table-footer sign-border-td-l">
                                            {formData.tableRows.reduce((sum, row) => sum + (parseFloat(row.total) || 0), 0).toFixed(2)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Workshop Manager Comments */}
                        <div className="bcr-comments-section">
                            <span className="bcr-comments-label">Workshop Manager's Comments/ Work Summary :-</span>
                            <input
                                ref={workLine1Ref}
                                type="text"
                                value={formData.workshopComments}
                                onChange={(e) => handleWorkSummaryOverflow(e.target.value)}
                                className="bcr-comments-text text-data-underline work-summary-line-1"
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                    width: 'calc(100% - 4.5rem)'
                                }}
                            />
                            <input
                                type="text"
                                value={formData.workSummaryLine2}
                                onChange={(e) => handleInputChange('workSummaryLine2', e.target.value)}
                                className="work-summary-line-2 text-data-underline"
                                style={{
                                    border: 'none',
                                    outline: 'none',
                                    background: 'transparent',
                                }}
                            />
                        </div>

                        {/* Cost Summary */}
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
                                            value={formData.sparePartsCost}
                                            readOnly
                                            className="bcr-cost-amount"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                color: '#666'
                                            }}
                                            title="Auto-calculated from table totals"
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
                                            value={formData.labourCharges}
                                            onChange={(e) => handleLabourChargeChange(e.target.value)}
                                            className="bcr-cost-amount"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent'
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
                                            value={formData.totalCost}
                                            readOnly
                                            className="bcr-cost-amount"
                                            style={{
                                                border: 'none',
                                                outline: 'none',
                                                background: 'transparent',
                                                color: '#666'
                                            }}
                                            title="Auto-calculated: Spare Parts + Labour"
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
                                        value={formData.approvedDeduction}
                                        onChange={(e) => handleInputChange('approvedDeduction', e.target.value)}
                                        className="bcr-cost-amount"
                                        style={{
                                            border: 'none',
                                            outline: 'none',
                                            background: 'transparent'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Authorization Table */}
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

export default BackchargeForm;