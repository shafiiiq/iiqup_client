// ─────────────────────────────────────────────────────────────────────────────
// exportHelpers.js — Excel export and browser print utilities.
// Pure functions: receive data, produce side effects (file download / print).
// ─────────────────────────────────────────────────────────────────────────────

import * as XLSX from 'xlsx';
import { getOperatorName, formatDateWithExpiry } from './equipmentHelpers';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Human-readable column header labels, keyed by field name. */
const COLUMN_HEADERS = {
  machine:          'Machine',
  regNo:            'Reg No',
  brand:            'Brand',
  year:             'Year',
  company:          'Company',
  operator:         'Operator',
  site:             'Site',
  status:           'Status',
  istimaraExpiry:   'Istimara Expiry',
  insuranceExpiry:  'Insurance Expiry',
  tpcExpiry:        'TPC Expiry',
};

/** Date fields that require formatDateWithExpiry() instead of direct access. */
const DATE_FIELDS = new Set(['istimaraExpiry', 'insuranceExpiry', 'tpcExpiry']);

// ─────────────────────────────────────────────────────────────────────────────
// Export to Excel
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds and downloads an Excel file from the provided equipment data.
 * Only exports columns the user has selected.
 *
 * @param {Array}  filteredData    — equipment records currently visible
 * @param {object} exportColumns   — { [fieldName]: boolean } selection map
 * @returns {{ success: boolean, message: string }}
 */
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
      const header = COLUMN_HEADERS[col];

      if (col === 'operator') {
        row[header] = getOperatorName(item.certificationBody);
      } else if (DATE_FIELDS.has(col)) {
        row[header] = formatDateWithExpiry(item[col]).formattedDate || 'N/A';
      } else {
        row[header] = item[col] || 'N/A';
      }
    });

    return row;
  });

  const ws       = XLSX.utils.json_to_sheet(exportData);
  const wb       = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Equipment Inventory');

  const date     = new Date().toISOString().split('T')[0];
  const filename = `Equipment_Inventory_${date}.xlsx`;

  XLSX.writeFile(wb, filename);

  return { success: true, message: 'Excel file exported successfully!' };
};

// ─────────────────────────────────────────────────────────────────────────────
// Print
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Opens a new browser tab with a print-friendly HTML table of all equipment.
 * Prints automatically when the page loads, then closes the tab.
 *
 * @param {Array}  filteredData   — equipment records to print
 * @param {string} searchTerm     — shown in the subtitle if active
 */
export const printEquipmentTable = (filteredData, searchTerm) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const style = `
    <style>
      body  { font-family: Arial, sans-serif; padding: 20px; }
      h1, p { text-align: center; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #000; padding: 8px; text-align: center; }
      th    { background-color: #f2f2f2; }
      .no-results { text-align: center; font-style: italic; }
    </style>
  `;

  const rows = filteredData?.length > 0
    ? filteredData.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${item.machine            || 'N/A'}</td>
          <td>${item.regNo              || 'N/A'}</td>
          <td>${item.brand              || 'N/A'}</td>
          <td>${item.year               || 'N/A'}</td>
          <td>${item.company            || 'N/A'}</td>
          <td>${getOperatorName(item.certificationBody)}</td>
          <td>${item.site               || 'N/A'}</td>
          <td>${item.status             || 'N/A'}</td>
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