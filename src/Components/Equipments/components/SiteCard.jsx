// ─────────────────────────────────────────────────────────────────────────────
// SiteCard.jsx — Card for the site-based tab.
// Renders one site group with all its equipment items inside.
// ─────────────────────────────────────────────────────────────────────────────

import Loader              from '../../../Common/Loader/Loader';
import Button              from '../../../Common/Button/Button';
import { getOperatorName } from '../utils/equipmentHelpers';

// Shared button defaults for all action buttons inside a site card.
const SITE_BTN = {
  variant:  'gradient',
  font:     'md',
  squircle: '4xl',
};

/**
 * @param {{
 *   site:             string,       — site name (the group key)
 *   equipments:       Array,        — equipment records assigned to this site
 *   activeImageIndex: object,       — { [regNo]: number }
 *   visibleCards:     Set<string>,  — regNos currently in viewport
 *   onImageClick:     (e, equipment, imageIndex) => void,
 *   onSetImageIndex:  (regNo, index) => void,
 *   onEdit:           (e, equipment) => void,
 *   onDelete:         (e, equipment) => void,
 *   onServiceHistory: (regNo) => void,
 *   onViewDetails:    (equipment) => void,
 *   onReplaceEquipment: (e, equipment) => void,
 * }} props
 */
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
    <div
      className="site-card"
      // CSS grid-row span scales the card height to the number of equipment items
      style={{ gridRow: `span ${Math.ceil(equipments.length / 2)}` }}
    >
      {/* Site Header */}
      <div className="site-card-header">
        <h2 className="site-name">{site}</h2>
        <span className="equipment-count">
          {equipments.length} Equipment{equipments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Equipment Items Grid */}
      <div className="site-equipments-grid">
        {equipments.map((item) => {
          const currentImageIndex = activeImageIndex[item.regNo] || 0;
          const hasImages         = item.equipmentImage?.length > 0;
          const isVisible         = visibleCards.has(item.regNo);

          return (
            <div
              className="site-equipment-item"
              key={item.id}
              data-reg-no={item.regNo}
            >
              {/* Image Slider */}
              <div className="site-card-image-slider">
                {hasImages && isVisible ? (
                  <>
                    <div className="slider-images">
                      {item.equipmentImage.map((img, index) => (
                        <img
                          key={index}
                          src={img.s3Url || img.url}
                          alt={img.label || `${item.machine} ${index + 1}`}
                          className={`slider-image ${index === currentImageIndex ? 'active' : ''}`}
                          loading="lazy"
                          onClick={(e) => onImageClick(e, item, index)}
                        />
                      ))}
                    </div>

                    {item.equipmentImage.length > 1 && (
                      <div className="slider-dots">
                        {item.equipmentImage.map((_, index) => (
                          <div
                            key={index}
                            className={`slider-dot ${index === currentImageIndex ? 'active' : ''}`}
                            onClick={() => onSetImageIndex(item.regNo, index)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                ) : hasImages && !isVisible ? (
                  <Loader />
                ) : (
                  <div className="no-image-placeholder">No images</div>
                )}
              </div>

              {/* Item Content */}
              <div className="site-card-content">
                <div className="site-card-header-mini">
                  <div className="equipment-name-and-reg">
                    <h3 className="site-card-title">{item.machine}</h3>
                    <div className="site-card-subtitle">{item.regNo}</div>
                  </div>
                  <span className={`status-badge ${item.status?.toLowerCase()}`}>
                    {item.status}
                  </span>
                </div>

                <div className="site-card-details">
                  <div className="detail-item">
                    <span className="detail-label">Brand</span>
                    <span className="detail-value">{item.brand} • {item.year}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Operator</span>
                    <span className="detail-value">{getOperatorName(item.certificationBody)}</span>
                  </div>
                </div>

                <div className="site-card-actions">
                  <Button {...SITE_BTN} iconCenter="edit_square" onClick={(e) => onEdit(e, item)}          colorScheme="blue-800"    width="40px"      height="40px" textColor="white-200" />
                  <Button {...SITE_BTN} iconCenter="backspace"   onClick={(e) => onDelete(e, item)}        colorScheme="red-600"     width="40px"      height="40px" textColor="white-200" />
                  <Button {...SITE_BTN} font="sm" text="History" onClick={() => onServiceHistory(item.regNo)} colorScheme="lime-800" width="90px"      height="36px" textColor="white-200" />
                  <Button {...SITE_BTN} font="sm" text="View"    onClick={() => onViewDetails(item)}       colorScheme="warning-800" width="90px"      height="36px" textColor="white-200" />
                  <Button {...SITE_BTN} font="sm" text="Replace Equipment" onClick={(e) => onReplaceEquipment(e, item)} colorScheme="lime-400" width="fit-content" height="36px" textColor="black-200" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default SiteCard;