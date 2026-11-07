import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import companyLogoImage from '@assets/images/al-ansari-color.png';
import companyAddressImage from '@assets/images/al-ansari-full-address.png';

import { formatDate } from '../../helper/maintenance.helper';
import {
  getDateRangeLabel,
  getDateRangeFileNameSuffix,
  getServiceTabLabel,
  getServiceTypeBadge,
  getServiceWorkDescription,
  getServiceRemarksText,
  getServiceRowBackgroundHex,
  getServiceRowBackgroundRgb,
  loadImageAsDataUrl,
} from './maintenance.list.helper';

const THIN_BORDER = { style: 'thin' };
const CELL_BORDER = { top: THIN_BORDER, left: THIN_BORDER, bottom: THIN_BORDER, right: THIN_BORDER };

const buildMaintenanceTableHeaders = (activeTab) => [
  'Date',
  ...(activeTab === 'all' ? ['Service Type'] : []),
  'Work Description',
  'Serviced Hrs/Km',
  'Next Service',
  ...(activeTab === 'oil' || activeTab === 'all' ? ['Next Full Service'] : []),
  ...(activeTab === 'tyre' || activeTab === 'all' ? ['Location', 'Tyre Model'] : []),
  ...(activeTab === 'battery' || activeTab === 'all' ? ['Battery Model'] : []),
  'Remarks',
];

const buildMaintenanceTableRow = (item, activeTab) => [
  formatDate(item.date),
  ...(activeTab === 'all' ? [item.fullService ? 'Full Service' : getServiceTypeBadge(item.serviceType).label] : []),
  getServiceWorkDescription(item),
  item.serviceHrs,
  item.nextServiceHrs === '0' ? '' : item.nextServiceHrs,
  ...(activeTab === 'oil' || activeTab === 'all'
    ? [item.serviceType === 'oil' && item.fullService ? Number(item.serviceHrs) + 3000 : '-']
    : []),
  ...(activeTab === 'tyre' || activeTab === 'all'
    ? [item.serviceType === 'tyre' ? item.location || '-' : '-', item.serviceType === 'tyre' ? item.tyreModel : '-']
    : []),
  ...(activeTab === 'battery' || activeTab === 'all'
    ? [item.serviceType === 'battery' ? item.batteryModel : '-']
    : []),
  getServiceRemarksText(item),
];

const buildEquipmentTitle = ({ registrationNumbers, equipmentList }) => {
  if (registrationNumbers.length === 0) return 'All Equipment';
  if (registrationNumbers.length > 1) return `Equipments (${registrationNumbers.join(', ')})`;
  const equipment = equipmentList.find((candidate) => candidate.regNo === registrationNumbers[0]);
  return `${equipment?.machine ?? 'Equipment'} ${registrationNumbers[0]}`;
};

const findEquipmentName = (equipmentList, registrationNumber) =>
  equipmentList.find((candidate) => candidate.regNo?.toString().trim() === registrationNumber?.toString().trim())
    ?.machine ?? 'Equipment';

const buildMaintenanceFileName = ({ activeTab, isMultipleEquipment, registrationNumbers, dateRangeFilter, extension }) => {
  const suffix = getDateRangeFileNameSuffix(dateRangeFilter);
  const target = isMultipleEquipment ? 'Multiple_Equipment' : registrationNumbers[0];
  return `${getServiceTabLabel(activeTab).replace(/\s+/g, '_')}_${target}${suffix}_${new Date().toISOString().slice(0, 10)}.${extension}`;
};

const drawSignatureBlock = async (doc, { supervisorSignUrl, skipSignature }, positionY) => {
  doc.setTextColor(0, 0, 0);

  if (skipSignature) {
    doc.rect(10, positionY, 50, 30);
    return;
  }

  const drawNotSigned = () => {
    doc.setFontSize(10);
    doc.setFont(undefined, 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Not Signed', 10, positionY);
  };

  if (!supervisorSignUrl) {
    drawNotSigned();
    return;
  }

  try {
    const signatureDataUrl = await loadImageAsDataUrl(supervisorSignUrl);
    doc.addImage(signatureDataUrl, 'PNG', 10, positionY, 50, 45);
  } catch {
    drawNotSigned();
  }
};

const drawWorkshopManagerDetails = (doc, startY) => {
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('Firoz Khan', 10, startY);
  doc.text('Workshop Manager', 10, startY + 6);
  doc.text('+974 5170 0481', 10, startY + 12);
};

const drawReportHeader = async (doc, { title, dateRangeFilter, searchTerm }) => {
  let currentY = 10;

  try {
    const [leftLogoDataUrl, rightLogoDataUrl] = await Promise.all([
      loadImageAsDataUrl(companyLogoImage),
      loadImageAsDataUrl(companyAddressImage),
    ]);

    const leftLogoProps = doc.getImageProperties(leftLogoDataUrl);
    const leftLogoWidth = 40;
    const leftLogoHeight = (leftLogoProps.height / leftLogoProps.width) * leftLogoWidth;
    doc.addImage(leftLogoDataUrl, 'PNG', 10, currentY, leftLogoWidth, leftLogoHeight);

    const rightLogoProps = doc.getImageProperties(rightLogoDataUrl);
    const rightLogoWidth = 80;
    const rightLogoHeight = (rightLogoProps.height / rightLogoProps.width) * rightLogoWidth;
    doc.addImage(rightLogoDataUrl, 'PNG', 210, currentY, rightLogoWidth, rightLogoHeight);

    currentY += Math.max(leftLogoHeight, rightLogoHeight) + 6;
  } catch {
    currentY += 30;
  }

  currentY += 30;

  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text(title, 148, currentY, { align: 'center' });
  currentY += 7;

  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text(`Date Range: ${getDateRangeLabel(dateRangeFilter)}`, 148, currentY, { align: 'center' });
  currentY += 6;

  if (searchTerm) {
    doc.setFontSize(10);
    doc.text(`Search Term: "${searchTerm}"`, 148, currentY, { align: 'center' });
    currentY += 6;
  }

  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 148, currentY, { align: 'center' });

  return currentY + 10;
};

const buildPdfTableOptions = ({ activeTab, headers, body, startY, items }) => ({
  head: [headers],
  body,
  startY,
  theme: 'grid',
  styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak', halign: 'center', valign: 'middle' },
  headStyles: { fillColor: [68, 114, 196], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
  columnStyles: { 0: { cellWidth: 25 }, ...(activeTab === 'all' ? { 1: { cellWidth: 20 } } : {}) },
  didParseCell(cellData) {
    if (cellData.section !== 'body') return;
    const item = items[cellData.row.index];
    if (item) cellData.cell.styles.fillColor = getServiceRowBackgroundRgb(item);
  },
  margin: { top: 10, left: 10, right: 10 },
});

export const exportMaintenanceListToExcel = async ({
  groupedData,
  activeTab,
  isMultipleEquipment,
  equipmentList,
  registrationNumbers,
  searchTerm,
  dateRangeFilter,
}) => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Maintenance List');

  const equipmentTitle = buildEquipmentTitle({ registrationNumbers, equipmentList });
  const tabLabel = getServiceTabLabel(activeTab);
  const headers = buildMaintenanceTableHeaders(activeTab);
  const lastColumnLetter = String.fromCharCode(64 + headers.length);

  let currentRowNumber = 1;

  const applyTitleRow = (rowNumber, value, fontSize, backgroundArgb, textArgb = 'FF000000') => {
    const cell = worksheet.getCell(`A${rowNumber}`);
    cell.value = value;
    cell.font = { bold: true, size: fontSize, color: { argb: textArgb } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: backgroundArgb } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(rowNumber).height = 45;
  };

  applyTitleRow(currentRowNumber, `${tabLabel} List - ${equipmentTitle}`, 16, 'FF2F5597', 'FFFFFFFF');
  currentRowNumber++;
  applyTitleRow(currentRowNumber, `Date Range: ${getDateRangeLabel(dateRangeFilter)}`, 14, 'FFBDD7EE');

  if (searchTerm) {
    currentRowNumber++;
    applyTitleRow(currentRowNumber, `Search Term: "${searchTerm}"`, 12, 'FFDDEBF7');
  }

  currentRowNumber++;
  worksheet.getRow(currentRowNumber).height = 20;

  currentRowNumber++;
  const timestampCell = worksheet.getCell(`A${currentRowNumber}`);
  timestampCell.value = `Report Generated: ${new Date().toLocaleString()}`;
  timestampCell.font = { italic: true, size: 11, color: { argb: 'FF7F7F7F' } };
  timestampCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(currentRowNumber).height = 45;

  currentRowNumber++;
  worksheet.getRow(currentRowNumber).height = 20;

  currentRowNumber++;
  const headerRow = worksheet.getRow(currentRowNumber);
  headers.forEach((headerText, columnIndex) => {
    const cell = headerRow.getCell(columnIndex + 1);
    cell.value = headerText;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border = CELL_BORDER;
  });
  headerRow.height = 45;

  const columnWidths = [
    15,
    ...(activeTab === 'all' ? [15] : []),
    40,
    15,
    15,
    ...(activeTab === 'oil' || activeTab === 'all' ? [18] : []),
    ...(activeTab === 'tyre' || activeTab === 'all' ? [20, 25] : []),
    ...(activeTab === 'battery' || activeTab === 'all' ? [25] : []),
    40,
  ];
  columnWidths.forEach((width, columnIndex) => { worksheet.getColumn(columnIndex + 1).width = width; });

  Object.entries(groupedData).forEach(([registrationNumber, items]) => {
    if (isMultipleEquipment) {
      currentRowNumber++;
      worksheet.mergeCells(`A${currentRowNumber}:${lastColumnLetter}${currentRowNumber}`);
      const equipmentHeaderCell = worksheet.getRow(currentRowNumber).getCell(1);
      equipmentHeaderCell.value = `${findEquipmentName(equipmentList, registrationNumber)} - Reg No: ${registrationNumber}`;
      equipmentHeaderCell.font = { bold: true, size: 12 };
      equipmentHeaderCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
      equipmentHeaderCell.alignment = { horizontal: 'left', vertical: 'middle' };
      equipmentHeaderCell.border = CELL_BORDER;
      worksheet.getRow(currentRowNumber).height = 35;
    }

    items.forEach((item) => {
      currentRowNumber++;
      const dataRow = worksheet.getRow(currentRowNumber);
      const backgroundArgb = getServiceRowBackgroundHex(item);

      buildMaintenanceTableRow(item, activeTab).forEach((cellValue, columnIndex) => {
        dataRow.getCell(columnIndex + 1).value = cellValue;
      });

      dataRow.height = 45;
      dataRow.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: backgroundArgb } };
        cell.border = CELL_BORDER;
        cell.font = { size: 11 };
      });
    });
  });

  worksheet.mergeCells(`A1:${lastColumnLetter}1`);
  worksheet.mergeCells(`A2:${lastColumnLetter}2`);
  if (searchTerm) {
    worksheet.mergeCells(`A3:${lastColumnLetter}3`);
    worksheet.mergeCells(`A5:${lastColumnLetter}5`);
  } else {
    worksheet.mergeCells(`A4:${lastColumnLetter}4`);
  }

  const fileName = buildMaintenanceFileName({ activeTab, isMultipleEquipment, registrationNumbers, dateRangeFilter, extension: 'xlsx' });
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const objectUrl = window.URL.createObjectURL(blob);

  const downloadLink = document.createElement('a');
  downloadLink.href = objectUrl;
  downloadLink.download = fileName;
  downloadLink.click();
  window.URL.revokeObjectURL(objectUrl);
};

export const exportMaintenanceListToPdf = async ({
  groupedData,
  activeTab,
  isMultipleEquipment,
  equipmentList,
  registrationNumbers,
  searchTerm,
  dateRangeFilter,
  supervisorSignUrl,
  skipSignature = false,
}) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');

  const equipmentTitle = buildEquipmentTitle({ registrationNumbers, equipmentList });
  const tabLabel = getServiceTabLabel(activeTab);

  const tableStartY = await drawReportHeader(doc, {
    title: `${tabLabel} List - ${equipmentTitle}`,
    dateRangeFilter,
    searchTerm,
  });

  const headers = buildMaintenanceTableHeaders(activeTab);
  const tableRows = [];
  const bodyItems = [];

  Object.entries(groupedData).forEach(([registrationNumber, items]) => {
    if (isMultipleEquipment) {
      tableRows.push([{
        content: `${findEquipmentName(equipmentList, registrationNumber)} - Reg No: ${registrationNumber}`,
        colSpan: headers.length,
        styles: { fontStyle: 'bold', fillColor: [211, 211, 211], halign: 'left' },
      }]);
      bodyItems.push(null);
    }

    items.forEach((item) => {
      tableRows.push(buildMaintenanceTableRow(item, activeTab));
      bodyItems.push(item);
    });
  });

  autoTable(doc, buildPdfTableOptions({ activeTab, headers, body: tableRows, startY: tableStartY, items: bodyItems }));

  const signatureY = doc.lastAutoTable.finalY + 15;
  await drawSignatureBlock(doc, { supervisorSignUrl, skipSignature }, signatureY);
  if (!skipSignature) drawWorkshopManagerDetails(doc, signatureY + 45);

  doc.save(buildMaintenanceFileName({ activeTab, isMultipleEquipment, registrationNumbers, dateRangeFilter, extension: 'pdf' }));
};

export const exportMaintenanceListToSeparatePdfs = async ({
  groupedData,
  activeTab,
  equipmentList,
  searchTerm,
  dateRangeFilter,
  supervisorSignUrl,
  skipSignature = false,
}) => {
  const tabLabel = getServiceTabLabel(activeTab);
  const fileNameSuffix = getDateRangeFileNameSuffix(dateRangeFilter);
  const headers = buildMaintenanceTableHeaders(activeTab);
  const equipmentEntries = Object.entries(groupedData);

  const createPdfForEquipment = async (registrationNumber, items) => {
    const doc = new jsPDF('landscape', 'mm', 'a4');
    const equipmentName = findEquipmentName(equipmentList, registrationNumber);

    const tableStartY = await drawReportHeader(doc, {
      title: `${tabLabel} List - ${equipmentName} (${registrationNumber})`,
      dateRangeFilter,
      searchTerm,
    });

    autoTable(
      doc,
      buildPdfTableOptions({
        activeTab,
        headers,
        body: items.map((item) => buildMaintenanceTableRow(item, activeTab)),
        startY: tableStartY,
        items,
      })
    );

    const signatureY = doc.lastAutoTable.finalY + 15;
    await drawSignatureBlock(doc, { supervisorSignUrl, skipSignature }, signatureY);
    if (!skipSignature) drawWorkshopManagerDetails(doc, signatureY + 45);

    doc.save(
      `${tabLabel.replace(/\s+/g, '_')}_${equipmentName.replace(/\s+/g, '_')}_${registrationNumber}${fileNameSuffix}_${new Date().toISOString().slice(0, 10)}.pdf`
    );
  };

  let successfulDownloadCount = 0;

  for (let index = 0; index < equipmentEntries.length; index++) {
    const [registrationNumber, items] = equipmentEntries[index];

    try {
      await createPdfForEquipment(registrationNumber, items);
      successfulDownloadCount++;
      if (index < equipmentEntries.length - 1) await new Promise((resolve) => setTimeout(resolve, 300));
    } catch (error) {
      console.error(`Failed to build PDF for equipment ${registrationNumber}:`, error);
    }
  }

  if (successfulDownloadCount === 0) throw new Error('Failed to create any PDFs');
};

export const printMaintenanceListTable = ({
  tableElement,
  activeTab,
  equipmentList,
  registrationNumbers,
  searchTerm,
  filteredItems,
  dateRangeFilter,
  supervisorSignUrl,
  skipSignature = false,
}) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const equipmentTitle = buildEquipmentTitle({ registrationNumbers, equipmentList });
  const tabLabel = getServiceTabLabel(activeTab);

  const signatureHtml = skipSignature
    ? '<div style="width:250px;height:100px;border:1px solid #000;"></div>'
    : supervisorSignUrl
      ? `<img src="${supervisorSignUrl}" alt="Supervisor Signature" style="width:150px;height:auto;display:block;" />`
      : '<span style="font-style:italic;color:#999;">Not Signed</span>';

  const printDocumentHtml = `
    <html>
      <head>
        <title>${tabLabel} List</title>
        <style>
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #000; padding: 4px 8px; text-align: center; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .no-results { text-align: center; font-style: italic; }
          .oil-service, .normal-service { background-color: #e8f5e8 !important; }
          .major-service { background-color: #fff3cd !important; }
          .tyre-service { background-color: #d1ecf1 !important; }
          .battery-service { background-color: #f8d7da !important; }
          .full-service-row { background-color: #ffd3a5 !important; }
          .view-more-btn, .document-column { display: none !important; }
          td:nth-child(3) { max-width: 170px; white-space: normal; word-wrap: break-word; }
          td:nth-child(10) { max-width: 230px; white-space: normal; word-wrap: break-word; }
        </style>
      </head>
      <body>
        <div style="display:flex;justify-content:space-between;padding:0 1rem;align-items:center;">
          <img style="width:10rem;max-height:6rem;" src="${companyLogoImage}" alt="Logo" />
          <img style="width:18rem;max-height:6rem;" src="${companyAddressImage}" alt="Company" />
        </div>
        <div style="display:flex;gap:1rem;justify-content:center;align-items:center;">
          <h2>${tabLabel} List -</h2>
          <h3>${equipmentTitle} -</h3>
          <p style="text-align:center;">Date Range: ${getDateRangeLabel(dateRangeFilter)}</p>
        </div>
        ${searchTerm ? `<p style="text-align:center;">Search results for: "<strong>${searchTerm}</strong>"</p>` : ''}
        <div style="overflow-x:auto;">
          ${tableElement?.outerHTML ?? '<p style="text-align:center;">No table data</p>'}
        </div>
        <div style="margin-top:10px;text-align:center;">
          Showing ${filteredItems.length} ${searchTerm ? 'matching entries' : 'entries'}
        </div>
        <div style="display:flex;gap:0.5rem;flex-direction:column;margin-top:1rem;text-align:left;">
          ${signatureHtml}
          ${!skipSignature ? `
          <p style="font-size:18px;margin:0;">Firoz Khan</p>
          <p style="font-size:18px;margin:0;">Workshop Manager</p>
          <p style="font-size:18px;margin:0;">+974 5170 0481</p>
          ` : ''}
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(printDocumentHtml);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => { printWindow.print(); printWindow.close(); };
};