// ─────────────────────────────────────────────────────────────────────────────
// ServiceHistoryEntryForm.jsx — Unified entry form for all five service history
// record types: Oil, Normal, Tyre, Battery, Major (maintenance).
//
// Route params:
//   :type   — 'oil' | 'normal' | 'tyre' | 'battery' | 'major'
//   :regNo  — Equipment registration number (optional, pre-fills fields)
//
// Routes:
//   <Route path="/service-history-form/:type/:regNo" element={...} />
//   <Route path="/service-history-form/:type"        element={...} />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect }        from 'react';
import { useParams, useNavigate }     from 'react-router-dom';

import { END_POINT }                  from '../../constants';
import { apiRequest }                 from '../../utils/api';
import { useHeaderTitle }             from '../../Context/HeaderTitleContext';
import { useAlert }                   from '../../Context/AlertContext';
import { useHeaderVibration }         from '../../Context/HeaderVibrationContext';

import Button from '../../Common/Button/Button';
import Input  from '../../Common/Input/Input';
import Toast  from '../../Common/Toast/Toast';

import OilService     from '../../assets/images/oil-service.png';
import NormalService  from '../../assets/images/normal-service.jpg';
import TyreService    from '../../assets/images/tyre-service.jpg';
import BatteryService from '../../assets/images/battery-service.png';
import MajorWork      from '../../assets/images/major-service.jpg';

import './ServiceHistoryEntryForm.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-type configuration: page title, hero image, and the
 * navigate-to path builder used after a successful submission.
 * All types now POST to the same unified endpoint.
 */
const TYPE_CONFIG = {
  oil: {
    title:   'Add Oil Service Record',
    image:   OilService,
    navPath: (id) => `/service-form/oil/${id}`,
  },
  normal: {
    title:   'Add Normal Service Record',
    image:   NormalService,
    navPath: (id) => `/service-form/normal/${id}`,
  },
  tyre: {
    title:   'Add Tyre Service Record',
    image:   TyreService,
    navPath: (id) => `/service-form/tyre/${id}`,
  },
  battery: {
    title:   'Add Battery Service Record',
    image:   BatteryService,
    navPath: (id) => `/service-form/battery/${id}`,
  },
  major: {
    title:   'Add Major Service Record',
    image:   MajorWork,
    navPath: (id) => `/service-form/major/${id}`,
  },
};

// Unified API endpoint for all history types
const HISTORY_ENDPOINT = `${END_POINT}/service-history/add`;

/** Default toast config shape. */
const DEFAULT_TOAST = { isOpen: false, type: 'success', message: '', textColor: '#ffffff' };

/** Shared Input props applied to every field. */
const SHARED_INPUT = {
  labelBgColor:      'transparent',
  labelSize:         '3xl',
  required:          'true',
  labelColor:        'yellow-300',
  colorScheme:       'yellow-300',
  variant:           'gradient',
  squircle:          '4xl',
  width:             '100%',
  height:            '57px',
  textColor:         'black-100',
  placeholderColor:  'black-300',
  fontWeight:        '500',
  inputPaddingInline:'2xl',
  inputPaddingBlock: 'xl',
};

/** Shared Button props for the Reset / Submit row. */
const SHARED_BTN = {
  variant:       'gradient',
  font:          'md',
  animation:     '',
  squircle:      '4xl',
  width:         '160px',
  height:        '57px',
  textColor:     'white-200',
  shadowPosition:'to-bottom',
  shadowColor:   'white-600',
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatServiceInput = (input) => (input ? input.toUpperCase() : '');

const calculateNextService = (currentValue) => {
  if (!currentValue) return '';
  const upper = currentValue.toUpperCase();
  if (upper.endsWith('KM'))  { const n = parseInt(upper.replace('KM', ''));  return isNaN(n) ? '' : `${n + 400}KM`;  }
  if (upper.endsWith('HRS')) { const n = parseInt(upper.replace('HRS', '')); return isNaN(n) ? '' : `${n + 400}HRS`; }
  const n = parseInt(upper);
  return isNaN(n) ? '' : `${n + 400}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// ServiceHistoryEntryForm
// ─────────────────────────────────────────────────────────────────────────────

function ServiceHistoryEntryForm() {
  const { type = 'oil', regNo } = useParams();
  const navigate                = useNavigate();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { showAlert }           = useAlert();
  const { triggerVibration }    = useHeaderVibration();

  // ── Resolve config (fall back to 'oil' if unknown type) ───────────────────
  const config = TYPE_CONFIG[type] || TYPE_CONFIG.oil;

  // ── Type booleans ──────────────────────────────────────────────────────────
  const isOilType   = type === 'oil' || type === 'normal';
  const isTyreType  = type === 'tyre';
  const isBattType  = type === 'battery';
  const isMajorType = type === 'major';

  // ── Equipment list for auto-fill ───────────────────────────────────────────
  const [equipments, setEquipments] = useState([]);

  // ── Form state ─────────────────────────────────────────────────────────────
  const buildDefault = () => ({
    date:        new Date().toISOString().split('T')[0],
    regNo:       regNo || '',
    equipment:   '',
    serviceHrs:     '',
    nextServiceHrs: '',
    oil:            'Check',
    oilFilter:      'Check',
    fuelFilter:     'Check',
    acFilter:       'Clean',
    waterSeparator: 'Check',
    airFilter:      'Clean',
    fullService:    false,
    tyreModel:      '',
    tyreNumber:     '',
    location:       '',
    operator:       '',
    batteryModel:   '',
    workRemarks:    '',
    mechanics:      '',
  });

  const [formData,    setFormData]    = useState(buildDefault);
  const [isLoading,   setIsLoading]   = useState(false);
  const [toastConfig, setToastConfig] = useState(DEFAULT_TOAST);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    setHeaderTitle(config.title);
    setHeaderSubtitle(regNo || '');
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [config.title, regNo, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const response = await apiRequest(`${END_POINT}/equipments/get-equipments`, 'GET');
        const data     = await response.json();
        setEquipments(data.data || []);
      } catch (err) {
        console.error('[ServiceHistoryEntryForm] fetchEquipments:', err);
      }
    };
    fetchEquipments();
  }, []);

  // Auto-fill equipment name and operator when regNo changes
  useEffect(() => {
    if (!equipments.length || !formData.regNo) return;
    const found = equipments.find((eq) => eq.regNo === formData.regNo.trim());
    if (!found) return;
    setFormData((prev) => ({
      ...prev,
      equipment: found.machine || '',
      operator:  found.certificationBody?.[found.certificationBody.length - 1]?.operatorName || prev.operator,
    }));
  }, [equipments, formData.regNo]);

  // Auto-calculate next service hrs when serviceHrs changes (oil/normal only)
  useEffect(() => {
    if (!formData.serviceHrs) return;
    setFormData((prev) => ({
      ...prev,
      nextServiceHrs: calculateNextService(formData.serviceHrs),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.serviceHrs]);

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  const showToast = (message, type = 'success', textColor = '#ffffff') =>
    setToastConfig({ isOpen: true, type, message, textColor });

  // ─────────────────────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────────────────────

  const validateForm = () => {
    if (!formData.date)      { showToast('Service Date is required',     'error');             return false; }
    if (!formData.equipment) { showToast('Equipment Name is required',   'error');             return false; }
    if (!formData.regNo)     { showToast('Equipment Reg No is required', 'error');             return false; }

    if (!formData.serviceHrs)     { showToast('Service Hrs/Km is required',      'error'); return false; }
    if (!formData.nextServiceHrs) { showToast('Next Service Hrs/Km is required', 'error'); return false; }

    if (isTyreType) {
      if (!formData.tyreModel)    { showToast('Tyre Model is required',      'error');             return false; }
      if (!formData.tyreNumber)   { showToast('Tyre Number is required',     'error');             return false; }
      if (!formData.location)     { showToast('Location is required',        'warning', '#000000'); return false; }
      if (!formData.operator)     { showToast('Operator is required',        'error');             return false; }
    }

    if (isBattType) {
      if (!formData.batteryModel) { showToast('Battery Model is required', 'error');             return false; }
      if (!formData.location)     { showToast('Location is required',      'warning', '#000000'); return false; }
      if (!formData.operator)     { showToast('Operator is required',      'error');             return false; }
    }

    if (isMajorType) {
      if (!formData.mechanics)   { showToast('Mechanics name is required', 'warning', '#000000'); return false; }
      if (!formData.workRemarks) { showToast('Work Remarks is required',   'error');             return false; }
    }

    return true;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'fullService') {
      setFormData((prev) => ({ ...prev, fullService: value === 'true' || value === true }));
      return;
    }

    if (name === 'serviceHrs' || name === 'nextServiceHrs') {
      setFormData((prev) => ({ ...prev, [name]: formatServiceInput(value) }));
      return;
    }

    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleReset = () => setFormData(buildDefault());

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Build unified payload — all types use the same endpoint and shape
      const payload = {
        serviceType:    type,
        regNo:          formData.regNo,
        date:           formData.date,
        equipment:      formData.equipment,
        // Oil / Normal
        ...(isOilType && {
          serviceHrs:     formData.serviceHrs,
          nextServiceHrs: formData.nextServiceHrs,
          oil:            formData.oil,
          oilFilter:      formData.oilFilter,
          fuelFilter:     formData.fuelFilter,
          acFilter:       formData.acFilter,
          waterSeparator: formData.waterSeparator,
          airFilter:      formData.airFilter,
          fullService:    formData.fullService,
        }),
        // Tyre
        ...(isTyreType && {
          tyreModel:    formData.tyreModel,
          tyreNumber:   formData.tyreNumber,
          location:     formData.location,
          operator:     formData.operator,
          serviceHrs:   formData.serviceHrs,
          nextServiceHrs: formData.nextServiceHrs,
        }),
        // Battery
        ...(isBattType && {
          batteryModel: formData.batteryModel,
          location:     formData.location,
          operator:     formData.operator,
        }),
        // Major
        ...(isMajorType && {
          mechanics:   formData.mechanics,
          remarks:     formData.workRemarks,
        }),
      };

      const response = await apiRequest(HISTORY_ENDPOINT, 'POST', payload);
      const result   = await response.json();

      if (response.status === 409) {
       showAlert(result.message || 'A record for this date already exists', 'warning', '#000000');
       return; 
      }

      if (!response.ok) throw new Error(result.message || result.error || 'Failed to submit');

      showAlert(`${config.title.replace('Add ', '')} added successfully!`, 'done_all', '--color-primary');
      triggerVibration();

      setTimeout(() => navigate(config.navPath(result.data?._id)), 1500);

    } catch (err) {
      console.error('[ServiceHistoryEntryForm] handleSubmit:', err);
      showAlert(`Error: ${err.message}`, 'error', '--color-error-500');
      triggerVibration();
    } finally {
      setIsLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="service-history-container">

      <div className="form-overlay-cnt-img">
        <img src={config.image} alt={config.title} className="overlay-img" />
      </div>

      <div className="form-container form-container-hst">
        <form className="service-history-form" onSubmit={handleSubmit}>

          {/* ── Shared: Date ── */}
          <div className="form-group">
            <Input {...SHARED_INPUT} type="date" id="date" name="date"
              value={formData.date} onChange={handleChange} label="Service Date" placeholder="Start Date" />
          </div>

          {/* ── Tyre: Tyre Model ── */}
          {isTyreType && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="tyreModel" name="tyreModel"
                value={formData.tyreModel} onChange={handleChange}
                label="Tyre Model" placeholder="Enter tyre model" />
            </div>
          )}

          {/* ── Tyre: Tyre Number ── */}
          {isTyreType && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="tyreNumber" name="tyreNumber"
                value={formData.tyreNumber} onChange={handleChange}
                label="Tyre Number" placeholder="Enter tyre number" />
            </div>
          )}

          {/* ── Battery: Battery Model ── */}
          {isBattType && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="batteryModel" name="batteryModel"
                value={formData.batteryModel} onChange={handleChange}
                label="Battery Model" placeholder="Enter battery model" />
            </div>
          )}

          {/* ── Shared: Equipment Name ── */}
          <div className="form-group">
            <Input {...SHARED_INPUT} type="text" id="equipment" name="equipment"
              value={formData.equipment} onChange={handleChange}
              label="Equipment Name" placeholder="Enter equipment name" />
          </div>

          {/* ── Shared: Equipment Reg No ── */}
          <div className="form-group">
            <Input {...SHARED_INPUT} type="text" id="regNo" name="regNo"
              value={formData.regNo} onChange={handleChange}
              label="Equipment Reg No" placeholder="Enter equipment number" />
          </div>

          {/* ── Service Hrs/Km ── */}
          {!isMajorType && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="serviceHrs" name="serviceHrs"
                value={formData.serviceHrs} onChange={handleChange}
                label="Service Hrs / Km" placeholder="e.g. 1000HRS or 5000KM" />
            </div>
          )}

          {/* ── Next Service Hrs/Km ── */}
          {!isMajorType && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="nextServiceHrs" name="nextServiceHrs"
                value={formData.nextServiceHrs} onChange={handleChange}
                label="Next Service Hrs / Km" placeholder="Auto-calculated or enter manually" />
            </div>
          )}

          {/* ── Oil/Normal: Consumable selects ── */}
          {isOilType && (
            <>
              {[
                { id: 'oil',            label: 'Oil',             options: ['Check', 'Change'] },
                { id: 'oilFilter',      label: 'Oil Filter',      options: ['Check', 'Change'] },
                { id: 'fuelFilter',     label: 'Fuel Filter',     options: ['Check', 'Change'] },
                { id: 'acFilter',       label: 'A/C Filter',      options: ['Check', 'Clean']  },
                { id: 'airFilter',      label: 'Air Filter',      options: ['Clean', 'Change'] },
                { id: 'waterSeparator', label: 'Water Separator', options: ['Check', 'Change'] },
              ].map(({ id, label, options }) => (
                <div key={id} className="form-group">
                  <Input {...SHARED_INPUT} type="select" id={id} name={id}
                    value={formData[id]} onChange={handleChange} label={label}
                    options={options.map((o) => ({ value: o, label: o }))} />
                </div>
              ))}

              <div className="form-group full-service-group">
                <Input {...SHARED_INPUT} type="select" id="fullService" name="fullService"
                  value={formData.fullService} onChange={handleChange}
                  label="Full Service" placeholderColor="black-100"
                  options={[{ value: false, label: 'No' }, { value: true, label: 'Yes' }]} />
              </div>
            </>
          )}

          {/* ── Tyre / Battery: Location ── */}
          {(isTyreType || isBattType) && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="location" name="location"
                value={formData.location} onChange={handleChange}
                label="Location" placeholder="Enter location" />
            </div>
          )}

          {/* ── Tyre / Battery: Operator ── */}
          {(isTyreType || isBattType) && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="operator" name="operator"
                value={formData.operator} onChange={handleChange}
                label="Operator" placeholder="Enter operator name" />
            </div>
          )}

          {/* RunningHours removed; tyre/battery use serviceHrs/nextServiceHrs instead. */}

          {/* ── Major: Mechanics ── */}
          {isMajorType && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="mechanics" name="mechanics"
                value={formData.mechanics} onChange={handleChange}
                label="Mechanics" placeholder="Enter mechanic's name" />
            </div>
          )}

          {/* ── Major: Work Remarks ── */}
          {isMajorType && (
            <div className="form-group full-width">
              <Input {...SHARED_INPUT} type="textarea" id="workRemarks" name="workRemarks"
                value={formData.workRemarks} onChange={handleChange}
                label="Work Remarks" placeholder="Enter work remarks and details"
                height="157px" squircle="30xl" fontSize="6xl" fullWidth="true"
                spellCheck="true" rows={5} />
            </div>
          )}

          {/* ── Actions ── */}
          <div className="form-actions">
            <Button {...SHARED_BTN} text="Reset"
              onClick={handleReset} colorScheme="amber-800" type="button" />
            <Button {...SHARED_BTN}
              text={isLoading ? 'Submitting...' : 'Submit'}
              onClick={handleSubmit}
              colorScheme={isLoading ? 'lime-800' : 'lime-600'}
              type={isLoading ? 'disabled' : 'submit'} />
          </div>

        </form>
      </div>

      <Toast
        isOpen={toastConfig.isOpen}
        onClose={() => setToastConfig(DEFAULT_TOAST)}
        type={toastConfig.type}
        message={toastConfig.message}
        textColor={toastConfig.textColor}
        duration={4000}
        position="top-center"
      />
    </div>
  );
}

export default ServiceHistoryEntryForm;