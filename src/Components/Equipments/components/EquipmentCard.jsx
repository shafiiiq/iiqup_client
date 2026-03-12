// ─────────────────────────────────────────────────────────────────────────────
// EquipmentCard.jsx — Single card for the equipment-based / hired tab grid.
// Renders image slider, metadata, and action buttons.
// Receives all handlers as props — owns no state and makes no API calls.
// ─────────────────────────────────────────────────────────────────────────────

import Loader          from '../../../Common/Loader/Loader';
import Button          from '../../../Common/Button/Button';
import { getOperatorName } from '../utils/equipmentHelpers';

// Shared button defaults for every action button in the card footer.
const CARD_BTN = {
  variant:        'gradient',
  font:           'md',
  animation:      '',
  squircle:       '4xl',
  shadowPosition: 'to-bottom',
  shadowColor:    'white-600',
};

/**
 * @param {{
 *   item:                    object,   — equipment record
 *   activeTab:               string,
 *   isSelectMode:            boolean,
 *   isSelected:              boolean,
 *   currentImageIndex:       number,
 *   isVisible:               boolean,  — true when card is in viewport (IntersectionObserver)
 *   onSelect:                (regNo: string) => void,
 *   onImageClick:            (e, equipment, imageIndex) => void,
 *   onSetImageIndex:         (regNo, index) => void,
 *   onEdit:                  (e, equipment) => void,
 *   onDelete:                (e, equipment) => void,
 *   onServiceHistory:        (regNo: string) => void,
 *   onViewDetails:           (equipment) => void,
 *   onMobilize:              (e, equipment) => void,
 *   onDemobilize:            (e, equipment) => void,
 * }} props
 */
function EquipmentCard({
  item,
  activeTab,
  isSelectMode,
  isSelected,
  currentImageIndex,
  isVisible,
  onSelect,
  onImageClick,
  onSetImageIndex,
  onEdit,
  onDelete,
  onServiceHistory,
  onViewDetails,
  onMobilize,
  onDemobilize,
}) {
  const hasImages = item.equipmentImage?.length > 0;

  // ── Image Slider ───────────────────────────────────────────────────────────
  const renderImageSlider = () => {
    if (hasImages && isVisible) {
      return (
        <>
          <div className="slider-images">
            {item.equipmentImage.map((img, index) => (
              <img
                key={index}
                src={img.s3Url || img.url}
                alt={img.label || `${item.machine} ${index + 1}`}
                className={`slider-image ${index === currentImageIndex ? 'active' : ''}`}
                loading="lazy"
                onClick={(e) => !isSelectMode && onImageClick(e, item, index)}
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
      );
    }

    if (hasImages && !isVisible) {
      // Card is off-screen — show loader placeholder until IntersectionObserver fires
      return <div className="no-image-placeholder"><Loader /></div>;
    }

    return <div className="no-image-placeholder">Upload images to view</div>;
  };

  // ── Card Actions (shown only when not in multi-select mode) ────────────────
  const renderActions = () => {
    if (isSelectMode) return null;

    return (
      <>
        <div className="card-actions">
          <Button {...CARD_BTN} iconCenter="edit_square" onClick={(e) => onEdit(e, item)}   colorScheme="blue-800" width="45px" height="45px" type="submit" textColor="white-200" />
          <Button {...CARD_BTN} iconCenter="backspace"   onClick={(e) => onDelete(e, item)} colorScheme="red-600"  width="45px" height="45px" type="submit" textColor="white-200" />
        </div>
        <Button {...CARD_BTN} text="Service History" onClick={() => onServiceHistory(item.regNo)} colorScheme="lime-800"    width="160px" height="38px" type="submit" textColor="white-200" />
        <Button {...CARD_BTN} text="View More"       onClick={() => onViewDetails(item)}          colorScheme="warning-800" width="160px" height="38px" type="submit" textColor="white-200" />
        {item.status === 'idle'
          ? <Button {...CARD_BTN} text="Mobilize" onClick={(e) => onMobilize(e, item)} colorScheme="lime-400" width="225px" height="38px" textColor="black-200" />
          : item.mobDate
            ? <div className="detail-item-equipment mob-data"><span className="detail-label">Last Mob :</span><span className="detail-value">{new Date(item.mobDate).toLocaleDateString('en-GB')}</span></div>
            : null
        }
        {item.status !== 'idle'
          ? <Button {...CARD_BTN} text="Demobilize" onClick={(e) => onDemobilize(e, item)} colorScheme="fuchsia-500" width="225px" height="38px" textColor="black-200" />
          : item.demobDate
            ? <div className="detail-item-equipment demob-data"><span className="detail-label">Last Demob :</span><span className="detail-value">{new Date(item.demobDate).toLocaleDateString('en-GB')}</span></div>
            : null
        }
      </>
    );
  };

  return (
    <div
      className={[
        'equipment-card',
        isSelectMode && isSelected ? 'selected' : '',
        item.hired ? 'equipment-card-hired' : '',
      ].filter(Boolean).join(' ')}
      key={item.id}
      data-reg-no={item.regNo}
      onClick={() => isSelectMode && onSelect(item.regNo)}
      style={{ cursor: isSelectMode ? 'pointer' : 'default' }}
    >
      {/* Image Slider */}
      <div className="card-image-slider">
        {renderImageSlider()}
      </div>

      {/* Card Content */}
      <div className="card-content">
        <div className="card-header">
          <div className="main-details">
            <div className="equipment-name-and-reg">
              <h3 className="card-title">{item.machine} - </h3>
              <div className="card-subtitle">{item.regNo}</div>
            </div>
            <div className="card-brand">{item.brand} • {item.year}</div>
          </div>
          <span className={`status-badge ${item.status?.toLowerCase()}`}>
            {item.status}
          </span>
        </div>

        {/* Hired-from label — only shown on the hired tab */}
        {activeTab === 'hired' && (
          <div className="main-details">
            <h4 className="card-title-hired">{item.hiredFrom}</h4>
          </div>
        )}

        <div className="card-details-grid">
          <div className="detail-item-equipment">
            <span className="detail-label">Operator</span>
            <span className="detail-value">{getOperatorName(item.certificationBody)}</span>
          </div>
          <div className="detail-item-equipment">
            <span className="detail-label">Site</span>
            <span className="detail-value">{item.site?.at(-1) || 'N/A'}</span>
          </div>
          {item.location?.length > 0 && (
            <div className="detail-item-equipment">
              <span className="detail-label">Location</span>
              <span className="detail-value">{item.location}</span>
            </div>
          )}
          {item.rentRate?.basis && (
            <>
              <div className="detail-item-equipment">
                <span className="detail-label">Rent Basis</span>
                <span className="detail-value">{item.rentRate.basis || 'N/A'}</span>
              </div>
              <div className="detail-item-equipment">
                <span className="detail-label">Rent Rate</span>
                <span className="detail-value">
                  {item.rentRate.rate
                    ? `${item.rentRate.currency || 'QAR'} ${item.rentRate.rate}`
                    : 'N/A'}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="card-footer">
          {renderActions()}
        </div>
      </div>
    </div>
  );
}

export default EquipmentCard;