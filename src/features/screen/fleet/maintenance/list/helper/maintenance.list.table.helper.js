import Button from '@/shared/components/widgets/button/Button';
import { formatDate, isOilOrNormalService } from '../../helper/maintenance.helper';
import { getServiceTypeBadge } from './maintenance.list.helper';
import RemarksCell from '../components/fragments/RemarksCell';
import { ACTION_BUTTON_PROPS } from '../constants/maintenance.list.constant';

export const buildListTableColumns = ({
  activeTab,
  expandedRemarks,
  onToggleRemark,
  onDeleteMaintenance,
  onViewReport,
  onEditMaintenance,
}) => {
  const showServiceTypeColumn = activeTab === 'all';
  const showNextFullServiceColumn = activeTab === 'oil' || activeTab === 'all';
  const showTyreColumns = activeTab === 'tyre' || activeTab === 'all';
  const showBatteryColumn = activeTab === 'battery' || activeTab === 'all';

  return [
    {
      key: 'date',
      header: 'Date',
      headerClassName: 'fleet maintenance list date column',
      render: (item) => formatDate(item.date),
    },
    showServiceTypeColumn && {
      key: 'serviceType',
      header: 'Service Type',
      render: (item) => {
        const badge = getServiceTypeBadge(item.serviceType);
        return (
          <span className={`fleet maintenance list service badge ${badge.className}`}>
            {item.fullService ? 'Full Service' : badge.label}
          </span>
        );
      },
    },
    {
      key: 'workDescription',
      header: 'Work Description',
      className: 'fleet maintenance list work description cell',
      render: (item) =>
        isOilOrNormalService(item.serviceType) ? (
          <div>
            <div>
              <strong>Fuel Filter: </strong>{item.fuelFilter},&nbsp;
              <strong>Water Sep: </strong>{item.waterSeparator}
            </div>
            <div>
              <strong>Air Filter:</strong> {item.airFilter}
              {item.acFilter && <>, <strong>A/C Filter:</strong> {item.acFilter}</>}
            </div>
          </div>
        ) : null,
    },
    {
      key: 'servicedHrs',
      header: 'Serviced Hrs/Km',
      render: (item) => item.serviceHrs,
    },
    {
      key: 'nextService',
      header: 'Next Service',
      render: (item) => (item.nextServiceHrs === '0' ? '' : item.nextServiceHrs),
    },
    showNextFullServiceColumn && {
      key: 'nextFullService',
      header: 'Next Full Service',
      render: (item) => (item.serviceType === 'oil' && item.fullService ? Number(item.serviceHrs) + 3000 : '-'),
    },
    showTyreColumns && {
      key: 'location',
      header: 'Location',
      render: (item) => item.location || '-',
    },
    showTyreColumns && {
      key: 'tyreModel',
      header: 'Tyre Model',
      render: (item) => (item.serviceType === 'tyre' ? item.tyreModel : '-'),
    },
    showBatteryColumn && {
      key: 'batteryModel',
      header: 'Battery Model',
      render: (item) => (item.serviceType === 'battery' ? item.batteryModel : '-'),
    },
    {
      key: 'remarks',
      header: 'Remarks',
      className: 'fleet maintenance list remarks cell',
      render: (item, index, groupKey) => (
        <RemarksCell
          item={item}
          remarkKey={`${groupKey}-${index}`}
          expandedRemarks={expandedRemarks}
          onToggleRemark={onToggleRemark}
        />
      ),
    },
    {
      key: 'attachments',
      header: 'Files',
      render: (item) => item.attachments?.length || 0,
    },
    {
      key: 'report',
      header: 'Report',
      actions: true,
      headerCenter: true,
      dataCenter: true,
      headerClassName: 'fleet maintenance list document column',
      className: 'fleet maintenance list document column',
      render: (item) => (
        <Button
          {...ACTION_BUTTON_PROPS}
          componentIconCenter="IconlyShow"
          componentIconSize={30}
          onClick={() => onViewReport(item._id)}
          colorScheme="yellow-800"
          iconColor="info-400"
          padding="0"
        />
      ),
    },
    {
      key: 'edit',
      header: 'Edit',
      actions: true,
      headerCenter: true,
      dataCenter: true,
      headerClassName: 'fleet maintenance list document column',
      className: 'fleet maintenance list document column',
      render: (item) => (
        <Button
          {...ACTION_BUTTON_PROPS}
          componentIconCenter="IconlyEdit"
          componentIconSize={30}
          onClick={() => onEditMaintenance(item._id)}
          colorScheme="warning-800"
          iconColor="warning-200"
          padding="0"
        />
      ),
    },
    {
      key: 'delete',
      header: 'Delete',
      actions: true,
      headerCenter: true,
      dataCenter: true,
      headerClassName: 'fleet maintenance list document column',
      className: 'fleet maintenance list document column',
      render: (item) => (
        <Button
          {...ACTION_BUTTON_PROPS}
          componentIconCenter="IconlyDelete"
          componentIconSize={30}
          onClick={() => onDeleteMaintenance(item)}
          colorScheme="yellow-700"
          iconColor="error-300"
          padding="0"
        />
      ),
    },
  ].filter(Boolean);
};