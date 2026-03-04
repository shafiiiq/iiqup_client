// ─────────────────────────────────────────────────────────────────────────────
// equipmentHelpers.js — Pure utility functions for the Equipments module.
// No side effects, no API calls, no state. Safe to import anywhere.
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// Operator Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extracts the display name of the most recently assigned operator
 * from a certificationBody array (which can hold strings or objects).
 *
 * @param {Array} certificationBody
 * @returns {string} Uppercased operator name, or 'N/A'
 */
export const getOperatorName = (certificationBody) => {
  if (!Array.isArray(certificationBody) || certificationBody.length === 0) return 'N/A';

  const lastItem = certificationBody[certificationBody.length - 1];

  if (typeof lastItem === 'string')    return lastItem.toUpperCase();
  if (lastItem?.operatorName)          return lastItem.operatorName.toUpperCase();
  return 'N/A';
};

/**
 * Looks up the database _id of the most recently assigned operator
 * by matching the operator name against the provided operator list.
 *
 * @param {Array}  certificationBody
 * @param {Array}  operatorList        — full list fetched from /operators endpoint
 * @returns {string} operator _id, or empty string if not found
 */
export const getOperatorId = (certificationBody, operatorList) => {
  if (!Array.isArray(certificationBody) || certificationBody.length === 0) return '';

  const lastItem     = certificationBody[certificationBody.length - 1];
  const operatorName = typeof lastItem === 'string' ? lastItem : lastItem?.operatorName;

  if (!operatorName) return '';

  const found = operatorList.find(op => op.name === operatorName);
  return found?._id || found?.id || '';
};

// ─────────────────────────────────────────────────────────────────────────────
// Date Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Formats a date string to "D, Month YYYY" (e.g. "3, January 2025").
 * Returns 'N/A' for falsy input.
 *
 * @param {string} dateString
 * @returns {string}
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';

  const date   = new Date(dateString);
  const months = [
    'January', 'February', 'March', 'April', 'May',      'June',
    'July',    'August',   'September', 'October', 'November', 'December'
  ];

  return `${date.getDate()}, ${months[date.getMonth()]} ${date.getFullYear()}`;
};

/**
 * Parses a MM/DD/YYYY date string, reformats it to DD-MM-YYYY,
 * and checks whether it has passed today's date.
 *
 * @param {string} dateString  — expected format: "MM/DD/YYYY"
 * @returns {{ formattedDate: string, isExpired: boolean }}
 */
export const formatDateWithExpiry = (dateString) => {
  if (!dateString) return { formattedDate: '', isExpired: false };

  const dateParts = dateString.split('/');
  if (dateParts.length !== 3) return { formattedDate: dateString, isExpired: false };

  const [month, day, year] = dateParts;
  const formattedDate      = `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  const itemDate           = new Date(year, month - 1, day);

  const today = new Date();
  today.setHours(0, 0, 0, 0); // compare date only, strip time component

  return { formattedDate, isExpired: itemDate < today };
};

/**
 * Returns the current month (1-based), year, and locale-formatted time string.
 * Used to stamp mobilize/demobilize/replace API payloads.
 *
 * @returns {{ month: number, year: number, time: string }}
 */
export const getCurrentDateTime = () => {
  const now  = new Date();
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  return { month: now.getMonth() + 1, year: now.getFullYear(), time };
};

// ─────────────────────────────────────────────────────────────────────────────
// Image Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Walks the equipment list in a given direction (1 = forward, -1 = backward)
 * starting from startIndex, returning the first item that has at least one image.
 * Used when navigating the fullscreen viewer across equipment boundaries.
 *
 * @param {Array}  data         — full filteredData array
 * @param {number} startIndex
 * @param {number} direction    — 1 or -1
 * @returns {object|null}
 */
export const findEquipmentWithImages = (data, startIndex, direction) => {
  let idx = startIndex;
  while (idx >= 0 && idx < data.length) {
    const eq = data[idx];
    if (eq?.equipmentImage?.length > 0) return eq;
    idx += direction;
  }
  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// Grouping Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Groups an equipment array by their most recent site assignment.
 * Equipment with no site is filed under 'Unassigned'.
 *
 * @param {Array} equipmentList
 * @returns {Record<string, Array>}  — { siteName: [equipment, ...] }
 */
export const groupEquipmentBySite = (equipmentList) => {
  if (!equipmentList || equipmentList.length === 0) return {};

  return equipmentList.reduce((acc, equipment) => {
    let site = equipment.site;

    // site can be an array of historical assignments — use the last entry
    if (Array.isArray(site)) {
      site = site[site.length - 1] || 'Unassigned';
    } else {
      site = site || 'Unassigned';
    }

    if (!acc[site]) acc[site] = [];
    acc[site].push(equipment);
    return acc;
  }, {});
};