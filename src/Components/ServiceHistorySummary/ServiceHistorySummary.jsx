import React, { useState, useEffect, useRef } from 'react';
import './ServiceHistorySummary.css';
import { apiRequest } from '../../utils/api';
import { END_POINT } from '../../constants';
import { useSearch } from '../../context/SearchContext';
import { useHeaderTitle } from '../../context/HeaderTitleContext';
import { useNavigate } from 'react-router-dom';
import Button from '../../common/Button/Button';
import DevModal from '../../common/DevModal/DevModal';
import ExcelJS from 'exceljs';
import logoImage from '../../assets/images/al-ansari-color.png';
import alAnsariText from '../../assets/images/al-ansari-full-address.png';
import Input from '../../common/Input/Input';
import Loader from '../../common/Loader/Loader';

function ServiceHistorySummary() {
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

    useEffect(() => {
        setHeaderTitle('Service History Summary');
        setHeaderSubtitle(`${selectedPeriod.toUpperCase() || selectedMonthRange}`);
        return () => {
            setHeaderTitle(null);
            setHeaderSubtitle(null);
        };
    }, [selectedPeriod, setHeaderSubtitle, setHeaderTitle, selectedMonthRange]);

    useEffect(() => {
        fetchServiceData(selectedPeriod);
    }, [selectedPeriod, selectedMonthRange]);

    const fetchServiceData = async (period, startDate = null, endDate = null, months = null) => {
        setIsLoading(true);
        if (period === 'months') {
            setelectedMonthRange(months)
        }
        try {
            let url;

            if (startDate && endDate) {
                const formatForAPI = (date) => {
                    const [year, month, day] = date.split('-');
                    return `${day}-${month}-${year}`;
                };
                url = `${END_POINT}/service-report/summary/date-range/${formatForAPI(startDate)}/${formatForAPI(endDate)}`;
            } else if (months) {
                url = `${END_POINT}/service-report/summary/last-months/${months}`;
            } else {
                url = `${END_POINT}/service-report/summary/${period}`;
            }

            const response = await apiRequest(url, 'GET');
            const data = await response.json();

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
    };

    const handlePeriodChange = (e) => {
        const newPeriod = e.target.value;
        setSelectedPeriod(newPeriod);
        fetchServiceData(newPeriod);
    };
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const [year, month, day] = dateString.split('-');
        return `${day}-${month}-${year}`;
    };

    const getServiceTypeClass = (serviceType) => {
        const type = serviceType?.toLowerCase() || 'normal';
        return `service-row-${type}`;
    };

    const getServiceTypeDisplay = (serviceType) => {
        const type = serviceType?.toLowerCase() || 'normal';
        if (type === 'maintenance') return 'MAJOR SERVICE';
        return type.toUpperCase();
    };

    const toggleRemarkExpansion = (index) => {
        setExpandedRemarks(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handleDeleteReport = (item) => {
        setDeleteReport(item);
        setShowDeleteModal(true);
    };

    const confirmDeleteReport = async () => {
        let url;
        if (deleteReport.serviceType === 'oil' || deleteReport.serviceType === 'normal') {
            url = `${END_POINT}/service-report/deletewith/${deleteReport._id}`;
        } else if (deleteReport.serviceType === 'tyre') {
            url = `${END_POINT}/service-history/delete-service-history/tyre/${deleteReport._id}`;
        } else if (deleteReport.serviceType === 'battery') {
            url = `${END_POINT}/service-history/delete-service-history/battery/${deleteReport._id}`;
        } else {
            url = `${END_POINT}/service-history/delete-service-history/maintenance/${deleteReport._id}`;
        }

        const response = await apiRequest(url, 'DELETE');
        const data = await response.json();

        if (data.success) {
            setShowDeleteModal(false);
            fetchServiceData(selectedPeriod);
        }
    };

    const handleRowClick = (date, serviceType, regNo) => {
        let path;
        switch (serviceType) {
            case 'normal':
            case 'oil':
                path = `/service-doc/${regNo}/${date}`;
                break;
            case 'maintenance':
                path = `/maintenance-doc/${regNo}/${date}`;
                break;
            case 'tyre':
                path = `/tyre-doc/${regNo}/${date}`;
                break;
            case 'battery':
                path = `/battery-doc/${regNo}/${date}`;
                break;
            default:
                path = `/service-doc/${regNo}/${date}`;
        }
        navigate(path);
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const tableClone = tableRef.current.cloneNode(true);
        const actionsColumn = tableClone.querySelectorAll('.no-print');
        actionsColumn.forEach(col => col.remove());

        const style = `
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
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
        .service-row-maintenance { background-color: rgba(239, 68, 68, 0.1); }

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

    const calculateRowHeight = (text) => {
        if (!text) return 35;
        const charCount = text.length;
        const lines = Math.ceil(charCount / 50);
        return Math.max(35, lines * 15);
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
                    case 'oil': bgColor = 'FFE8F5E8'; break;
                    case 'maintenance': bgColor = 'FFFFF3CD'; break;
                    case 'tyre': bgColor = 'FFD1ECF1'; break;
                    case 'battery': bgColor = 'FFF8D7DA'; break;
                    case 'normal': bgColor = 'FFF0E6FF'; break;
                    default: bgColor = 'FFF0E6FF'; break;
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

    return (
        <div className="service-history-container-cnt">
            <DevModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                type="error"
                title="Delete Report?"
                message="Are you sure you want to delete this report? This action cannot be undone."
                buttonText="Delete"
                secondaryButtonText="Cancel"
                onButtonClick={confirmDeleteReport}
                onSecondaryClick={() => setShowDeleteModal(false)}
            />

            <div className="controls-bar">
                <div className="action-buttons left">
                    <div className="selectors">
                        <div className="period-selector">
                            <Input
                                type="select"
                                value={selectedPeriod}
                                onChange={(e) => handlePeriodChange(e)}
                                options={[
                                    { value: 'daily', label: 'Today' },
                                    { value: 'yesterday', label: 'Yesterday' },
                                    { value: 'weekly', label: 'Last Week' },
                                    { value: 'monthly', label: 'Last Month' },
                                    { value: 'yearly', label: 'Last Year' }
                                ]}
                                colorScheme="violet-800"
                                variant="gradient"
                                font="md"
                                squircle="4xl"
                                width="140px"
                                height="38px"
                                textColor="white-200"
                                shadowPosition="to-bottom"
                                shadowColor="white-600"
                                animation="none"
                                fontWeight='500'
                                inputPaddingInline="xl"
                            />
                        </div>
                        <div className="last-x-months-selector">
                            <Input
                                type="select"
                                value={selectedMonthRange}
                                onChange={(e) => fetchServiceData('months', null, null, e.target.value)}
                                options={[
                                    { value: '1', label: '1 Month' },
                                    { value: '2', label: '2 Months' },
                                    { value: '3', label: '3 Months' },
                                    { value: '4', label: '4 Months' },
                                    { value: '5', label: '5 Months' },
                                    { value: '6', label: '6 Months' },
                                    { value: '7', label: '7 Months' },
                                    { value: '8', label: '8 Months' },
                                    { value: '9', label: '9 Months' },
                                    { value: '10', label: '10 Months' },
                                    { value: '11', label: '11 Months' },
                                    { value: '12', label: '12 Month' },
                                    { value: '13', label: '13 Months' },
                                    { value: '14', label: '14 Months' },
                                    { value: '15', label: '15 Months' },
                                    { value: '16', label: '16 Months' },
                                    { value: '17', label: '17 Months' },
                                    { value: '18', label: '18 Months' },
                                    { value: '19', label: '19 Months' },
                                    { value: '20', label: '20 Months' },
                                    { value: '21', label: '21 Months' },
                                    { value: '22', label: '22 Months' },
                                ]}
                                colorScheme="red-600"
                                variant="gradient"
                                font="md"
                                squircle="4xl"
                                width="130px"
                                height="38px"
                                textColor="white-100"
                                shadowPosition="to-bottom"
                                shadowColor="white-600"
                                animation="none"
                                inputPaddingInline="xl"
                                fontWeight='500'
                            />
                        </div>
                        <div className='range-selector'>
                            <div className="data-range-inputs">
                                <Input
                                    type="date"
                                    name="startDate"
                                    value={dateRange.start}
                                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                    placeholder="Start Date"
                                    colorScheme="yellow-300"
                                    variant="gradient"
                                    squircle="4xl"
                                    width="240px"
                                    height="40px"
                                    textColor="black-100"
                                    placeholderColor="black-300"
                                    fontWeight='500'
                                    inputPaddingInline="2xl"
                                    inputPaddingBlock="xl"
                                />

                                <Input
                                    type="date"
                                    name="endDate"
                                    value={dateRange.end}
                                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                    placeholder="End Date"
                                    colorScheme="yellow-300"
                                    variant="gradient"
                                    squircle="4xl"
                                    width="240px"
                                    height="40px"
                                    textColor="black-200"
                                    placeholderColor="black-300"
                                    inputPaddingInline="4xl"
                                    inputPaddingBlock="xl"
                                    fontWeight='500'
                                />
                            </div>
                            <Button
                                text="Apply"
                                onClick={() => fetchServiceData('custom', dateRange.start, dateRange.end)}
                                colorScheme="lime-500"
                                variant="gradient"
                                font="md"
                                animation=""
                                squircle="xl"
                                width="140px"
                                height="38px"
                                type="submit"
                                textColor="black-200"
                                shadowPosition="to-bottom"
                                shadowColor="white-600"
                            />
                        </div>
                    </div>
                </div>
                <div className="action-buttons right">
                    <Button
                        text="Export to Excel"
                        onClick={handleExportToExcel}
                        colorScheme="primary-800"
                        variant="gradient"
                        font="md"
                        squircle="4xl"
                        width="160px"
                        height="38px"
                        textColor="white-200"
                        shadowPosition="to-bottom"
                        shadowColor="white-600"
                    />
                    <Button
                        text="Print"
                        onClick={handlePrint}
                        colorScheme="success-800"
                        variant="gradient"
                        font="md"
                        squircle="4xl"
                        width="160px"
                        height="38px"
                        textColor="white-200"
                        shadowPosition="to-bottom"
                        shadowColor="white-600"
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="loading-container">
                    <Loader />
                </div>
            ) : (
                <div className="service-table-container">
                    {filteredData.length > 0 ? (
                        <table className="service-table summary-service-table" ref={tableRef}>
                            <thead>
                                <tr>
                                    <th>S.No</th>
                                    <th>Date</th>
                                    <th>Reg No</th>
                                    <th>Machine</th>
                                    <th>Service Type</th>
                                    <th>Service Hours</th>
                                    <th>Next Service Hours</th>
                                    <th>Location</th>
                                    <th>Mechanics</th>
                                    <th>Operator Name</th>
                                    <th>Remarks</th>
                                    <th className="no-print">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((service, index) => (
                                    <tr key={service._id?.$oid || service._id || index} className={getServiceTypeClass(service.serviceType)}>
                                        <td>{index + 1}</td>
                                        <td>{formatDate(service.date)}</td>
                                        <td className="reg-no">{service.regNo}</td>
                                        <td>{service.machine}</td>
                                        <td className="summary-service-type">{getServiceTypeDisplay(service.serviceType)}</td>
                                        <td>{service.serviceHrs}</td>
                                        <td>{service.nextServiceHrs}</td>
                                        <td>{service.location}</td>
                                        <td>{service.mechanics}</td>
                                        <td>{service.operatorName}</td>
                                        <td className="remarks-cell">
                                            {service.remarks && (
                                                <div className="remarks-content">
                                                    <div className={expandedRemarks[index] ? 'remarks-text expanded' : 'remarks-text'}>
                                                        {service.remarks?.toUpperCase()}
                                                    </div>
                                                    {service.remarks.length > 100 && (
                                                        <button
                                                            className="view-more-btn no-print"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleRemarkExpansion(index);
                                                            }}
                                                        >
                                                            {expandedRemarks[index] ? 'View Less' : 'View More'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                            {!service.remarks && '-'}
                                        </td>
                                        <td className="no-print">
                                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                <Button
                                                    text="View Document"
                                                    onClick={() => handleRowClick(formatDate(service.date), service.serviceType, service.regNo)}
                                                    colorScheme="sky-800"
                                                    variant="gradient"
                                                    font="sm"
                                                    squircle="4xl"
                                                    width="fit-content"
                                                    height="32px"
                                                    textColor="white-200"
                                                    shadowPosition="to-bottom"
                                                    shadowColor="white-600"
                                                />
                                                <Button
                                                    text="Delete"
                                                    onClick={() => handleDeleteReport(service)}
                                                    colorScheme="red-700"
                                                    variant="gradient"
                                                    font="sm"
                                                    squircle="4xl"
                                                    width="70px"
                                                    height="32px"
                                                    textColor="white-200"
                                                    shadowPosition="to-bottom"
                                                    shadowColor="white-600"
                                                />
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="no-data">
                            <p>No service records found for the selected period</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default ServiceHistorySummary;