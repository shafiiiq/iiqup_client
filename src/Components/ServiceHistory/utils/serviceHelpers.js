// ─────────────────────────────────────────────────────────────────────────────
// serviceHelpers.js — Pure utility functions for ServiceHistory.
// No React, no side effects, no API calls. Safe to import anywhere.
// ─────────────────────────────────────────────────────────────────────────────


// ─────────────────────────────────────────────────────────────────────────────
// Date Formatting
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats any date string to "DD-MM-YYYY".
 * Returns an empty string for falsy input.
 *
 * @param {string} dateString
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  const date  = new Date(dateString);
  const day   = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year  = date.getFullYear();
  return `${day}-${month}-${year}`;
};


// ─────────────────────────────────────────────────────────────────────────────
// Date Range Filtering
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks whether a given date string falls within the active date filter.
 * Returns false for falsy/invalid input.
 *
 * @param {string}  dateString
 * @param {{
 *   dateFilter:      'all'|'lastXmonths'|'thismonth'|'custom',
 *   lastMonthsCount: number,
 *   customStartDate: string,
 *   customEndDate:   string,
 * }} filterState
 * @returns {boolean}
 */
export const isDateInRange = (dateString, { dateFilter, lastMonthsCount, customStartDate, customEndDate }) => {
  if (!dateString) return false;

  const itemDate = new Date(dateString);
  const now      = new Date();

  switch (dateFilter) {
    case 'all':
      return true;

    case 'lastXmonths': {
      // Include everything from the start of (now - lastMonthsCount + 1) months ago
      const startOfRange = new Date(now.getFullYear(), now.getMonth() - lastMonthsCount + 1, 1);
      startOfRange.setHours(0, 0, 0, 0);
      const itemDateOnly = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      return itemDateOnly >= startOfRange;
    }

    case 'thismonth':
      return itemDate.getMonth()    === now.getMonth() &&
             itemDate.getFullYear() === now.getFullYear();

    case 'custom': {
      if (!customStartDate || !customEndDate) return true;
      const start = new Date(customStartDate);
      const end   = new Date(customEndDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return itemDate >= start && itemDate <= end;
    }

    default:
      return true;
  }
};

/**
 * Converts the active date filter to a human-readable label.
 * Used in export file names and PDF/Excel subtitle rows.
 *
 * @param {{
 *   dateFilter:      string,
 *   lastMonthsCount: number,
 *   customStartDate: string,
 *   customEndDate:   string,
 * }} filterState
 * @returns {string}
 */
export const getDateRangeText = ({ dateFilter, lastMonthsCount, customStartDate, customEndDate }) => {
  switch (dateFilter) {
    case 'all':
      return 'All Time';
    case 'lastXmonths':
      return `Last ${lastMonthsCount} Month${lastMonthsCount !== 1 ? 's' : ''}`;
    case 'thismonth':
      return 'This Month';
    case 'custom':
      return customStartDate && customEndDate
        ? `${formatDate(customStartDate)} to ${formatDate(customEndDate)}`
        : 'Custom Date Range';
    default:
      return 'All Time';
  }
};

/**
 * Builds the export file name suffix based on the active date filter.
 * e.g. "_Last_6_Months" or "_2025-01-01_to_2025-06-30".
 */
export const getDateFilterSuffix = ({ dateFilter, lastMonthsCount, customStartDate, customEndDate }) => {
  switch (dateFilter) {
    case 'lastXmonths':
      return `_Last_${lastMonthsCount}_Months`;
    case 'thismonth':
      return '_This_Month';
    case 'custom':
      return customStartDate && customEndDate ? `_${customStartDate}_to_${customEndDate}` : '';
    default:
      return '';
  }
};


// ─────────────────────────────────────────────────────────────────────────────
// Service Type Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Maps service type keys to badge display config. */
const SERVICE_TYPE_BADGES = {
  normal:      { text: 'Normal',      className: 'badge-normal'      },
  oil:         { text: 'Oil',         className: 'badge-oil'         },
  maintenance: { text: 'Major Works', className: 'badge-maintenance' },
  tyre:        { text: 'Tyre',        className: 'badge-tyre'        },
  battery:     { text: 'Battery',     className: 'badge-battery'     },
};

/**
 * Returns the badge config for a given service type.
 * Falls back to a safe default for unknown types.
 *
 * @param {string} serviceType
 * @returns {{ text: string, className: string }}
 */
export const getServiceTypeBadge = (serviceType) =>
  SERVICE_TYPE_BADGES[serviceType] || { text: 'Unknown', className: 'badge-default' };

/**
 * Human-readable tab label for use in export titles and print headers.
 *
 * @param {string} activeTab
 * @returns {string}
 */
export const getTabName = (activeTab) => {
  const names = {
    all:         'All Services',
    oil:         'Oil Service',
    maintenance: 'Major Works',
    tyre:        'Tyre Service',
    battery:     'Battery Service',
  };
  return names[activeTab] || 'All Services';
};


// ─────────────────────────────────────────────────────────────────────────────
// Row Content Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the "Work Description" cell text for a service record.
 * Oil/normal services list their filter changes; all others use workRemarks.
 * Used in the Excel and screen table (returns plain text, not JSX).
 *
 * @param {object} item — service record
 * @returns {string}
 */
export const getWorkDescription = (item) => {
  if (item.serviceType === 'oil' || item.serviceType === 'normal') {
    return [
      `Filters: Fuel Filter: ${item.fuelFilter || '-'}`,
      `Water Sep: ${item.waterSeparator || '-'}`,
      `Air Filter: ${item.airFilter || '-'}`,
      item.acFilter ? `A/C Filter: ${item.acFilter}` : null,
    ].filter(Boolean).join(', ');
  }
  return item.workRemarks?.toUpperCase() || '-';
};

/**
 * Same as getWorkDescription but formatted as a single line for PDF cells.
 *
 * @param {object} item
 * @returns {string}
 */
export const getWorkDescriptionForPDF = (item) => {
  if (item.serviceType === 'oil' || item.serviceType === 'normal') {
    return [
      `Filters: Fuel Filter: ${item.fuelFilter || '-'}`,
      `Water Sep: ${item.waterSeparator || '-'}`,
      `Air Filter: ${item.airFilter || '-'}`,
      item.acFilter ? `A/C Filter: ${item.acFilter}` : null,
    ].filter(Boolean).join(', ');
  }
  return item.workRemarks?.toUpperCase() || '-';
};

/**
 * Returns the "Remarks" cell text for a service record.
 * Each service type stores its remarks in a different field name.
 *
 * @param {object} item
 * @returns {string}
 */
export const getRemarksText = (item) => {
  switch (item.serviceType) {
    case 'oil':
    case 'normal':
      return item.remarks?.toUpperCase() || '';
    case 'maintenance':
      return item.majorRemarks?.toUpperCase() || item.workRemarks?.toUpperCase() || '';
    case 'tyre':
    case 'battery':
      return item.remarks?.toUpperCase() || '';
    default:
      return '';
  }
};

/**
 * Returns the CSS background colour (ARGB hex) for an Excel/PDF row
 * based on the record's service type and special flags.
 *
 * @param {object} item
 * @returns {string} — ARGB hex e.g. "FFE8F5E8"
 */
export const getRowBgColor = (item) => {
  // Full-service and replaced records are always highlighted orange
  if (item.fullService || item.replaced) return 'FFFFD3A5';

  const colors = {
    oil:         'FFE8F5E8',
    maintenance: 'FFFFF3CD',
    tyre:        'FFD1ECF1',
    battery:     'FFF8D7DA',
    normal:      'FFF8D7DA',
  };
  return colors[item.serviceType] || 'FFFFFFFF';
};

/**
 * Returns the RGB colour tuple for a jsPDF row based on service type.
 *
 * @param {object} item
 * @returns {[number, number, number]}
 */
export const getRowBgColorForPDF = (item) => {
  if (item.fullService || item.replaced) return [255, 211, 165];

  const colors = {
    oil:         [232, 245, 232],
    maintenance: [255, 243, 205],
    tyre:        [209, 236, 241],
    battery:     [248, 215, 218],
  };
  return colors[item.serviceType] || [255, 255, 255];
};


// ─────────────────────────────────────────────────────────────────────────────
// Image Helper (used by PDF export)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Loads an image URL via a canvas element and returns a base64 data URL.
 * Required by jsPDF which cannot load cross-origin images directly.
 *
 * @param {string} imageSrc
 * @returns {Promise<string>} — "data:image/png;base64,..."
 */
export const loadImageAsDataURL = (imageSrc) =>
  new Promise((resolve, reject) => {
    const img     = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src     = imageSrc;
  });