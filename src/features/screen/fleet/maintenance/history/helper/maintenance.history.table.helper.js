import Button from '@/shared/components/widgets/button/Button';
import { formatDate, getServiceTypeBadge } from '../helper/maintenance.history.helper';
import RemarksCell from '../components/fragments/RemarksCell';
import { ACTION_BUTTON_PROPS, SERVICE_TYPES_WITH_HOURS_TRACKING, isOilOrNormalService } from '../constants/maintenance.history.constant';

export const buildHistoryTableColumns = ({
  activeTab,
  expandedRemarks,
  onToggleRemark,
  onDeleteReport,
  navigateToServiceDocument,
}) => {
  const showServiceTypeColumn = activeTab === 'all';
  const showHoursColumns = ['oil', 'normal', 'major', 'tyre', 'battery', 'all'].includes(activeTab);
  const showNextFullServiceColumn = activeTab === 'oil' || activeTab === 'all';
  const showTyreColumns = activeTab === 'tyre' || activeTab === 'all';
  const showBatteryColumn = activeTab === 'battery' || activeTab === 'all';

  return [
    {
      key: 'date',
      header: 'Date',
      headerClassName: 'equipment maintenance history date column',
      render: (item) => formatDate(item.date),
    },
    showServiceTypeColumn && {
      key: 'serviceType',
      header: 'Service Type',
      render: (item) => {
        const badge = getServiceTypeBadge(item.serviceType);
        return (
          <span className={`equipment maintenance history service badge ${badge.className}`}>
            {item.fullService ? 'Full Service' : badge.label}
          </span>
        );
      },
    },
    {
      key: 'workDescription',
      header: 'Work Description',
      className: 'equipment maintenance history work description cell',
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
        ) : (
          null
        ),
    },
    showHoursColumns && {
      key: 'servicedHrs',
      header: 'Serviced Hrs/Km',
      render: (item) => (SERVICE_TYPES_WITH_HOURS_TRACKING.has(item.serviceType) ? item.serviceHrs : '-'),
    },
    showHoursColumns && {
      key: 'nextService',
      header: 'Next Service',
      render: (item) => {
        if (!SERVICE_TYPES_WITH_HOURS_TRACKING.has(item.serviceType)) return '-';
        return item.nextServiceHrs === 0 || item.nextServiceHrs === '0' ? '' : item.nextServiceHrs;
      },
    },
    showHoursColumns && showNextFullServiceColumn && {
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
      className: 'equipment maintenance history remarks cell',
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
      key: 'Report',
      header: 'Report',
      actions: true,
      headerCenter: true,
      dataCenter: true,
      headerClassName: 'equipment maintenance history document column',
      className: 'equipment maintenance history document column',
      render: (item) => (
        <Button
          {...ACTION_BUTTON_PROPS}
          componentIconCenter="IconlyShow"
          componentIconSize={30}
          onClick={() => navigateToServiceDocument(formatDate(item.date), item.serviceType, item._id)}
          colorScheme="yellow-800"
          iconColor="info-400"
          padding='0'
        />
      ),
    },
    {
      key: 'delete',
      header: 'Delete',
      actions: true,
      headerCenter: true,
      dataCenter: true,
      headerClassName: 'equipment maintenance history document column',
      className: 'equipment maintenance history document column',
      render: (item) => (
        <Button
          {...ACTION_BUTTON_PROPS}
          componentIconCenter="IconlyDelete"
          componentIconSize={30}
          onClick={() => onDeleteReport(item)}
          colorScheme="yellow-700"
          iconColor="error-300"
          padding='0'
        />
      ),
    },
  ].filter(Boolean);
};