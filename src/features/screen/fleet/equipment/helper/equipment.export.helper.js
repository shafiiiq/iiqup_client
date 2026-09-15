import * as XLSX from 'xlsx';
import { getOperatorName, formatDateWithExpiry } from './equipment.helper';
import { EQUIPMENT_EXPORT_COLUMN_HEADERS, EQUIPMENT_EXPORT_DATE_FIELDS } from '../constants/equipment.constant';

export const buildAndDownloadExcel = (filteredData, exportColumns) => {
  const selectedColumns = Object.entries(exportColumns)
    .filter(([, isSelected]) => isSelected)
    .map(([col]) => col);

  if (selectedColumns.length === 0) {
    return { success: false, message: 'Please select at least one column to export.' };
  }

  const exportData = filteredData.map((item) => {
    const row = {};

    selectedColumns.forEach((col) => {
      const header = EQUIPMENT_EXPORT_COLUMN_HEADERS[col];

      if (col === 'operator') {
        row[header] = getOperatorName(item.certificationBody);
      } else if (EQUIPMENT_EXPORT_DATE_FIELDS.has(col)) {
        row[header] = formatDateWithExpiry(item[col]).formattedDate || 'N/A';
      } else {
        row[header] = item[col] || 'N/A';
      }
    });

    return row;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Equipment Inventory');

  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `Equipment_Inventory_${date}.xlsx`);

  return { success: true, message: 'Excel file exported successfully!' };
};

export const printEquipmentTable = (filteredData, searchTerm) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const style = `
    <style>
      h1, p { text-align: center; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #000; padding: 8px; text-align: center; }
      th { background-color: #f2f2f2; }
      .no-results { text-align: center; font-style: italic; }
    </style>
  `;

  const rows = filteredData?.length > 0
    ? filteredData.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.machine || 'N/A'}</td>
          <td>${item.regNo || 'N/A'}</td>
          <td>${item.brand || 'N/A'}</td>
          <td>${item.year || 'N/A'}</td>
          <td>${item.company || 'N/A'}</td>
          <td>${getOperatorName(item.certificationBody)}</td>
          <td>${item.site || 'N/A'}</td>
          <td>${item.status || 'N/A'}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="9" class="no-results">No equipment data available</td></tr>';

  const content = `
    <html>
      <head>
        <title>Equipment Inventory</title>
        ${style}
      </head>
      <body>
        <h1>Equipment Inventory</h1>
        ${searchTerm ? `<p>Search results for: "<strong>${searchTerm}</strong>"</p>` : ''}
        <table>
          <thead>
            <tr>
              <th>ID</th><th>Machine</th><th>Reg No</th><th>Brand</th>
              <th>Year</th><th>Company</th><th>Operator</th><th>Site</th><th>Status</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        <div style="margin-top: 10px; text-align: center;">
          Showing ${filteredData?.length || 0} ${searchTerm ? 'matching entries' : 'entries'}
        </div>
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