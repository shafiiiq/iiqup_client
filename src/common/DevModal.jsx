import React from 'react';
import './DevModal.css';

const DevModal = ({
  isOpen = false,
  onClose = () => {},
  type = 'success',
  title = '',
  message = '',
  buttonText = null,
  onButtonClick = null,
  autoClose = false,
  autoCloseDelay = 4000,
  progress = 0,
  progressText = '',
  updatesList = [],
  // NEW PROPS
  showInput = false,
  inputValue = '',
  onInputChange = () => {},
  inputPlaceholder = '',
  inputMaxLength = null,
  inputError = '',
  secondaryButtonText = null,
  onSecondaryClick = null,
  deviceInfo = null,
  preventClose = false,
  useCellInput = false, // NEW: Enable cell-based input
  cellCount = 20, // NEW: Number of cells
}) => {
  const [visible, setVisible] = React.useState(false);
  const modalRef = React.useRef(null);
  const autoCloseRef = React.useRef(null);
  const lastActive = React.useRef(null);
  const cellRefs = React.useRef([]);

  React.useEffect(() => {
    if (isOpen) {
      lastActive.current = document.activeElement;
      setVisible(true);
      window.requestAnimationFrame(() => focusFirst());
      if (autoClose && type !== 'progress') {
        autoCloseRef.current = setTimeout(() => handleClose(), autoCloseDelay);
      }
      document.addEventListener('keydown', handleKey);
      return () => {
        clearTimeout(autoCloseRef.current);
        document.removeEventListener('keydown', handleKey);
      };
    } else {
      if (lastActive.current && lastActive.current.focus) {
        lastActive.current.focus();
      }
    }
  }, [isOpen, autoClose, autoCloseDelay, type]);

  React.useEffect(() => {
    return () => {
      clearTimeout(autoCloseRef.current);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  const handleKey = (e) => {
    if (!visible) return;
    if (e.key === 'Escape' && type !== 'progress' && !preventClose) {
      e.preventDefault();
      handleClose();
    } else if (e.key === 'Tab') {
      trapTab(e);
    } else if (e.key === 'Enter' && showInput && buttonText) {
      e.preventDefault();
      handleCTA();
    }
  };

  const focusFirst = () => {
    if (!modalRef.current) return;
    const el = modalRef.current.querySelector('input, button, a, [tabindex]:not([tabindex="-1"])');
    if (el) el.focus();
    else modalRef.current.focus();
  };

  const trapTab = (e) => {
    if (!modalRef.current) return;
    const focusable = Array.from(
      modalRef.current.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )
    ).filter((n) => n.offsetParent !== null);

    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  const handleClose = () => {
    if (type === 'progress' || preventClose) return;
    clearTimeout(autoCloseRef.current);
    setVisible(false);
    setTimeout(() => {
      onClose();
      if (lastActive.current && lastActive.current.focus) lastActive.current.focus();
    }, 360);
  };

  const handleOverlayClick = () => {
    if (type !== 'progress' && !preventClose) handleClose();
  };

  const stop = (e) => e.stopPropagation();

  const handleCTA = () => {
    if (onButtonClick) onButtonClick();
    if (type !== 'progress' && !preventClose) handleClose();
  };

  const handleSecondary = () => {
    if (onSecondaryClick) onSecondaryClick();
  };

  // Cell input handlers
  const handleCellChange = (index, value) => {
    // Only allow single digit/character
    const newChar = value.slice(-1).toUpperCase();
    if (newChar && !/^[A-Z0-9]$/.test(newChar)) return;

    const currentValue = inputValue.padEnd(cellCount, '');
    const newValue = currentValue.substring(0, index) + newChar + currentValue.substring(index + 1);
    onInputChange(newValue.trimEnd());

    // Auto-focus next cell
    if (newChar && index < cellCount - 1) {
      cellRefs.current[index + 1]?.focus();
    }
  };

  const handleCellKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const currentValue = inputValue.padEnd(cellCount, '');
      const newValue = currentValue.substring(0, index) + '' + currentValue.substring(index + 1);
      onInputChange(newValue.trimEnd());

      // Focus previous cell
      if (index > 0) {
        cellRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      cellRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < cellCount - 1) {
      e.preventDefault();
      cellRefs.current[index + 1]?.focus();
    }
  };

  const handleCellPaste = (e) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const newValue = pastedText.substring(0, cellCount);
    onInputChange(newValue);
    
    // Focus the next empty cell or last cell
    const nextIndex = Math.min(newValue.length, cellCount - 1);
    cellRefs.current[nextIndex]?.focus();
  };

  const palette = {
    success: {
      primary: '#10b981',
      secondary: '#059669',
      accent: '#34d399',
      textColor: '#ffffff',
      ctaColor: '#065f46',
      svg: 'check'
    },
    error: {
      primary: '#ef4444',
      secondary: '#dc2626',
      accent: '#f87171',
      textColor: '#ffffff',
      ctaColor: '#991b1b',
      svg: 'times'
    },
    warning: {
      primary: '#f59e0b',
      secondary: '#d97706',
      accent: '#fbbf24',
      textColor: '#ffffff',
      ctaColor: '#92400e',
      svg: 'warning'
    },
    updates: {
      primary: '#3b82f6',
      secondary: '#2563eb',
      accent: '#60a5fa',
      textColor: '#ffffff',
      ctaColor: '#1d4ed8',
      svg: 'sync'
    },
    progress: {
      primary: '#8b5cf6',
      secondary: '#7c3aed',
      accent: '#a78bfa',
      textColor: '#ffffff',
      ctaColor: '#6d28d9',
      svg: 'progress'
    },
    announcements: {
      primary: '#06b6d4',
      secondary: '#0891b2',
      accent: '#22d3ee',
      textColor: '#ffffff',
      ctaColor: '#0e7490',
      svg: 'announcement'
    },
    activation: {
      primary: '#6366f1',
      secondary: '#4f46e5',
      accent: '#818cf8',
      textColor: '#ffffff',
      ctaColor: '#3730a3',
      svg: 'key'
    }
  }[type] || palette.success;

  const renderIcon = () => {
    const iconProps = {
      viewBox: "0 0 24 24",
      xmlns: "http://www.w3.org/2000/svg",
      focusable: "false"
    };

    switch (palette.svg) {
      case 'check':
        return (
          <svg {...iconProps}>
            <path 
              fill="currentColor" 
              fillOpacity="0.15"
              d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"
            />
          </svg>
        );
      case 'times':
        return (
          <svg {...iconProps}>
            <path 
              fill="currentColor" 
              fillOpacity="0.15"
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"
            />
          </svg>
        );
      case 'warning':
        return (
          <svg {...iconProps}>
            <path 
              fill="currentColor" 
              fillOpacity="0.15"
              d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"
            />
          </svg>
        );
      case 'sync':
        return (
          <svg {...iconProps}>
            <path 
              fill="currentColor" 
              fillOpacity="0.15"
              d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"
            />
          </svg>
        );
      case 'progress':
        return (
          <svg {...iconProps}>
            <path 
              fill="currentColor" 
              fillOpacity="0.15"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
        );
      case 'announcement':
        return (
          <svg {...iconProps}>
            <path 
              fill="currentColor" 
              fillOpacity="0.15"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
            />
          </svg>
        );
      case 'key':
        return (
          <svg {...iconProps}>
            <path 
              fill="currentColor" 
              fillOpacity="0.15"
              d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v4h4v-4h2v-4H12.65zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  const paddedValue = inputValue.padEnd(cellCount, '');

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
        rel="stylesheet"
      />
      
      <div
        className={`dm-overlay ${visible ? 'dm-visible' : ''}`}
        onClick={handleOverlayClick}
        aria-hidden={!isOpen}
      >
        <div
          className={`dm-card dm-card-${type} ${visible ? 'dm-enter' : ''} ${showInput ? 'dm-card-input' : ''} ${useCellInput ? 'dm-card-cells' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label={title || 'Notification'}
          onClick={stop}
          ref={modalRef}
          tabIndex={-1}
          style={{
            background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 100%)`,
          }}
        >
          <div className="dm-shapes-overlay">
            <div className="dm-shape dm-shape-1" style={{ background: `linear-gradient(45deg, ${palette.accent}40, ${palette.accent}20)` }}></div>
            <div className="dm-shape dm-shape-2" style={{ background: `linear-gradient(-45deg, ${palette.accent}30, ${palette.accent}10)` }}></div>
          </div>

          <div className="dm-watermark" aria-hidden="true">
            {renderIcon()}
          </div>

          {type !== 'progress' && !preventClose && (
            <button className="dm-close" onClick={handleClose} aria-label="Close">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          )}

          <div className="dm-content">
            <h2 className="dm-title" style={{ color: palette.textColor }}>
              {title}
            </h2>
            
            {deviceInfo && (
              <div className="dm-device-info">
                <div className="dm-device-item">
                  <span className="dm-device-label">Device:</span>
                  <span className="dm-device-value">{deviceInfo.browserInfo}</span>
                </div>
                <div className="dm-device-item">
                  <span className="dm-device-label">Location:</span>
                  <span className="dm-device-value">{deviceInfo.location}</span>
                </div>
                <div className="dm-device-item">
                  <span className="dm-device-label">IP:</span>
                  <span className="dm-device-value">{deviceInfo.ipAddress}</span>
                </div>
              </div>
            )}

            {type !== 'updates' && type !== 'progress' && !showInput && (
              <p className="dm-message" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {message}
              </p>
            )}

            {showInput && !useCellInput && (
              <div className="dm-input-section">
                {message && (
                  <p className="dm-message dm-input-label" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {message}
                  </p>
                )}
                <input
                  type="text"
                  className="dm-input"
                  value={inputValue}
                  onChange={(e) => onInputChange(e.target.value)}
                  placeholder={inputPlaceholder}
                  maxLength={inputMaxLength}
                  autoFocus
                />
                {inputError && (
                  <div className="dm-input-error">{inputError}</div>
                )}
              </div>
            )}

            {showInput && useCellInput && (
              <div className="dm-input-section">
                {message && (
                  <p className="dm-message dm-input-label" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {message}
                  </p>
                )}
                <div className="dm-cell-input-container">
                  {Array.from({ length: cellCount }).map((_, index) => (
                    <input
                      key={index}
                      ref={(el) => (cellRefs.current[index] = el)}
                      type="text"
                      className="dm-cell-input"
                      value={paddedValue[index] || ''}
                      onChange={(e) => handleCellChange(index, e.target.value)}
                      onKeyDown={(e) => handleCellKeyDown(index, e)}
                      onPaste={index === 0 ? handleCellPaste : undefined}
                      maxLength={1}
                      autoFocus={index === 0}
                    />
                  ))}
                </div>
                {inputError && (
                  <div className="dm-input-error">{inputError}</div>
                )}
              </div>
            )}

            {type === 'updates' && updatesList.length > 0 && (
              <div className="dm-updates-list">
                {updatesList.map((update, index) => (
                  <div key={index} className="dm-update-item">
                    <div className="dm-update-bullet"></div>
                    <span className="dm-update-text">{update}</span>
                  </div>
                ))}
              </div>
            )}

            {type === 'progress' && (
              <div className="dm-progress-section">
                <div className="dm-progress-bar">
                  <div 
                    className="dm-progress-fill" 
                    style={{ 
                      width: `${Math.min(100, Math.max(0, progress))}%`,
                      background: `linear-gradient(90deg, ${palette.accent}, white)`
                    }}
                  ></div>
                </div>
                <div className="dm-progress-text">
                  <span className="dm-progress-percentage">{Math.round(progress)}%</span>
                  {progressText && <span className="dm-progress-label">{progressText}</span>}
                </div>
                {message && (
                  <p className="dm-message dm-progress-message" style={{ color: 'rgba(255,255,255,0.8)' }}>
                    {message}
                  </p>
                )}
              </div>
            )}
          </div>

          {(buttonText || secondaryButtonText) && type !== 'progress' && (
            <div className="dm-footer">
              {secondaryButtonText && (
                <button
                  className="dm-cta dm-cta-secondary"
                  onClick={handleSecondary}
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  {secondaryButtonText}
                </button>
              )}
              {buttonText && (
                <button
                  className="dm-cta"
                  onClick={handleCTA}
                  disabled={showInput && inputError}
                  style={{ 
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    color: palette.ctaColor 
                  }}
                >
                  {buttonText}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DevModal;