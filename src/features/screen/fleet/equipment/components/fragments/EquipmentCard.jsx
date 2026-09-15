import { useState, useEffect } from 'react';
import Button from '@/shared/components/widgets/button/Button';
import MediaCard from '@/shared/components/widgets/card/MediaCard';
import { EQUIPMENT_CARD_LOOK } from '../../constants/equipment.card.look.constant';
import { BUTTON_PROPS, EQUIPMENT_IMAGE_SLIDESHOW_INTERVAL_MS } from '../../constants/equipment.constant';

function MobDateHover({ item, onAddShift }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="fleet equipment mob-date-hover-wrap"
      style={{ width: '225px', height: '38px', display: 'flex', alignItems: 'center' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {!hovered ? (
        <div className="fleet equipment detail-item mob-data" style={{ margin: 0, width: '100%' }}>
          <span className="fleet equipment detail-label">Last Mob :</span>
          <span className="fleet equipment detail-value" style={{ marginLeft: '8px' }}>
            {item.mobDate ? new Date(item.mobDate).toLocaleDateString('en-GB') : 'N/A'}
          </span>
        </div>
      ) : (
        <Button
          {...BUTTON_PROPS}
          text="+ Add Shift"
          onClick={(e) => onAddShift(e, item)}
          colorScheme="lime-600"
          width="225px"
          height="38px"
          textColor="white-200"
        />
      )}
    </div>
  );
}

function EquipmentCard({
  item,
  activeTab,
  isSelectMode,
  isSelected,
  onSelect,
  onImageClick,
  onEdit,
  onDelete,
  onServiceHistory,
  onViewDetails,
  onMobilize,
  onDemobilize,
  onAddShift,
  onReplaceEquipment,
  onMarkAsSold,
  onSetIdleLocation,
  onOpenRemarks,
  draggable = false,
  onDragStart,
  onDragEnd,
}) {
  const isSold = item.status === 'sold';
  const hasImages = item.equipmentImage?.length > 0;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!item.equipmentImage || item.equipmentImage.length <= 1) return undefined;
    const timer = setInterval(() => {
      setCurrentImageIndex(prev => (prev + 1) % item.equipmentImage.length);
    }, EQUIPMENT_IMAGE_SLIDESHOW_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [item.equipmentImage]);

  const renderImageSlider = () => {
    if (!hasImages) {
      return <div className="fleet equipment no-image-placeholder">
        <span className="material-symbols-rounded">landscape_2</span>
      </div>;
    }

    return (
      <>
        <div className="fleet equipment slider-images">
          {item.equipmentImage?.map((img, index) => {
            const imageUrl = img?.s3Url?.trim() || img?.url?.trim();

            return imageUrl ? (
              <img
                key={index}
                src={imageUrl}
                className={`fleet equipment slider-image ${index === currentImageIndex ? 'active' : ''
                  }`}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                onClick={(e) =>
                  !isSelectMode && onImageClick(e, item, index)
                }
              />
            ) : (
              // image crash icon needed here 
              <div key={index} className="fleet equipment no-image-placeholder">
                <span className="material-symbols-rounded">landscape_2_off</span>
              </div>
            );
          })}
        </div>

        {item.equipmentImage.length > 1 && (
          <div className="fleet equipment slider-dots">
            {item.equipmentImage.map((_, index) => (
              <div
                key={index}
                className={`fleet equipment slider-dot ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        )}
      </>
    );
  };

  const renderActions = () => {
    if (isSelectMode) return null;

    return (
      <>
        <div className="fleet equipment card-actions">
          <Button {...BUTTON_PROPS} componentIconCenter="IconlyEdit" componentIconSize={30} onClick={(e) => onEdit(e, item)} colorScheme="yellow-700" width="45px" height="45px" iconColor="warning-500" type="submit" />
          <Button {...BUTTON_PROPS} componentIconCenter="IconlyDelete" componentIconSize={30} onClick={(e) => onDelete(e, item)} colorScheme="yellow-400" width="45px" height="45px" iconColor="error-500" type="submit" />
        </div>
        <Button {...BUTTON_PROPS} componentIconLeft='MaintenanceRecordIcon' componentIconSize='25' iconColor='white-200' text="Service History" onClick={() => onServiceHistory(item.regNo)} colorScheme="primary-600" width="160px" height="38px" textColor="white-200" type="submit" />
        <Button {...BUTTON_PROPS} componentIconLeft='IconlyShow' componentIconSize='25' iconColor='white-200' text="View More" onClick={() => onViewDetails(item)} colorScheme="primary-700" width="160px" height="38px" textColor="white-200" type="submit" />

        {!isSold && item.status === 'idle' && (
          <div className="fleet equipment detail-item idle-location-data">
            <span className="fleet equipment detail-label">Idle At :</span>
            <span className="fleet equipment detail-value">
              {item.idleAt === 'site' && item.idleSite ? item.idleSite : 'Garage'}
            </span>
            <Button {...BUTTON_PROPS} componentIconCenter="IconlyEdit" componentIconSize={18} onClick={(e) => onSetIdleLocation(e, item)} colorScheme="yellow-700" width="32px" height="32px" iconColor="warning-500" />
          </div>
        )}

        {!isSold && (
          item.status === 'idle'
            ? <Button {...BUTTON_PROPS} text="Mobilize" componentIconLeft='ApartureIcon' componentIconSize='25' iconColor='white-200' onClick={(e) => onMobilize(e, item)} colorScheme="primary-600" width="225px" height="38px" textColor="white-200" />
            : <MobDateHover item={item} onAddShift={onAddShift} />
        )}

        {!isSold && (
          item.status !== 'idle'
            ? <Button {...BUTTON_PROPS} text="Demobilize" componentIconLeft='DepartureIcon' componentIconSize='25' iconColor='white-200' onClick={(e) => onDemobilize(e, item)} colorScheme="primary-600" width="225px" height="38px" textColor="white-200" />
            : (
              <div className="fleet equipment detail-item demob-data">
                <span className="fleet equipment detail-label">Last Demob :</span>
                <span className="fleet equipment detail-value">{item.demobDate ? new Date(item.demobDate).toLocaleDateString('en-GB') : 'N/A'}</span>
              </div>
            )
        )}

        {!isSold && onReplaceEquipment && (
          <Button {...BUTTON_PROPS} text="Replace Equipment" componentIconLeft='IconlySwap' componentIconSize='25' iconColor='white-200' onClick={(e) => onReplaceEquipment(e, item)} colorScheme="primary-800" width="225px" height="38px" textColor="white-200" />
        )}

        {!isSold && onMarkAsSold && (
          <Button {...BUTTON_PROPS} text='Mark as Sold' componentIconLeft='SellIcon' componentIconSize='30' onClick={(e) => onMarkAsSold(e, item)} colorScheme="yellow-700" width="fit-content" height="38px" iconColor="error-600" textColor='error-300' />
        )}
      </>
    );
  };

  return (
    <MediaCard
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      vars={{ ...EQUIPMENT_CARD_LOOK, '--card-min-height': item.hired ? '362px' : '320px' }}
      selected={isSelectMode && isSelected}
      onClick={() => isSelectMode && onSelect(item.regNo)}
      outerStyle={{ cursor: isSelectMode ? 'pointer' : 'default' }}
      data-reg-no={item.regNo}
      media={<div className="fleet equipment card-image-slider">{renderImageSlider()}</div>}
    >
      <div className="fleet equipment card-content">
        <div className="fleet equipment card-header">
          <div className="fleet equipment main-details">
            <div className="fleet equipment name-and-reg">
              <h3 className="fleet equipment card-title">{item.machine} - </h3>
              <div className="fleet equipment card-subtitle">{item.regNo}</div>
            </div>
            <div className="fleet equipment card-brand">{item.brand} • {item.year}</div>
          </div>
          <span className={`fleet equipment status-badge ${item.status?.toLowerCase()}`}>
            {item.status}
          </span>
        </div>

        {activeTab === 'hired' && (
          <div className="fleet equipment main-details">
            <h4 className="fleet equipment card-title hired">{item.hiredFrom}</h4>
          </div>
        )}

        <div className="fleet equipment card-details-grid">
          <div className="fleet equipment detail-item">
            <span className="fleet equipment detail-label">Operator{item.certificationBody?.length > 1 ? 's' : ''}</span>
            <span className="fleet equipment detail-value">
              {item.certificationBody?.length > 0
                ? item.certificationBody.map((cb, i) => (
                  <span key={i} style={{ display: 'block', fontSize: '18px' }}>
                    {cb.operatorName}
                    {cb.shiftName ? ` (${cb.shiftName})` : cb.shiftStart && cb.shiftEnd ? ` (${cb.shiftStart}–${cb.shiftEnd})` : ''}
                  </span>
                ))
                : 'N/A'
              }
            </span>
          </div>
          <div className="fleet equipment detail-item">
            <span className="fleet equipment detail-label">Site</span>
            <span className="fleet equipment detail-value">{item.site?.at(-1) || 'N/A'}</span>
          </div>
          {item.location?.length > 0 && (
            <div className="fleet equipment detail-item">
              <span className="fleet equipment detail-label">Location</span>
              <span className="fleet equipment detail-value">{item.location}</span>
            </div>
          )}
          {item.rentRate?.basis && (
            <>
              <div className="fleet equipment detail-item">
                <span className="fleet equipment detail-label">Rent Basis</span>
                <span className="fleet equipment detail-value">{item.rentRate.basis || 'N/A'}</span>
              </div>
              <div className="fleet equipment detail-item">
                <span className="fleet equipment detail-label">Rent Rate</span>
                <span className="fleet equipment detail-value">
                  {item.rentRate.rate ? `${item.rentRate.currency || 'QAR'} ${item.rentRate.rate}` : 'N/A'}
                </span>
              </div>
            </>
          )}
        </div>

        {item.status !== 'active' && onOpenRemarks && (
          <div className="fleet equipment remarks-block">
            <div className="fleet equipment remarks-header">
              <span className="fleet equipment detail-label">Remarks</span>
              <Button
                {...BUTTON_PROPS}
                text={item.remarks ? 'Edit Remarks' : 'Add Remarks'}
                componentIconLeft='IconlyEdit'
                componentIconSize='20'
                iconColor='white-200'
                onClick={(e) => onOpenRemarks(e, item)}
                colorScheme="info-700"
                width="160px"
                height="32px"
                textColor="white-200"
              />
            </div>
            {item.remarks && <p className="fleet equipment remarks-text">{item.remarks}</p>}
          </div>
        )}

        <div className="fleet equipment card-footer">
          {renderActions()}
        </div>
      </div>
    </MediaCard>
  );
}

export default EquipmentCard;