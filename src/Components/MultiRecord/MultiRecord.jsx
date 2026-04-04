// ─────────────────────────────────────────────────────────────────────────────
// MultiRecord.jsx  —  All-or-nothing batch entry for service history records.
// Uses unified /service-history/batch endpoint.
// 'maintenance' type renamed to 'major' to match backend enum.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams }           from 'react-router-dom';

import { END_POINT }          from '../../constants';
import { apiRequest }         from '../../utils/api';
import { useHeaderTitle }     from '../../Context/HeaderTitleContext';
import { useAlert }           from '../../Context/AlertContext';
import { useHeaderVibration } from '../../Context/HeaderVibrationContext';

import Button from '../../Common/Button/Button';
import Input  from '../../Common/Input/Input';
import Toast  from '../../Common/Toast/Toast';

import './MultiRecord.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

// 'maintenance' → 'major' to match the unified backend enum
const SERVICE_TYPES = [
  { value: 'oil',    label: 'Oil Service', icon: 'oil_barrel'            },
  { value: 'normal', label: 'Normal',      icon: 'build'                 },
  { value: 'tyre',   label: 'Tyre',        icon: 'tire_repair'           },
  { value: 'battery',label: 'Battery',     icon: 'battery_charging_full' },
  { value: 'major',  label: 'Major Work',  icon: 'construction'          },
];

const OIL_FILTER_OPTIONS = [
  { key: 'oil',            label: 'Engine Oil',  opts: ['Check', 'Change'] },
  { key: 'oilFilter',      label: 'Oil Filter',  opts: ['Check', 'Change'] },
  { key: 'fuelFilter',     label: 'Fuel Filter', opts: ['Check', 'Change'] },
  { key: 'acFilter',       label: 'A/C Filter',  opts: ['Check', 'Clean']  },
  { key: 'airFilter',      label: 'Air Filter',  opts: ['Clean', 'Change'] },
  { key: 'waterSeparator', label: 'Water Sep.',  opts: ['Check', 'Change'] },
];

const DEFAULT_CHECKLIST = [
  { id: 1,  description: 'Change Engine oil & Filter',    status: '' },
  { id: 2,  description: 'Change Fuel Filter',            status: '' },
  { id: 3,  description: 'Check/Clean Air Filter',        status: '' },
  { id: 4,  description: 'Check Transmission Filter',     status: '' },
  { id: 5,  description: 'Check Power Steering Oil',      status: '' },
  { id: 6,  description: 'Check Hydraulic Oil',           status: '' },
  { id: 7,  description: 'Check Brake',                   status: '' },
  { id: 8,  description: 'Check Tyre Air Pressure',       status: '' },
  { id: 9,  description: 'Check Oil Leak',                status: '' },
  { id: 10, description: 'Check Battery Condition',       status: '' },
  { id: 11, description: 'Check Wiper & Water',           status: '' },
  { id: 12, description: 'Check All Lights',              status: '' },
  { id: 13, description: 'Check All Horns',               status: '' },
  { id: 14, description: 'Check Parking Brake',           status: '' },
  { id: 15, description: 'Check Differential Oil',        status: '' },
  { id: 16, description: 'Check Rod Water & Hoses',       status: '' },
  { id: 17, description: 'Lubricants All Points',         status: '' },
  { id: 18, description: 'Check Gear Shift System',       status: '' },
  { id: 19, description: 'Check Clutch System',           status: '' },
  { id: 20, description: 'Check Wheel Nut',               status: '' },
  { id: 21, description: 'Check Starter & Alternator',    status: '' },
  { id: 22, description: 'Check Number Plate both',       status: '' },
  { id: 23, description: 'Check Paint',                   status: '' },
  { id: 24, description: 'Check Tires',                   status: '' },
  { id: 25, description: 'Check Silencer',                status: '' },
  { id: 26, description: 'Replace Hydraulic Oil-Filter',  status: '' },
  { id: 27, description: 'Replace Transmission Oil',      status: '' },
  { id: 28, description: 'Replace Differential Oil',      status: '' },
  { id: 29, description: 'Replace Steering Box Oil',      status: '' },
  { id: 30, description: 'Check Engine Valve Clearance',  status: '' },
  { id: 31, description: 'Replace Clutch Fluid',          status: '' },
  { id: 32, description: 'Check Brake Lining',            status: '' },
  { id: 33, description: 'Change Drive Belt',             status: '' },
  { id: 34, description: 'Check A/C Filter',              status: '' },
  { id: 35, description: 'Check Water Separator',         status: '' },
];

const SHARED_INPUT_PROPS = {
  colorScheme:        'yellow-300',
  textColor:          'black-100',
  labelBgColor:       'transparent',
  labelSize:          '3xl',
  labelColor:         'yellow-300',
  placeholderColor:   'black-300',
  variant:            'gradient',
  width:              '100%',
  height:             '57px',
  squircle:           '4xl',
  fontWeight:         '500',
  inputPaddingInline: '2xl',
  inputPaddingBlock:  'xl',
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

const DEFAULT_TOAST = { isOpen: false, type: 'success', message: '', textColor: '#ffffff' };

const calcNext = (val) => {
  if (!val) return '';
  const up = String(val).toUpperCase();
  if (up.endsWith('KM'))  { const n = parseInt(up); return isNaN(n) ? '' : `${n + 400}KM`;  }
  if (up.endsWith('HRS')) { const n = parseInt(up); return isNaN(n) ? '' : `${n + 400}HRS`; }
  const n = parseInt(up);
  return isNaN(n) ? '' : `${n + 400}`;
};

let _uid = 0;
const uid = () => `c${++_uid}_${Date.now()}`;

const buildCard = (regNo = '', machine = '', operator = '') => ({
  id: uid(),
  regNo, machine, operator,
  serviceType:    'oil',
  date:           new Date().toISOString().split('T')[0],
  serviceHrs: '', nextServiceHrs: '',
  runningHours: '', fullService: false,
  tyreModel: '', tyreNumber: '',
  batteryModel: '', workRemarks: '',
  mechanics: '', location: '', remarks: '',
  oil: 'Check', oilFilter: 'Check', fuelFilter: 'Check',
  acFilter: 'Clean', airFilter: 'Clean', waterSeparator: 'Check',
  checklistItems: DEFAULT_CHECKLIST.map(i => ({ ...i })),
  _open: { type: true, history: false, filters: false, report: false, checklist: false },
  _collapsed: false,
  _status: 'idle',
  _error: '',
});

// ─────────────────────────────────────────────────────────────────────────────
// ChecklistRadioGroup
// ─────────────────────────────────────────────────────────────────────────────

function ChecklistRadioGroup({ itemId, currentStatus, onStatusChange }) {
  return (
    <div className="mr-item-status">
      <Input type="radio" id={`yes-${itemId}`}   name={`status-${itemId}`} checked={currentStatus === '✓'}  onChange={() => onStatusChange(itemId, '✓')}  {...SHARED_RADIO_PROPS} colorScheme="lime-700" borderColor="lime-300" onCheckedColor="lime-100" />
      <Input type="radio" id={`no-${itemId}`}    name={`status-${itemId}`} checked={currentStatus === '✗'}  onChange={() => onStatusChange(itemId, '✗')}  {...SHARED_RADIO_PROPS} colorScheme="red-700"  borderColor="red-500"  onCheckedColor="red-100"  />
      <Input type="radio" id={`blank-${itemId}`} name={`status-${itemId}`} checked={currentStatus === '--'} onChange={() => onStatusChange(itemId, '--')} {...SHARED_RADIO_PROPS} colorScheme="gray-700" onCheckedColor="gray-100" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ChecklistColumn
// ─────────────────────────────────────────────────────────────────────────────

function ChecklistColumn({ label, items, rangeStart, rangeEnd, onStatusChange, onRangeChange }) {
  const bulkBtnBase = {
    variant: 'gradient', font: 'md', squircle: '4xl',
    width: '80px', height: '45px', type: 'button',
    shadowPosition: 'to-bottom', shadowColor: 'white-600',
  };
  return (
    <div className="mr-checklist-column">
      <div className="mr-checklist-actions">
        <span>{label}</span>
        <div className="mr-checklist-buttons">
          <Button text="YES"   onClick={() => onRangeChange(rangeStart, rangeEnd, '✓')}  colorScheme="lime-300" textColor="black-200" {...bulkBtnBase} />
          <Button text="NO"    onClick={() => onRangeChange(rangeStart, rangeEnd, '✗')}  colorScheme="red-500"  textColor="white-200" {...bulkBtnBase} />
          <Button text="BLANK" onClick={() => onRangeChange(rangeStart, rangeEnd, '--')} colorScheme="gray-500" textColor="white-200" {...bulkBtnBase} />
        </div>
      </div>
      <div className="mr-checklist-items">
        {items.map((item) => (
          <div key={item.id} className="mr-checklist-item">
            <div className="mr-item-number">{item.id}.</div>
            <div className="mr-item-description">{item.description}</div>
            <ChecklistRadioGroup itemId={item.id} currentStatus={item.status} onStatusChange={onStatusChange} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionToggle
// ─────────────────────────────────────────────────────────────────────────────

function SectionToggle({ label, icon, isOpen, onToggle, badge }) {
  return (
    <button type="button" className={`mr-stoggle ${isOpen ? 'open' : ''}`} onClick={onToggle}>
      <span className="material-symbols-rounded mr-stoggle-icon">{icon}</span>
      <span className="mr-stoggle-label">{label}</span>
      {badge != null && <span className="mr-badge">{badge}</span>}
      <span className="material-symbols-rounded mr-stoggle-arrow">
        {isOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_down'}
      </span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ServiceCard
// ─────────────────────────────────────────────────────────────────────────────

function ServiceCard({ card, index, hasUrlRegNo, onChange, onRemove }) {
  const isOil   = card.serviceType === 'oil' || card.serviceType === 'normal';
  const isTyre  = card.serviceType === 'tyre';
  const isBatt  = card.serviceType === 'battery';
  const isMajor = card.serviceType === 'major';

  const set    = (field, val) => onChange(card.id, field, val);
  const toggle = (section)    => set('_open', { ...card._open, [section]: !card._open[section] });

  const [eqResults,   setEqResults]   = useState([]);
  const [eqSearching, setEqSearching] = useState(false);
  const eqDebounce = useRef(null);

  const searchEquipments = (term) => {
    if (!term?.trim()) { setEqResults([]); return; }
    clearTimeout(eqDebounce.current);
    eqDebounce.current = setTimeout(async () => {
      setEqSearching(true);
      try {
        const res  = await apiRequest(`${END_POINT}/equipments/search-equipments`, 'POST', {
          searchTerm: term.trim(), page: 1, limit: 20, searchField: 'all',
        });
        const data = await res.json();
        setEqResults(data.data || []);
      } catch { setEqResults([]); }
      finally  { setEqSearching(false); }
    }, 350);
  };

  const handleHrsBlur = () => {
    if (isOil && card.serviceHrs && !card.nextServiceHrs)
      set('nextServiceHrs', calcNext(card.serviceHrs));
  };

  const handleEquipmentSelect = (val) => {
    const found = eqResults.find(x => String(x.regNo) === String(val));
    if (found) {
      const lastCert = found.certificationBody?.[found.certificationBody.length - 1];
      const op = lastCert?.operatorName || '';
      onChange(card.id, '__bulk', { regNo: String(found.regNo), machine: found.machine || '', operator: op });
    } else {
      set('regNo', val);
      searchEquipments(val);
    }
  };

  const handleClStatus = (id, status) =>
    set('checklistItems', card.checklistItems.map(i => i.id === id ? { ...i, status } : i));

  const handleClRange = (start, end, status) =>
    set('checklistItems', card.checklistItems.map(i =>
      i.id >= start && i.id <= end ? { ...i, status } : i
    ));

  const handleTypeChange = (val) => {
    set('serviceType', val);
    set('checklistItems', DEFAULT_CHECKLIST.map(i => ({
      ...i, status: (val === 'oil' || val === 'normal') && i.id <= 24 ? '✓' : '',
    })));
  };

  const markedCount = card.checklistItems.filter(i => i.status).length;
  const typeLabel   = SERVICE_TYPES.find(t => t.value === card.serviceType)?.label || '';

  const cardCls = [
    'mr-card',
    card._status === 'success' ? 'card-ok'   : '',
    card._status === 'failed'  ? 'card-err'  : '',
    card._collapsed             ? 'collapsed' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={cardCls}>

      <div className="mr-card-hdr">
        <div className="mr-card-hdr-left">
          {card._status === 'success' && <span className="material-symbols-rounded mr-status-ico ok">check_circle</span>}
          {card._status === 'failed'  && <span className="material-symbols-rounded mr-status-ico err">cancel</span>}
          {card._status === 'idle'    && <span className="mr-card-num">#{index + 1}</span>}
          <span className="mr-card-type-tag">{typeLabel}</span>
          {card.regNo && <span className="mr-card-reg">{card.regNo}</span>}
          {card.date  && <span className="mr-card-date">{card.date}</span>}
        </div>
        <div className="mr-card-hdr-actions">
          <button type="button" className="mr-collapse-btn" title={card._collapsed ? 'Expand' : 'Collapse'}
            onClick={() => set('_collapsed', !card._collapsed)}>
            <span className="material-symbols-rounded">{card._collapsed ? 'expand_more' : 'expand_less'}</span>
          </button>
          <Button text="" icon="close" onClick={() => onRemove(card.id)}
            colorScheme="red-700" variant="gradient" squircle="4xl"
            width="36px" height="36px" type="button" textColor="white-200" />
        </div>
      </div>

      {card._status === 'failed' && card._error && (
        <div className="mr-card-errmsg">
          <span className="material-symbols-rounded">error</span>
          {card._error}
        </div>
      )}

      {!card._collapsed && (
        <div className="mr-card-body">

          {!hasUrlRegNo && (
            <div className="mr-section">
              <div className="mr-section-body">
                <div className="mr-form-grid">
                  <div className="mr-form-group">
                    <Input {...SHARED_INPUT_PROPS} type="search-select" id={`regNo-${card.id}`} name="regNo"
                      value={card.regNo} label="Equipment"
                      placeholder={eqSearching ? 'Searching…' : 'Search reg no or name'}
                      options={eqResults.map(e => ({ value: String(e.regNo), label: `${e.regNo} — ${e.machine} (${e.brand})` }))}
                      onChange={e => handleEquipmentSelect(e.target.value)} />
                  </div>
                  <div className="mr-form-group">
                    <Input {...SHARED_INPUT_PROPS} type="text" id={`machine-${card.id}`} name="machine"
                      value={card.machine} onChange={e => set('machine', e.target.value)}
                      label="Machine" placeholder="Auto-filled from search" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mr-section">
            <SectionToggle label="Service Type" icon="tune" isOpen={card._open.type} onToggle={() => toggle('type')} badge={typeLabel} />
            {card._open.type && (
              <div className="mr-section-body">
                <div className="mr-type-grid">
                  {SERVICE_TYPES.map(t => (
                    <Button key={t.value} text={t.label} icon={t.icon} onClick={() => handleTypeChange(t.value)}
                      colorScheme={card.serviceType === t.value ? 'amber-400' : 'amber-800'}
                      textColor={card.serviceType === t.value ? 'black-200' : 'white-300'}
                      variant="gradient" squircle="4xl" height="48px" font="md" type="button"
                      shadowPosition="to-bottom" shadowColor="white-600" />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mr-section">
            <SectionToggle label="Service History" icon="history" isOpen={card._open.history} onToggle={() => toggle('history')} />
            {card._open.history && (
              <div className="mr-section-body">
                <div className="mr-form-grid">
                  <div className="mr-form-group"><Input {...SHARED_INPUT_PROPS} type="date" id={`date-${card.id}`}  name="date"         value={card.date}         onChange={e => set('date',      e.target.value)}                         label="Date"                 squircle="10xl" /></div>
                  <div className="mr-form-group"><Input {...SHARED_INPUT_PROPS} type="text" id={`loc-${card.id}`}   name="location"     value={card.location}     onChange={e => set('location',  e.target.value)}                         label="Location"             placeholder="Site location"  /></div>
                  <div className="mr-form-group"><Input {...SHARED_INPUT_PROPS} type="text" id={`mech-${card.id}`}  name="mechanics"    value={card.mechanics}    onChange={e => set('mechanics', e.target.value)}                         label="Mechanics"            placeholder="Mechanic name"  /></div>
                  <div className="mr-form-group"><Input {...SHARED_INPUT_PROPS} type="text" id={`op-${card.id}`}    name="operator"     value={card.operator}     onChange={e => set('operator',  e.target.value)}                         label="Operator"             placeholder="Operator name"  /></div>
                  <div className="mr-form-group"><Input {...SHARED_INPUT_PROPS} type="text" id={`sHrs-${card.id}`}  name="serviceHrs"   value={card.serviceHrs}   onBlur={handleHrsBlur} onChange={e => set('serviceHrs',     e.target.value.toUpperCase())} label="Service Hrs / Km"     placeholder="e.g. 1000HRS"  /></div>
                  <div className="mr-form-group"><Input {...SHARED_INPUT_PROPS} type="text" id={`nsHrs-${card.id}`} name="nextService"  value={card.nextServiceHrs}               onChange={e => set('nextServiceHrs', e.target.value.toUpperCase())} label="Next Service Hrs / Km" placeholder="Auto-filled"   /></div>
                  {isOil && (
                    <div className="mr-form-group">
                      <Input {...SHARED_INPUT_PROPS} type="select" id={`fs-${card.id}`} name="fullService"
                        value={String(card.fullService)} onChange={e => set('fullService', e.target.value === 'true')}
                        label="Full Service" options={[{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }]} />
                    </div>
                  )}
                  {isTyre && (
                    <>
                      <div className="mr-form-group"><Input {...SHARED_INPUT_PROPS} type="text" id={`tm-${card.id}`} name="tyreModel"    value={card.tyreModel}    onChange={e => set('tyreModel',    e.target.value)}                     label="Tyre Model"       placeholder="Tyre model"   /></div>
                      <div className="mr-form-group"><Input {...SHARED_INPUT_PROPS} type="text" id={`tn-${card.id}`} name="tyreNumber"   value={card.tyreNumber}   onChange={e => set('tyreNumber',   e.target.value)}                     label="Tyre Number"      placeholder="Tyre number"  /></div>
                      <div className="mr-form-group"><Input {...SHARED_INPUT_PROPS} type="text" id={`rh-${card.id}`} name="runningHours" value={card.runningHours} onChange={e => set('runningHours', e.target.value.toUpperCase())}       label="Running Hrs / Km" placeholder="e.g. 5000HRS" /></div>
                    </>
                  )}
                  {isBatt && (
                    <div className="mr-form-group">
                      <Input {...SHARED_INPUT_PROPS} type="text" id={`bm-${card.id}`} name="batteryModel"
                        value={card.batteryModel} onChange={e => set('batteryModel', e.target.value)}
                        label="Battery Model" placeholder="Battery model" />
                    </div>
                  )}
                </div>
                {/* Major: Work Remarks inside history section */}
                {isMajor && (
                  <div className="mr-form-group">
                    <Input {...SHARED_INPUT_PROPS} type="textarea" id={`wr-${card.id}`} name="workRemarks"
                      value={card.workRemarks} onChange={e => set('workRemarks', e.target.value)}
                      label="Work Remarks" placeholder="Describe work done"
                      height="120px" squircle="30xl" fontSize="6xl" fullWidth="true" rows={4} />
                  </div>
                )}
              </div>
            )}
          </div>

          {isOil && (
            <div className="mr-section">
              <SectionToggle label="Filter & Fluid Status" icon="oil_barrel" isOpen={card._open.filters} onToggle={() => toggle('filters')} />
              {card._open.filters && (
                <div className="mr-section-body">
                  <div className="mr-filter-grid">
                    {OIL_FILTER_OPTIONS.map(({ key, label, opts }) => (
                      <div key={key} className="mr-filter-item">
                        <span className="mr-filter-lbl">{label}</span>
                        <div className="mr-filter-pills">
                          {opts.map(opt => (
                            <Button key={opt} text={opt} onClick={() => set(key, opt)}
                              colorScheme={card[key] === opt ? 'amber-400' : 'amber-800'}
                              textColor={card[key] === opt ? 'black-200' : 'white-300'}
                              variant="gradient" squircle="4xl" height="40px" font="md" type="button"
                              shadowPosition="to-bottom" shadowColor="white-600" />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mr-section">
            <SectionToggle label="Service Report" icon="description" isOpen={card._open.report} onToggle={() => toggle('report')} />
            {card._open.report && (
              <div className="mr-section-body">
                <div className="mr-form-group">
                  <Input {...SHARED_INPUT_PROPS} type="textarea" id={`rem-${card.id}`} name="remarks"
                    value={card.remarks} onChange={e => set('remarks', e.target.value)}
                    placeholder="Service remarks…" height="120px" squircle="30xl"
                    fontSize="6xl" fullWidth="true" rows={4} label={undefined} />
                </div>
              </div>
            )}
          </div>

          <div className="mr-section">
            <SectionToggle label="Checklist" icon="checklist" isOpen={card._open.checklist} onToggle={() => toggle('checklist')} badge={`${markedCount}/35`} />
            {card._open.checklist && (
              <div className="mr-section-body">
                <div className="mr-checklist-grid">
                  <ChecklistColumn label="Items 1-24"  items={card.checklistItems.slice(0, 24)} rangeStart={1}  rangeEnd={24} onStatusChange={handleClStatus} onRangeChange={handleClRange} />
                  <ChecklistColumn label="Items 25-35" items={card.checklistItems.slice(24)}    rangeStart={25} rangeEnd={35} onStatusChange={handleClStatus} onRangeChange={handleClRange} />
                </div>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MultiRecord — Main
// ─────────────────────────────────────────────────────────────────────────────

function MultiRecord() {
  const { regNo: urlRegNo } = useParams();
  const hasUrlRegNo         = Boolean(urlRegNo);

  const { setHeaderTitle, setHeaderSubtitle } = useHeaderTitle();
  const { showAlert }        = useAlert();
  const { triggerVibration } = useHeaderVibration();

  const [cards,       setCards]       = useState(() => [buildCard(urlRegNo || ''), buildCard(urlRegNo || '')]);
  const [isLoading,   setIsLoading]   = useState(false);
  const [toastConfig, setToastConfig] = useState(DEFAULT_TOAST);

  useEffect(() => {
    setHeaderTitle('Multi Record Entry');
    setHeaderSubtitle(urlRegNo || 'Multiple Equipment');
    return () => { setHeaderTitle(null); setHeaderSubtitle(null); };
  }, [urlRegNo, setHeaderTitle, setHeaderSubtitle]);

  useEffect(() => {
    if (!hasUrlRegNo) return;
    const fetchEquipment = async () => {
      try {
        const res   = await apiRequest(`${END_POINT}/equipments/get-equipment/${urlRegNo}`, 'GET');
        const data  = await res.json();
        const found = data?.data?.[0];
        if (!found) return;
        const lastCert = found.certificationBody?.[found.certificationBody.length - 1];
        const op       = lastCert?.operatorName || '';
        setCards(prev => prev.map(c => ({
          ...c,
          regNo:    String(found.regNo),
          machine:  found.machine || '',
          operator: op,
        })));
      } catch (err) { console.error('[MultiRecord] fetchEquipment:', err); }
    };
    fetchEquipment();
  }, [hasUrlRegNo, urlRegNo]);

  // ── Card handlers ──────────────────────────────────────────────────────────

  const handleCardChange = useCallback((id, field, val) => {
    if (field === '__bulk') {
      setCards(prev => prev.map(c => c.id === id ? { ...c, ...val } : c));
    } else {
      setCards(prev => prev.map(c => c.id === id ? { ...c, [field]: val } : c));
    }
  }, []);

  const addCard = () => {
    const ref = cards[0];
    setCards(prev => [...prev, buildCard(ref?.regNo || urlRegNo || '', ref?.machine || '', ref?.operator || '')]);
  };

  const removeCard = (id) => setCards(prev => prev.length > 1 ? prev.filter(c => c.id !== id) : prev);

  const showToast = (msg, type = 'error', textColor = '#ffffff') =>
    setToastConfig({ isOpen: true, type, message: msg, textColor });

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    for (let i = 0; i < cards.length; i++) {
      const c = cards[i];
      const n = `Card #${i + 1}`;
      if (!c.regNo && c.regNo !== 0) { showToast(`${n}: Equipment Reg No required`);              return false; }
      if (!c.machine)                { showToast(`${n}: Equipment Name required`);                return false; }
      if (!c.date)                   { showToast(`${n}: Date required`);                          return false; }
      if (!c.location)               { showToast(`${n}: Location required`, 'warning', '#000');   return false; }
      if (!c.mechanics)              { showToast(`${n}: Mechanics required`, 'warning', '#000');  return false; }
    }
    return true;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  //
  // Groups cards by regNo + serviceType → one batch POST per group.
  // The server runs a pre-flight check and wraps all writes in a transaction.
  // On any failure nothing is written — safe to resubmit after fixing errors.

  const handleSubmit = async () => {
    if (!validate()) return;
    setIsLoading(true);

    setCards(prev => prev.map(c => ({ ...c, _status: 'idle', _error: '' })));

    // Group by regNo + serviceType
    const groups = {};
    cards.forEach(c => {
      const k = `${c.regNo}__${c.serviceType}`;
      (groups[k] = groups[k] || []).push(c);
    });

    let allOk    = true;
    let errorMsg = '';
    const updatedCards = [...cards];

    for (const groupCards of Object.values(groups)) {
      const f = groupCards[0];

      // Build unified sharedData payload — all field names match the new schema
      const payload = {
        type: f.serviceType,   // already 'oil' | 'normal' | 'tyre' | 'battery' | 'major'
        sharedData: {
          regNo:          f.regNo,
          machine:        f.machine,
          location:       f.location,
          mechanics:      f.mechanics,
          operator:       f.operator,
          operatorName:   f.operator,
          remarks:        f.remarks,
          checklistItems: f.checklistItems,
          // Oil / normal filter flags
          oil:            f.oil,
          oilFilter:      f.oilFilter,
          fuelFilter:     f.fuelFilter,
          acFilter:       f.acFilter,
          airFilter:      f.airFilter,
          waterSeparator: f.waterSeparator,
          // Tyre
          tyreModel:      f.tyreModel,
          tyreNumber:     f.tyreNumber,
          // Battery
          batteryModel:   f.batteryModel,
        },
        records: groupCards.map(c => ({
          date:           c.date,
          serviceHrs:     c.serviceHrs     || null,
          nextServiceHrs: c.nextServiceHrs || null,
          runningHours:   c.runningHours   || null,
          // Major type work remarks live on the record level
          workRemarks:    c.workRemarks    || c.remarks || null,
          remarks:        c.remarks        || null,
          fullService:    c.fullService,
        })),
      };

      try {
        const res    = await apiRequest(`${END_POINT}/service-history/batch`, 'POST', payload);
        const result = await res.json();

        if (result.ok) {
          groupCards.forEach(c => {
            const ci = updatedCards.findIndex(x => x.id === c.id);
            if (ci !== -1) updatedCards[ci] = { ...updatedCards[ci], _status: 'success', _error: '' };
          });
        } else {
          allOk    = false;
          errorMsg = result.message || 'Server rejected this batch — fix issues and resubmit';

          const serverErrors = Array.isArray(result.errors) ? result.errors : [];
          groupCards.forEach((c, localIdx) => {
            const reason = serverErrors[localIdx] || result.message || 'Rejected by server';
            const ci = updatedCards.findIndex(x => x.id === c.id);
            if (ci !== -1) updatedCards[ci] = { ...updatedCards[ci], _status: 'failed', _error: reason };
          });
        }

      } catch (err) {
        allOk    = false;
        errorMsg = err.message || 'Network error';
        groupCards.forEach(c => {
          const ci = updatedCards.findIndex(x => x.id === c.id);
          if (ci !== -1) updatedCards[ci] = { ...updatedCards[ci], _status: 'failed', _error: err.message };
        });
      }
    }

    setCards(updatedCards);
    setIsLoading(false);

    if (allOk) {
      showAlert(`All ${cards.length} records saved!`, 'done_all', '--color-primary');
      triggerVibration();
    } else {
      showAlert(
        errorMsg || 'Submission failed — fix the highlighted cards and resubmit',
        'error',
        '--color-error-500'
      );
      triggerVibration();
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  const collapsedCards = cards.filter(c => c._collapsed);
  const expandedCards  = cards.filter(c => !c._collapsed);
  const hasStack       = collapsedCards.length > 0;

  return (
    <div className="mr-container">
      <div className={`mr-grid ${hasStack ? 'has-stack' : ''}`}>
        {hasStack ? (
          <>
            <div className="mr-stack-col">
              {collapsedCards.map((card) => (
                <ServiceCard key={card.id} card={card} index={cards.indexOf(card)}
                  hasUrlRegNo={hasUrlRegNo} onChange={handleCardChange} onRemove={removeCard} />
              ))}
            </div>
            <div className="mr-expanded-col">
              {expandedCards.map((card) => (
                <ServiceCard key={card.id} card={card} index={cards.indexOf(card)}
                  hasUrlRegNo={hasUrlRegNo} onChange={handleCardChange} onRemove={removeCard} />
              ))}
              <div className="mr-add-slot" style={{ gridColumn: expandedCards.length % 2 === 1 ? '2' : '1' }}>
                <Button text="Add Another Record" icon="add_circle" onClick={addCard}
                  colorScheme="rose-800" textColor="white-200" variant="gradient"
                  squircle="4xl" height="56px" font="xl" type="button"
                  shadowPosition="to-bottom" shadowColor="white-600" width="280px" />
              </div>
            </div>
          </>
        ) : (
          <>
            {expandedCards.map((card) => (
              <ServiceCard key={card.id} card={card} index={cards.indexOf(card)}
                hasUrlRegNo={hasUrlRegNo} onChange={handleCardChange} onRemove={removeCard} />
            ))}
            <div className="mr-add-slot" style={{ gridColumn: expandedCards.length % 2 === 1 ? '2' : '1' }}>
              <Button text="Add Another Record" icon="add_circle" onClick={addCard}
                colorScheme="rose-800" textColor="white-200" variant="gradient"
                squircle="4xl" height="56px" font="xl" type="button"
                shadowPosition="to-bottom" shadowColor="white-600" width="280px" />
            </div>
          </>
        )}
      </div>

      <div className="mr-bottom-bar">
        <Button text="Reset All" icon="refresh"
          onClick={() => setCards([buildCard(urlRegNo || ''), buildCard(urlRegNo || '')])}
          colorScheme="amber-800" variant="gradient" font="md" squircle="4xl"
          width="160px" height="48px" type="button" textColor="white-200"
          shadowPosition="to-bottom" shadowColor="white-600" />
        <Button
          text={isLoading ? `Submitting ${cards.length} records…` : `Submit ${cards.length} Record${cards.length !== 1 ? 's' : ''}`}
          icon={isLoading ? 'hourglass_top' : 'cloud_upload'}
          onClick={handleSubmit}
          colorScheme={isLoading ? 'amber-800' : 'lime-700'}
          variant="gradient" font="md" squircle="4xl"
          width="240px" height="48px" type="button" textColor="white-200"
          shadowPosition="to-bottom" shadowColor="white-600"
          disabled={isLoading} />
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

export default MultiRecord;