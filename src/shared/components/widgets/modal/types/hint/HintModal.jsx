import React from 'react';
import ModalBase from '../../ModalBase';
import { DEFAULT_MODAL_MODE } from '../../modalModes';
import './HintModal.css';

const HintModal = ({
  isOpen,
  onClose,
  mode = DEFAULT_MODAL_MODE,
  title,
  message,
  filterGroups = [],
  buttonText,
  onButtonClick,
  modalWidth,
  modalHeight,
}) => (
  <ModalBase
    isOpen={isOpen}
    onClose={onClose}
    mode={mode}
    type="hint"
    title={title}
    showMessage={false}
    buttonText={buttonText}
    onButtonClick={onButtonClick}
    modalWidth={modalWidth}
    modalHeight={modalHeight}
  >
    <div className="shared widget modal hint-section">
      {message && <p className="shared widget modal message hint-message">{message}</p>}
      {filterGroups.map((group, index) => (
        <div key={index} className="shared widget modal hint-group">
          {group.label && <div className="shared widget modal hint-group-label">{group.label}</div>}
          <div className="shared widget modal hint-grid">
            {group.items.map((item, itemIndex) => (
              <div key={itemIndex} className="shared widget modal hint-item">
                <div className="shared widget modal hint-swatch" style={{ background: item.color }} />
                <span className="shared widget modal hint-text">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </ModalBase>
);

export default HintModal;
