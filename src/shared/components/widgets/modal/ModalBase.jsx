import React from 'react';
import './ModalBase.css';
import { useModalController } from './useModalController';
import { getModalPalette } from './modalPalette';
import { renderModalIcon, renderCloseIcon } from './icons';
import { DEFAULT_MODAL_MODE } from './modalModes';
import DeviceInfoPanel from './fragments/DeviceInfoPanel';

const ModalBase = ({
  isOpen = false,
  onClose = () => {},
  mode = DEFAULT_MODAL_MODE,
  type = 'success',
  title = '',
  message = '',
  showMessage = true,
  closable = true,
  autoClose = false,
  autoCloseDelay = 4000,
  modalWidth = null,
  modalHeight = null,
  buttonText = null,
  onButtonClick = null,
  buttonDisabled = false,
  secondaryButtonText = null,
  onSecondaryClick = null,
  renderExtraFooterAction = null,
  submitOnEnter = false,
  onSubmit = null,
  deviceInfo = null,
  children,
  contentClassName = '',
}) => {
  const { visible, modalRef, requestClose } = useModalController({
    isOpen,
    onClose,
    autoClose,
    autoCloseDelay,
    closable,
    submitOnEnter,
    onSubmit,
  });

  const palette = getModalPalette(type);

  if (!isOpen) return null;

  const handleOverlayClick = () => {
    if (closable) requestClose();
  };

  const handlePrimaryClick = () => {
    if (onSubmit) onSubmit();
    else if (onButtonClick) onButtonClick();
  };

  const handleSecondaryClick = () => {
    if (onSecondaryClick) onSecondaryClick();
  };

  const hasFooter = Boolean(buttonText || secondaryButtonText || renderExtraFooterAction);

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      <div
        className={`shared widget modal overlay ${visible ? 'is-visible' : ''}`}
        onClick={handleOverlayClick}
        aria-hidden={!isOpen}
      >
        <div className="shared widget modal wrapper">
          <div
            className={`shared widget modal card mode-${mode} type-${type} ${visible ? 'is-entered' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Notification'}
            onClick={(event) => event.stopPropagation()}
            ref={modalRef}
            tabIndex={-1}
            style={{
              background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 100%)`,
              ...(modalWidth ? { width: modalWidth } : {}),
              ...(modalWidth ? { minWidth: modalWidth } : {}),
              ...(modalHeight ? { height: modalHeight } : {}),
            }}
          >
            <div className="shared widget modal shapes">
              <div
                className="shared widget modal shape shape-icon"
                style={{ background: `linear-gradient(-45deg, ${palette.accent}30, ${palette.accent}10)` }}
              />
            </div>

            <div className="shared widget modal watermark" aria-hidden="true">
              {renderModalIcon(palette.icon)}
            </div>

            {closable && (
              <button className="shared widget modal close" onClick={requestClose} aria-label="Close">
                {renderCloseIcon()}
              </button>
            )}

            <div className={`shared widget modal content ${contentClassName}`}>
              <h2 className="shared widget modal title" style={{ color: palette.textColor }}>
                {title}
              </h2>

              {deviceInfo && <DeviceInfoPanel deviceInfo={deviceInfo} />}

              {showMessage && message && <p className="shared widget modal message">{message}</p>}

              {children}
            </div>

            {hasFooter && (
              <div className="shared widget modal footer">
                {renderExtraFooterAction}
                {secondaryButtonText && (
                  <button className="shared widget modal cta cta-secondary" onClick={handleSecondaryClick}>
                    {secondaryButtonText}
                  </button>
                )}
                {buttonText && (
                  <button
                    className="shared widget modal cta cta-primary"
                    onClick={handlePrimaryClick}
                    disabled={buttonDisabled}
                    style={{ color: palette.ctaColor }}
                  >
                    {buttonText}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalBase;
