// ─────────────────────────────────────────────────────────────────────────────
// FullscreenViewer.jsx — Overlay image viewer with cross-equipment navigation.
// Opens when a user clicks an image on any card.
// Animates in from the click origin via CSS custom properties.
// ─────────────────────────────────────────────────────────────────────────────

import { findEquipmentWithImages } from '../utils/equipmentHelpers';

/**
 * @param {{
 *   image:             object | null,   — current image object { s3Url, url, label }
 *   imageIndex:        number,
 *   equipment:         object | null,   — equipment the image belongs to
 *   clickPosition:     { x: number, y: number },
 *   filteredData:      Array,           — full list for cross-equipment navigation
 *   onClose:           () => void,
 *   onSetImage:        (image) => void,
 *   onSetImageIndex:   (index) => void,
 *   onSetEquipment:    (equipment) => void,
 * }} props
 */
function FullscreenViewer({
  image,
  imageIndex,
  equipment,
  clickPosition,
  filteredData,
  onClose,
  onSetImage,
  onSetImageIndex,
  onSetEquipment,
}) {
  if (!image || !equipment) return null;

  // ── Close with animation ───────────────────────────────────────────────────

  const handleClose = () => {
    const overlay = document.querySelector('.fullscreen-overlay');
    if (overlay) {
      overlay.classList.add('closing');
      // Wait for the CSS closing animation before clearing state
      setTimeout(onClose, 400);
    }
  };

  // ── Navigate between images (and across equipment boundaries) ─────────────

  const navigate = (direction) => {
    let newIndex     = imageIndex + direction;
    let newEquipment = equipment;

    const currentEquipmentIndex = filteredData.findIndex(eq => eq.regNo === equipment.regNo);

    if (newIndex >= equipment.equipmentImage.length) {
      // Past the last image of this equipment — jump to the next equipment with images
      const found = findEquipmentWithImages(filteredData, currentEquipmentIndex + 1, 1);
      if (!found) return;
      newEquipment = found;
      newIndex     = 0;
      onSetEquipment(found);
    } else if (newIndex < 0) {
      // Before the first image — jump to the previous equipment with images
      const found = findEquipmentWithImages(filteredData, currentEquipmentIndex - 1, -1);
      if (!found) return;
      newEquipment = found;
      newIndex     = found.equipmentImage.length - 1;
      onSetEquipment(found);
    }

    onSetImageIndex(newIndex);
    onSetImage(newEquipment.equipmentImage[newIndex]);
  };

  return (
    <div
      className="fullscreen-overlay"
      onClick={handleClose}
      style={{
        '--click-x': `${clickPosition.x}px`,
        '--click-y': `${clickPosition.y}px`,
      }}
    >
      <div className="fullscreen-header">
        <h2>{equipment.machine} - {equipment.regNo}</h2>
        <span className="image-counter">
          {imageIndex + 1} / {equipment.equipmentImage.length}
        </span>
      </div>

      <div className="fullscreen-content" onClick={(e) => e.stopPropagation()}>
        <button className="fullscreen-close" onClick={handleClose}>
          <span className="material-symbols-rounded">close</span>
        </button>

        <div className="fullscreen-image-container">
          <img
            src={image.s3Url || image.url}
            alt={image.label || equipment.machine}
          />
        </div>

        <button className="fullscreen-nav prev" onClick={() => navigate(-1)}>
          <span className="material-symbols-rounded">chevron_left</span>
        </button>

        <button className="fullscreen-nav next" onClick={() => navigate(1)}>
          <span className="material-symbols-rounded">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

export default FullscreenViewer;