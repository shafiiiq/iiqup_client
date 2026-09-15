import React from 'react';
import './MaintenanceRecord.css';
import Tabs from '@/shared/components/widgets/tabs/Tabs';
import Controls from '@/shared/components/widgets/controls/Controls';
import Modal from '@/shared/components/widgets/modal/Modal';
import Input from '@/shared/components/widgets/input/Input';
import Loader from '@/shared/components/widgets/loader/spinner/Spinner';
import Table from '@/shared/components/widgets/table/Table';

import { useMaintenanceRecord } from '../hooks/useMaintenanceRecord';
import { MONTH_RANGE_OPTIONS } from '../constants/maintenance.record.constant';
import { buildRecordPeriodNavItems } from '../constants/maintenance.record.nav.tree.constant';
import { buildRecordTableColumns, getRecordRowClassName } from '../helper/maintenance.record.table.helper';

const TAB_CONTROL_BUTTON_PROPS = {
    variant: 'gradient',
    font: 'md',
    animation: '',
    squircle: '4xl',
    height: '38px',
    textColor: 'white-100',
    shadowPosition: 'to-bottom',
    shadowColor: 'white-600',
    width: '100%',
};

function MaintenanceRecord() {
    const h = useMaintenanceRecord();

    const navItems = buildRecordPeriodNavItems();
    const columns = buildRecordTableColumns({
        expandedRemarks: h.expandedRemarks,
        onToggleRemark: h.toggleRemarkExpansion,
        onRowClick: h.handleRowClick,
        onDeleteReport: h.handleDeleteReport,
    });

    return (
        <div className="service-history-container-cnt">
            <Modal
                isOpen={h.showDeleteModal}
                onClose={h.handleCloseDeleteModal}
                type="error"
                title="Delete Report?"
                message="Are you sure you want to delete this report? This action cannot be undone."
                buttonText="Delete"
                secondaryButtonText="Cancel"
                onButtonClick={h.confirmDeleteReport}
                onSecondaryClick={h.handleCloseDeleteModal}
            />

            <div className="record-layout">
                <div className="record-layout-sidebar">
                    <Tabs
                        title="Period"
                        items={navItems}
                        activePath={[h.selectedPeriod]}
                        onSelect={([key]) => h.handlePeriodTabSelect(key)}
                        showSearch={false}
                        maxHeight="1090px"
                        controlsColumns={2}
                        controls={[
                            { ...TAB_CONTROL_BUTTON_PROPS, text: 'Export', onClick: h.handleExportToExcel, colorScheme: 'black-200', componentIconLeft: 'ExcelIcon', componentIconSize: '30', iconColor: 'white-200' },
                            { ...TAB_CONTROL_BUTTON_PROPS, text: 'Print', onClick: h.handlePrint, colorScheme: 'black-200', componentIconLeft: 'PrinterIcon', componentIconSize: '30', iconColor: 'white-200' },
                        ]}
                    />
                </div>

                <div className="record-layout-content">
                    {h.selectedPeriod === 'months' && (
                        <div className="record-period-panel">
                            <Input
                                type="select"
                                value={h.selectedMonthRange}
                                onChange={h.handleMonthRangeChange}
                                options={MONTH_RANGE_OPTIONS}
                                colorScheme="primary-600"
                                variant="gradient"
                                font="md"
                                squircle="4xl"
                                width="200px"
                                height="38px"
                                textColor="white-100"
                                shadowPosition="to-bottom"
                                shadowColor="white-600"
                                animation="none"
                                inputPaddingInline="xl"
                                fontWeight="500"
                                label="Number of Months"
                                labelBgColor='transparent'
                            />
                        </div>
                    )}

                    {h.selectedPeriod === 'custom' && (
                        <div className="record-period-panel">
                            <div className="data-range-inputs">
                                <Input
                                    type="date"
                                    name="startDate"
                                    value={h.dateRange.start}
                                    onChange={h.handleDateRangeStartChange}
                                    placeholder="Start Date"
                                    label="Start Date"
                                    labelBgColor='transparent'
                                    colorScheme="primary-300"
                                    variant="gradient"
                                    squircle="4xl"
                                    width="240px"
                                    height="40px"
                                    textColor="black-100"
                                    placeholderColor="black-300"
                                    fontWeight="500"
                                    inputPaddingInline="2xl"
                                    inputPaddingBlock="xl"
                                />
                                <Input
                                    type="date"
                                    name="endDate"
                                    value={h.dateRange.end}
                                    onChange={h.handleDateRangeEndChange}
                                    placeholder="End Date"
                                    label="End Date"
                                    labelBgColor='transparent'
                                    colorScheme="primary-300"
                                    variant="gradient"
                                    squircle="4xl"
                                    width="240px"
                                    height="40px"
                                    textColor="black-200"
                                    placeholderColor="black-300"
                                    inputPaddingInline="4xl"
                                    inputPaddingBlock="xl"
                                    fontWeight="500"
                                />
                            </div>
                            <Controls
                                justify="space-between"
                                margin="12px auto 0 170px"
                                width='fit-content'
                                rows={1}
                                columns={1}
                                buttons={[
                                    {
                                        text: 'Apply',
                                        onClick: h.handleApplyDateRange,
                                        colorScheme: 'success-500',
                                        variant: 'gradient',
                                        font: 'md',
                                        squircle: 'xl',
                                        width: '140px',
                                        height: '38px',
                                        type: 'submit',
                                        textColor: 'black-200',
                                        shadowPosition: 'to-bottom',
                                        shadowColor: 'white-600',
                                    },
                                ]}
                            />
                        </div>
                    )}

                    {h.isLoading ? (
                        <div className="loading-container">
                            <Loader />
                        </div>
                    ) : (
                        <Table
                            tableRef={h.tableRef}
                            columns={columns}
                            groups={h.groupedData}
                            getRowClassName={getRecordRowClassName}
                            rowKey={(item, index, groupKey) => `${groupKey}-${index}`}
                            emptyMessage="No service records found for the selected period"
                            className="service-table summary-service-table"
                            containerClassName="service-table-container"
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default MaintenanceRecord;