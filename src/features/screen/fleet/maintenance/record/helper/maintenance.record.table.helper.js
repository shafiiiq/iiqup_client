import Button from '@/shared/components/widgets/button/Button';
import { formatDate, getServiceTypeClass, getServiceTypeDisplay } from './maintenance.record.helper';

export const getRecordRowClassName = (item) => getServiceTypeClass(item.serviceType);

export const buildRecordTableColumns = ({ expandedRemarks, onToggleRemark, onRowClick, onDeleteReport }) => [
  {
    key: 'date',
    header: 'Date',
    render: (item) => formatDate(item.date),
  },
  {
    key: 'serviceType',
    header: 'Service Type',
    className: 'summary-service-type',
    render: (item) => getServiceTypeDisplay(item.serviceType),
  },
  {
    key: 'serviceHrs',
    header: 'Service Hours',
    render: (item) => item.serviceHrs || '-',
  },
  {
    key: 'nextServiceHrs',
    header: 'Next Service Hours',
    render: (item) => item.nextServiceHrs || '-',
  },
  {
    key: 'location',
    header: 'Location',
    render: (item) => item.location || '-',
  },
  {
    key: 'mechanics',
    header: 'Mechanics',
    render: (item) => item.mechanics || '-',
  },
  {
    key: 'operatorName',
    header: 'Operator Name',
    render: (item) => item.operatorName || '-',
  },
  {
    key: 'remarks',
    header: 'Remarks',
    className: 'remarks-cell',
    render: (item, index, groupKey) => {
      if (!item.remarks) return '-';

      const remarkKey = `${groupKey}-${index}`;
      const isExpanded = expandedRemarks[remarkKey];
      const isTruncatable = item.remarks.length > 100;

      return (
        <div className="remarks-content">
          <div className={isExpanded ? 'remarks-text expanded' : 'remarks-text'}>{item.remarks?.toUpperCase()}</div>
          {isTruncatable && (
            <button
              className="view-more-btn no-print"
              onClick={(event) => { event.stopPropagation(); onToggleRemark(remarkKey); }}
            >
              {isExpanded ? 'View Less' : 'View More'}
            </button>
          )}
        </div>
      );
    },
  },
  {
    key: 'document',
    header: 'Document',
    actions: true,
    headerCenter: true,
    dataCenter: true,
    className: 'no-print',
    headerClassName: 'no-print',
    render: (item) => (
        <Button
          componentIconCenter="IconlyShow"
          componentIconSize={30}
          colorScheme="yellow-700"
          iconColor="info-300"
          padding='0'
          onClick={() => onRowClick(formatDate(item.date), item.serviceType, item._id)}
          variant="gradient"
          font="sm"
          squircle="4xl"
          width="fit-content"
          height="32px"
          textColor="white-200"
          shadowPosition="to-bottom"
          shadowColor="white-600"
        />
    ),
  },
  {
    key: 'delete',
    header: 'Delete',
    actions: true,
    headerCenter: true,
    dataCenter: true,
    className: 'no-print',
    headerClassName: 'no-print',
    render: (item) => (
        <Button
          componentIconCenter="IconlyDelete"
          componentIconSize={30}
          colorScheme="yellow-700"
          iconColor="error-300"
          padding='0'
          onClick={() => onDeleteReport(item)}
          variant="gradient"
          font="sm"
          squircle="4xl"
          width="70px"
          height="32px"
          textColor="white-200"
          shadowPosition="to-bottom"
          shadowColor="white-600"
        />
    ),
  },
];