// ─────────────────────────────────────────────────────────────────────────────
// ServiceForm.jsx — Service report form for adding and updating service records.
// Handles data pre-population from unified history model, real-time grammar
// correction, checklist management, form validation, and submit/update flow.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams }      from 'react-router-dom';

import { API_URI }              from '../../constants';
import { apiRequest }             from '../../utils/api';
import { useHeaderTitle }         from '../../Context/HeaderTitleContext';
import { useAlert }               from '../../Context/AlertContext';
import { useHeaderVibration }     from '../../Context/HeaderVibrationContext';

import Button from '../../Common/Button/Button';
import Input  from '../../Common/Input/Input';
import Toast  from '../../Common/Toast/Toast';

import './ServiceForm.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

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

const DEFAULT_FORM_DATA = {
  serviceHrs:     '',
  regNo:          '',
  nextServiceHrs: '',
  machine:        '',
  mechanics:      '',
  location:       '',
  date:           new Date().toISOString().split('T')[0],
  operatorName:   '',
  remarks:        '',
};

const DEFAULT_TOAST = { isOpen: false, type: 'success', message: '', textColor: '#ffffff' };

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

const formatDateForPayload = (dateString) => {
  const date  = new Date(dateString);
  const day   = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${day}-${month}-${date.getFullYear()}`;
};

/**
 * Applies oil/filter service type logic to checklist items 1–35.
 * Derives descriptions from the unified history document fields.
 */
const applyOilServiceChecklist = (items, history) => {
  const {
    oil = '', oilFilter = '', fuelFilter = '',
    airFilter = '', acFilter = '', waterSeparator = '',
  } = history;

  return items.map((item) => {
    switch (item.id) {
      case 1: {
        const desc =
          oilFilter === 'Check' && oil === 'Check'  ? 'Check Engine oil & Filter'            :
          oilFilter === 'Check' && oil === 'Change' ? 'Checked Filter & Changed Engine oil'  :
          oilFilter === 'Change' && oil === 'Check' ? 'Checked Engine oil & Changed Filter'  :
                                                      'Change Engine oil & Filter';
        return { ...item, description: desc, status: '✓' };
      }
      case 2:  return { ...item, description: fuelFilter     === 'Check'  ? 'Check Fuel Filter'        : 'Change Fuel Filter',     status: '✓' };
      case 3:  return { ...item, description: airFilter      === 'Change' ? 'Check/Change Air Filter'  : 'Check/Clean Air Filter', status: '✓' };
      case 34: return { ...item, description: acFilter       === 'Check'  ? 'Check A/C filter'         : 'Clean A/C filter'                    };
      case 35: return { ...item, description: waterSeparator === 'Check'  ? 'Check Water Seperator'    : 'Change Water Seperator'              };
      default:
        return (item.id >= 4 && item.id <= 24) ? { ...item, status: '✓' } : item;
    }
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────────────────

function ChecklistRadioGroup({ itemId, currentStatus, onStatusChange }) {
  return (
    <div className="item-status">
      <Input type="radio" id={`yes-${itemId}`}   name={`status-${itemId}`} checked={currentStatus === '✓'}  onChange={() => onStatusChange(itemId, '✓')}  {...SHARED_RADIO_PROPS} colorScheme="lime-700" borderColor="lime-300" onCheckedColor="lime-100" />
      <Input type="radio" id={`no-${itemId}`}    name={`status-${itemId}`} checked={currentStatus === '✗'}  onChange={() => onStatusChange(itemId, '✗')}  {...SHARED_RADIO_PROPS} colorScheme="red-700"  borderColor="red-500"  onCheckedColor="red-100"  />
      <Input type="radio" id={`blank-${itemId}`} name={`status-${itemId}`} checked={currentStatus === '--'} onChange={() => onStatusChange(itemId, '--')} {...SHARED_RADIO_PROPS} colorScheme="gray-700" onCheckedColor="gray-100" />
    </div>
  );
}

function ChecklistColumn({ label, items, rangeStart, rangeEnd, onStatusChange, onRangeChange }) {
  const bulkBtnBase = {
    variant: 'gradient', font: 'md', squircle: '4xl',
    width: '80px', height: '45px', type: 'button',
    shadowPosition: 'to-bottom', shadowColor: 'white-600',
  };
  return (
    <div className="checklist-column">
      <div className="checklist-actions">
        <span>{label}</span>
        <div className="checklist-buttons">
          <Button text="YES"   onClick={() => onRangeChange(rangeStart, rangeEnd, '✓')}  colorScheme="lime-300" textColor="black-200" {...bulkBtnBase} />
          <Button text="NO"    onClick={() => onRangeChange(rangeStart, rangeEnd, '✗')}  colorScheme="red-500"  textColor="white-200" {...bulkBtnBase} />
          <Button text="BLANK" onClick={() => onRangeChange(rangeStart, rangeEnd, '--')} colorScheme="gray-500" textColor="white-200" {...bulkBtnBase} />
        </div>
      </div>
      <div className="checklist-items">
        {items.map((item) => (
          <div key={item.id} className="checklist-item">
            <div className="item-number">{item.id}.</div>
            <div className="item-description">{item.description}</div>
            <ChecklistRadioGroup itemId={item.id} currentStatus={item.status} onStatusChange={onStatusChange} />
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
 * Route params:
 *   - serviceType : 'oil' | 'normal' | 'tyre' | 'battery' | 'major'
 *   - historyId   : unified history record _id to pre-populate (add mode)
 *   - reportId    : existing service report _id to edit (update mode)
 */
function ServiceForm({ initialData = {} }) {
  const navigate                             = useNavigate();
  const { serviceType, historyId, reportId, complaintId } = useParams();

  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { showAlert }                          = useAlert();
  const { triggerVibration }                   = useHeaderVibration();

  const grammarDebounceRef  = useRef(null);
  const hasLoadedHistoryRef = useRef(false);

  const [formData,       setFormData]       = useState({ ...DEFAULT_FORM_DATA, machine: initialData.machine || '', operatorName: initialData.operatorName || '' });
  const [checklistItems, setChecklistItems] = useState(DEFAULT_CHECKLIST);
  const [isUpdateMode,   setIsUpdateMode]   = useState(false);
  const [isLoading,      setIsLoading]      = useState(false);
  const [originalDate,   setOriginalDate]   = useState('');
  const [toastConfig,    setToastConfig]    = useState(DEFAULT_TOAST);

  // ── Effect: Pre-populate from unified history record (add mode) ───────────
  //
  // Uses the new unified endpoint: GET /service-history/get-by-id/:type/:id
  // The unified model has all fields on one document — no need to branch by type
  // for the fetch itself, but we still apply type-specific checklist defaults.

  useEffect(() => {
    if (!historyId || !serviceType || hasLoadedHistoryRef.current) return;
    hasLoadedHistoryRef.current = true;

    const fetchHistory = async () => {
      try {
        const response = await apiRequest(
          `${API_URI}/service-history/get-by-id/${serviceType}/${historyId}`,
          'GET'
        );
        const result = await response.json();

        if (!result.ok || !result.data) {
          showAlert('Failed to load service history data', 'error', '--color-error-500');
          triggerVibration();
          return;
        }

        const history = result.data;

        // All field names are now unified — no equipmentNo / workRemarks aliasing needed
        setFormData((prev) => ({
          ...prev,
          regNo:          history.regNo          || '',
          date:           normaliseDate(history.date),
          serviceHrs:     history.serviceHrs || '',
          nextServiceHrs: history.nextServiceHrs || '',
          mechanics:      history.mechanics      || '',
          location:       history.location       || '',
          remarks:        history.remarks        || '',
          operatorName:   history.operator       || prev.operatorName,
        }));

        // Apply type-specific checklist defaults
        setChecklistItems((prev) => {
          switch (serviceType) {
            case 'tyre':
              return prev.map((item) => ({ ...item, status: (item.id === 8 || item.id === 24) ? '✓' : '' }));
            case 'battery':
              return prev.map((item) => ({ ...item, status: item.id === 10 ? '✓' : '' }));
            case 'oil':
            case 'normal':
              return applyOilServiceChecklist(prev, history);
            case 'major':
              return prev.map((item) => ({ ...item, status: '' }));
            default:
              return prev;
          }
        });

      } catch (err) {
        console.error('[ServiceForm] fetchHistory:', err);
        showAlert('Error loading service history data', 'error', '--color-error-500');
        triggerVibration();
      }
    };

    fetchHistory();
  }, [historyId, serviceType, showAlert, triggerVibration]);

  // ── Effect: Pre-populate from existing report (update mode) ───────────────

  useEffect(() => {
    if (!reportId) return;
    setIsUpdateMode(true);

    const fetchReport = async () => {
      try {
        const response = await apiRequest(
          `${API_URI}/service-report/get-report/with-id/${reportId}`,
          'GET'
        );
        const result = await response.json();

        if (!result.ok || !result.data) {
          showAlert('Failed to load service report data', 'error', '--color-error-500');
          triggerVibration();
          return;
        }

        const report        = result.data;
        const formattedDate = normaliseDate(report.date);

        setOriginalDate(formattedDate);
        setFormData({
          serviceHrs:     report.serviceHrs     || '',
          regNo:          report.regNo          || '',
          nextServiceHrs: report.nextServiceHrs || '',
          machine:        report.machine        || '',
          mechanics:      report.mechanics      || '',
          location:       report.location       || '',
          date:           formattedDate,
          operatorName:   report.operatorName   || '',
          remarks:        report.remarks        || '',
        });

        if (report.checklistItems?.length) {
          setChecklistItems(report.checklistItems);
        }

      } catch (err) {
        console.error('[ServiceForm] fetchReport:', err);
        showAlert('Error loading service report data', 'error', '--color-error-500');
        triggerVibration();
      }
    };

    fetchReport();
  }, [reportId, showAlert, triggerVibration]);

  // ── Effect: Auto-populate machine & operator from reg no ──────────────────

  useEffect(() => {
    if (!formData.regNo || isUpdateMode) return;

    const fetchEquipment = async () => {
      try {
        const response  = await apiRequest(`${API_URI}/equipments/get-equipment/${formData.regNo}`, 'GET');
        const result    = await response.json();
        const equipment = result?.data?.[0];

        if (equipment) {
          const lastCert = equipment.certificationBody?.[equipment.certificationBody.length - 1];
          setFormData((prev) => ({
            ...prev,
            machine:      equipment.machine || '',
            operatorName: lastCert?.operatorName || prev.operatorName,
          }));
        }
      } catch (err) {
        console.error('[ServiceForm] fetchEquipment:', err);
      }
    };

    fetchEquipment();
  }, [formData.regNo, isUpdateMode]);

  // ── Effect: Header title ───────────────────────────────────────────────────

  useEffect(() => {
    const title    = isUpdateMode ? 'Update Service Report' : 'Service Report Form';
    const subtitle = formData.regNo || null;
    setHeaderTitle(formData.regNo ? title : 'Service History');
    setHeaderSubtitle(subtitle);
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [formData.regNo, isUpdateMode, setHeaderTitle, setHeaderSubtitle]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRemarksChange = (e) => {
    let { value } = e.target;

    if (value.length === 1) value = value.charAt(0).toUpperCase();
    value = value.replace(/\.\s+([a-z])/g, (_match, letter) => `. ${letter.toUpperCase()}`);

    setFormData((prev) => ({ ...prev, remarks: value }));

    if (grammarDebounceRef.current) clearTimeout(grammarDebounceRef.current);

    grammarDebounceRef.current = setTimeout(async () => {
      if (!value.trim()) return;
      try {
        const response = await fetch('https://api.languagetool.org/v2/check', {
          method:  'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body:    `text=${encodeURIComponent(value)}&language=en-US`,
        });
        const result = await response.json();
        let fixed = value;
        [...result.matches].reverse().forEach((match) => {
          if (match.replacements.length > 0) {
            fixed = fixed.substring(0, match.offset) + match.replacements[0].value + fixed.substring(match.offset + match.length);
          }
        });
        if (fixed !== value) setFormData((prev) => ({ ...prev, remarks: fixed }));
      } catch (err) {
        console.error('[ServiceForm] grammar check:', err);
      }
    }, 1500);
  };

  const handleStatusChange = (id, status) =>
    setChecklistItems((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)));

  const handleRangeStatusChange = (startId, endId, status) =>
    setChecklistItems((prev) =>
      prev.map((item) => item.id >= startId && item.id <= endId ? { ...item, status } : item)
    );

  // ─────────────────────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────────────────────

  const validateForm = () => {
    const rules = [
      { field: 'serviceHrs',   message: 'Service Hrs/Km is required',     type: 'error',   textColor: '#ffffff' },
      { field: 'regNo',        message: 'Registration Number is required', type: 'error',   textColor: '#ffffff' },
      { field: 'machine',      message: 'Machine name is required',        type: 'error',   textColor: '#ffffff' },
      { field: 'mechanics',    message: 'Mechanics name is required',      type: 'warning', textColor: '#000000' },
      { field: 'location',     message: 'Location is required',            type: 'warning', textColor: '#000000' },
      { field: 'operatorName', message: 'Operator Name is required',       type: 'error',   textColor: '#ffffff' },
    ];

    for (const rule of rules) {
      if (!formData[rule.field]) {
        setToastConfig({ isOpen: true, type: rule.type, message: rule.message, textColor: rule.textColor });
        return false;
      }
    }

    if (formData.nextServiceHrs == null) {
      setToastConfig({ isOpen: true, type: 'error', message: 'Next Service Hrs/Km is required', textColor: '#ffffff' });
      return false;
    }

    return true;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Submit
  // ─────────────────────────────────────────────────────────────────────────

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    const payload = {
      ...formData,
      checklistItems,
      serviceType,
      ...(complaintId && { complaintId }),
      ...(historyId                    && { historyId }),
      ...(isUpdateMode && originalDate && { previousDate: originalDate }),
    };

    const url    = isUpdateMode
      ? `${API_URI}/service-report/updatewith/${reportId}`
      : `${API_URI}/service-report/add-service-report`;
    const method = isUpdateMode ? 'PUT' : 'POST';

    try {
      const response = await apiRequest(url, method, payload);
      const result   = await response.json();

      showAlert(
        isUpdateMode ? 'Service report updated successfully!' : 'Service report added successfully!',
        'done_all',
        '--color-primary'
      );
      triggerVibration();

      setTimeout(() => {
         const report = result.data?.serviceReport || result.data || formData;
         navigate(`/service-document/${report.historyId || historyId}`, {
           state: {
             regNo:      report.regNo,
             date:       formatDateForPayload(report.date),
             serviceType,
             historyId:  report.historyId || historyId,
             docType:    serviceType,
           },
         });
      }, 1500);

    } catch (err) {
      console.error(`[ServiceForm] ${isUpdateMode ? 'update' : 'add'}:`, err);
      showAlert(
        isUpdateMode
          ? 'Failed to update service record. Please try again.'
          : 'Failed to add service record. Please try again.',
        'error',
        '--color-error-500'
      );
      triggerVibration();
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    if (isUpdateMode) return;
    setFormData({ ...DEFAULT_FORM_DATA, machine: initialData.machine || '', operatorName: initialData.operatorName || '' });
    setChecklistItems(DEFAULT_CHECKLIST.map((item) => ({ ...item, status: item.id <= 24 ? '✓' : '' })));
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="service-form-container">
      <div className="form-container">
        <form className="service-form">

          <div className="form-section">
            <h3 className="section-title">Service Information</h3>
            <div className="form-grid">
              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="text" id="serviceHrs"     name="serviceHrs"     value={formData.serviceHrs}     onChange={handleInputChange} label="Service Hrs/ Km"      placeholder="Enter service hrs"                  required />
              </div>
              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="text" id="regNo"          name="regNo"          value={formData.regNo}          onChange={handleInputChange} label="Reg No"               placeholder="Enter equipment registration number" required />
              </div>
              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="text" id="nextServiceHrs" name="nextServiceHrs" value={formData.nextServiceHrs} onChange={handleInputChange} label="Next Service Hrs/ Km" placeholder="Enter next service hrs"              required />
              </div>
              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="text" id="machine"        name="machine"        value={formData.machine}        onChange={handleInputChange} label="Machine"              placeholder="Enter equipment name"               required />
              </div>
              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="date" id="date"           name="date"           value={formData.date}           onChange={handleInputChange} label="Date"                 squircle="10xl"                                  required />
              </div>
              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="text" id="mechanics"      name="mechanics"      value={formData.mechanics}      onChange={handleInputChange} label="Mechanics"            placeholder="Enter mechanics name"               required />
              </div>
              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="text" id="location"       name="location"       value={formData.location}       onChange={handleInputChange} label="Location"             placeholder="Enter location"  placeholderColor="black-100" required />
              </div>
              <div className="form-group">
                <Input {...SHARED_INPUT_PROPS} type="text" id="operatorName"   name="operatorName"   value={formData.operatorName}   onChange={handleInputChange} label="Operator Name"        placeholder="Enter operator name"               required />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Remarks</h3>
            <div className="form-group">
              <Input
                {...SHARED_INPUT_PROPS}
                type="textarea" id="remarks" name="remarks"
                value={formData.remarks} onChange={handleRemarksChange}
                placeholder="Enter any additional remarks"
                height="157px" squircle="30xl" fontSize="6xl"
                fullWidth="true" spellCheck rows={10} label={undefined}
              />
            </div>
          </div>

          <div className="form-section">
            <h3 className="section-title">Checklist Items</h3>
            <div className="checklist-grid">
              <ChecklistColumn
                label="Items 1-24" items={checklistItems.slice(0, 24)}
                rangeStart={1} rangeEnd={24}
                onStatusChange={handleStatusChange} onRangeChange={handleRangeStatusChange}
              />
              <ChecklistColumn
                label="Items 25-35" items={checklistItems.slice(24)}
                rangeStart={25} rangeEnd={35}
                onStatusChange={handleStatusChange} onRangeChange={handleRangeStatusChange}
              />
            </div>
          </div>

          <div className="form-actions">
            <Button
              text="Reset" onClick={handleReset} colorScheme="amber-800"
              variant="gradient" font="md" squircle="4xl" width="160px" height="38px"
              type="button" textColor="white-200" shadowPosition="to-bottom" shadowColor="white-600"
            />
            <Button
              text={isLoading ? (isUpdateMode ? 'Updating...' : 'Submitting...') : (isUpdateMode ? 'Update' : 'Submit')}
              onClick={handleSubmit}
              colorScheme={isLoading ? 'lime-800' : 'lime-700'}
              variant="gradient" font="md" squircle="4xl" width="160px" height="38px"
              type="button" textColor="white-200" shadowPosition="to-bottom" shadowColor="white-600"
            />
          </div>

        </form>
      </div>

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