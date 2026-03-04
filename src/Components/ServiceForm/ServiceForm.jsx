// ─────────────────────────────────────────────────────────────────────────────
// ServiceForm.jsx — Service report form for adding and updating service records.
// Handles data pre-population from history, real-time grammar correction,
// checklist management, form validation, and submit/update flow.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { END_POINT }              from '../../constants';
import { apiRequest }             from '../../utils/api';
import { useHeaderTitle }         from '../../context/HeaderTitleContext';
import { useAlert }               from '../../context/AlertContext';
import { useHeaderVibration }     from '../../context/HeaderVibrationContext';

import Button from '../../common/Button/Button';
import Input  from '../../common/Input/Input';
import Toast  from '../../common/Toast/Toast';

import './ServiceForm.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Default checklist used for every new service report. */
const DEFAULT_CHECKLIST = [
  { id: 1,  description: 'Change Engine oil & Filter',      status: '' },
  { id: 2,  description: 'Change Fuel Filter',              status: '' },
  { id: 3,  description: 'Check/Clean Air Filter',          status: '' },
  { id: 4,  description: 'Check Transmission Filter',       status: '' },
  { id: 5,  description: 'Check Power Steering Oil',        status: '' },
  { id: 6,  description: 'Check Hydraulic Oil',             status: '' },
  { id: 7,  description: 'Check Brake',                     status: '' },
  { id: 8,  description: 'Check Tyre Air Pressure',         status: '' },
  { id: 9,  description: 'Check Oil Leak',                  status: '' },
  { id: 10, description: 'Check Battery Condition',         status: '' },
  { id: 11, description: 'Check Wiper & Water',             status: '' },
  { id: 12, description: 'Check All Lights',                status: '' },
  { id: 13, description: 'Check All Horns',                 status: '' },
  { id: 14, description: 'Check Parking Brake',             status: '' },
  { id: 15, description: 'Check Differential Oil',          status: '' },
  { id: 16, description: 'Check Rod Water & Hoses',         status: '' },
  { id: 17, description: 'Lubricants All Points',           status: '' },
  { id: 18, description: 'Check Gear Shift System',         status: '' },
  { id: 19, description: 'Check Clutch System',             status: '' },
  { id: 20, description: 'Check Wheel Nut',                 status: '' },
  { id: 21, description: 'Check Starter & Alternator',      status: '' },
  { id: 22, description: 'Check Number Plate both',         status: '' },
  { id: 23, description: 'Check Paint',                     status: '' },
  { id: 24, description: 'Check Tires',                     status: '' },
  { id: 25, description: 'Check Silencer',                  status: '' },
  { id: 26, description: 'Replace Hydraulic Oil- Filter',   status: '' },
  { id: 27, description: 'Replace Transmission Oil',        status: '' },
  { id: 28, description: 'Replace Differential Oil',        status: '' },
  { id: 29, description: 'Replace Steering Box Oil',        status: '' },
  { id: 30, description: 'Check Engine Valve Clearence',    status: '' },
  { id: 31, description: 'Replace clutch fluid',            status: '' },
  { id: 32, description: 'Check Brake Lining',              status: '' },
  { id: 33, description: 'Change Drive Belt',               status: '' },
  { id: 34, description: 'Check A/C filter',                status: '' },
  { id: 35, description: 'Check Water Seperator',           status: '' },
];

/** Default form field values for a new (non-update) service report. */
const DEFAULT_FORM_DATA = {
  serviceHrs:    '',
  regNo:         '',
  nextServiceHrs:'',
  machine:       '',
  mechanics:     '',
  location:      '',
  date:          new Date().toISOString().split('T')[0],
  operatorName:  '',
  remarks:       '',
};

/** Default toast configuration. */
const DEFAULT_TOAST = {
  isOpen:    false,
  type:      'success',
  message:   '',
  textColor: '#ffffff',
};

/** Shared Input props applied to every form field to keep markup DRY. */
const SHARED_INPUT_PROPS = {
  colorScheme:       'yellow-300',
  textColor:         'black-100',
  labelBgColor:      'transparent',
  labelSize:         '3xl',
  labelColor:        'yellow-300',
  placeholderColor:  'black-300',
  variant:           'gradient',
  width:             '100%',
  height:            '57px',
  squircle:          '4xl',
  fontWeight:        '500',
  inputPaddingInline:'2xl',
  inputPaddingBlock: 'xl',
};

/** Shared Input props for every radio button inside the checklist. */
const SHARED_RADIO_PROPS = {
  textColor:    'black-100',
  labelBgColor: 'transparent',
  size:         'xs',
  variant:      'gradient',
  borderWidth:  '2',
  onCheckedSize:'sm',
  rounded:      '4xl',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalises a date string of any known format to "YYYY-MM-DD".
 * Accepts ISO (with or without time), "DD-MM-YYYY", or returns today on failure.
 *
 * @param {string} raw - Raw date value from the API.
 * @returns {string} Normalised date string.
 */
const normaliseDate = (raw) => {
  if (!raw) return new Date().toISOString().split('T')[0];

  if (raw.includes('T'))                        return raw.split('T')[0];
  if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) {
    const [d, m, y] = raw.split('-');
    return `${y}-${m}-${d}`;
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw))         return raw;

  const parsed = new Date(raw);
  return isNaN(parsed) ? new Date().toISOString().split('T')[0] : parsed.toISOString().split('T')[0];
};

/**
 * Formats a "YYYY-MM-DD" date string to "DD-MM-YYYY" for API payloads.
 *
 * @param {string} dateString - ISO date string.
 * @returns {string} Formatted date.
 */
const formatDateForPayload = (dateString) => {
  const date  = new Date(dateString);
  const day   = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
};

/**
 * Applies oil/filter service type logic to the first 24 checklist items.
 * Derives human-readable descriptions from API flags (oil, oilFilter, etc.).
 *
 * @param {Object[]} items      - Current checklist items array.
 * @param {Object}   serviceData - Raw history data from the API.
 * @returns {Object[]} Updated checklist items.
 */
const applyOilServiceChecklist = (items, serviceData) => {
  const { oil = '', oilFilter = '', fuelFilter = '', airFilter = '', acFilter = '', waterSeparator = '' } = serviceData;

  return items.map((item) => {
    switch (item.id) {
      case 1: {
        const engineDesc =
          oilFilter === 'Check' && oil === 'Check' ? 'Check Engine oil & Filter'              :
          oilFilter === 'Check' && oil === 'Change' ? 'Checked Filter & Changed Engine oil'   :
          oilFilter === 'Change' && oil === 'Check' ? 'Checked Engine oil & Changed Filter'   :
                                                      'Change Engine oil & Filter';
        return { ...item, description: engineDesc, status: '✓' };
      }
      case 2:  return { ...item, description: fuelFilter === 'Check'     ? 'Check Fuel Filter'          : 'Change Fuel Filter',       status: '✓' };
      case 3:  return { ...item, description: airFilter  === 'Change'    ? 'Check/Change Air Filter'    : 'Check/Clean Air Filter',   status: '✓' };
      case 34: return { ...item, description: acFilter   === 'Check'     ? 'Check A/C filter'           : 'Clean A/C filter'                      };
      case 35: return { ...item, description: waterSeparator === 'Check' ? 'Check Water Seperator'      : 'Change Water Seperator'                 };
      default:
        // Items 4-24 get a blanket '✓' for oil/normal service type.
        return (item.id >= 4 && item.id <= 24) ? { ...item, status: '✓' } : item;
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ChecklistRadioGroup — Three radio buttons (YES / NO / BLANK) for one checklist item.
 *
 * @param {number}   itemId         - Checklist item id.
 * @param {string}   currentStatus  - Current status value ('✓', '✗', '--', '').
 * @param {Function} onStatusChange - Callback: (id, status) => void.
 */
function ChecklistRadioGroup({ itemId, currentStatus, onStatusChange }) {
  return (
    <div className="item-status">

      {/* YES */}
      <Input
        type="radio"
        id={`yes-${itemId}`}
        name={`status-${itemId}`}
        checked={currentStatus === '✓'}
        onChange={() => onStatusChange(itemId, '✓')}
        {...SHARED_RADIO_PROPS}
        colorScheme="lime-700"
        borderColor="lime-300"
        onCheckedColor="lime-100"
      />

      {/* NO */}
      <Input
        type="radio"
        id={`no-${itemId}`}
        name={`status-${itemId}`}
        checked={currentStatus === '✗'}
        onChange={() => onStatusChange(itemId, '✗')}
        {...SHARED_RADIO_PROPS}
        colorScheme="red-700"
        borderColor="red-500"
        onCheckedColor="red-100"
      />

      {/* BLANK */}
      <Input
        type="radio"
        id={`blank-${itemId}`}
        name={`status-${itemId}`}
        checked={currentStatus === '--'}
        onChange={() => onStatusChange(itemId, '--')}
        {...SHARED_RADIO_PROPS}
        colorScheme="gray-700"
        onCheckedColor="gray-100"
      />

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

/**
 * ChecklistColumn — Renders a labelled column of checklist items
 * with bulk YES / NO / BLANK action buttons.
 *
 * @param {string}   label          - Column header label (e.g. "Items 1-24").
 * @param {Object[]} items          - Slice of checklist items for this column.
 * @param {number}   rangeStart     - First item id in this column.
 * @param {number}   rangeEnd       - Last item id in this column.
 * @param {Function} onStatusChange - Callback: (id, status) => void.
 * @param {Function} onRangeChange  - Callback: (start, end, status) => void.
 */
function ChecklistColumn({ label, items, rangeStart, rangeEnd, onStatusChange, onRangeChange }) {

  /** Shared props for the three bulk-action buttons. */
  const bulkBtnBase = {
    variant:       'gradient',
    font:          'md',
    squircle:      '4xl',
    width:         '80px',
    height:        '45px',
    type:          'button',
    shadowPosition:'to-bottom',
    shadowColor:   'white-600',
  };

  return (
    <div className="checklist-column">

      {/* ── Bulk action row ── */}
      <div className="checklist-actions">
        <span>{label}</span>
        <div className="checklist-buttons">
          <Button text="YES"   onClick={() => onRangeChange(rangeStart, rangeEnd, '✓')} colorScheme="lime-300" textColor="black-200" {...bulkBtnBase} />
          <Button text="NO"    onClick={() => onRangeChange(rangeStart, rangeEnd, '✗')} colorScheme="red-500"  textColor="white-200" {...bulkBtnBase} />
          <Button text="BLANK" onClick={() => onRangeChange(rangeStart, rangeEnd, '--')} colorScheme="gray-500" textColor="white-200" {...bulkBtnBase} />
        </div>
      </div>

      {/* ── Item rows ── */}
      <div className="checklist-items">
        {items.map((item) => (
          <div key={item.id} className="checklist-item">
            <div className="item-number">{item.id}.</div>
            <div className="item-description">{item.description}</div>
            <ChecklistRadioGroup
              itemId={item.id}
              currentStatus={item.status}
              onStatusChange={onStatusChange}
            />
          </div>
        ))}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ServiceForm — Main Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ServiceForm — Renders the service report form in both "add" and "update" modes.
 *
 * Route params:
 *   - serviceType : 'oil' | 'normal' | 'tyre' | 'battery' | 'maintenance'
 *   - historyId   : service-history record to pre-populate (add mode)
 *   - reportId    : existing service report to edit (update mode)
 *
 * @param {Object} props.initialData - Optional seed values (machine, operatorName).
 */
function ServiceForm({ initialData = {} }) {
  const navigate               = useNavigate();
  const { serviceType, historyId, reportId } = useParams();

  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { showAlert }                          = useAlert();
  const { triggerVibration }                   = useHeaderVibration();

  // ── Refs ───────────────────────────────────────────────────────────────────

  /** Debounce timer for grammar-check requests. */
  const grammarDebounceRef = useRef(null);

  /** Guards against double-fetching service history on re-render. */
  const hasLoadedHistoryRef = useRef(false);

  // ── State ──────────────────────────────────────────────────────────────────

  const [formData,       setFormData]       = useState({ ...DEFAULT_FORM_DATA, machine: initialData.machine || '', operatorName: initialData.operatorName || '' });
  const [checklistItems, setChecklistItems] = useState(DEFAULT_CHECKLIST);
  const [isUpdateMode,   setIsUpdateMode]   = useState(false);
  const [isLoading,      setIsLoading]      = useState(false);
  const [originalDate,   setOriginalDate]   = useState('');
  const [toastConfig,    setToastConfig]    = useState(DEFAULT_TOAST);

  // ── Effect: Pre-populate from service history (add mode) ───────────────────

  useEffect(() => {
    if (!historyId || !serviceType || hasLoadedHistoryRef.current) return;
    hasLoadedHistoryRef.current = true;

    const fetchServiceHistory = async () => {
      try {
        const response = await apiRequest(
          `${END_POINT}/service-history/get-service-history-by/${serviceType}/${historyId}`
        );
        const result = await response.json();

        if (!result.ok || !result.data) {
          showAlert('Failed to load service history data', 'error', '--color-error-500');
          triggerVibration();
          return;
        }

        const history = result.data;

        // Populate form fields from history record.
        setFormData((prev) => ({
          ...prev,
          regNo:         history.equipmentNo  || history.regNo    || '',
          date:          normaliseDate(history.date),
          serviceHrs:    history.runningHours || history.serviceHrs || '',
          nextServiceHrs:history.nextServiceHrs || 0,
          mechanics:     history.mechanics    || '',
          location:      history.location     || '',
          remarks:       history.workRemarks  || history.remarks   || '',
        }));

        // Apply service-type-specific checklist defaults.
        setChecklistItems((prev) => {
          switch (serviceType) {
            case 'tyre':
              return prev.map((item) => ({ ...item, status: (item.id === 8 || item.id === 24) ? '✓' : '' }));

            case 'battery':
              return prev.map((item) => ({ ...item, status: item.id === 10 ? '✓' : '' }));

            case 'normal':
            case 'oil':
              return applyOilServiceChecklist(prev, history);

            case 'maintenance':
              return prev.map((item) => ({ ...item, status: '' }));

            default:
              return prev;
          }
        });

      } catch (err) {
        console.error('[ServiceForm] fetchServiceHistory error:', err);
        showAlert('Error loading service history data', 'error', '--color-error-500');
        triggerVibration();
      }
    };

    fetchServiceHistory();
  }, [historyId, serviceType, showAlert, triggerVibration]);

  // ── Effect: Pre-populate from existing report (update mode) ───────────────

  useEffect(() => {
    if (!reportId) return;
    setIsUpdateMode(true);

    const fetchServiceReport = async () => {
      try {
        const response = await apiRequest(`${END_POINT}/service-report/get-report/with-id/${reportId}`);
        const result   = await response.json();

        if (!result.ok || !result.data) {
          showAlert('Failed to load service report data', 'error', '--color-error-500');
          triggerVibration();
          return;
        }

        const report       = result.data;
        const formattedDate = normaliseDate(report.date);

        setOriginalDate(formattedDate);
        setFormData({
          serviceHrs:    report.serviceHrs    || '',
          regNo:         report.regNo         || '',
          nextServiceHrs:report.nextServiceHrs || '',
          machine:       report.machine       || '',
          mechanics:     report.mechanics     || '',
          location:      report.location      || '',
          date:          formattedDate,
          operatorName:  report.operatorName  || '',
          remarks:       report.remarks       || '',
        });

        if (report.checklistItems?.length) {
          setChecklistItems(report.checklistItems);
        }

      } catch (err) {
        console.error('[ServiceForm] fetchServiceReport error:', err);
        showAlert('Error loading service report data', 'error', '--color-error-500');
        triggerVibration();
      }
    };

    fetchServiceReport();
  }, [reportId, showAlert, triggerVibration]);

  // ── Effect: Auto-populate machine & operator from equipment reg no ─────────

  useEffect(() => {
    if (!formData.regNo || isUpdateMode) return;

    const fetchEquipment = async () => {
      try {
        const response  = await apiRequest(`${END_POINT}/equipments/get-equipment/${formData.regNo}`, 'GET');
        const result    = await response.json();
        const equipment = result?.data?.[0];

        if (equipment) {
          const latestOperator = equipment.certificationBody?.[equipment.certificationBody.length - 1] || '';
          setFormData((prev) => ({
            ...prev,
            machine:      equipment.machine || '',
            operatorName: latestOperator,
          }));
        }
      } catch (err) {
        console.error('[ServiceForm] fetchEquipment error:', err);
      }
    };

    fetchEquipment();
  }, [formData.regNo, isUpdateMode]);

  // ── Effect: Sync header title / subtitle ──────────────────────────────────

  useEffect(() => {
    const title    = isUpdateMode ? 'Update Service Report' : 'Service Report Form';
    const subtitle = formData.regNo || null;

    setHeaderTitle(formData.regNo ? title : 'Service History');
    setHeaderSubtitle(subtitle);

    return () => {
      setHeaderTitle(null);
      setHeaderSubtitle(null);
    };
  }, [formData.regNo, isUpdateMode, setHeaderTitle, setHeaderSubtitle]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  /**
   * Generic controlled-input change handler.
   * Reads `name` and `value` from the event target.
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Remarks field handler with:
   *   - Auto-capitalisation of the first character.
   *   - Auto-capitalisation after full-stop + space.
   *   - Debounced grammar correction via LanguageTool API (1.5 s delay).
   */
  const handleRemarksChange = (e) => {
    let { value } = e.target;

    // Capitalise the first letter typed.
    if (value.length === 1) value = value.charAt(0).toUpperCase();

    // Capitalise letters that follow ". " (sentence boundaries).
    value = value.replace(/\.\s+([a-z])/g, (_match, letter) => `. ${letter.toUpperCase()}`);

    setFormData((prev) => ({ ...prev, remarks: value }));

    // Cancel any pending grammar-check.
    if (grammarDebounceRef.current) clearTimeout(grammarDebounceRef.current);

    // Schedule a new grammar-check after 1.5 s of inactivity.
    grammarDebounceRef.current = setTimeout(async () => {
      if (!value.trim()) return;

      try {
        const response = await fetch('https://api.languagetool.org/v2/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body:    `text=${encodeURIComponent(value)}&language=en-US`,
        });

        const result = await response.json();
        let   fixed  = value;

        // Apply suggestions in reverse so offsets remain valid after replacements.
        [...result.matches].reverse().forEach((match) => {
          if (match.replacements.length > 0) {
            fixed =
              fixed.substring(0, match.offset) +
              match.replacements[0].value +
              fixed.substring(match.offset + match.length);
          }
        });

        if (fixed !== value) {
          setFormData((prev) => ({ ...prev, remarks: fixed }));
        }
      } catch (err) {
        console.error('[ServiceForm] Grammar check error:', err);
      }
    }, 1500);
  };

  /**
   * Updates the status of a single checklist item.
   *
   * @param {number} id     - Item id.
   * @param {string} status - New status value ('✓', '✗', '--').
   */
  const handleStatusChange = (id, status) => {
    setChecklistItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  /**
   * Bulk-applies a status to all items within an inclusive id range.
   *
   * @param {number} startId - First item id (inclusive).
   * @param {number} endId   - Last item id (inclusive).
   * @param {string} status  - Status value to apply.
   */
  const handleRangeStatusChange = (startId, endId, status) => {
    setChecklistItems((prev) =>
      prev.map((item) =>
        item.id >= startId && item.id <= endId ? { ...item, status } : item
      )
    );
  };

  // ── Validation ─────────────────────────────────────────────────────────────

  /**
   * Validates required form fields.
   * Shows an inline toast and returns false on the first invalid field.
   *
   * @returns {boolean} True when all validations pass.
   */
  const validateForm = () => {
    const rules = [
      { field: 'serviceHrs',     message: 'Service Hrs/Km is required',      type: 'error',   textColor: '#ffffff' },
      { field: 'regNo',          message: 'Registration Number is required',  type: 'error',   textColor: '#ffffff' },
      { field: 'machine',        message: 'Machine name is required',         type: 'error',   textColor: '#ffffff' },
      { field: 'mechanics',      message: 'Mechanics name is required',       type: 'warning', textColor: '#000000' },
      { field: 'location',       message: 'Location is required',             type: 'warning', textColor: '#000000' },
      { field: 'operatorName',   message: 'Operator Name is required',        type: 'error',   textColor: '#ffffff' },
    ];

    for (const rule of rules) {
      if (!formData[rule.field]) {
        setToastConfig({ isOpen: true, type: rule.type, message: rule.message, textColor: rule.textColor });
        return false;
      }
    }

    // nextServiceHrs is allowed to be 0, so check for null/undefined specifically.
    if (formData.nextServiceHrs == null) {
      setToastConfig({ isOpen: true, type: 'error', message: 'Next Service Hrs/Km is required', textColor: '#ffffff' });
      return false;
    }

    return true;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────

  /** Builds the API payload, submits the form, and navigates to the service document on success. */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    const payload = {
      ...formData,
      checklistItems,
      serviceType,
      ...(historyId                       && { historyId }),
      ...(isUpdateMode && originalDate    && { previousDate: originalDate }),
    };

    const url    = isUpdateMode ? `${END_POINT}/service-report/updatewith/${reportId}` : `${END_POINT}/service-report/add-service-report`;
    const method = isUpdateMode ? 'PUT' : 'POST';

    try {
      const response = await apiRequest(url, method, payload);
      const result   = await response.json();

      const successMessage = isUpdateMode ? 'Service report updated successfully!' : 'Service report added successfully!';
      showAlert(successMessage, 'done_all', '--color-primary');
      triggerVibration();

      // Navigate to the generated service document after a brief delay.
      setTimeout(() => {
        const reportData = result.data?.serviceReport || formData;
        navigate(`/service-document/${reportData.historyId}`, {
          state: {
            regNo:      reportData.regNo,
            date:       formatDateForPayload(reportData.date),
            serviceType,
            historyId:  reportData.historyId,
            docType:    serviceType,
          },
        });
      }, 1500);

    } catch (err) {
      console.error(`[ServiceForm] ${isUpdateMode ? 'update' : 'add'} error:`, err);
      const errorMessage = isUpdateMode ? 'Failed to update service record. Please try again.' : 'Failed to add service record. Please try again.';
      showAlert(errorMessage, 'error', '--color-error-500');
      triggerVibration();
    } finally {
      setIsLoading(false);
    }
  };

  /** Resets all form fields and checklist to their initial state. */
  const handleReset = () => {
    if (isUpdateMode) return; // Reset is disabled in update mode.

    setFormData({
      ...DEFAULT_FORM_DATA,
      machine:      initialData.machine      || '',
      operatorName: initialData.operatorName || '',
    });

    // Items 1-24 default to '✓'; items 25-35 default to blank.
    setChecklistItems(DEFAULT_CHECKLIST.map((item) => ({
      ...item,
      status: item.id <= 24 ? '✓' : '',
    })));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="service-form-container">

      {/* ── Form ── */}
      <div className="form-container">
        <form className="service-form">

          {/* ── Section: Service Information ── */}
          <div className="form-section">
            <h3 className="section-title">Service Information</h3>
            <div className="form-grid">

              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="text" id="serviceHrs"     name="serviceHrs"     value={formData.serviceHrs}     onChange={handleInputChange} label="Service Hrs/ Km"          placeholder="Enter service hrs"                        required />
              </div>
              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="text" id="regNo"          name="regNo"          value={formData.regNo}          onChange={handleInputChange} label="Reg No"                   placeholder="Enter equipment registration number"       required />
              </div>
              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="text" id="nextServiceHrs" name="nextServiceHrs" value={formData.nextServiceHrs} onChange={handleInputChange} label="Next Service Hrs/ Km"     placeholder="Enter next service hrs"                   required />
              </div>
              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="text" id="machine"        name="machine"        value={formData.machine}        onChange={handleInputChange} label="Machine"                  placeholder="Enter equipment name"                     required />
              </div>
              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="date" id="date"           name="date"           value={formData.date}           onChange={handleInputChange} label="Date"                     squircle="10xl"                                        required />
              </div>
              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="text" id="mechanics"      name="mechanics"      value={formData.mechanics}      onChange={handleInputChange} label="Mechanics"                placeholder="Enter mechanics name"                     required />
              </div>
              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="text" id="location"       name="location"       value={formData.location}       onChange={handleInputChange} label="Location"                 placeholder="Enter location"  placeholderColor="black-100" required />
              </div>
              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="text" id="operatorName"   name="operatorName"   value={formData.operatorName}   onChange={handleInputChange} label="Operator Name"            placeholder="Enter operator name"                      required />
              </div>

            </div>
          </div>

          {/* ── Section: Remarks ── */}
          <div className="form-section">
            <h3 className="section-title">Remarks</h3>
            <div className="form-group">
              <Input
                {...SHARED_INPUT_PROPS}
                type="textarea"
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleRemarksChange}
                placeholder="Enter any additional remarks"
                height="157px"
                squircle="30xl"
                fontSize="6xl"
                fullWidth="true"
                spellCheck
                rows={10}
                label={undefined}
              />
            </div>
          </div>

          {/* ── Section: Checklist Items ── */}
          <div className="form-section">
            <h3 className="section-title">Checklist Items</h3>
            <div className="checklist-grid">

              {/* Items 1–24 */}
              <ChecklistColumn
                label="Items 1-24"
                items={checklistItems.slice(0, 24)}
                rangeStart={1}
                rangeEnd={24}
                onStatusChange={handleStatusChange}
                onRangeChange={handleRangeStatusChange}
              />

              {/* Items 25–35 */}
              <ChecklistColumn
                label="Items 25-35"
                items={checklistItems.slice(24)}
                rangeStart={25}
                rangeEnd={35}
                onStatusChange={handleStatusChange}
                onRangeChange={handleRangeStatusChange}
              />

            </div>
          </div>

          {/* ── Form Actions ── */}
          <div className="form-actions">

            <Button
              text="Reset"
              onClick={handleReset}
              colorScheme="amber-800"
              variant="gradient"
              font="md"
              squircle="4xl"
              width="160px"
              height="38px"
              type="button"
              textColor="white-200"
              shadowPosition="to-bottom"
              shadowColor="white-600"
            />

            <Button
              text={isLoading
                ? (isUpdateMode ? 'Updating...'  : 'Submitting...')
                : (isUpdateMode ? 'Update'       : 'Submit')}
              onClick={handleSubmit}
              colorScheme={isLoading ? 'lime-800' : 'lime-700'}
              variant="gradient"
              font="md"
              squircle="4xl"
              width="160px"
              height="38px"
              type="button"
              textColor="white-200"
              shadowPosition="to-bottom"
              shadowColor="white-600"
            />

          </div>
        </form>
      </div>

      {/* ── Toast Notification ── */}
      <Toast
        isOpen={toastConfig.isOpen}
        onClose={() => setToastConfig((prev) => ({ ...prev, isOpen: false }))}
        type={toastConfig.type}
        message={toastConfig.message}
        textColor={toastConfig.textColor}
        duration={4000}
        position="top-center"
      />

    </div>
  );
}

export default ServiceForm;