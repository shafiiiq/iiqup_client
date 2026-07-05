// ─────────────────────────────────────────────────────────────────────────────
// serviceExport.js — Excel, PDF, and browser-print export for ServiceHistory.
// UPDATED: 'maintenance' → 'major' throughout (unified model).
// All functions are async and pure side-effectful. No state, no React.
// ─────────────────────────────────────────────────────────────────────────────

import ExcelJS      from 'exceljs';
import logoImage    from '../../../assets/images/al-ansari-color.png';
import alAnsariText from '../../../assets/images/al-ansari-full-address.png';

import {
  formatDate,
  getDateRangeText,
  getDateFilterSuffix,
  getTabName,
  getWorkDescription,
  getWorkDescriptionForPDF,
  getRemarksText,
  getRowBgColor,
  getRowBgColorForPDF,
  loadImageAsDataURL,
} from './serviceHelpers';

// ─────────────────────────────────────────────────────────────────────────────
// Shared Header Builder
// 'major' replaces 'maintenance' in all tab checks
// ─────────────────────────────────────────────────────────────────────────────

const buildHeaders = (activeTab) => [
  'Date',
  ...(activeTab === 'all' ? ['Service Type'] : []),
  'Work Description',
  ...(['oil', 'normal', 'tyre', 'battery', 'all'].includes(activeTab)
    ? ['Serviced Hrs/Km', 'Next Service']
    : []),
  ...(activeTab === 'oil' || activeTab === 'all'
    ? ['Next Full Service']
    : []),
  // 'major' replaces old 'maintenance'
  ...(activeTab === 'major'
    ? ['Serviced Hrs/Km', 'Next Service']
    : []),
  ...(activeTab === 'tyre' || activeTab === 'all'
    ? ['Location', 'Tyre Model']
    : []),
  ...(activeTab === 'battery' || activeTab === 'all'
    ? ['Battery Model']
    : []),
  'Remarks',
];

const buildRowData = (item, activeTab) => [
  formatDate(item.date),
  ...(activeTab === 'all' ? [item.fullService ? 'Full Service' : (item.serviceType ?? '-')] : []),
  getWorkDescription(item),
  // 'major' replaces 'maintenance' in the type check array
  ...(['oil', 'normal', 'tyre', 'battery', 'major', 'all'].includes(activeTab) ? [
    ['oil', 'normal', 'tyre', 'battery', 'major'].includes(item.serviceType)
      ? item.serviceHrs
      : '-',
    ['oil', 'normal', 'tyre', 'battery', 'major'].includes(item.serviceType)
      ? (item.nextServiceHrs === 0 ? '' : item.nextServiceHrs)
      : '-',
    ...(activeTab === 'oil' || activeTab === 'all'
      ? [item.serviceType === 'oil' && item.fullService ? Number(item.serviceHrs) + 3000 : '-']
      : []),
  ] : []),
  ...(activeTab === 'tyre' || activeTab === 'all'
    ? [
        item.serviceType === 'tyre' && item.location ? item.location : '-',
        item.serviceType === 'tyre' ? item.tyreModel : '-',
      ]
    : []),
  ...(activeTab === 'battery' || activeTab === 'all'
    ? [item.serviceType === 'battery' ? item.batteryModel : '-']
    : []),
  getRemarksText(item),
];

// ─────────────────────────────────────────────────────────────────────────────
// Excel Export
// ─────────────────────────────────────────────────────────────────────────────

export const exportToExcel = async ({
  groupedData,
  activeTab,
  isMultipleEquipment,
  multipleEquipmentData,
  equipmentData,
  regNoArray,
  searchTerm,
  filterState,
}) => {
  const workbook  = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Service History');

  const tabName        = getTabName(activeTab);
  const equipmentTitle = isMultipleEquipment
    ? `Equipments (${regNoArray.join(', ')})`
    : `${equipmentData?.machine ?? 'Equipment'} ${regNoArray[0]}`;

  const headers  = buildHeaders(activeTab);
  const colCount = headers.length;
  const lastCol  = String.fromCharCode(64 + colCount);

  let currentRow = 1;

  const applyHeaderRow = (rowNum, value, fontSize, bgArgb, textArgb = 'FF000000') => {
    const cell = worksheet.getCell(`A${rowNum}`);
    cell.value     = value;
    cell.font      = { bold: true, size: fontSize, color: { argb: textArgb } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(rowNum).height = 45;
  };

  applyHeaderRow(currentRow, `${tabName} History - ${equipmentTitle}`, 16, 'FF2F5597', 'FFFFFFFF');
  currentRow++;
  applyHeaderRow(currentRow, `Date Range: ${getDateRangeText(filterState)}`, 14, 'FFBDD7EE');

  if (searchTerm) {
    currentRow++;
    applyHeaderRow(currentRow, `Search Term: "${searchTerm}"`, 12, 'FFDDEBF7');
  }

  currentRow++;
  worksheet.getRow(currentRow).height = 20;

  currentRow++;
  const tsCell = worksheet.getCell(`A${currentRow}`);
  tsCell.value     = `Report Generated: ${new Date().toLocaleString()}`;
  tsCell.font      = { italic: true, size: 11, color: { argb: 'FF7F7F7F' } };
  tsCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(currentRow).height = 45;

  currentRow++;
  worksheet.getRow(currentRow).height = 20;

  currentRow++;
  const headerRow = worksheet.getRow(currentRow);
  headers.forEach((header, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value     = header;
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
    cell.border    = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
  });
  headerRow.height = 45;

  const colWidths = [
    15,
    ...(activeTab === 'all' ? [15] : []),
    40,
    ...(activeTab === 'oil' || activeTab === 'all' ? [15, 15, 18] : []),
    ...(activeTab === 'major' ? [15, 15] : []),
    ...(activeTab === 'tyre' || activeTab === 'all' ? [20, 25] : []),
    ...(activeTab === 'battery' || activeTab === 'all' ? [25] : []),
    40,
  ];
  colWidths.forEach((width, i) => { worksheet.getColumn(i + 1).width = width; });

  Object.entries(groupedData).forEach(([regNo, items]) => {
    if (isMultipleEquipment) {
      currentRow++;
      const eq = multipleEquipmentData.find(e => e.regNo?.toString().trim() === regNo?.toString().trim());
      worksheet.mergeCells(`A${currentRow}:${lastCol}${currentRow}`);
      const eqCell = worksheet.getRow(currentRow).getCell(1);
      eqCell.value     = `${eq?.machine ?? 'Equipment'} - Reg No: ${regNo}`;
      eqCell.font      = { bold: true, size: 12 };
      eqCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };
      eqCell.alignment = { horizontal: 'left', vertical: 'middle' };
      eqCell.border    = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      worksheet.getRow(currentRow).height = 35;
    }

    items.forEach((item) => {
      currentRow++;
      const dataRow = worksheet.getRow(currentRow);
      const bgArgb  = getRowBgColor(item);

      buildRowData(item, activeTab).forEach((value, colIndex) => {
        dataRow.getCell(colIndex + 1).value = value;
      });

      dataRow.height = 45;
      dataRow.eachCell((cell) => {
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgArgb } };
        cell.border    = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.font      = { size: 11 };
      });
    });
  });

  worksheet.mergeCells(`A1:${lastCol}1`);
  worksheet.mergeCells(`A2:${lastCol}2`);
  if (searchTerm) {
    worksheet.mergeCells(`A3:${lastCol}3`);
    worksheet.mergeCells(`A5:${lastCol}5`);
  } else {
    worksheet.mergeCells(`A4:${lastCol}4`);
  }

  const suffix   = getDateFilterSuffix(filterState);
  const fileName = `${tabName.replace(/\s+/g, '_')}_${isMultipleEquipment ? 'Multiple_Equipment' : regNoArray[0]}${suffix}_${new Date().toISOString().slice(0, 10)}.xlsx`;

  const buffer = await workbook.xlsx.writeBuffer();
  const blob   = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url    = window.URL.createObjectURL(blob);

  const link    = document.createElement('a');
  link.href     = url;
  link.download = fileName;
  link.click();
  window.URL.revokeObjectURL(url);
};

// ─────────────────────────────────────────────────────────────────────────────
// PDF Export
// ─────────────────────────────────────────────────────────────────────────────

export const exportToPDF = async ({
  groupedData,
  activeTab,
  isMultipleEquipment,
  multipleEquipmentData,
  equipmentData,
  regNoArray,
  searchTerm,
  filterState,
  supervisorSignUrl,
}) => {
  const { jsPDF } = window.jspdf;
  const doc       = new jsPDF('landscape', 'mm', 'a4');

  const tabName        = getTabName(activeTab);
  const equipmentTitle = isMultipleEquipment
    ? `Equipments (${regNoArray.join(', ')})`
    : `${equipmentData?.machine ?? 'Equipment'} ${regNoArray[0]}`;

  let currentY = 10;

  try {
    const [leftLogoData, rightLogoData] = await Promise.all([
      loadImageAsDataURL(logoImage),
      loadImageAsDataURL(alAnsariText),
    ]);

    const leftProps  = doc.getImageProperties(leftLogoData);
    const leftWidth  = 40;
    const leftHeight = (leftProps.height / leftProps.width) * leftWidth;
    doc.addImage(leftLogoData, 'PNG', 10, currentY, leftWidth, leftHeight);

    const rightProps  = doc.getImageProperties(rightLogoData);
    const rightWidth  = 80;
    const rightHeight = (rightProps.height / rightProps.width) * rightWidth;
    doc.addImage(rightLogoData, 'PNG', 210, currentY, rightWidth, rightHeight);

    currentY += Math.max(leftHeight, rightHeight) + 6;
  } catch {
    currentY += 30;
  }

  currentY += 30;

  doc.setFontSize(18); doc.setFont(undefined, 'bold');
  doc.text(`${tabName} History - ${equipmentTitle}`, 148, currentY, { align: 'center' });
  currentY += 7;

  doc.setFontSize(12); doc.setFont(undefined, 'normal');
  doc.text(`Date Range: ${getDateRangeText(filterState)}`, 148, currentY, { align: 'center' });
  currentY += 6;

  if (searchTerm) {
    doc.setFontSize(10);
    doc.text(`Search Term: "${searchTerm}"`, 148, currentY, { align: 'center' });
    currentY += 6;
  }

  doc.setFontSize(9); doc.setTextColor(128, 128, 128);
  doc.text(`Report Generated: ${new Date().toLocaleString()}`, 148, currentY, { align: 'center' });
  currentY += 10;

  const headers   = buildHeaders(activeTab);
  const tableData = [];

  Object.entries(groupedData).forEach(([regNo, items]) => {
    if (isMultipleEquipment) {
      const eq = multipleEquipmentData.find(e => e.regNo?.toString().trim() === regNo?.toString().trim());
      tableData.push([{
        content:  `${eq?.machine ?? 'Equipment'} - Reg No: ${regNo}`,
        colSpan:  headers.length,
        styles:   { fontStyle: 'bold', fillColor: [211, 211, 211], halign: 'left' },
      }]);
    }

    items.forEach((item) => {
      const row = [
        formatDate(item.date),
        ...(activeTab === 'all' ? [item.fullService ? 'Full Service' : getServiceTypeBadge(item.serviceType)?.text] : []),
        getWorkDescriptionForPDF(item),
        // 'major' replaces 'maintenance'
        ...(['oil', 'normal', 'major', 'all'].includes(activeTab) ? [
          ['oil', 'normal', 'major'].includes(item.serviceType)
            ? item.serviceHrs
            : item.serviceType === 'tyre' ? item.runningHours : '-',
          ['oil', 'normal', 'major'].includes(item.serviceType)
            ? (item.nextServiceHrs === 0 ? '' : item.nextServiceHrs)
            : '-',
          ...(activeTab === 'oil' || activeTab === 'all'
            ? [item.serviceType === 'oil' && item.fullService ? Number(item.serviceHrs) + 3000 : '-']
            : []),
        ] : []),
        ...(activeTab === 'tyre' || activeTab === 'all'
          ? [
              item.serviceType === 'tyre' && item.location ? item.location : '-',
              item.serviceType === 'tyre' ? item.tyreModel : '-',
            ]
          : []),
        ...(activeTab === 'battery' || activeTab === 'all'
          ? [item.serviceType === 'battery' ? item.batteryModel : '-']
          : []),
        getRemarksText(item),
      ];
      tableData.push(row);
    });
  });

  const flatItems = Object.values(groupedData).flat();

  doc.autoTable({
    head:    [headers],
    body:    tableData,
    startY:  currentY,
    theme:   'grid',
    styles:  { fontSize: 8, cellPadding: 2, overflow: 'linebreak', halign: 'center', valign: 'middle' },
    headStyles: { fillColor: [68, 114, 196], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
    columnStyles: { 0: { cellWidth: 25 }, ...(activeTab === 'all' ? { 1: { cellWidth: 20 } } : {}) },
    didParseCell(data) {
      if (data.section === 'body' && data.row.index >= 0) {
        const item = flatItems[data.row.index];
        if (item) data.cell.styles.fillColor = getRowBgColorForPDF(item);
      }
    },
    margin: { top: 10, left: 10, right: 10 },
  });

  const signY = doc.lastAutoTable.finalY + 15;
  doc.setTextColor(0, 0, 0);

  if (supervisorSignUrl) {
    try {
      const sigData = await loadImageAsDataURL(supervisorSignUrl);
      doc.addImage(sigData, 'PNG', 10, signY, 50, 45);
    } catch {
      doc.setFontSize(10); doc.setFont(undefined, 'italic'); doc.setTextColor(150, 150, 150);
      doc.text('Not Signed', 10, signY);
    }
  } else {
    doc.setFontSize(10); doc.setFont(undefined, 'italic'); doc.setTextColor(150, 150, 150);
    doc.text('Not Signed', 10, signY);
  }

  doc.setTextColor(0, 0, 0); doc.setFontSize(12); doc.setFont(undefined, 'normal');
  const detailsY = signY + 45;
  doc.text('Firoz Khan',       10, detailsY);
  doc.text('Workshop Manager', 10, detailsY + 6);
  doc.text('+974 5170 0481',   10, detailsY + 12);

  const suffix   = getDateFilterSuffix(filterState);
  const fileName = `${tabName.replace(/\s+/g, '_')}_${isMultipleEquipment ? 'Multiple_Equipment' : regNoArray[0]}${suffix}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

// ─────────────────────────────────────────────────────────────────────────────
// PDF Export Separate (One PDF per Equipment)
// ─────────────────────────────────────────────────────────────────────────────

export const exportToPDFSeparate = async ({
  groupedData,
  activeTab,
  isMultipleEquipment,
  multipleEquipmentData,
  equipmentData,
  regNoArray,
  searchTerm,
  filterState,
  supervisorSignUrl,
}) => {
  const { jsPDF } = window.jspdf;
  const tabName = getTabName(activeTab);
  const suffix  = getDateFilterSuffix(filterState);

  const equipments = Object.entries(groupedData);
  let downloadCount = 0;

  // Helper function to create a single PDF for one equipment
  const createEquipmentPDF = async (regNo, items, eq) => {
    const doc       = new jsPDF('landscape', 'mm', 'a4');
    const equipName = eq?.machine ?? 'Equipment';
    let currentY    = 10;

    try {
      const [leftLogoData, rightLogoData] = await Promise.all([
        loadImageAsDataURL(logoImage),
        loadImageAsDataURL(alAnsariText),
      ]);

      const leftProps  = doc.getImageProperties(leftLogoData);
      const leftWidth  = 40;
      const leftHeight = (leftProps.height / leftProps.width) * leftWidth;
      doc.addImage(leftLogoData, 'PNG', 10, currentY, leftWidth, leftHeight);

      const rightProps  = doc.getImageProperties(rightLogoData);
      const rightWidth  = 80;
      const rightHeight = (rightProps.height / rightProps.width) * rightWidth;
      doc.addImage(rightLogoData, 'PNG', 210, currentY, rightWidth, rightHeight);

      currentY += Math.max(leftHeight, rightHeight) + 6;
    } catch {
      currentY += 30;
    }

    currentY += 30;

    doc.setFontSize(18); doc.setFont(undefined, 'bold');
    doc.text(`${tabName} History - ${equipName} (${regNo})`, 148, currentY, { align: 'center' });
    currentY += 7;

    doc.setFontSize(12); doc.setFont(undefined, 'normal');
    doc.text(`Date Range: ${getDateRangeText(filterState)}`, 148, currentY, { align: 'center' });
    currentY += 6;

    if (searchTerm) {
      doc.setFontSize(10);
      doc.text(`Search Term: "${searchTerm}"`, 148, currentY, { align: 'center' });
      currentY += 6;
    }

    doc.setFontSize(9); doc.setTextColor(128, 128, 128);
    doc.text(`Report Generated: ${new Date().toLocaleString()}`, 148, currentY, { align: 'center' });
    currentY += 10;

    const headers   = buildHeaders(activeTab);
    const tableData = [];

    items.forEach((item) => {
      const row = [
        formatDate(item.date),
        ...(activeTab === 'all' ? [item.fullService ? 'Full Service' : getServiceTypeBadge(item.serviceType)?.text] : []),
        getWorkDescriptionForPDF(item),
        ...(['oil', 'normal', 'tyre', 'battery', 'major', 'all'].includes(activeTab) ? [
          ['oil', 'normal', 'tyre', 'battery', 'major'].includes(item.serviceType)
            ? item.serviceHrs
            : '-',
          ['oil', 'normal', 'tyre', 'battery', 'major'].includes(item.serviceType)
            ? (item.nextServiceHrs === 0 ? '' : item.nextServiceHrs)
            : '-',
          ...(activeTab === 'oil' || activeTab === 'all'
            ? [item.serviceType === 'oil' && item.fullService ? Number(item.serviceHrs) + 3000 : '-']
            : []),
        ] : []),
        ...(activeTab === 'tyre' || activeTab === 'all'
          ? [
              item.serviceType === 'tyre' && item.location ? item.location : '-',
              item.serviceType === 'tyre' ? item.tyreModel : '-',
            ]
          : []),
        ...(activeTab === 'battery' || activeTab === 'all'
          ? [item.serviceType === 'battery' ? item.batteryModel : '-']
          : []),
        getRemarksText(item),
      ];
      tableData.push(row);
    });

    doc.autoTable({
      head:    [headers],
      body:    tableData,
      startY:  currentY,
      theme:   'grid',
      styles:  { fontSize: 8, cellPadding: 2, overflow: 'linebreak', halign: 'center', valign: 'middle' },
      headStyles: { fillColor: [68, 114, 196], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center' },
      columnStyles: { 0: { cellWidth: 25 }, ...(activeTab === 'all' ? { 1: { cellWidth: 20 } } : {}) },
      didParseCell(data) {
        if (data.section === 'body' && data.row.index >= 0) {
          const item = items[data.row.index];
          if (item) data.cell.styles.fillColor = getRowBgColorForPDF(item);
        }
      },
      margin: { top: 10, left: 10, right: 10 },
    });

    const signY = doc.lastAutoTable.finalY + 15;
    doc.setTextColor(0, 0, 0);

    if (supervisorSignUrl) {
      try {
        const sigData = await loadImageAsDataURL(supervisorSignUrl);
        doc.addImage(sigData, 'PNG', 10, signY, 50, 45);
      } catch {
        doc.setFontSize(10); doc.setFont(undefined, 'italic'); doc.setTextColor(150, 150, 150);
        doc.text('Not Signed', 10, signY);
      }
    } else {
      doc.setFontSize(10); doc.setFont(undefined, 'italic'); doc.setTextColor(150, 150, 150);
      doc.text('Not Signed', 10, signY);
    }

    doc.setTextColor(0, 0, 0); doc.setFontSize(12); doc.setFont(undefined, 'normal');
    const detailsY = signY + 45;
    doc.text('Firoz Khan',       10, detailsY);
    doc.text('Workshop Manager', 10, detailsY + 6);
    doc.text('+974 5170 0481',   10, detailsY + 12);

    const fileName = `${tabName.replace(/\s+/g, '_')}_${equipName.replace(/\s+/g, '_')}_${regNo}${suffix}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
  };

  // Download PDFs sequentially with delay to avoid browser throttling
  for (let i = 0; i < equipments.length; i++) {
    const [regNo, items] = equipments[i];
    const eq = multipleEquipmentData.find(e => e.regNo?.toString().trim() === regNo?.toString().trim());

    try {
      await createEquipmentPDF(regNo, items, eq);
      downloadCount++;

      // Add delay between downloads (except for last one) to avoid browser blocking
      if (i < equipments.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error(`[Export] Failed to create PDF for equipment ${regNo}:`, error);
    }
  }

  if (downloadCount === 0) {
    throw new Error('Failed to create any PDFs');
  }
};

const getServiceTypeBadge = (serviceType) => {
  const badges = {
    normal:  { text: 'Normal'     },
    oil:     { text: 'Oil'        },
    major:   { text: 'Major Works' }, // 'maintenance' removed
    tyre:    { text: 'Tyre'       },
    battery: { text: 'Battery'    },
  };
  return badges[serviceType] || { text: 'Unknown' };
};

// ─────────────────────────────────────────────────────────────────────────────
// Print
// ─────────────────────────────────────────────────────────────────────────────

export const printServiceHistory = ({
  tableRef,
  activeTab,
  isMultipleEquipment,
  equipmentData,
  regNoArray,
  searchTerm,
  filteredData,
  filterState,
  supervisorSignUrl,
}) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const tabName        = getTabName(activeTab);
  const equipmentTitle = isMultipleEquipment
    ? `Equipments (${regNoArray.join(', ')})`
    : `${equipmentData?.machine ?? 'Equipment'} ${regNoArray[0]}`;

  const signatureHtml = supervisorSignUrl
    ? `<img src="${supervisorSignUrl}" alt="Supervisor Signature" style="width:150px;height:auto;display:block;" />`
    : '<span style="font-style:italic;color:#999;">Not Signed</span>';

  const content = `
    <html>
      <head>
        <title>${tabName} History</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { text-align: center; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
          th, td { border: 1px solid #000; padding: 4px 8px; text-align: center; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .no-results { text-align: center; font-style: italic; }
          .oil-service     { background-color: #e8f5e8 !important; }
          .normal-service  { background-color: #e8f5e8 !important; }
          .major-service   { background-color: #fff3cd !important; }
          .tyre-service    { background-color: #d1ecf1 !important; }
          .battery-service { background-color: #f8d7da !important; }
          .full-service-row, .replacement-row { background-color: #ffd3a5 !important; }
          .view-more-btn, .document-column { display: none !important; }
          td:nth-child(3) { max-width: 170px; white-space: normal; word-wrap: break-word; }
          td:nth-child(10) { max-width: 230px; white-space: normal; word-wrap: break-word; }
        </style>
      </head>
      <body>
        <div style="display:flex;justify-content:space-between;padding:0 1rem;align-items:center;">
          <img style="width:10rem;max-height:6rem;" src="${logoImage}" alt="Logo" />
          <img style="width:18rem;max-height:6rem;" src="${alAnsariText}" alt="Company" />
        </div>
        <div style="display:flex;gap:1rem;justify-content:center;align-items:center;">
          <h2>${tabName} History -</h2>
          <h3>${equipmentTitle} -</h3>
          <p style="text-align:center;">Date Range: ${getDateRangeText(filterState)}</p>
        </div>
        ${searchTerm ? `<p style="text-align:center;">Search results for: "<strong>${searchTerm}</strong>"</p>` : ''}
        <div style="overflow-x:auto;">
          ${tableRef.current?.outerHTML ?? '<p style="text-align:center;">No table data</p>'}
        </div>
        <div style="margin-top:10px;text-align:center;">
          Showing ${filteredData.length} ${searchTerm ? 'matching entries' : 'entries'}
        </div>
        <div style="display:flex;gap:0.5rem;flex-direction:column;margin-top:1rem;text-align:left;">
          ${signatureHtml}
          <p style="font-size:18px;margin:0;">Firoz Khan</p>
          <p style="font-size:18px;margin:0;">Workshop Manager</p>
          <p style="font-size:18px;margin:0;">+974 5170 0481</p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(content);
  printWindow.document.close();
  printWindow.focus();
  printWindow.onload = () => { printWindow.print(); printWindow.close(); };
};