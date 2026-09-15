import { useNavigate } from 'react-router-dom';
import Table from '@/shared/components/widgets/table/Table';
import { buildHistoryTableColumns } from '../../helper/maintenance.history.table.helper';

function HistoryTable({
  groupedData,
  activeTab,
  registrationNumbers,
  expandedRemarks,
  onToggleRemark,
  onDeleteReport,
  tableRef,
}) {
  const navigate = useNavigate();

  const navigateToServiceDocument = (date, serviceType, historyId) => {
    const docTypeByServiceType = {
      major: 'maintenance-doc',
      tyre: 'tyre-doc',
      battery: 'battery-doc',
    };

    navigate(`/service-document/${historyId}`, {
      state: {
        regNo: registrationNumbers[0],
        date,
        serviceType,
        historyId,
        docType: docTypeByServiceType[serviceType] ?? 'service-doc',
      },
    });
  };

  const columns = buildHistoryTableColumns({
    activeTab,
    expandedRemarks,
    onToggleRemark,
    onDeleteReport,
    navigateToServiceDocument,
  });

  const getRowClassName = (item) =>
    [
      `equipment maintenance history ${item.serviceType} service row`,
      item.fullService ? 'equipment maintenance history full service row' : '',
      item.replaced ? 'equipment maintenance history replacement row' : '',
    ].filter(Boolean).join(' ');

  return (
    <Table
      tableRef={tableRef}
      columns={columns}
      groups={groupedData}
      getRowClassName={getRowClassName}
      rowKey={(item, index, groupKey) => `${groupKey}-${index}`}
      emptyMessage="No service records found for the selected period"
      className="equipment maintenance history table"
      containerClassName="equipment maintenance history table container"
    />
  );
}

export default HistoryTable;