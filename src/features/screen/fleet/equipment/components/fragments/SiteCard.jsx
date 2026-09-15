import Loader from '@/shared/components/widgets/loader/spinner/Spinner';
import Button from '@/shared/components/widgets/button/Button';
import Card from '@/shared/components/widgets/card/Card';
import MediaCard from '@/shared/components/widgets/card/MediaCard';
import { SITE_CARD_LOOK, SITE_ITEM_CARD_LOOK } from '../../constants/equipment.card.look.constant';
import { getOperatorName } from '../../helper/equipment.helper';

const SITE_BTN = {
  variant: 'gradient',
  font: 'md',
  squircle: '4xl',
};

function SiteCard({
  site,
  equipments,
  activeImageIndex,
  visibleCards,
  onImageClick,
  onSetImageIndex,
  onEdit,
  onDelete,
  onServiceHistory,
  onViewDetails,
  onReplaceEquipment,
}) {
  return (
    <Card vars={SITE_CARD_LOOK} outerStyle={{ gridRow: `span ${Math.ceil(equipments.length / 2)}` }}>
      <div className="fleet equipment site-card-header">
        <h2 className="fleet equipment site-name">{site}</h2>
        <span className="fleet equipment equipment-count">
          {equipments.length} Equipment{equipments.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="fleet equipment site-equipments-grid">
        {equipments.map((item) => {
          const currentImageIndex = activeImageIndex[item.regNo] || 0;
          const hasImages = item.equipmentImage?.length > 0;
          const isVisible = visibleCards.has(item.regNo);

          return (
            <MediaCard
              key={item.id}
              vars={SITE_ITEM_CARD_LOOK}
              mediaGap="16px"
              data-reg-no={item.regNo}
              media={
                <div className="fleet equipment site-card-image-slider">
                  {hasImages && isVisible ? (
                    <>
                      <div className="fleet equipment slider-images">
                        {item.equipmentImage.map((img, index) => (
                          <img
                            key={index}
                            src={img.s3Url || img.url}
                            alt={img.label || `${item.machine} ${index + 1}`}
                            className={`fleet equipment slider-image ${index === currentImageIndex ? 'active' : ''}`}
                            loading="lazy"
                            onClick={(e) => onImageClick(e, item, index)}
                          />
                        ))}
                      </div>

                      {item.equipmentImage.length > 1 && (
                        <div className="fleet equipment slider-dots">
                          {item.equipmentImage.map((_, index) => (
                            <div
                              key={index}
                              className={`fleet equipment slider-dot ${index === currentImageIndex ? 'active' : ''}`}
                              onClick={() => onSetImageIndex(item.regNo, index)}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  ) : hasImages && !isVisible ? (
                    <Loader />
                  ) : (
                    <div className="fleet equipment no-image-placeholder">No images</div>
                  )}
                </div>
              }
            >
              <div className="fleet equipment site-card-content">
                <div className="fleet equipment site-card-header-mini">
                  <div className="fleet equipment name-and-reg">
                    <h3 className="fleet equipment site-card-title">{item.machine}</h3>
                    <div className="fleet equipment site-card-subtitle">{item.regNo}</div>
                  </div>
                  <span className={`fleet equipment status-badge ${item.status?.toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>

                <div className="fleet equipment site-card-details">
                  <div className="fleet equipment detail-item">
                    <span className="fleet equipment detail-label">Brand</span>
                    <span className="fleet equipment detail-value">{item.brand} • {item.year}</span>
                  </div>
                  <div className="fleet equipment detail-item">
                    <span className="fleet equipment detail-label">Operator</span>
                    <span className="fleet equipment detail-value">{getOperatorName(item.certificationBody)}</span>
                  </div>
                </div>

                <div className="fleet equipment site-card-actions">
                  <Button {...SITE_BTN} componentIconCenter="IconlyEdit" componentIconSize={30} onClick={(e) => onEdit(e, item)} colorScheme="yellow-800" width="40px" height="40px" iconColor="warning-500" />
                  <Button {...SITE_BTN} componentIconCenter="IconlyDelete" componentIconSize={30} onClick={(e) => onDelete(e, item)} colorScheme="yellow-600" width="40px" height="40px" iconColor="error-500" />
                  <Button {...SITE_BTN} font="sm" componentIconLeft='MaintenanceRecordIcon' componentIconSize='22' iconColor='white-200' text="History" onClick={() => onServiceHistory(item.regNo)} colorScheme="primary-600" width="110px" height="36px" textColor="white-200" />
                  <Button {...SITE_BTN} font="sm" text="View" componentIconLeft='IconlyShow' componentIconSize='25' iconColor='white-200' onClick={() => onViewDetails(item)} colorScheme="primary-600" width="90px" height="36px" textColor="white-200" />
                  <Button {...SITE_BTN} font="sm" text="Replace Equipment" componentIconLeft='IconlySwap' componentIconSize='25' iconColor='white-100' onClick={(e) => onReplaceEquipment(e, item)} colorScheme="primary-600" width="fit-content" height="36px" textColor="white-200" />
                </div>
              </div>
            </MediaCard>
          );
        })}
      </div>
    </Card>
  );
}

export default SiteCard;