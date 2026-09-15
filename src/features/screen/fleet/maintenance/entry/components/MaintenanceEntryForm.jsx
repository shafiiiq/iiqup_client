import Tabs from '@/shared/components/widgets/tabs/Tabs';
import Button from '@/shared/components/widgets/button/Button';
import Input from '@/shared/components/widgets/input/Input';
import Toast from '@/shared/components/widgets/toast/Toast';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';

import { useMaintenanceEntryForm } from '../hooks/useMaintenanceEntryForm';
import { SERVICE_TYPES, ENTRY_TABS, INPUT_PROPS, RADIO_BUTTON_PROPS, BUTTON_PROPS } from '../constants/maintenance.entry.constant';

import './MaintenanceEntryForm.css';

const OIL_FILTER_OPTIONS = [
    { key: 'oil', label: 'Engine Oil', opts: ['Check', 'Change'] },
    { key: 'oilFilter', label: 'Oil Filter', opts: ['Check', 'Change'] },
    { key: 'fuelFilter', label: 'Fuel Filter', opts: ['Check', 'Change'] },
    { key: 'acFilter', label: 'A/C Filter', opts: ['Check', 'Clean'] },
    { key: 'airFilter', label: 'Air Filter', opts: ['Clean', 'Change'] },
    { key: 'waterSeparator', label: 'Water Sep.', opts: ['Check', 'Change'] },
];

function ServiceTypeTab({ formData, isTypeLocked, onSelectType, onChange }) {
    const isOil = formData.serviceType === 'oil' || formData.serviceType === 'normal';
    const isTyre = formData.serviceType === 'tyre';
    const isBatt = formData.serviceType === 'battery';

    return (
        <div className="fleet maintenance entry form tab-panel">
            <h3 className="fleet maintenance entry form tab-title">Select Service Type</h3>

            <div className="fleet maintenance entry form type-grid">
                {SERVICE_TYPES.map((type) => (
                    <button
                        key={type.value}
                        type="button"
                        disabled={isTypeLocked}
                        className={`fleet maintenance entry form type-card ${formData.serviceType === type.value ? 'selected' : ''}`}
                        onClick={() => onSelectType(type.value)}
                    >
                        <img src={type.image} alt={type.label} className="fleet maintenance entry form type-card-image" />
                        <span>{type.label}</span>
                    </button>
                ))}
            </div>

            {isOil && (
                <div className="fleet maintenance entry form grid">
                    {OIL_FILTER_OPTIONS.map(({ key, label, opts }) => (
                        <div key={key} className="fleet maintenance entry form field">
                            <Input
                                {...INPUT_PROPS}
                                type="select"
                                id={key}
                                name={key}
                                value={formData[key]}
                                onChange={onChange}
                                label={label}
                                options={opts.map((o) => ({ value: o, label: o }))}
                            />
                        </div>
                    ))}
                    <div className="fleet maintenance entry form field">
                        <Input
                            {...INPUT_PROPS}
                            type="select"
                            id="fullService"
                            name="fullService"
                            value={formData.fullService}
                            onChange={onChange}
                            label="Full Service"
                            options={[{ value: false, label: 'No' }, { value: true, label: 'Yes' }]}
                        />
                    </div>
                </div>
            )}

            {isTyre && (
                <div className="fleet maintenance entry form grid">
                    <div className="fleet maintenance entry form field">
                        <Input {...INPUT_PROPS} type="text" id="tyreModel" name="tyreModel" value={formData.tyreModel} onChange={onChange} label="Tyre Model" placeholder="Enter tyre model" />
                    </div>
                    <div className="fleet maintenance entry form field">
                        <Input {...INPUT_PROPS} type="text" id="tyreNumber" name="tyreNumber" value={formData.tyreNumber} onChange={onChange} label="Tyre Number" placeholder="Enter tyre number" />
                    </div>
                </div>
            )}

            {isBatt && (
                <div className="fleet maintenance entry form grid">
                    <div className="fleet maintenance entry form field">
                        <Input {...INPUT_PROPS} type="text" id="batteryModel" name="batteryModel" value={formData.batteryModel} onChange={onChange} label="Battery Model" placeholder="Enter battery model" />
                    </div>
                </div>
            )}
        </div>
    );
}

function HistoryTab({ formData, onChange }) {
    return (
        <div className="fleet maintenance entry form tab-panel">
            <h3 className="fleet maintenance entry form tab-title">Service History</h3>
            <div className="fleet maintenance entry form grid">
                <div className="fleet maintenance entry form field"><Input {...INPUT_PROPS} type="date" id="date" name="date" value={formData.date} onChange={onChange} label="Service Date" /></div>
                <div className="fleet maintenance entry form field"><Input {...INPUT_PROPS} type="text" id="regNo" name="regNo" value={formData.regNo} onChange={onChange} label="Equipment Reg No" placeholder="Enter equipment number" /></div>
                <div className="fleet maintenance entry form field"><Input {...INPUT_PROPS} type="text" id="equipment" name="equipment" value={formData.equipment} onChange={onChange} label="Equipment Name" placeholder="Enter equipment name" /></div>
                <div className="fleet maintenance entry form field"><Input {...INPUT_PROPS} type="text" id="serviceHrs" name="serviceHrs" value={formData.serviceHrs} onChange={onChange} label="Service Hrs / Km" placeholder="e.g. 1000HRS" /></div>
                <div className="fleet maintenance entry form field"><Input {...INPUT_PROPS} type="text" id="nextServiceHrs" name="nextServiceHrs" value={formData.nextServiceHrs} onChange={onChange} label="Next Service Hrs / Km" placeholder="Auto-calculated" /></div>
                <div className="fleet maintenance entry form field"><Input {...INPUT_PROPS} type="text" id="location" name="location" value={formData.location} onChange={onChange} label="Location" placeholder="Enter location" /></div>
                <div className="fleet maintenance entry form field"><Input {...INPUT_PROPS} type="text" id="mechanics" name="mechanics" value={formData.mechanics} onChange={onChange} label="Mechanics" placeholder="Enter mechanics name" /></div>
                <div className="fleet maintenance entry form field"><Input {...INPUT_PROPS} type="text" id="operator" name="operator" value={formData.operator} onChange={onChange} label="Operator" placeholder="Enter operator name" /></div>
            </div>
        </div>
    );
}

function ChecklistRadioGroup({ itemId, currentStatus, onStatusChange }) {
    return (
        <div className="fleet maintenance entry form item-status">
            <Input type="radio" id={`entry-yes-${itemId}`} name={`entry-status-${itemId}`} checked={currentStatus === '✓'} onChange={() => onStatusChange(itemId, '✓')} {...RADIO_BUTTON_PROPS} colorScheme="primary-700" borderColor="primary-500" onCheckedColor="primary-100" />
            <Input type="radio" id={`entry-no-${itemId}`} name={`entry-status-${itemId}`} checked={currentStatus === '✗'} onChange={() => onStatusChange(itemId, '✗')} {...RADIO_BUTTON_PROPS} colorScheme="primary-700" borderColor="primary-500" onCheckedColor="primary-100" />
            <Input type="radio" id={`entry-blank-${itemId}`} name={`entry-status-${itemId}`} checked={currentStatus === '--'} onChange={() => onStatusChange(itemId, '--')} {...RADIO_BUTTON_PROPS} colorScheme="primary-700" borderColor="primary-500" onCheckedColor="primary-100" />
        </div>
    );
}

function ChecklistColumn({ label, items, rangeStart, rangeEnd, onStatusChange, onRangeChange }) {
    const rangeStatus = items.every((item) => item.status === items[0]?.status) ? items[0]?.status : null;

    return (
        <div className="fleet maintenance entry form checklist-column">
            <div className="fleet maintenance entry form checklist-actions">
                <span>{label}</span>
                <div className="fleet maintenance entry form checklist-buttons">
                    <Button {...BUTTON_PROPS} text="YES" onClick={() => onRangeChange(rangeStart, rangeEnd, '✓')} colorScheme={rangeStatus === '✓' ? 'primary-300' : 'primary-700'} textColor={rangeStatus === '✓' ? 'black-100' : 'white-100'} />
                    <Button {...BUTTON_PROPS} text="NO" onClick={() => onRangeChange(rangeStart, rangeEnd, '✗')} colorScheme={rangeStatus === '✗' ? 'primary-300' : 'primary-700'} textColor={rangeStatus === '✗' ? 'black-100' : 'white-100'} />
                    <Button {...BUTTON_PROPS} text="BLANK" onClick={() => onRangeChange(rangeStart, rangeEnd, '--')} colorScheme={rangeStatus === '--' ? 'primary-300' : 'primary-700'} textColor={rangeStatus === '--' ? 'black-100' : 'white-100'} />
                </div>
            </div>
            <div className="fleet maintenance entry form checklist-items">
                {items.map((item) => (
                    <div key={item.id} className="fleet maintenance entry form checklist-item">
                        <div>{item.id}.</div>
                        <div>{item.description}</div>
                        <ChecklistRadioGroup itemId={item.id} currentStatus={item.status} onStatusChange={onStatusChange} />
                    </div>
                ))}
            </div>
        </div>
    );
}

function ReportTab({ formData, onChange, onStatusChange, onRangeStatusChange }) {
    return (
        <div className="fleet maintenance entry form tab-panel">
            <h3 className="fleet maintenance entry form tab-title">Service Report</h3>
            <div className="fleet maintenance entry form field">
                <Input
                    {...INPUT_PROPS}
                    type="textarea"
                    id="remarks"
                    name="remarks"
                    value={formData.remarks}
                    onChange={onChange}
                    placeholder="Enter remarks…"
                    height="140px"
                    squircle="30xl"
                    fontSize="6xl"
                    fullWidth="true"
                    rows={5}
                    label="Remarks"
                />
            </div>

            <div className="fleet maintenance entry form checklist-grid">
                <ChecklistColumn label="Items 1-24" items={formData.checklistItems.slice(0, 24)} rangeStart={1} rangeEnd={24} onStatusChange={onStatusChange} onRangeChange={onRangeStatusChange} />
                <ChecklistColumn label="Items 25-35" items={formData.checklistItems.slice(24)} rangeStart={25} rangeEnd={35} onStatusChange={onStatusChange} onRangeChange={onRangeStatusChange} />
            </div>
        </div>
    );
}

function MaintenanceEntryForm() {
    const {
        mode,
        isTypeLocked,
        formData,
        activeTab,
        setActiveTab,
        isLoading,
        isPrefetching,
        toastConfig,
        closeToast,
        handleChange,
        handleTypeSelect,
        handleStatusChange,
        handleRangeStatusChange,
        tabHasWarning,
        handleSubmit,
    } = useMaintenanceEntryForm();

    const navItems = [
        { key: ENTRY_TABS.TYPE, label: 'Service Type', warn: tabHasWarning(ENTRY_TABS.TYPE) },
        { key: ENTRY_TABS.HISTORY, label: 'History', warn: tabHasWarning(ENTRY_TABS.HISTORY) },
        { key: ENTRY_TABS.REPORT, label: 'Report', warn: tabHasWarning(ENTRY_TABS.REPORT) },
    ];

    if (isPrefetching) {
        return (
            <div className="fleet maintenance entry form loading">
                <Loader />
            </div>
        );
    }

    return (
        <div className="fleet maintenance entry form container">
            <div className="fleet maintenance entry form layout">
                <Tabs
                    title="Sections"
                    items={navItems}
                    activePath={[activeTab]}
                    onSelect={([key]) => setActiveTab(key)}
                    maxHeight='1090px'
                />

                <div className="fleet maintenance entry form content">
                    {activeTab === ENTRY_TABS.TYPE && (
                        <ServiceTypeTab formData={formData} isTypeLocked={isTypeLocked} onSelectType={handleTypeSelect} onChange={handleChange} />
                    )}
                    {activeTab === ENTRY_TABS.HISTORY && (
                        <HistoryTab formData={formData} onChange={handleChange} />
                    )}
                    {activeTab === ENTRY_TABS.REPORT && (
                        <ReportTab formData={formData} onChange={handleChange} onStatusChange={handleStatusChange} onRangeStatusChange={handleRangeStatusChange} />
                    )}

                    <div className="fleet maintenance entry form actions">
                        <Button
                            text={isLoading ? 'Saving...' : mode === 'updateReport' ? 'Update' : 'Submit'}
                            onClick={handleSubmit}
                            colorScheme={isLoading ? 'success-1000' : 'success-800'}
                            variant="gradient"
                            font="md"
                            squircle="4xl"
                            width="200px"
                            height="48px"
                            type="button"
                            textColor="white-200"
                            shadowPosition="to-bottom"
                            shadowColor="white-600"
                            disabled={isLoading}
                        />
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

export default MaintenanceEntryForm;