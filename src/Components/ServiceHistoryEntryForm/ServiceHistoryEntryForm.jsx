// ─────────────────────────────────────────────────────────────────────────────
// ServiceHistoryEntryForm.jsx — Unified entry form for all four service history
// record types: Oil/Normal Service, Tyre, Battery, and Maintenance.
//
// Route params:
//   :type   — 'oil' | 'normal' | 'tyre' | 'battery' | 'maintenance'
//   :regNo  — Equipment registration number (optional, pre-fills fields)
//
// Routes (replace existing four routes with these two):
//   <Route path="/service-history-form/:type/:regNo" element={...} />
//   <Route path="/service-history-form/:type"        element={...} />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect }        from 'react';
import { useParams, useNavigate }     from 'react-router-dom';

import { END_POINT }                  from '../../constants';
import { apiRequest }                 from '../../utils/api';
import { useHeaderTitle }             from '../../context/HeaderTitleContext';
import { useAlert }                   from '../../context/AlertContext';
import { useHeaderVibration }         from '../../context/HeaderVibrationContext';

import Button from '../../common/Button/Button';
import Input  from '../../common/Input/Input';
import Toast  from '../../common/Toast/Toast';

import OilService    from '../../assets/images/oil-service.png';
import NormalService from '../../assets/images/normal-service.jpg';
import TyreService   from '../../assets/images/tyre-service.jpg';
import BatteryService from '../../assets/images/battery-service.png';
import MajorWork     from '../../assets/images/major-service.jpg';

// Reuse whichever CSS has the shared layout rules.
// All four originals shared identical structure — pick one or consolidate to a
// single ServiceHistoryEntryForm.css that imports the common rules.
import './ServiceHistoryEntryForm.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Per-type configuration: page title, hero image, API endpoint, and the
 * navigate-to path builder used after a successful submission.
 *
 * @type {Record<string, { title: string, image: string, endpoint: string, navPath: (id: string) => string }>}
 */
const TYPE_CONFIG = {
  oil: {
    title:    'Add Oil Service Record',
    image:    OilService,
    endpoint: `${END_POINT}/service-history/add-service-history`,
    navPath:  (id) => `/service-form/oil/${id}`,
  },
  normal: {
    title:    'Add Normal Service Record',
    image:    NormalService,
    endpoint: `${END_POINT}/service-history/add-service-history`,
    navPath:  (id) => `/service-form/normal/${id}`,
  },
  tyre: {
    title:    'Add Tyre Service Record',
    image:    TyreService,
    endpoint: `${END_POINT}/service-history/add-tyre-history`,
    navPath:  (id) => `/service-form/tyre/${id}`,
  },
  battery: {
    title:    'Add Battery Service Record',
    image:    BatteryService,
    endpoint: `${END_POINT}/service-history/add-batery-history`,
    navPath:  (id) => `/service-form/battery/${id}`,
  },
  maintenance: {
    title:    'Add Major Service Record',
    image:    MajorWork,
    endpoint: `${END_POINT}/service-history/add-maintenance-history`,
    navPath:  (id) => `/service-form/maintenance/${id}`,
  },
};

/** Default toast config shape — reused on every toast reset. */
const DEFAULT_TOAST = { isOpen: false, type: 'success', message: '', textColor: '#ffffff' };

/** Shared Input props applied to every field to keep JSX terse. */
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

/**
 * Uppercases the input and leaves it unchanged — used to normalise service
 * hours / km values before storing them.
 *
 * @param {string} input - Raw input string.
 * @returns {string} Uppercased string.
 */
const formatServiceInput = (input) => (input ? input.toUpperCase() : '');

/**
 * Calculates the next service milestone by adding 400 to the numeric portion
 * of a value like "1200HRS" or "5000KM".
 *
 * @param {string} currentValue - Current service hours/km string.
 * @returns {string} Next service value, or empty string if unparseable.
 */
const calculateNextService = (currentValue) => {
  if (!currentValue) return '';
  const upper = currentValue.toUpperCase();

  if (upper.endsWith('KM')) {
    const n = parseInt(upper.replace('KM', ''));
    return isNaN(n) ? '' : `${n + 400}KM`;
  }
  if (upper.endsWith('HRS')) {
    const n = parseInt(upper.replace('HRS', ''));
    return isNaN(n) ? '' : `${n + 400}HRS`;
  }
  const n = parseInt(upper);
  return isNaN(n) ? '' : `${n + 400}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// ServiceHistoryEntryForm — Main Component
// ─────────────────────────────────────────────────────────────────────────────

/**
 * ServiceHistoryEntryForm — Renders the correct history entry form based on
 * the `:type` route parameter. All four original forms have been merged here.
 * Field sets are rendered conditionally per type; shared infrastructure
 * (equipment fetch, auto-fill, toast, submit, reset) is written once.
 */
function ServiceHistoryEntryForm() {
  const { type = 'oil', regNo } = useParams();
  const navigate                = useNavigate();
  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { showAlert }           = useAlert();
  const { triggerVibration }    = useHeaderVibration();

  // ── Resolve config for the current type ───────────────────────────────────

  const config = TYPE_CONFIG[type] || TYPE_CONFIG.oil;

  // ── Booleans for conditional field rendering ───────────────────────────────

  const isServiceType     = type === 'oil' || type === 'normal'; // oil + normal share the same fields
  const isTyreType        = type === 'tyre';
  const isBatteryType     = type === 'battery';
  const isMaintenanceType = type === 'maintenance';

  // ── Data lists ─────────────────────────────────────────────────────────────

  const [equipments, setEquipments] = useState([]);

  // ── Form state ─────────────────────────────────────────────────────────────

  const buildDefaultFormData = () => ({
    // ── Shared fields (all types) ──
    date:        new Date().toISOString().split('T')[0],
    equipment:   '',
    // Equipment reg no key differs by type in originals — normalised to regNo here.
    regNo:       regNo || '',

    // ── Oil / Normal service fields ──
    serviceHrs:     '',
    nextServiceHrs: '',
    oil:            'Check',
    oilFilter:      'Check',
    fuelFilter:     'Check',
    acFilter:       'Clean',
    waterSeparator: 'Check',
    airFilter:      'Clean',
    fullService:    false,

    // ── Tyre fields ──
    tyreModel:    '',
    tyreNumber:   '',
    location:     '',
    operator:     '',
    runningHours: '',

    // ── Battery fields ──
    batteryModel: '',
    // location and operator also used by battery (same keys as tyre)

    // ── Maintenance fields ──
    workRemarks: '',
    mechanics:   '',
  });

  const [formData,    setFormData]    = useState(buildDefaultFormData);
  const [isLoading,   setIsLoading]   = useState(false);
  const [toastConfig, setToastConfig] = useState(DEFAULT_TOAST);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  // ── Effect: Header title / subtitle ───────────────────────────────────────

  useEffect(() => {
    setHeaderTitle(config.title);
    setHeaderSubtitle(regNo || '');

    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [config.title, regNo, setHeaderTitle, setHeaderSubtitle]);

  // ── Effect: Fetch all equipment records once on mount ─────────────────────

  useEffect(() => {
    const fetchEquipments = async () => {
      try {
        const response = await apiRequest(`${END_POINT}/equipments/get-equipments`, 'GET');
        const data     = await response.json();
        setEquipments(data.data || []);
      } catch (err) {
        console.error('[ServiceHistoryEntryForm] fetchEquipments error:', err);
      }
    };

    fetchEquipments();
  }, []);

  // ── Effect: Auto-fill equipment name and operator when regNo resolves ──────

  useEffect(() => {
    if (!equipments.length || !formData.regNo) return;

    const found = equipments.find((eq) => eq.regNo === formData.regNo.trim());
    if (!found) return;

    setFormData((prev) => ({
      ...prev,
      equipment: found.machine || '',
      // operator field used by tyre and battery; safe to set for all types
      operator: found.certificationBody?.[found.certificationBody.length - 1] || prev.operator,
    }));
  }, [equipments, formData.regNo]);

  // ── Effect: Auto-calculate next service hours whenever serviceHrs changes ──

  useEffect(() => {
    if (!isServiceType) return;
    setFormData((prev) => ({
      ...prev,
      nextServiceHrs: formData.serviceHrs ? calculateNextService(formData.serviceHrs) : '',
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.serviceHrs]);

  // ─────────────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Shows a toast notification.
   *
   * @param {string} message   - Message text.
   * @param {string} [type]    - Toast variant: 'success' | 'error' | 'warning'.
   * @param {string} [textColor] - CSS colour for the message text.
   */
  const showToast = (message, type = 'success', textColor = '#ffffff') => {
    setToastConfig({ isOpen: true, type, message, textColor });
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Validation
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Validates the form fields relevant to the current service type.
   * Shows a toast for the first failing field.
   *
   * @returns {boolean} True when all required fields are filled.
   */
  const validateForm = () => {
    // ── Shared validations ──
    if (!formData.date)      { showToast('Service Date is required',       'error');   return false; }
    if (!formData.equipment) { showToast('Equipment Name is required',     'error');   return false; }
    if (!formData.regNo)     { showToast('Equipment Reg No is required',   'error');   return false; }

    // ── Oil / Normal service ──
    if (isServiceType) {
      if (!formData.serviceHrs)     { showToast('Service Hrs/Km is required',      'error'); return false; }
      if (!formData.nextServiceHrs) { showToast('Next Service Hrs/Km is required', 'error'); return false; }
    }

    // ── Tyre ──
    if (isTyreType) {
      if (!formData.tyreModel)    { showToast('Tyre Model is required',      'error');            return false; }
      if (!formData.tyreNumber)   { showToast('Tyre Number is required',     'error');            return false; }
      if (!formData.location)     { showToast('Location is required',        'warning', '#000000'); return false; }
      if (!formData.operator)     { showToast('Operator is required',        'error');            return false; }
      if (!formData.runningHours) { showToast('Running Hrs/Km is required', 'error');            return false; }
    }

    // ── Battery ──
    if (isBatteryType) {
      if (!formData.batteryModel) { showToast('Battery Model is required', 'error');             return false; }
      if (!formData.location)     { showToast('Location is required',      'warning', '#000000'); return false; }
      if (!formData.operator)     { showToast('Operator is required',      'error');             return false; }
    }

    // ── Maintenance ──
    if (isMaintenanceType) {
      if (!formData.mechanics)   { showToast('Mechanics name is required',  'warning', '#000000'); return false; }
      if (!formData.workRemarks) { showToast('Work Remarks is required',    'error');             return false; }
    }

    return true;
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Generic field change handler.
   * Handles booleans (fullService), formatted service hours, and plain text.
   *
   * @param {React.ChangeEvent<HTMLInputElement|HTMLSelectElement|HTMLTextAreaElement>} e
   */
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

  /** Resets the form to its default state. */
  const handleReset = () => setFormData(buildDefaultFormData());

  /**
   * Validates, then POSTs the form data to the appropriate API endpoint.
   * On success navigates to the newly created record's detail page.
   *
   * @param {React.FormEvent} e - Form submit event.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // ── Oil/Normal: check if a full-service notification is needed ────────
      if (isServiceType && formData.nextServiceHrs && formData.serviceHrs) {
        const current = parseInt(formData.serviceHrs.replace(/[^0-9]/g, ''));
        const next    = parseInt(formData.nextServiceHrs.replace(/[^0-9]/g, ''));

        if (Math.floor(next / 3000) > Math.floor(current / 3000)) {
          await apiRequest(
            `${END_POINT}/service-history/add-full-service-notification`,
            'POST',
            { regNo, nextServiceHrs: formData.nextServiceHrs }
          );
        }
      }

      // ── Build type-specific payload (map normalised keys back to API keys) ─
      const payload = buildPayload();

      const response = await apiRequest(config.endpoint, 'POST', payload);
      const result   = await response.json();

      if (!response.ok) throw new Error(result.error || 'Failed to submit form');

      showAlert(`${config.title.replace('Add ', '')} added successfully!`, 'done_all', '--color-primary');
      triggerVibration();

      setTimeout(() => navigate(config.navPath(result.data?._id)), 1500);

    } catch (err) {
      console.error('[ServiceHistoryEntryForm] handleSubmit error:', err);
      showAlert(`Error: ${err.message}`, 'error', '--color-error-500');
      triggerVibration();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Builds the API-ready payload from formData, mapping the normalised `regNo`
   * field back to the key each endpoint expects.
   *
   * @returns {Object} Payload object ready for the API.
   */
  const buildPayload = () => {
    const shared = { date: formData.date, equipment: formData.equipment };

    if (isServiceType) {
      return {
        ...shared,
        regNo:          formData.regNo,
        serviceHrs:     formData.serviceHrs,
        nextServiceHrs: formData.nextServiceHrs,
        oil:            formData.oil,
        oilFilter:      formData.oilFilter,
        fuelFilter:     formData.fuelFilter,
        acFilter:       formData.acFilter,
        waterSeparator: formData.waterSeparator,
        airFilter:      formData.airFilter,
        fullService:    formData.fullService,
      };
    }

    if (isTyreType) {
      return {
        ...shared,
        equipmentNo:  formData.regNo,
        tyreModel:    formData.tyreModel,
        tyreNumber:   formData.tyreNumber,
        location:     formData.location,
        operator:     formData.operator,
        runningHours: formData.runningHours,
      };
    }

    if (isBatteryType) {
      return {
        ...shared,
        equipmentNo:  formData.regNo,
        batteryModel: formData.batteryModel,
        location:     formData.location,
        operator:     formData.operator,
      };
    }

    // ── Maintenance ──
    return {
      ...shared,
      regNo:       formData.regNo,
      workRemarks: formData.workRemarks,
      mechanics:   formData.mechanics,
    };
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="service-history-container">

      {/* ── Hero image ── */}
      <div className="form-overlay-cnt-img">
        <img src={config.image} alt={config.title} className="overlay-img" />
      </div>

      <div className="form-container form-container-hst">
        <form className="service-history-form" onSubmit={handleSubmit}>

          {/* ── Shared: Service Date ── */}
          <div className="form-group">
            <Input {...SHARED_INPUT} type="date" id="date" name="date"
              value={formData.date} onChange={handleChange}
              label="Service Date" placeholder="Start Date"
            />
          </div>

          {/* ── Tyre: Tyre Model ── */}
          {isTyreType && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="tyreModel" name="tyreModel"
                value={formData.tyreModel} onChange={handleChange}
                label="Tyre Model" placeholder="Enter tyre model"
              />
            </div>
          )}

          {/* ── Tyre: Tyre Number ── */}
          {isTyreType && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="tyreNumber" name="tyreNumber"
                value={formData.tyreNumber} onChange={handleChange}
                label="Tyre Number" placeholder="Enter tyre number"
              />
            </div>
          )}

          {/* ── Battery: Battery Model ── */}
          {isBatteryType && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="batteryModel" name="batteryModel"
                value={formData.batteryModel} onChange={handleChange}
                label="Battery Model" placeholder="Enter battery model"
              />
            </div>
          )}

          {/* ── Shared: Equipment Name (auto-filled from regNo) ── */}
          <div className="form-group">
            <Input {...SHARED_INPUT} type="text" id="equipment" name="equipment"
              value={formData.equipment} onChange={handleChange}
              label="Equipment Name" placeholder="Enter equipment name"
            />
          </div>

          {/* ── Shared: Equipment Reg No ── */}
          <div className="form-group">
            <Input {...SHARED_INPUT} type="text" id="regNo" name="regNo"
              value={formData.regNo} onChange={handleChange}
              label="Equipment Reg No" placeholder="Enter equipment number"
            />
          </div>

          {/* ── Oil/Normal: Service Hrs/Km ── */}
          {isServiceType && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="serviceHrs" name="serviceHrs"
                value={formData.serviceHrs} onChange={handleChange}
                label="Service Hrs / Km" placeholder="e.g. 1000HRS or 5000KM"
              />
            </div>
          )}

          {/* ── Oil/Normal: Next Service Hrs/Km (auto-calculated) ── */}
          {isServiceType && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="nextServiceHrs" name="nextServiceHrs"
                value={formData.nextServiceHrs} onChange={handleChange}
                label="Next Service Hrs / Km" placeholder="Auto-calculated or enter manually"
              />
            </div>
          )}

          {/* ── Oil/Normal: Consumable selects ── */}
          {isServiceType && (
            <>
              {[
                { id: 'oil',            label: 'Oil',            options: ['Check', 'Change'] },
                { id: 'oilFilter',      label: 'Oil Filter',     options: ['Check', 'Change'] },
                { id: 'fuelFilter',     label: 'Fuel Filter',    options: ['Check', 'Change'] },
                { id: 'acFilter',       label: 'A/C Filter',     options: ['Check', 'Clean']  },
                { id: 'airFilter',      label: 'Air Filter',     options: ['Clean', 'Change'] },
                { id: 'waterSeparator', label: 'Water Separator',options: ['Check', 'Change'] },
              ].map(({ id, label, options }) => (
                <div key={id} className="form-group">
                  <Input {...SHARED_INPUT} type="select" id={id} name={id}
                    value={formData[id]} onChange={handleChange}
                    label={label}
                    options={options.map((o) => ({ value: o, label: o }))}
                  />
                </div>
              ))}

              {/* Full Service toggle */}
              <div className="form-group full-service-group">
                <Input {...SHARED_INPUT} type="select" id="fullService" name="fullService"
                  value={formData.fullService} onChange={handleChange}
                  label="Full Service"
                  placeholderColor="black-100"
                  options={[{ value: false, label: 'No' }, { value: true, label: 'Yes' }]}
                />
              </div>
            </>
          )}

          {/* ── Tyre / Battery: Location ── */}
          {(isTyreType || isBatteryType) && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="location" name="location"
                value={formData.location} onChange={handleChange}
                label="Location" placeholder="Enter location"
              />
            </div>
          )}

          {/* ── Tyre / Battery: Operator ── */}
          {(isTyreType || isBatteryType) && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="operator" name="operator"
                value={formData.operator} onChange={handleChange}
                label="Operator" placeholder="Enter operator name"
              />
            </div>
          )}

          {/* ── Tyre: Running Hours ── */}
          {isTyreType && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="runningHours" name="runningHours"
                value={formData.runningHours} onChange={handleChange}
                label="Running Hrs / Km" placeholder="Enter running hours or km"
              />
            </div>
          )}

          {/* ── Maintenance: Mechanics ── */}
          {isMaintenanceType && (
            <div className="form-group">
              <Input {...SHARED_INPUT} type="text" id="mechanics" name="mechanics"
                value={formData.mechanics} onChange={handleChange}
                label="Mechanics" placeholder="Enter mechanic's name"
              />
            </div>
          )}

          {/* ── Maintenance: Work Remarks (textarea) ── */}
          {isMaintenanceType && (
            <div className="form-group full-width">
              <Input {...SHARED_INPUT} type="textarea" id="workRemarks" name="workRemarks"
                value={formData.workRemarks} onChange={handleChange}
                label="Work Remarks" placeholder="Enter work remarks and details"
                height="157px" squircle="30xl" fontSize="6xl" fullWidth="true"
                spellCheck="true" rows={5}
              />
            </div>
          )}

          {/* ── Form actions: Reset / Submit ── */}
          <div className="form-actions">
            <Button {...SHARED_BTN}
              text="Reset"
              onClick={handleReset}
              colorScheme="amber-800"
              type="button"
            />
            <Button {...SHARED_BTN}
              text={isLoading ? 'Submitting...' : 'Submit'}
              onClick={handleSubmit}
              colorScheme={isLoading ? 'lime-800' : 'lime-600'}
              type={isLoading ? 'disabled' : 'submit'}
            />
          </div>

        </form>
      </div>

      {/* ── Toast notification ── */}
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