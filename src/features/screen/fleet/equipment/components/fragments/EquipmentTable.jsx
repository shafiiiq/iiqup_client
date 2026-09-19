import Table from '@/shared/components/widgets/table/Table';
import Button from '@/shared/components/widgets/button/Button';
import { getOperatorName } from '../../helper/equipment.helper';
import { BUTTON_PROPS } from '../../constants/equipment.constant';

const STATUS_STYLES = {
    active: { background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a' },
    idle: { background: 'rgba(245, 158, 11, 0.15)', color: '#d97706' },
    maintenance: { background: 'rgba(239, 68, 68, 0.15)', color: '#dc2626' },
    going: { background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' },
    loading: { background: 'rgba(148, 163, 184, 0.15)', color: '#64748b' },
    leased: { background: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' },
    sold: { background: 'rgba(107, 114, 128, 0.18)', color: '#4b5563' },
};

const TABLE_ICON_BTN = { ...BUTTON_PROPS, width: '36px', height: '36px' };
const TABLE_TEXT_BTN = { ...BUTTON_PROPS, width: '110px', height: '34px' };

const formatDate = (value) => (value ? new Date(value).toLocaleDateString('en-GB') : 'N/A');

const isIdle = (item) => item.status?.toLowerCase() === 'idle';

const buildColumns = ({
    onEdit,
    onDelete,
    onServiceHistory,
    onViewDetails,
    onMobilize,
    onDemobilize,
    onMarkAsSold,
    onSetIdleLocation,
    onOpenRemarks,
}) => [
        { key: 'machine', header: 'Machine', render: (item) => item.machine },
        { key: 'regNo', header: 'Reg No', render: (item) => item.regNo },
        { key: 'brand', header: 'Brand / Year', render: (item) => `${item.brand} • ${item.year}` },
        {
            key: 'operator',
            header: 'Operator',
            render: (item) => (isIdle(item) ? 'Unassigned' : getOperatorName(item.certificationBody)),
        },
        {
            key: 'site',
            header: 'Site',
            render: (item) => (isIdle(item) ? 'Unassigned' : item.site?.at(-1) || 'N/A'),
        },
        {
            key: 'lastMob',
            header: 'Last Mob',
            render: (item) => formatDate(item.mobDate),
        },
        {
            key: 'lastDemob',
            header: 'Last Demob',
            render: (item) => formatDate(item.demobDate),
        },
        {
            key: 'status',
            header: 'Status',
            progress: true,
            headerCenter: true,
            dataCenter: true,
            render: (item) => {
                const style = STATUS_STYLES[item.status?.toLowerCase()] || { background: 'rgba(148, 163, 184, 0.15)', color: '#64748b' };
                return { label: item.status, background: style.background, color: style.color };
            },
        },
        {
            key: 'idleAt',
            header: 'Idle At',
            render: (item) => {
                if (!isIdle(item)) return 'N/A';
                return item.idleAt === 'site' && item.idleSite ? item.idleSite : 'Garage';
            },
        },
        {
            key: 'actions',
            header: '',
            actions: true,
            headerCenter: true,
            dataCenter: true,
            render: (item) => {
                return (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {isIdle(item) && (
                            <Button {...TABLE_ICON_BTN} componentIconCenter="IconlyEdit" componentIconSize={20} onClick={(e) => onSetIdleLocation(e, item)} colorScheme="yellow-700" iconColor="warning-500" />
                        )}
                    </div>
                );
            },
        },
        {
            key: 'remarks',
            header: 'Remarks',
            render: (item) => item.remarks || 'N/A',
        },
        {
            key: 'actions',
            header: '',
            actions: true,
            headerCenter: true,
            dataCenter: true,
            render: (item) => {
                const isSold = item.status === 'sold';
                return (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {!isSold && (
                            <Button {...TABLE_ICON_BTN} componentIconCenter="IconlyEdit" componentIconSize={20} onClick={(e) => onOpenRemarks(e, item)} colorScheme="yellow-700" iconColor="info-400" />
                        )}
                    </div>
                );
            },
        },
        {
            key: 'mobilization',
            header: 'Mob / Demob',
            actions: true,
            headerCenter: true,
            dataCenter: true,
            render: (item) => {
                const isSold = item.status === 'sold';
                if (isSold) return null;
                return isIdle(item) ? (
                    <Button {...TABLE_TEXT_BTN} width="fit-content" componentIconCenter="ApartureIcon" iconColor='success-900' onClick={(e) => onMobilize(e, item)} colorScheme="success-200" textColor="white-200" />
                ) : (
                    <Button {...TABLE_TEXT_BTN} width='fit-content' componentIconCenter="DepartureIcon" iconColor='error-900' onClick={(e) => onDemobilize(e, item)} colorScheme="error-300" textColor="white-200" />
                );
            },
        },
        {
            key: 'actions',
            header: 'History',
            actions: true,
            headerCenter: true,
            dataCenter: true,
            render: (item) => {
                const isSold = item.status === 'sold';
                return (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Button {...TABLE_ICON_BTN} componentIconCenter="MaintenanceRecordIcon" componentIconSize={20} onClick={() => onServiceHistory(item.regNo)} colorScheme="primary-600" iconColor="white-200" />
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: 'More',
            actions: true,
            headerCenter: true,
            dataCenter: true,
            render: (item) => {
                const isSold = item.status === 'sold';
                return (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Button {...TABLE_ICON_BTN} componentIconCenter="IconlyShow" componentIconSize={20} onClick={() => onViewDetails(item)} colorScheme="primary-700" iconColor="white-200" />
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: 'Edit',
            actions: true,
            headerCenter: true,
            dataCenter: true,
            render: (item) => {
                return (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Button {...TABLE_ICON_BTN} componentIconCenter="IconlyEdit" componentIconSize={20} onClick={(e) => onEdit(e, item)} colorScheme="yellow-700" iconColor="warning-500" />
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: 'Delete',
            actions: true,
            headerCenter: true,
            dataCenter: true,
            render: (item) => {
                return (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        <Button {...TABLE_ICON_BTN} componentIconCenter="IconlyDelete" componentIconSize={20} onClick={(e) => onDelete(e, item)} colorScheme="yellow-400" iconColor="error-500" />
                    </div>
                );
            },
        },
        {
            key: 'actions',
            header: 'Sell',
            actions: true,
            headerCenter: true,
            dataCenter: true,
            render: (item) => {
                const isSold = item.status === 'sold';
                return (
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {!isSold && onMarkAsSold && (
                            <Button {...TABLE_ICON_BTN} componentIconCenter="SellIcon" componentIconSize={20} onClick={(e) => onMarkAsSold(e, item)} colorScheme="yellow-700" iconColor="error-600" />
                        )}
                    </div>
                );
            },
        },
    ];

function EquipmentTable({
    items,
    onEdit,
    onDelete,
    onServiceHistory,
    onViewDetails,
    onMobilize,
    onDemobilize,
    onMarkAsSold,
    onSetIdleLocation,
    onOpenRemarks,
    title,
    titlePosition,
    maxHeight,
    onScrollEnd,
}) {
    const columns = buildColumns({
        onEdit,
        onDelete,
        onServiceHistory,
        onViewDetails,
        onMobilize,
        onDemobilize,
        onMarkAsSold,
        onSetIdleLocation,
        onOpenRemarks,
    });

    return (
        <Table
            columns={columns}
            data={items}
            emptyMessage="No equipments found"
            rowKey={(item) => item.id || item.regNo}
            title={title}
            titlePosition={titlePosition}
            maxHeight={maxHeight}
            onScrollEnd={onScrollEnd}
        />
    );
}

export const EQUIPMENT_TABLE_COLUMN_COUNT = 13;

export default EquipmentTable;