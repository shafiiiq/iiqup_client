import { useState, useEffect } from 'react';
import Button from '@/shared/components/widgets/button/Button';
import EquipmentTable, { EQUIPMENT_TABLE_COLUMN_COUNT } from './EquipmentTable';
import TableSkeleton from '@/shared/components/widgets/table/TableSkeleton';
import { useIdleEquipmentList } from '../../hooks/useIdleEquipmentList';
import { useIdleRosterSnapshots } from '../../hooks/useIdleRosterSnapshots';
import { BUTTON_PROPS } from '../../constants/equipment.constant';

function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return <span className="fleet equipment idle-roster-tab-time">{now.toLocaleString('en-GB')}</span>;
}

const toEquipmentLike = (entry) => ({
  ...entry,
  certificationBody: entry.operatorName ? [{ operatorName: entry.operatorName }] : [],
  site: entry.site ? [entry.site] : [],
});

const noop = () => { };

function IdleRoster({ actions }) {
  const live = useIdleEquipmentList();
  const snapshots = useIdleRosterSnapshots();
  const [isEditing, setIsEditing] = useState(false);

  const isViewingHistory = !!snapshots.selectedSnapshot;

  const handleSave = async () => {
    await snapshots.saveSnapshot(live.equipmentList);
    setIsEditing(false);
  };

  if (live.isLoading) {
    return (
      <div className="fleet equipment idle-roster">
        <TableSkeleton columns={EQUIPMENT_TABLE_COLUMN_COUNT} rows={6} />
        <TableSkeleton columns={EQUIPMENT_TABLE_COLUMN_COUNT} rows={4} />
      </div>
    );
  }
  if (live.error) return <div className="fleet equipment records error">{live.error}</div>;

  const idleEquipments = live.equipmentList.filter((eq) => eq.status === 'idle');
  const maintenanceEquipments = live.equipmentList.filter((eq) => eq.status === 'maintenance');

  const snapshotIdle = (snapshots.selectedSnapshot?.entries || []).filter((e) => e.status === 'idle').map(toEquipmentLike);
  const snapshotMaintenance = (snapshots.selectedSnapshot?.entries || []).filter((e) => e.status === 'maintenance').map(toEquipmentLike);

  return (
    <div className="fleet equipment idle-roster">
      <div className="fleet equipment idle-roster-tabs-row">
        <button
          className={`fleet equipment idle-roster-tab ${!isViewingHistory ? 'active' : ''}`}
          onClick={snapshots.viewLatest}
        >
          <span className="fleet equipment idle-roster-tab-label">Latest Idle List</span>
          <LiveClock />
        </button>

        {snapshots.history.map((item) => (
          <button
            key={item._id}
            className={`fleet equipment idle-roster-tab ${snapshots.selectedId === item._id ? 'active' : ''}`}
            onClick={() => snapshots.viewSnapshot(item._id)}
          >
            {new Date(item.savedAt).toLocaleString('en-GB')} · {item.entries.length} equipment
          </button>
        ))}

        {!isViewingHistory && (
          <div className="fleet equipment idle-roster-actions">
            <Button {...BUTTON_PROPS} width="140px" height="36px" text="Refresh" onClick={live.refetch} colorScheme="black-200" textColor="white-200" />
            {!isEditing ? (
              <Button {...BUTTON_PROPS} text="Update" componentIconLeft="IconlyEdit" componentIconSize="25" iconColor="white-200" onClick={() => setIsEditing(true)} colorScheme="primary-600" width="160px" height="36px" textColor="white-200" />
            ) : (
              <>
                <Button {...BUTTON_PROPS} text={snapshots.isSaving ? 'Saving...' : 'Save Update'} componentIconLeft="IconlyShow" componentIconSize="25" iconColor="white-200" onClick={handleSave} colorScheme="success-800" width="170px" height="36px" textColor="white-200" />
                <Button {...BUTTON_PROPS} text="Cancel" onClick={() => setIsEditing(false)} colorScheme="warning-700" width="120px" height="36px" textColor="white-200" />
              </>
            )}
          </div>
        )}
      </div>

      {snapshots.error && <div className="fleet equipment records error">{snapshots.error}</div>}

      {isViewingHistory ? (
        <>
          <div className="fleet equipment idle-roster-locked">
            <EquipmentTable
              title="Idle list"
              titlePosition="center"
              maxHeight="700px"
              items={snapshotIdle}
              onEdit={noop} onDelete={noop} onServiceHistory={noop} onViewDetails={noop}
              onMobilize={noop} onDemobilize={noop} onMarkAsSold={noop} onSetIdleLocation={noop} onOpenRemarks={noop}
            />
          </div>
          <div className="fleet equipment idle-roster-locked">
            <EquipmentTable
              title="Under Maintenance"
              titlePosition="center"
              maxHeight="500px"
              items={snapshotMaintenance}
              onEdit={noop} onDelete={noop} onServiceHistory={noop} onViewDetails={noop}
              onMobilize={noop} onDemobilize={noop} onMarkAsSold={noop} onSetIdleLocation={noop} onOpenRemarks={noop}
            />
          </div>
        </>
      ) : (
        <>
          <div className={isEditing ? '' : 'fleet equipment idle-roster-locked'}>
            <EquipmentTable
              title="Idle list"
              titlePosition="center"
              maxHeight="700px"
              items={idleEquipments}
              onEdit={actions.handleEdit}
              onDelete={actions.handleDeleteClick}
              onServiceHistory={actions.handleRowClick}
              onViewDetails={actions.handleViewDetails}
              onMobilize={actions.handleMobilizeClick}
              onDemobilize={actions.handleDemobilizeClick}
              onMarkAsSold={actions.handleMarkAsSoldClick}
              onSetIdleLocation={actions.handleSetIdleLocationClick}
              onOpenRemarks={actions.handleOpenRemarksModal}
            />
          </div>
          <div className={isEditing ? '' : 'fleet equipment idle-roster-locked'}>
            <EquipmentTable
              title="Under Maintenance"
              titlePosition="center"
              maxHeight="500px"
              items={maintenanceEquipments}
              onEdit={actions.handleEdit}
              onDelete={actions.handleDeleteClick}
              onServiceHistory={actions.handleRowClick}
              onViewDetails={actions.handleViewDetails}
              onMobilize={actions.handleMobilizeClick}
              onDemobilize={actions.handleDemobilizeClick}
              onMarkAsSold={actions.handleMarkAsSoldClick}
              onSetIdleLocation={actions.handleSetIdleLocationClick}
              onOpenRemarks={actions.handleOpenRemarksModal}
            />
          </div>
        </>
      )}
    </div>
  );
}

export default IdleRoster;