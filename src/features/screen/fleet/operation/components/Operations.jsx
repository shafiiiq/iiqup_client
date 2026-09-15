import React from 'react';
import './Operations.css';
import Controls from '@/shared/components/widgets/controls/Controls';
import Input from '@/shared/components/widgets/input/Input';
import Table from '@/shared/components/widgets/table/Table';
import Tabs from '@/shared/components/widgets/tabs/Tabs';
import useOperations from '../hooks/useOperation';
import { PERIOD_OPTIONS, MONTH_OPTIONS, TAB_TREE } from '../constants/operation.constant';
import { formatDateFull, formatTime, getActivityMeta, getExpandRows } from '../helper/operation.helper';

const NS = 'features screen fleet equipment operations';

const renderOperatorExpanded = (extraItem) => (
    <span>
        {extraItem.operatorName || '—'}
        {extraItem.shiftName ? ` — ${extraItem.shiftName}` : ''}
        {!extraItem.shiftName && extraItem.shiftStart ? ` — ${extraItem.shiftStart}${extraItem.shiftEnd ? ' – ' + extraItem.shiftEnd : ''}` : ''}
    </span>
);

const COLUMN_DEFS = {
    expand: { key: 'expand', expand: true, header: '' },
    type: {
        key: 'type',
        header: 'Type',
        render: (item) => (
            <span className={`${NS} activity-badge`} data-badge-type={item._meta.badgeType}>
                {item._meta.badgeLabel}
            </span>
        ),
    },
    equipment: {
        key: 'equipment',
        header: 'Equipment',
        render: (item) => (
            <div className={`${NS} operations-equipment-cell`}>
                <span className={`${NS} operations-equipment-machine`}>{item._meta.machine || '—'}</span>
                <span className={`${NS} operations-equipment-reg`}>{item._meta.regNo || '—'}</span>
            </div>
        ),
    },
    details: { key: 'details', header: 'Details', render: (item) => item._meta.details },
    operator: {
        key: 'operator',
        header: 'Operator',
        render: (item) => item._meta.operatorSummary,
        renderExpanded: renderOperatorExpanded,
    },
    previousOperators: {
        key: 'previousOperators',
        header: 'Previous Operator(s)',
        render: (item) => item._meta.previousOperatorSummary,
        renderExpanded: renderOperatorExpanded,
    },
    location: { key: 'location', header: 'Location', render: (item) => item._meta.location },
    lastMobilized: {
        key: 'lastMobilized',
        header: 'Last Mobilized',
        render: (item) => `${item._meta.lastMobilizedDate} ${item._meta.lastMobilizedTime !== '—' ? item._meta.lastMobilizedTime : ''}`.trim() || '—',
    },
    hired: {
        key: 'hired',
        header: 'Hired',
        headerCenter: true,
        dataCenter: true,
        render: (item) => item._meta.hiredLabel,
    },
    hiredFrom: { key: 'hiredFrom', header: 'Hired From', render: (item) => item._meta.hiredFrom },
    rentRate: { key: 'rentRate', header: 'Rent Rate', render: (item) => item._meta.rentRate },
    outgoingOperator: { key: 'outgoingOperator', header: 'Outgoing Operator', render: (item) => item._meta.outgoingOperator },
    incomingOperator: { key: 'incomingOperator', header: 'Incoming Operator', render: (item) => item._meta.incomingOperator },
    replacedBy: { key: 'replacedBy', header: 'Replaced By', render: (item) => item._meta.replacedByLabel },
    shift: { key: 'shift', header: 'Shift', render: (item) => item._meta.shiftInfo },
    remainingShifts: { key: 'remainingShifts', header: 'Remaining Shifts', render: (item) => item._meta.remainingShiftsSummary },
    newSite: { key: 'newSite', header: 'New Site', render: (item) => item._meta.newSiteForReplaced },
    date: {
        key: 'date',
        header: 'Date',
        headerCenter: true,
        dataCenter: true,
        render: (item) => formatDateFull(item.date),
    },
    time: {
        key: 'time',
        header: 'Time',
        headerCenter: true,
        dataCenter: true,
        render: (item) => formatTime(item.time),
    },
    remarks: { key: 'remarks', header: 'Remarks', render: (item) => item._meta.remarks },
};

const TAB_COLUMNS = {
    recent: ['expand', 'type', 'equipment', 'details', 'operator', 'previousOperators', 'location', 'lastMobilized', 'hired', 'hiredFrom', 'rentRate', 'outgoingOperator', 'incomingOperator', 'replacedBy', 'shift', 'remainingShifts', 'newSite', 'date', 'time', 'remarks'],
    mobilization: ['expand', 'equipment', 'details', 'operator', 'location', 'hired', 'hiredFrom', 'rentRate', 'date', 'time', 'remarks'],
    demobilization: ['expand', 'equipment', 'details', 'previousOperators', 'location', 'lastMobilized', 'hired', 'hiredFrom', 'rentRate', 'date', 'time', 'remarks'],
    statusChanges: ['equipment', 'details', 'location', 'hired', 'hiredFrom', 'rentRate', 'date', 'time', 'remarks'],
    operatorReplacements: ['expand', 'equipment', 'details', 'outgoingOperator', 'incomingOperator', 'shift', 'remainingShifts', 'previousOperators', 'location', 'hired', 'hiredFrom', 'rentRate', 'date', 'time', 'remarks'],
    equipmentReplacements: ['equipment', 'details', 'outgoingOperator', 'incomingOperator', 'replacedBy', 'newSite', 'location', 'hired', 'hiredFrom', 'rentRate', 'date', 'time', 'remarks'],
};

function OperationFilterPanel({
    selectedPeriod,
    handlePeriodChange,
    selectedMonthRange,
    handleMonthsFilter,
    dateRange,
    setDateRange,
    handleDateRangeFilter,
    singleDate,
    setSingleDate,
    handleSingleDateFilter,
    specificTime,
    setSpecificTime,
    handleSpecificTimeFilter,
    timeRange,
    setTimeRange,
    handleTimeRangeFilter,
    clearTimeFilters,
}) {
    const hasActiveTimeFilter = Boolean(specificTime || timeRange.start || timeRange.end);

    return (
        <div className={`${NS} operations-filter-panel`}>
            <div className={`${NS} operations-filter-field`}>
                <span className={`${NS} operations-filter-field-label`}>Period</span>
                <Input
                    type="select" value={selectedPeriod} onChange={handlePeriodChange} options={PERIOD_OPTIONS}
                    colorScheme="primary-700" variant="gradient" font="sm" squircle="2xl"
                    width="100%" height="40px" textColor="white-200" inputPaddingInline="lg" fontWeight="500"
                />
            </div>

            <div className={`${NS} operations-filter-field`}>
                <span className={`${NS} operations-filter-field-label`}>Look back</span>
                <Input
                    type="select" value={selectedMonthRange} onChange={(e) => handleMonthsFilter(e.target.value)} options={MONTH_OPTIONS}
                    colorScheme="primary-700" variant="gradient" font="sm" squircle="2xl"
                    width="100%" height="40px" textColor="white-100" inputPaddingInline="lg" fontWeight="500"
                />
            </div>

            <div className={`${NS} operations-filter-field`}>
                <span className={`${NS} operations-filter-field-label`}>Custom range</span>
                <Input type="date" placeholder='Start Date' name="startDate" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} colorScheme="primary-700" variant="gradient" squircle="2xl" width="100%" height="40px" textColor="black-100" fontWeight="500" inputPaddingInline="lg" />
                <Input type="date" name="endDate" placeholder='End Date' value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} colorScheme="primary-700" variant="gradient" squircle="2xl" width="100%" height="40px" textColor="black-200" inputPaddingInline="lg" fontWeight="500" />
                <Controls
                    width="100%" wrap={false} justify="center"
                    items={[{ text: 'Apply Range', onClick: handleDateRangeFilter, colorScheme: 'success-800', variant: 'gradient', font: 'sm', squircle: 'xl', height: '38px', fullWidth: true, textColor: 'white-200' }]}
                />
            </div>

            <div className={`${NS} operations-filter-field`}>
                <span className={`${NS} operations-filter-field-label`}>Single date</span>
                <Input type="date" name="singleDate" value={singleDate} onChange={(e) => setSingleDate(e.target.value)} colorScheme="primary-700" variant="gradient" squircle="2xl" width="100%" height="40px" textColor="black-100" fontWeight="500" inputPaddingInline="lg" />
                <Controls
                    width="100%" wrap={false} justify="center"
                    items={[{ text: 'Go', onClick: handleSingleDateFilter, colorScheme: 'success-800', variant: 'gradient', font: 'sm', squircle: 'xl', height: '38px', fullWidth: true, textColor: 'white-200' }]}
                />
            </div>

            <div className={`${NS} operations-filter-field`}>
                <span className={`${NS} operations-filter-field-label`}>Specific time</span>
                <Input type="time" name="specificTime" value={specificTime} onChange={(e) => setSpecificTime(e.target.value)} colorScheme="primary-700" variant="gradient" squircle="2xl" width="100%" height="40px" textColor="white-100" fontWeight="500" inputPaddingInline="lg" />
                <Controls
                    width="100%" wrap={false} justify="center"
                    items={[{ text: 'Filter', onClick: handleSpecificTimeFilter, colorScheme: 'success-800', variant: 'gradient', font: 'sm', squircle: 'xl', height: '38px', fullWidth: true, textColor: 'white-200' }]}
                />
            </div>

            <div className={`${NS} operations-filter-field`}>
                <span className={`${NS} operations-filter-field-label`}>Time range</span>
                <Input type="time" name="startTime" value={timeRange.start} onChange={(e) => setTimeRange({ ...timeRange, start: e.target.value })} colorScheme="primary-700" variant="gradient" squircle="2xl" width="100%" height="40px" textColor="black-100" fontWeight="500" inputPaddingInline="lg" />
                <Input type="time" name="endTime" value={timeRange.end} onChange={(e) => setTimeRange({ ...timeRange, end: e.target.value })} colorScheme="primary-700" variant="gradient" squircle="2xl" width="100%" height="40px" textColor="black-100" fontWeight="500" inputPaddingInline="lg" />
                <Controls
                    width="100%" wrap={false} justify="center"
                    items={[{ text: 'Apply Range', onClick: handleTimeRangeFilter, colorScheme: 'success-800', variant: 'gradient', font: 'sm', squircle: 'xl', height: '38px', fullWidth: true, textColor: 'white-200' }]}
                />
            </div>

            {hasActiveTimeFilter && (
                <div className={`${NS} operations-filter-field`}>
                    <Controls
                        width="100%" wrap={false} justify="center"
                        items={[{ text: 'Clear Filters', onClick: clearTimeFilters, colorScheme: 'primary-700', variant: 'gradient', font: 'sm', squircle: 'xl', height: '38px', fullWidth: true, textColor: 'white-200' }]}
                    />
                </div>
            )}
        </div>
    );
}

function Operations() {
    const {
        activePath,
        setActivePath,
        activeTab,
        isLoading,
        specificTime,
        setSpecificTime,
        timeRange,
        setTimeRange,
        singleDate,
        setSingleDate,
        selectedPeriod,
        selectedMonthRange,
        dateRange,
        setDateRange,
        items,
        handleSingleDateFilter,
        handleSpecificTimeFilter,
        handleTimeRangeFilter,
        clearTimeFilters,
        handlePeriodChange,
        handleMonthsFilter,
        handleDateRangeFilter,
    } = useOperations();

    const handleTabSelect = (path, node) => {
        if (node.children?.length) {
            setActivePath([...path, node.children[0].key]);
        } else {
            setActivePath(path);
        }
    };

    const rows = items.map((item) => ({ ...item, _meta: getActivityMeta(item) }));
    const columns = (TAB_COLUMNS[activeTab] || TAB_COLUMNS.recent).map((key) => COLUMN_DEFS[key]);

    return (
        <div className={`${NS} operations-root`}>
            <div
                className={`${NS} operations-sidebar`}
                style={{ '--tabs-expanded-width': '280px', '--tabs-collapsed-width': '76px', '--tabs-sticky-top': '0px' }}
            >
                <Tabs
                    items={TAB_TREE}
                    activePath={activePath}
                    onSelect={handleTabSelect}
                    title="Activities"
                    showSearch={false}
                    maxHeight="100%"
                    filterToggleLabel={activeTab === 'recent' ? undefined : 'Filters'}
                    filters={
                        activeTab === 'recent'
                            ? undefined
                            : (
                                <OperationFilterPanel
                                    selectedPeriod={selectedPeriod}
                                    handlePeriodChange={handlePeriodChange}
                                    selectedMonthRange={selectedMonthRange}
                                    handleMonthsFilter={handleMonthsFilter}
                                    dateRange={dateRange}
                                    setDateRange={setDateRange}
                                    handleDateRangeFilter={handleDateRangeFilter}
                                    singleDate={singleDate}
                                    setSingleDate={setSingleDate}
                                    handleSingleDateFilter={handleSingleDateFilter}
                                    specificTime={specificTime}
                                    setSpecificTime={setSpecificTime}
                                    handleSpecificTimeFilter={handleSpecificTimeFilter}
                                    timeRange={timeRange}
                                    setTimeRange={setTimeRange}
                                    handleTimeRangeFilter={handleTimeRangeFilter}
                                    clearTimeFilters={clearTimeFilters}
                                />
                            )
                    }
                />
            </div>

            <div className={`${NS} operations-table-wrapper`}>
                <Table
                    columns={columns}
                    data={rows}
                    rowKey={(item) => item._id}
                    getExpandedRows={getExpandRows}
                    loading={isLoading}
                    emptyMessage="No activities found"
                />
            </div>
        </div>
    );
}

export default Operations;