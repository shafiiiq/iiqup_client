import { findEquipmentWithImages } from '../../helper/equipment.helper';

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

  const handleClose = () => {
    const overlay = document.querySelector('.fleet.equipment.fullscreen-overlay');
    if (overlay) {
      overlay.classList.add('closing');
      setTimeout(onClose, 400);
    }
  };

  const navigate = (direction) => {
    let newIndex = imageIndex + direction;
    let newEquipment = equipment;

    const currentEquipmentIndex = filteredData.findIndex(eq => eq.regNo === equipment.regNo);

    if (newIndex >= equipment.equipmentImage.length) {
      const found = findEquipmentWithImages(filteredData, currentEquipmentIndex + 1, 1);
      if (!found) return;
      newEquipment = found;
      newIndex = 0;
      onSetEquipment(found);
    } else if (newIndex < 0) {
      const found = findEquipmentWithImages(filteredData, currentEquipmentIndex - 1, -1);
      if (!found) return;
      newEquipment = found;
      newIndex = found.equipmentImage.length - 1;
      onSetEquipment(found);
    }

    onSetImageIndex(newIndex);
    onSetImage(newEquipment.equipmentImage[newIndex]);
  };

  return (
    <div
      className="fleet equipment fullscreen-overlay"
      onClick={handleClose}
      style={{ '--click-x': `${clickPosition.x}px`, '--click-y': `${clickPosition.y}px` }}
    >
      <div className="fleet equipment fullscreen-header">
        <h2>{equipment.machine} - {equipment.regNo}</h2>
        <span className="fleet equipment image-counter">
          {imageIndex + 1} / {equipment.equipmentImage.length}
        </span>
      </div>

      <div className="fleet equipment fullscreen-content" onClick={(e) => e.stopPropagation()}>
        <button className="fleet equipment fullscreen-close" onClick={handleClose}>
          <span className="material-symbols-rounded">close</span>
        </button>

        <div className="fleet equipment fullscreen-image-container">
          <img src={image.s3Url || image.url} alt={image.label || equipment.machine} />
        </div>

        <button className="fleet equipment fullscreen-nav prev" onClick={() => navigate(-1)}>
          <span className="material-symbols-rounded">chevron_left</span>
        </button>

        <button className="fleet equipment fullscreen-nav next" onClick={() => navigate(1)}>
          <span className="material-symbols-rounded">chevron_right</span>
        </button>
      </div>
    </div>
  );
}

export default FullscreenViewer;