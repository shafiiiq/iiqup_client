import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSearch } from '@/shared/context/SearchContext';
import { fetchServiceSummaryData, deleteServiceReport } from '../api/maintenance.record.api';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import { useNavigate } from 'react-router-dom';
import ExcelJS from 'exceljs';
import logoImage from '@assets/images/al-ansari-color.png';
import alAnsariText from '@assets/images/al-ansari-full-address.png';

import { formatDate, getServiceTypeDisplay, calculateRowHeight, groupServiceRecordsByEquipment } from '../helper/maintenance.record.helper';

export const useMaintenanceRecord = () => {
    const { searchTerm } = useSearch();
    const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
    const navigate = useNavigate();
    const tableRef = useRef(null);

    const [serviceData, setServiceData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('daily');
    const [selectedMonthRange, setelectedMonthRange] = useState('1');
    const [deleteReport, setDeleteReport] = useState({});
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [expandedRemarks, setExpandedRemarks] = useState({});
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    const fetchServiceData = useCallback(async (period, startDate = null, endDate = null, months = null) => {
        setIsLoading(true);
        try {
            const data = await fetchServiceSummaryData({ period, startDate, endDate, months });

            if (data && data.data && data.data.all) {
                setServiceData(data.data.all);
            } else {
                setServiceData([]);
            }
        } catch (error) {
            console.error('Error fetching service data:', error);
            setServiceData([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        setHeaderTitle('Service History Summary');
        setHeaderSubtitle(`${selectedPeriod.toUpperCase() || selectedMonthRange}`);
        return () => {
            setHeaderTitle(null);
            setHeaderSubtitle(null);
        };
    }, [selectedPeriod, selectedMonthRange, setHeaderSubtitle, setHeaderTitle]);

    useEffect(() => {
        // 'custom' needs a start/end date from the person first — the Apply
        // button (handleApplyDateRange) triggers the fetch for that case, so
        // switching to the Custom Range tab alone must not fire a request.
        if (selectedPeriod === 'custom') return;

        if (selectedPeriod === 'months') {
            fetchServiceData(selectedPeriod, null, null, selectedMonthRange);
            return;
        }

        fetchServiceData(selectedPeriod);
    }, [selectedPeriod, selectedMonthRange, fetchServiceData]);

    const handlePeriodChange = (e) => {
        const newPeriod = e.target.value;
        setSelectedPeriod(newPeriod);
        if (newPeriod !== 'months') {
            setSelectedPeriod(newPeriod);
        }
    };

    // Tabs sidebar selection handler — 'months' and 'custom' just switch the
    // active tab; their own controls (month count / date range + Apply) live
    // in the main content panel and drive the actual fetch from there.
    const handlePeriodTabSelect = (key) => {
        setSelectedPeriod(key);
    };

    const handleMonthRangeChange = (e) => {
        const nextMonthRange = e.target.value;
        setelectedMonthRange(nextMonthRange);
        setSelectedPeriod('months');
    };

    const handleDateRangeStartChange = (e) => {
        setDateRange({ ...dateRange, start: e.target.value });
    };

    const handleDateRangeEndChange = (e) => {
        setDateRange({ ...dateRange, end: e.target.value });
    };

    const handleApplyDateRange = () => {
        setSelectedPeriod('custom');
        fetchServiceData('custom', dateRange.start, dateRange.end);
    };

    const toggleRemarkExpansion = (index) => {
        setExpandedRemarks(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleToggleRemarkClick = (e, index) => {
        e.stopPropagation();
        toggleRemarkExpansion(index);
    };

    const handleDeleteReport = (item) => {
        setDeleteReport(item);
        setShowDeleteModal(true);
    };

    const handleCloseDeleteModal = () => setShowDeleteModal(false);

    const confirmDeleteReport = async () => {
        const response = await deleteServiceReport(deleteReport._id);
        if (response.ok) {
            setShowDeleteModal(false);
            fetchServiceData(selectedPeriod);
        }
    };

    const handleRowClick = (date, serviceType, id) => {
        navigate(`/service-document/${id}`, {
            state: {
                date,
                serviceType,
                historyId: id,
                docType: serviceType === 'major'   ? 'maintenance-doc'
                       : serviceType === 'tyre'    ? 'tyre-doc'
                       : serviceType === 'battery' ? 'battery-doc'
                       : 'service-doc',
            },
        });
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const tableClone = tableRef.current.cloneNode(true);
        const actionsColumn = tableClone.querySelectorAll('.no-print');
        actionsColumn.forEach(col => col.remove());

        const style = `
      <style>
        .print-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .print-header img { max-width: 250px; max-height: 100px; }
        img.company-address { max-width: 350px !important; max-height: 100px; }
        h1 { text-align: center; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .service-row-oil { background-color: rgba(245, 158, 11, 0.1); }
        .service-row-normal { background-color: rgba(59, 130, 246, 0.1); }
        .service-row-battery { background-color: rgba(34, 197, 94, 0.1); }
        .service-row-tyre { background-color: rgba(139, 92, 246, 0.1); }
        .service-row-major { background-color: rgba(239, 68, 68, 0.1); }
        .summary-service-table td:nth-child(9) {
           max-width: 120px;
           word-wrap: break-word;
           white-space: normal;
           line-height: 1.4;
        }
      </style>
    `;

        const content = `
      <html>
        <head>
          <title>Service History - ${selectedPeriod.toUpperCase()}</title>
          ${style}
        </head>
        <body>
          <div class="print-header">
            <img src="${logoImage}" alt="Logo" />
            <img src="${alAnsariText}" class="company-address" alt="Company" />
          </div>
          <h1>Service History - ${selectedPeriod.toUpperCase()}</h1>
          ${tableClone.outerHTML}
        </body>
      </html>
    `;

        printWindow.document.open();
        printWindow.document.write(content);
        printWindow.document.close();
        printWindow.focus();

        printWindow.onload = () => {
            printWindow.print();
            printWindow.close();
        };
    };

    const handleExportToExcel = async () => {
        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Service History');

            worksheet.mergeCells('A1:K1');
            const titleCell = worksheet.getCell('A1');
            titleCell.value = `Service History - ${selectedPeriod.toUpperCase()}`;
            titleCell.font = { bold: true, size: 16, color: { argb: 'FFFFFFFF' } };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF2F5597' } };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            worksheet.getRow(1).height = 45;

            const headers = ['S.No', 'Date', 'Reg No', 'Machine', 'Service Type', 'Service Hours', 'Next Service Hours', 'Location', 'Mechanics', 'Operator Name', 'Remarks'];

            const headerRow = worksheet.getRow(3);
            headers.forEach((header, index) => {
                const cell = headerRow.getCell(index + 1);
                cell.value = header;
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
            });
            headerRow.height = 45;

            const colWidths = [8, 15, 12, 25, 18, 18, 18, 20, 20, 20, 100];
            colWidths.forEach((width, index) => {
                worksheet.getColumn(index + 1).width = width;
            });

            filteredData.forEach((service, index) => {
                const row = worksheet.getRow(index + 4);
                const rowData = [
                    index + 1,
                    formatDate(service.date),
                    service.regNo,
                    service.machine,
                    getServiceTypeDisplay(service.serviceType),
                    service.serviceHrs || '-',
                    service.nextServiceHrs || '-',
                    service.location || '-',
                    service.mechanics || '-',
                    service.operatorName || '-',
                    service.remarks || '-'
                ];

                rowData.forEach((value, colIndex) => {
                    row.getCell(colIndex + 1).value = value;
                });

                const remarksHeight = calculateRowHeight(service.remarks);
                row.height = remarksHeight;

                let bgColor = 'FFFFFFFF';
                switch (service.serviceType) {
                    case 'oil':     bgColor = 'FFE8F5E8'; break;
                    case 'major':   bgColor = 'FFFFF3CD'; break;
                    case 'tyre':    bgColor = 'FFD1ECF1'; break;
                    case 'battery': bgColor = 'FFF8D7DA'; break;
                    case 'normal':  bgColor = 'FFF0E6FF'; break;
                    default:        bgColor = 'FFF0E6FF'; break;
                }

                row.eachCell((cell) => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
                    cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
                });
            });

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Service_History_${selectedPeriod}_${new Date().toISOString().slice(0, 10)}.xlsx`;
            link.click();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exporting to Excel:', error);
        }
    };

    const filteredData = serviceData.filter(item => {
        if (!searchTerm) return true;
        return Object.values(item).some(value =>
            String(value).toLowerCase().includes(searchTerm.toLowerCase())
        );
    });

    const groupedData = useMemo(() => groupServiceRecordsByEquipment(filteredData), [filteredData]);

    return {
        filteredData,
        groupedData,
        isLoading,
        selectedPeriod,
        selectedMonthRange,
        dateRange,
        deleteReport,
        showDeleteModal,
        expandedRemarks,
        tableRef,

        handlePeriodChange,
        handlePeriodTabSelect,
        handleMonthRangeChange,
        handleDateRangeStartChange,
        handleDateRangeEndChange,
        handleApplyDateRange,

        handleExportToExcel,
        handlePrint,

        handleCloseDeleteModal,
        confirmDeleteReport,
        handleDeleteReport,

        handleRowClick,
        toggleRemarkExpansion,
        handleToggleRemarkClick,
    };
};

export default useMaintenanceRecord;