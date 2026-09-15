import React from 'react';
import './Mechanic.css';
import Input from '@/shared/components/widgets/input/Input';
import Controls from '@/shared/components/widgets/controls/Controls';
import Tabs from '@/shared/components/widgets/tabs/Tabs';
import Table from '@/shared/components/widgets/table/Table';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';
import { useMechanic } from '../hooks/useMechanic';
import {
  ATTENDANCE_FILTER_OPTIONS,
  ATTENDANCE_FILTER_SELECT_PROPS,
  DATE_RANGE_INPUT_PROPS,
  PROFILE_BUTTON_PROPS,
  PAGER_BUTTON_PROPS,
} from '../constants/mechanic.constant';
import {
  formatQatarTime,
  formatMinutesAsDuration,
  buildAttendanceRows,
  buildMechanicOverviewRows,
  buildRecentActivityRows,
} from '../helper/mechanic.helper';

const DETAILS_COLUMNS = [
  { key: 'field', header: 'Field', render: (row) => row.field },
  { key: 'value', header: 'Value', render: (row) => row.value },
];

const TOOLKIT_COLUMNS = [
  { key: 'slNo', header: 'SL NO', render: (_row, index, _g, allRows) => allRows.length - index },
  { key: 'handover', header: 'Handover Date', render: (row) => new Date(row.assignedDate).toLocaleDateString() },
  { key: 'name', header: 'Name', render: (row) => row.name },
  { key: 'size', header: 'Size', render: (row) => row.size },
  { key: 'color', header: 'Color', render: (row) => row.color },
  { key: 'quantity', header: 'Quantity', render: (row) => row.quantity },
];

const ATTENDANCE_COLUMNS = [
  { key: 'date', header: 'Date', render: (row) => row.date },
  { key: 'checkIn', header: 'Check In', render: (row) => (row.checkIn ? formatQatarTime(row.checkIn.punchDateTime) : '-') },
  { key: 'breakOut', header: 'Break Out', render: (row) => (row.breakOut ? formatQatarTime(row.breakOut.punchDateTime) : '-') },
  { key: 'breakIn', header: 'Break In', render: (row) => (row.breakIn ? formatQatarTime(row.breakIn.punchDateTime) : '-') },
  { key: 'checkOut', header: 'Check Out', render: (row) => (row.checkOut ? formatQatarTime(row.checkOut.punchDateTime) : '-') },
  { key: 'total', header: 'Total Hours', render: (row) => formatMinutesAsDuration(row.totalMinutes) },
];

const RECENT_ACTIVITY_COLUMNS = [
  { key: 'mechanicName', header: 'Mechanic', render: (row) => row.mechanicName },
  { key: 'date', header: 'Date', render: (row) => row.date },
  { key: 'time', header: 'Time', render: (row) => row.time },
  { key: 'punchType', header: 'Type', render: (row) => row.punchType },
];

const OverviewActivityTab = ({ rows, loading }) => (
  <div className="features screen mechanic attendance">
    <div className="features screen mechanic content-header">
      <h3>Recent Activity</h3>
    </div>
    <Table
      columns={RECENT_ACTIVITY_COLUMNS}
      data={rows}
      rowKey={(row) => row.id}
      loading={loading}
      emptyMessage="No recent activity"
    />
  </div>
);

const DetailsTab = ({ mechanic }) => (
  <Table columns={DETAILS_COLUMNS} data={buildMechanicOverviewRows(mechanic)} emptyMessage="No data" />
);

const ToolkitsTab = ({ toolkits }) => (
  <Table
    columns={TOOLKIT_COLUMNS}
    data={toolkits}
    rowKey={(row) => row._id}
    emptyMessage="No toolkits assigned"
  />
);

const AttendanceTab = ({
  attendanceFilter,
  attendanceRows,
  attendanceLoading,
  attendancePage,
  attendanceTotalPages,
  dateRange,
  onFilterChange,
  onDateRangeChange,
  onApplyDateRange,
  onPageChange,
}) => (
  <div className="features screen mechanic attendance">
    <div className="features screen mechanic content-header">
      <h3>Attendance Records</h3>
      {attendanceFilter === 'date-range' && (
        <div className="features screen mechanic range-selector">
          <Input
            {...DATE_RANGE_INPUT_PROPS}
            name="startDate"
            value={dateRange.start}
            onChange={(e) => onDateRangeChange({ ...dateRange, start: e.target.value })}
            placeholder="Start Date"
          />
          <Input
            {...DATE_RANGE_INPUT_PROPS}
            name="endDate"
            value={dateRange.end}
            onChange={(e) => onDateRangeChange({ ...dateRange, end: e.target.value })}
            placeholder="End Date"
          />
          <Controls
            items={[{ text: 'Apply', onClick: onApplyDateRange, ...PAGER_BUTTON_PROPS }]}
          />
        </div>
      )}
      <Input
        {...ATTENDANCE_FILTER_SELECT_PROPS}
        value={attendanceFilter}
        onChange={(e) => onFilterChange(e.target.value)}
        options={ATTENDANCE_FILTER_OPTIONS}
      />
    </div>

    <Table
      columns={ATTENDANCE_COLUMNS}
      data={attendanceRows}
      rowKey={(row) => row.date}
      loading={attendanceLoading}
      emptyMessage="No attendance records found"
    />

    <div className="features screen mechanic pager">
      <Controls
        items={[
          { text: 'Prev', onClick: () => onPageChange(attendancePage - 1), disabled: attendancePage <= 1, ...PAGER_BUTTON_PROPS },
          { text: 'Next', onClick: () => onPageChange(attendancePage + 1), disabled: attendancePage >= attendanceTotalPages, ...PAGER_BUTTON_PROPS },
        ]}
      />
      <span className="features screen mechanic pager-label">
        Page {attendancePage} of {attendanceTotalPages}
      </span>
    </div>
  </div>
);

const Mechanic = () => {
  const {
    loading,
    error,
    treeItems,
    activePath,
    selectPath,
    isOverview,
    recentActivity,
    recentActivityLoading,
    mechanic,
    isEditing,
    editForm,
    startEditing,
    cancelEditing,
    updateEditField,
    saveEditing,
    removeMechanic,
    attendanceFilter,
    dateRange,
    setDateRange,
    changeAttendanceFilter,
    applyDateRange,
    attendanceRecords,
    attendancePage,
    attendanceTotalPages,
    attendanceLoading,
    goToAttendancePage,
  } = useMechanic();

  const activeSection = activePath[0] === 'mechanics' ? activePath[2] : null;

  if (loading) {
    return (
      <div className="features screen mechanic container">
        <div className="features screen mechanic loading-state">
          <Loader />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="features screen mechanic container">
        <div className="features screen mechanic error-state">
          <p>Error: {error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="features screen mechanic container">
      <div className="features screen mechanic body">
        <div className="features screen mechanic detail-nav">
          <Tabs
            items={treeItems}
            activePath={activePath}
            onSelect={(path) => selectPath(path)}
            showSearch={false}
            maxHeight="none"
          />
        </div>

        <div className="features screen mechanic tab-content">
          {isOverview && (
            <OverviewActivityTab rows={buildRecentActivityRows(recentActivity)} loading={recentActivityLoading} />
          )}

          {!isOverview && mechanic && (
            <>
              <div className="features screen mechanic profile-header">
                {isEditing ? (
                  <div className="features screen mechanic edit-form">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => updateEditField('name', e.target.value)}
                      className="features screen mechanic edit-input"
                    />
                    <input
                      type="text"
                      value={editForm.userId}
                      onChange={(e) => updateEditField('userId', e.target.value)}
                      className="features screen mechanic edit-input"
                      placeholder="User ID"
                    />
                  </div>
                ) : (
                  <div className="features screen mechanic profile-info">
                    <h2>{mechanic.name}</h2>
                    <p className="features screen mechanic profile-id">ID: {mechanic.userId || mechanic._id}</p>
                  </div>
                )}

                <div className="features screen mechanic profile-buttons">
                  {isEditing ? (
                    <Controls
                      items={[
                        { text: 'Save', onClick: saveEditing, colorScheme: 'lime-600', ...PROFILE_BUTTON_PROPS },
                        { text: 'Cancel', onClick: cancelEditing, colorScheme: 'amber-600', ...PROFILE_BUTTON_PROPS },
                      ]}
                      gap="15px"
                    />
                  ) : (
                    <Controls
                      items={[
                        { text: 'Edit', onClick: startEditing, colorScheme: 'blue-600', ...PROFILE_BUTTON_PROPS },
                        { text: 'Delete', onClick: removeMechanic, colorScheme: 'red-600', ...PROFILE_BUTTON_PROPS },
                      ]}
                      gap="15px"
                    />
                  )}
                </div>
              </div>

              {activeSection === 'details' && <DetailsTab mechanic={mechanic} />}
              {activeSection === 'toolkits' && <ToolkitsTab toolkits={mechanic.toolkits || []} />}
              {activeSection === 'attendance' && (
                <AttendanceTab
                  attendanceFilter={attendanceFilter}
                  attendanceRows={buildAttendanceRows(attendanceRecords)}
                  attendanceLoading={attendanceLoading}
                  attendancePage={attendancePage}
                  attendanceTotalPages={attendanceTotalPages}
                  dateRange={dateRange}
                  onFilterChange={changeAttendanceFilter}
                  onDateRangeChange={setDateRange}
                  onApplyDateRange={applyDateRange}
                  onPageChange={goToAttendancePage}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mechanic;