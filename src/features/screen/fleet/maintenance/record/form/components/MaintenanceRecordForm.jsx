import { useState } from 'react';
import Tabs   from '@/shared/components/widgets/tabs/Tabs';
import Button from '@/shared/components/widgets/button/Button';
import Input  from '@/shared/components/widgets/input/Input';
import Toast  from '@/shared/components/widgets/toast/Toast';

import { useMaintenanceRecordForm } from '../hooks/useMaintenanceRecordForm';
import { useMaintenanceRecordCard } from '../hooks/useMaintenanceRecordCard';
import { getCardMissingFields } from '../helper/maintenance.record.form.helper';
import {
  SERVICE_TYPES,
  OIL_FILTER_OPTIONS,
  INPUT_PROPS,
  RADIO_BUTTON_PROPS,
  BUTTON_PROPS,
} from '../constants/maintenance.record.form.constant';

import './MaintenanceRecordForm.css';

const TAB_CONTROL_BUTTON_PROPS = {
  variant: 'gradient',
  font: 'md',
  animation: '',
  squircle: '4xl',
  height: '38px',
  textColor: 'white-200',
  shadowPosition: 'to-bottom',
  shadowColor: 'white-600',
  width: '100%',
};

const SECTIONS = [
  { key: 'equipment', label: 'Select Equipment' },
  { key: 'type',      label: 'Service Type' },
  { key: 'history',   label: 'History' },
  { key: 'report',    label: 'Report' },
];

function ChecklistRadioGroup({ itemId, currentStatus, onStatusChange }) {
  return (
    <div className="fleet maintenance record form item-status">
      <Input type="radio" id={`yes-${itemId}`}   name={`status-${itemId}`} checked={currentStatus === '✓'}  onChange={() => onStatusChange(itemId, '✓')}  {...RADIO_BUTTON_PROPS} colorScheme="primary-1000" borderColor="primary-1000" onCheckedColor="primary-100" />
      <Input type="radio" id={`no-${itemId}`}    name={`status-${itemId}`} checked={currentStatus === '✗'}  onChange={() => onStatusChange(itemId, '✗')}  {...RADIO_BUTTON_PROPS} colorScheme="primary-1000" borderColor="primary-1000" onCheckedColor="primary-100" />
      <Input type="radio" id={`blank-${itemId}`} name={`status-${itemId}`} checked={currentStatus === '--'} onChange={() => onStatusChange(itemId, '--')} {...RADIO_BUTTON_PROPS} colorScheme="primary-1000" borderColor="primary-1000" onCheckedColor="primary-100"  />
    </div>
  );
}

function ChecklistColumn({ label, items, rangeStart, rangeEnd, onStatusChange, onRangeChange }) {
  const rangeStatus = items.every((item) => item.status === items[0]?.status) ? items[0]?.status : null;

  return (
    <div className="fleet maintenance record form checklist-column">
      <div className="fleet maintenance record form checklist-actions">
        <span>{label}</span>
        <div className="fleet maintenance record form checklist-buttons">
          <Button {...BUTTON_PROPS} text="YES"   onClick={() => onRangeChange(rangeStart, rangeEnd, '✓')}  colorScheme={rangeStatus === '✓'  ? 'primary-100' : 'primary-1000'} textColor={rangeStatus === '✓'  ? 'black-100' : 'white-100'} />
          <Button {...BUTTON_PROPS} text="NO"    onClick={() => onRangeChange(rangeStart, rangeEnd, '✗')}  colorScheme={rangeStatus === '✗'  ? 'primary-100' : 'primary-1000'} textColor={rangeStatus === '✗'  ? 'black-100' : 'white-100'} />
          <Button {...BUTTON_PROPS} text="BLANK" onClick={() => onRangeChange(rangeStart, rangeEnd, '--')} colorScheme={rangeStatus === '--' ? 'primary-100' : 'primary-1000'} textColor={rangeStatus === '--' ? 'black-100' : 'white-100'} />
        </div>
      </div>
      <div className="fleet maintenance record form checklist-items">
        {items.map((item) => (
          <div key={item.id} className="fleet maintenance record form checklist-item">
            <div className="fleet maintenance record form item-number">{item.id}.</div>
            <div className="fleet maintenance record form item-description">{item.description}</div>
            <ChecklistRadioGroup itemId={item.id} currentStatus={item.status} onStatusChange={onStatusChange} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MaintenanceRecordForm() {
  const {
    cards,
    activeCardId,
    setActiveCardId,
    isLoading,
    toastConfig,
    hasUrlRegNo,
    handleCardChange,
    addCard,
    removeCard,
    resetAll,
    handleSubmit,
    closeToast,
  } = useMaintenanceRecordForm();

  const [activeSection, setActiveSection] = useState('equipment');

  const activeIndex = cards.findIndex((card) => card.id === activeCardId);
  const activeCard = cards[activeIndex] || cards[0];

  const {
    eqResults,
    eqSearching,
    set,
    handleEquipmentSelect,
    handleHrsBlur,
    handleClStatus,
    handleClRange,
    handleTypeChange,
    markedCount,
    typeLabel,
  } = useMaintenanceRecordCard(activeCard, handleCardChange);

  if (!activeCard) return null;

  const isOil  = activeCard.serviceType === 'oil' || activeCard.serviceType === 'normal';
  const isTyre = activeCard.serviceType === 'tyre';
  const isBatt = activeCard.serviceType === 'battery';

  const tabItems = cards.map((card, index) => {
    const missing = getCardMissingFields(card);
    const missingCount = missing.equipment.length + missing.type.length + missing.history.length + missing.report.length;

    return {
      key: card.id,
      label: `Record ${index + 1}${card.regNo ? ` — ${card.regNo}` : ''}`,
      warn: missingCount > 0,
      children: SECTIONS.map((section) => ({
        key: section.key,
        label: section.label,
        warn: (missing[section.key] || []).length > 0,
      })),
    };
  });

  const handleTabSelect = (path) => {
    const [cardKey, sectionKey] = path;
    setActiveCardId(cardKey);
    setActiveSection(sectionKey || 'equipment');
  };

  return (
    <div className="fleet maintenance record form container">
      <div className="fleet maintenance record form layout">
        <Tabs
          title="Records"
          items={tabItems}
          activePath={[activeCardId, activeSection]}
          onSelect={handleTabSelect}
          showSearch={false}
          maxHeight="1090px"
          controlsColumns={1}
          controls={[
            { ...TAB_CONTROL_BUTTON_PROPS, text: 'Add Record', onClick: () => { addCard(); setActiveSection('equipment'); }, colorScheme: 'success-800', componentIconLeft: 'IconlyPlus', componentIconSize: '25', iconColor: 'white-200' },
            { ...TAB_CONTROL_BUTTON_PROPS, text: 'Reset All', onClick: () => { resetAll(); setActiveSection('equipment'); }, colorScheme: 'warning-800', componentIconLeft: 'RefreshIcon', componentIconSize: '25', iconColor: 'white-200' },
          ]}
        />

        <div className="fleet maintenance record form content">

          <div className="fleet maintenance record form content-header">
            <div className="fleet maintenance record form content-header-left">
              {activeCard._status === 'success' && <span className="material-symbols-rounded fleet maintenance record form status-icon status-icon-success">check_circle</span>}
              {activeCard._status === 'failed'  && <span className="material-symbols-rounded fleet maintenance record form status-icon status-icon-error">cancel</span>}
              <span className="fleet maintenance record form card-number">#{activeIndex + 1}</span>
              <span className="fleet maintenance record form card-type-tag">{typeLabel}</span>
              {activeCard.regNo && <span className="fleet maintenance record form card-reg">{activeCard.regNo}</span>}
              {activeCard.date  && <span className="fleet maintenance record form card-date">{activeCard.date}</span>}
            </div>
            {cards.length > 1 && (
              <Button text="Remove Record" icon="close" onClick={() => removeCard(activeCard.id)}
                colorScheme="error-700" variant="gradient" squircle="4xl"
                height="36px" width="fit-content" type="button" textColor="white-200" />
            )}
          </div>

          {activeCard._status === 'failed' && activeCard._error && (
            <div className="fleet maintenance record form card-error-message">
              <span className="material-symbols-rounded">error</span>
              {activeCard._error}
            </div>
          )}

          {activeSection === 'equipment' && (
            <div className="fleet maintenance record form section">
              <h3 className="fleet maintenance record form section-title">Select Equipment</h3>
              <div className="fleet maintenance record form section-body">
                {hasUrlRegNo ? (
                  <div className="fleet maintenance record form form-grid">
                    <div className="fleet maintenance record form field">
                      <Input {...INPUT_PROPS} type="text" id={`regNo-locked-${activeCard.id}`} name="regNo"
                        value={activeCard.regNo} label="Equipment Reg No" disabled readOnly />
                    </div>
                    <div className="fleet maintenance record form field">
                      <Input {...INPUT_PROPS} type="text" id={`machine-locked-${activeCard.id}`} name="machine"
                        value={activeCard.machine} label="Equipment Name" disabled readOnly />
                    </div>
                  </div>
                ) : (
                  <div className="fleet maintenance record form form-grid">
                    <div className="fleet maintenance record form field">
                      <Input {...INPUT_PROPS} type="search-select" id={`regNo-${activeCard.id}`} name="regNo"
                        value={activeCard.regNo} label="Equipment"
                        placeholder={eqSearching ? 'Searching…' : 'Search reg no or name'}
                        options={eqResults.map((eq) => ({ value: String(eq.regNo), label: `${eq.regNo} — ${eq.machine} (${eq.brand})` }))}
                        onChange={(e) => handleEquipmentSelect(e.target.value)} />
                    </div>
                    <div className="fleet maintenance record form field">
                      <Input {...INPUT_PROPS} type="text" id={`machine-${activeCard.id}`} name="machine"
                        value={activeCard.machine} onChange={(e) => set('machine', e.target.value)}
                        label="Machine" placeholder="Auto-filled from search" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'type' && (
            <div className="fleet maintenance record form section">
              <h3 className="fleet maintenance record form section-title">Service Type</h3>
              <div className="fleet maintenance record form section-body">
                <div className="fleet maintenance record form type-grid">
                  {SERVICE_TYPES.map((type) => (
                    <Button key={type.value} text={type.label} icon={type.icon} onClick={() => handleTypeChange(type.value)}
                      colorScheme={activeCard.serviceType === type.value ? 'primary-200' : 'primary-900'}
                      textColor={activeCard.serviceType === type.value ? 'black-200' : 'white-300'}
                      variant="gradient" squircle="4xl" height="48px" font="md" type="button"
                      shadowPosition="to-bottom" shadowColor="white-600" width='19.58%' />
                  ))}
                </div>

                {isOil && (
                  <div className="fleet maintenance record form filter-grid">
                    {OIL_FILTER_OPTIONS.map(({ key, label, opts }) => (
                      <div key={key} className="fleet maintenance record form filter-item">
                        <span className="fleet maintenance record form filter-label">{label}</span>
                        <div className="fleet maintenance record form filter-pills">
                          {opts.map((opt) => (
                            <Button key={opt} text={opt} onClick={() => set(key, opt)}
                              colorScheme={activeCard[key] === opt ? 'primary-600' : 'primary-900'}
                              textColor={activeCard[key] === opt ? 'white-200' : 'white-300'}
                              variant="gradient" squircle="4xl" height="40px" font="md" type="button"
                              shadowPosition="to-bottom" shadowColor="white-600" width='50%' />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isTyre && (
                  <div className="fleet maintenance record form form-grid">
                    <div className="fleet maintenance record form field"><Input {...INPUT_PROPS} type="text" id={`tm-${activeCard.id}`} name="tyreModel"  value={activeCard.tyreModel}  onChange={(e) => set('tyreModel',  e.target.value)} label="Tyre Model"  placeholder="Tyre model"  /></div>
                    <div className="fleet maintenance record form field"><Input {...INPUT_PROPS} type="text" id={`tn-${activeCard.id}`} name="tyreNumber" value={activeCard.tyreNumber} onChange={(e) => set('tyreNumber', e.target.value)} label="Tyre Number" placeholder="Tyre number" /></div>
                  </div>
                )}

                {isBatt && (
                  <div className="fleet maintenance record form form-grid">
                    <div className="fleet maintenance record form field">
                      <Input {...INPUT_PROPS} type="text" id={`bm-${activeCard.id}`} name="batteryModel"
                        value={activeCard.batteryModel} onChange={(e) => set('batteryModel', e.target.value)}
                        label="Battery Model" placeholder="Battery model" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === 'history' && (
            <div className="fleet maintenance record form section">
              <h3 className="fleet maintenance record form section-title">History</h3>
              <div className="fleet maintenance record form section-body">
                <div className="fleet maintenance record form form-grid">
                  <div className="fleet maintenance record form field"><Input {...INPUT_PROPS} type="date" id={`date-${activeCard.id}`}  name="date"        value={activeCard.date}         onChange={(e) => set('date',      e.target.value)}                          label="Date"                  squircle="10xl" /></div>
                  <div className="fleet maintenance record form field"><Input {...INPUT_PROPS} type="text" id={`loc-${activeCard.id}`}   name="location"    value={activeCard.location}     onChange={(e) => set('location',  e.target.value)}                          label="Location"              placeholder="Site location"  /></div>
                  <div className="fleet maintenance record form field"><Input {...INPUT_PROPS} type="text" id={`mech-${activeCard.id}`}  name="mechanics"   value={activeCard.mechanics}    onChange={(e) => set('mechanics', e.target.value)}                          label="Mechanics"             placeholder="Mechanic name"  /></div>
                  <div className="fleet maintenance record form field"><Input {...INPUT_PROPS} type="text" id={`op-${activeCard.id}`}    name="operator"    value={activeCard.operator}     onChange={(e) => set('operator',  e.target.value)}                          label="Operator"              placeholder="Operator name"  /></div>
                  <div className="fleet maintenance record form field"><Input {...INPUT_PROPS} type="text" id={`sHrs-${activeCard.id}`}  name="serviceHrs"  value={activeCard.serviceHrs}   onBlur={handleHrsBlur} onChange={(e) => set('serviceHrs',     e.target.value.toUpperCase())} label="Service Hrs / Km"      placeholder="e.g. 1000HRS"  /></div>
                  <div className="fleet maintenance record form field"><Input {...INPUT_PROPS} type="text" id={`nsHrs-${activeCard.id}`} name="nextService" value={activeCard.nextServiceHrs}                onChange={(e) => set('nextServiceHrs', e.target.value.toUpperCase())} label="Next Service Hrs / Km" placeholder="Auto-filled"   /></div>
                  {isOil && (
                    <div className="fleet maintenance record form field">
                      <Input {...INPUT_PROPS} type="select" id={`fs-${activeCard.id}`} name="fullService"
                        value={String(activeCard.fullService)} onChange={(e) => set('fullService', e.target.value === 'true')}
                        label="Full Service" options={[{ value: 'false', label: 'No' }, { value: 'true', label: 'Yes' }]} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'report' && (
            <div className="fleet maintenance record form section">
              <h3 className="fleet maintenance record form section-title">Report</h3>
              <div className="fleet maintenance record form section-body">
                <div className="fleet maintenance record form field">
                  <Input {...INPUT_PROPS} type="textarea" id={`rem-${activeCard.id}`} name="remarks"
                    value={activeCard.remarks} onChange={(e) => set('remarks', e.target.value)}
                    placeholder="Service remarks…" height="120px" squircle="30xl"
                    fontSize="6xl" fullWidth="true" rows={4} label={undefined} />
                </div>

                <div className="fleet maintenance record form checklist-actions">
                  <span>Checklist</span>
                  <span className="fleet maintenance record form badge">{markedCount}/35</span>
                </div>
                <div className="fleet maintenance record form checklist-grid">
                  <ChecklistColumn label="Items 1-24"  items={activeCard.checklistItems.slice(0, 24)} rangeStart={1}  rangeEnd={24} onStatusChange={handleClStatus} onRangeChange={handleClRange} />
                  <ChecklistColumn label="Items 25-35" items={activeCard.checklistItems.slice(24)}    rangeStart={25} rangeEnd={35} onStatusChange={handleClStatus} onRangeChange={handleClRange} />
                </div>
              </div>
            </div>
          )}

          <div className="fleet maintenance record form bottom-bar">
            <Button
              text={isLoading ? `Submitting ${cards.length} records…` : `Submit ${cards.length} Record${cards.length !== 1 ? 's' : ''}`}
              icon={isLoading ? 'hourglass_top' : 'cloud_upload'}
              onClick={handleSubmit}
              colorScheme={isLoading ? 'success-1000' : 'success-700'}
              variant="gradient" font="md" squircle="4xl"
              width="260px" height="48px" type="button" textColor="white-200"
              shadowPosition="to-bottom" shadowColor="white-600"
              disabled={isLoading} />
          </div>

        </div>
      </div>

      <Toast
        isOpen={toastConfig.isOpen}
        onClose={closeToast}
        type={toastConfig.type}
        message={toastConfig.message}
        textColor={toastConfig.textColor}
        duration={4000}
        position="top-center"
      />
    </div>
  );
}

export default MaintenanceRecordForm;