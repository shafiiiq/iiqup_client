import { useNavigate } from 'react-router-dom';
import Table from '@/shared/components/widgets/table/Table';
import { buildListTableColumns } from '../../helper/maintenance.list.table.helper';

function ListTable({ groupedData, activeTab, expandedRemarks, onToggleRemark, onDeleteMaintenance, tableRef }) {
  const navigate = useNavigate();

  const columns = buildListTableColumns({
    activeTab,
    expandedRemarks,
    onToggleRemark,
    onDeleteMaintenance,
    onViewReport: (maintenanceId) => navigate(`/maintenance/report/${maintenanceId}`),
    onEditMaintenance: (maintenanceId) => navigate(`/maintenance/form/edit/${maintenanceId}`),
  });

  const getRowClassName = (item) =>
    [
      `fleet maintenance list ${item.serviceType} service row`,
      item.fullService ? 'fleet maintenance list full service row' : '',
    ].filter(Boolean).join(' ');

  return (
    <Table
      tableRef={tableRef}
      columns={columns}
      groups={groupedData}
      getRowClassName={getRowClassName}
      rowKey={(item, index, groupKey) => `${groupKey}-${index}`}
      emptyMessage="No maintenance records found for the selected period"
      className="fleet maintenance list table"
      containerClassName="fleet maintenance list table container"
    />
  );
}

export default ListTable;