import React from 'react';
import './DevModal.css';
import Input from '../Input/Input';
import Button from '../Button/Button';

const DevModal = ({
  isOpen = false,
  onClose = () => { },
  type = 'success',
  modalWidth = null,
  modalHeight = null,
  title = '',
  message = '',
  buttonText = null,
  onButtonClick = null,
  autoClose = false,
  autoCloseDelay = 4000,
  progress = 0,
  progressText = '',
  updatesList = [],
  showInput = false,
  inputValue = '',
  onInputChange = () => { },
  inputPlaceholder = '',
  inputMaxLength = null,
  inputError = '',
  secondaryButtonText = null,
  onSecondaryClick = null,
  deviceInfo = null,
  preventClose = false,
  useCellInput = false,
  cellCount = 20,
  formFields = [],
  onFormChange = () => { },
  formValues = {},
  unauthorizedReason = '',
  contactEmail = 'support@example.com',
  filterGroups = [],
  onFilterChange = () => { },
  filterValues = {},
  onApplyFilters = () => { },
  onResetFilters = () => { },
  onFileChange = () => { },
  fileValues = {},
}) => {
  const [visible, setVisible] = React.useState(false);
  const [splitType, setSplitType] = React.useState('specific');
  const [pageInput, setPageInput] = React.useState('');
  const [splitError, setSplitError] = React.useState('');
  const [filePreviews, setFilePreviews] = React.useState({});
  const [dragging, setDragging] = React.useState(false);
  const [uploadedFiles, setUploadedFiles] = React.useState([]);

  const modalRef = React.useRef(null);
  const autoCloseRef = React.useRef(null);
  const lastActive = React.useRef(null);
  const cellRefs = React.useRef([]);
  const fileInputRef = React.useRef(null);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, autoClose, autoCloseDelay, type]);

  React.useEffect(() => {
    return () => {
      clearTimeout(autoCloseRef.current);
      document.removeEventListener('keydown', handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setUploadedFiles([]);
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
    if (showInput && inputError) {
      return;
    }

    if (type === 'split' && onButtonClick) {
      if (!pageInput.trim()) {
        setSplitError('Please enter page numbers');
        return;
      }

      let pages = [];

      try {
        if (splitType === 'specific') {
          pages = pageInput.split(',').map(p => parseInt(p.trim())).filter(p => !isNaN(p) && p > 0);
          if (pages.length === 0) {
            setSplitError('Invalid page numbers');
            return;
          }
        } else if (splitType === 'range') {
          const ranges = pageInput.split(',');
          pages = ranges.map(range => {
            const [start, end] = range.split('-').map(p => parseInt(p.trim()));
            if (isNaN(start) || isNaN(end) || start < 1 || end < start) {
              throw new Error('Invalid range');
            }
            return [start, end];
          });
        } else if (splitType === 'every') {
          const interval = parseInt(pageInput.trim());
          if (isNaN(interval) || interval < 1) {
            setSplitError('Invalid interval');
            return;
          }
          pages = [interval];
        } else if (onButtonClick) {
          type === 'fileupload' ? onButtonClick(uploadedFiles) : onButtonClick();
        }

        onButtonClick({ splitType, pages });

      } catch (error) {
        setSplitError('Invalid input format');
        return;
      }
    } else if (onButtonClick) {
      onButtonClick();
    }
  };

  const handleSecondary = () => {
    if (onSecondaryClick) onSecondaryClick();
  };

  const handleCellChange = (index, value) => {
    const newChar = value.slice(-1).toUpperCase();
    if (newChar && !/^[A-Z0-9]$/.test(newChar)) return;

    const currentValue = inputValue.padEnd(cellCount, '');
    const newValue = currentValue.substring(0, index) + newChar + currentValue.substring(index + 1);
    onInputChange(newValue.trimEnd());

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

    const nextIndex = Math.min(newValue.length, cellCount - 1);
    cellRefs.current[nextIndex]?.focus();
  };

  const handleFileChange = (fieldName, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setFilePreviews(prev => ({ ...prev, [fieldName]: preview }));
    onFileChange(fieldName, file);
  };

  const handleDropZoneClick = () => fileInputRef.current?.click();

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const incoming = Array.from(e.dataTransfer.files);
    setUploadedFiles((prev) => [...prev, ...incoming]);
  };

  const handleDropZoneChange = (e) => {
    const incoming = Array.from(e.target.files);
    setUploadedFiles((prev) => [...prev, ...incoming]);
  };

  const handleRemoveUploadedFile = (index) =>
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));

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
    },
    authentication: {
      primary: '#a4c725ff',
      secondary: '#959e17ff',
      accent: '#8daf2fff',
      textColor: '#ffffff',
      ctaColor: '#6e7509ff',
      svg: 'key'
    },
    split: {
      primary: '#a4c725ff',
      secondary: '#959e17ff',
      accent: '#8daf2fff',
      textColor: '#ffffff',
      ctaColor: '#6e7509ff',
      svg: 'sync'
    },
    otp: {
      primary: '#f19763ff',
      secondary: '#c06418ff',
      accent: '#f8d881ff',
      textColor: '#ffffff',
      ctaColor: '#923e17ff',
      svg: 'key'
    },
    form: {
      primary: '#2563eb',
      secondary: '#1d4ed8',
      accent: '#60a5fa',
      textColor: '#ffffff',
      ctaColor: '#1e40af',
      svg: 'form'
    },
    unauthorized: {
      primary: '#dc2626',
      secondary: '#b91c1c',
      accent: '#f87171',
      textColor: '#ffffff',
      ctaColor: '#991b1b',
      svg: 'lock'
    },
    filters: {
      primary: '#2c2904be',
      secondary: '#96955a7a',
      accent: 'rgb(255, 251, 0)',
      textColor: '#ffffffff',
      ctaColor: 'rgb(117, 124, 11)',
      svg: 'filter'
    },
    fileupload: {
      primary: '#0f172a',
      secondary: '#1e293b',
      accent: '#38bdf8',
      textColor: '#ffffff',
      ctaColor: '#0c4a6e',
      svg: 'form'
    },
    hint: {
      primary: '#0f172a',
      secondary: '#1e293b',
      accent: '#38bdf8',
      textColor: '#ffffff',
      ctaColor: '#0c4a6e',
      svg: 'filter'
    },
  }[type] || {
    primary: '#b97010',
    secondary: '#969405',
    accent: '#d3b634',
    textColor: '#eeff04',
    ctaColor: '#595f06',
    svg: 'check'
  };

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
      case 'form':
        return (
          <svg {...iconProps}>
            <path
              fill="currentColor"
              fillOpacity="0.15"
              d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"
            />
          </svg>
        );
      case 'lock':
        return (
          <svg {...iconProps}>
            <path
              fill="currentColor"
              fillOpacity="0.15"
              d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
            />
          </svg>
        );
      case 'filter':
        return (
          <svg {...iconProps}>
            <path
              fill="currentColor"
              fillOpacity="0.15"
              d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"
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
        <div className='dm-modal-wrapper'>
          <div
            className={`dm-card dm-card-${type} ${visible ? 'dm-enter' : ''} 
    ${showInput ? 'dm-card-input' : ''} 
    ${useCellInput ? 'dm-card-cells' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label={title || 'Notification'}
            onClick={stop}
            ref={modalRef}
            tabIndex={-1}
            style={{
              background: `linear-gradient(135deg, ${palette.primary} 0%, ${palette.secondary} 100%)`,
              ...(modalWidth ? { width: modalWidth } : {}),
              ...(modalHeight ? { height: modalHeight } : {}),
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
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
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

              {type !== 'updates' && type !== 'progress' && type !== 'form' && type !== 'unauthorized' && type !== 'filters' && type !== 'fileupload' && type !== 'hint' && !showInput && (
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
                  <Input
                    type="text"
                    value={inputValue}
                    onChange={(e) => onInputChange(e.target.value)}
                    placeholder={inputPlaceholder}
                    maxLength={inputMaxLength}
                    autoFocus
                    colorScheme="white-100"
                    variant="filled"
                    height='57px'
                    fontSize='xl'
                    placeholderColor='black-100'
                    inputPaddingInline='2xl'
                    fontWeight='500'
                    squircle='10xl'
                    fullWidth={true}
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

              {type === 'hint' && (
                <div className="dm-hint-section">
                  {message && (
                    <p className="dm-message dm-hint-message" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {message}
                    </p>
                  )}
                  {filterGroups.map((group, i) => (
                    <div key={i} className="dm-hint-group">
                      {group.label && <div className="dm-hint-group-label">{group.label}</div>}
                      <div className="dm-hint-grid">
                        {group.items.map((item, j) => (
                          <div key={j} className="dm-hint-item">
                            <div className="dm-hint-swatch" style={{ background: item.color }}></div>
                            <span className="dm-hint-text">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {type === 'split' && (
                <div className="dm-split-section">
                  {message && (
                    <p className="dm-message dm-split-message" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {message}
                    </p>
                  )}

                  <div className="dm-split-options">
                    <label className="dm-split-radio-label">
                      <input
                        type="radio"
                        value="specific"
                        checked={splitType === 'specific'}
                        onChange={(e) => {
                          setSplitType(e.target.value);
                          setPageInput('');
                          setSplitError('');
                        }}
                      />
                      <span>Specific Pages (e.g., 1,3,5)</span>
                    </label>

                    <label className="dm-split-radio-label">
                      <input
                        type="radio"
                        value="range"
                        checked={splitType === 'range'}
                        onChange={(e) => {
                          setSplitType(e.target.value);
                          setPageInput('');
                          setSplitError('');
                        }}
                      />
                      <span>Page Range (e.g., 1-5,7-10)</span>
                    </label>

                    <label className="dm-split-radio-label">
                      <input
                        type="radio"
                        value="every"
                        checked={splitType === 'every'}
                        onChange={(e) => {
                          setSplitType(e.target.value);
                          setPageInput('');
                          setSplitError('');
                        }}
                      />
                      <span>Every N Pages (e.g., 2)</span>
                    </label>

                    <Input
                      type="text"
                      value={pageInput}
                      onChange={(e) => {
                        setPageInput(e.target.value);
                        setSplitError('');
                      }}
                      placeholder={
                        splitType === 'specific' ? 'Enter pages: 1,3,5' :
                          splitType === 'range' ? 'Enter ranges: 1-5,7-10' :
                            'Enter interval: 2'
                      }
                      colorScheme="white-100"
                      variant="filled"
                      height='57px'
                      fontSize='xl'
                      placeholderColor='black-100'
                      inputPaddingInline='2xl'
                      fontWeight='500'
                      squircle='10xl'
                      fullWidth={true}
                    />

                    {splitError && (
                      <div className="dm-split-error">{splitError}</div>
                    )}
                  </div>
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

              {type === 'form' && formFields.length > 0 && (
                <div className="dm-form-section">
                  {message && (
                    <p className="dm-message dm-form-message" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {message}
                    </p>
                  )}
                  <div className="dm-form-fields">
                    {formFields.map((field, index) => (
                      <div key={field.name || index} className="dm-form-field">
                        <label className="dm-form-label">
                          {field.label}
                          {field.required && <span className="dm-form-required">*</span>}
                        </label>

                        {field.type === 'textarea' ? (
                          <Input
                            type="textarea"
                            value={formValues[field.name] || ''}
                            onChange={(e) => onFormChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            rows={field.rows || 3}
                            colorScheme="white-100"
                            variant="filled"
                            height='57px'
                            fontSize='xl'
                            placeholderColor='black-100'
                            inputPaddingInline='2xl'
                            fontWeight='500'
                            squircle='10xl'
                            fullWidth={true}
                          />
                        ) : field.type === 'select' ? (
                          <Input
                            type="select"
                            value={formValues[field.name] || ''}
                            onChange={(e) => onFormChange(field.name, e.target.value)}
                            placeholder={field.placeholder || 'Select...'}
                            options={field.options}
                            colorScheme="white-100"
                            variant="filled"
                            height='57px'
                            fontSize='xl'
                            placeholderColor='black-100'
                            inputPaddingInline='2xl'
                            fontWeight='500'
                            squircle='10xl'
                            fullWidth={true}
                          />
                        ) : field.type === 'search-select' ? (
                          <Input
                            type="search-select"
                            value={formValues[field.name] || ''}
                            onChange={(e) => {
                              onFormChange(field.name, e.target.value);
                            }}
                            onFocus={field.onSearchFocus}
                            placeholder={field.placeholder || 'Type to search or add new...'}
                            options={field.options || []}
                            disabled={field.disabled}
                            colorScheme="white-100"
                            variant="filled"
                            height='57px'
                            fontSize='xl'
                            placeholderColor='black-100'
                            inputPaddingInline='2xl'
                            fontWeight='500'
                            squircle='10xl'
                            fullWidth={true}
                          />
                        ) : field.type === 'searchable-multi-select' ? (
                          <div style={{ marginBottom: '15px' }}>
                            <div className="dm-selected-items" style={{
                              marginBottom: '10px',
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '6px'
                            }}>
                              {(formValues[field.name] || []).map((item, index) => (
                                <span key={index} style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  backgroundColor: '#e0e7ff',
                                  color: '#4338ca',
                                  padding: '6px 10px',
                                  borderRadius: '6px',
                                  fontSize: '13px',
                                  fontWeight: '500'
                                }}>
                                  {item}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const newValues = (formValues[field.name] || []).filter((_, i) => i !== index);
                                      onFormChange(field.name, newValues);
                                    }}
                                    style={{
                                      marginLeft: '8px',
                                      background: 'none',
                                      border: 'none',
                                      color: '#4338ca',
                                      cursor: 'pointer',
                                      fontWeight: 'bold',
                                      fontSize: '16px',
                                      lineHeight: '1',
                                      padding: '0'
                                    }}
                                  >
                                    ×
                                  </button>
                                </span>
                              ))}
                            </div>
                            <Input
                              type="text"
                              placeholder={field.placeholder || 'Search...'}
                              onChange={(e) => {
                                field.onSearch && field.onSearch(e.target.value);
                              }}
                              onFocus={() => field.onSearchFocus && field.onSearchFocus()}
                              onBlur={() => {
                                setTimeout(() => {
                                  field.onSearchBlur && field.onSearchBlur();
                                }, 200);
                              }}
                              colorScheme="white-100"
                              variant="filled"
                              height='57px'
                              fontSize='xl'
                              placeholderColor='black-100'
                              inputPaddingInline='2xl'
                              fontWeight='500'
                              squircle='10xl'
                              fullWidth={true}
                            />
                            {field.showDropdown && field.dropdownItems && field.dropdownItems.length > 0 && (
                              <div className="dm-searchable-dropdown" style={{
                                position: 'absolute',
                                zIndex: 1000,
                                maxHeight: '200px',
                                overflowY: 'auto',
                                backgroundColor: 'white',
                                border: '2px solid rgba(255, 255, 255, 0.2)',
                                borderRadius: '8px',
                                marginTop: '4px',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                              }}>
                                {field.dropdownItems.slice(0, 10).map((item, i) => (
                                  <div
                                    key={i}
                                    onClick={() => field.onItemSelect && field.onItemSelect(item)}
                                    style={{
                                      padding: '10px 12px',
                                      cursor: 'pointer',
                                      borderBottom: '1px solid #f0f0f0',
                                      color: '#1f2937',
                                      transition: 'background 150ms ease'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                  >
                                    <div style={{ fontWeight: '500' }}>{item.label}</div>
                                    {item.subtitle && (
                                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                                        {item.subtitle}
                                      </div>
                                    )}
                                  </div>
                                ))}
                                {field.dropdownItems.length > 10 && (
                                  <div style={{
                                    padding: '8px 12px',
                                    color: '#6b7280',
                                    fontSize: '12px',
                                    textAlign: 'center'
                                  }}>
                                    +{field.dropdownItems.length - 10} more results...
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : field.type === 'allow-add-select' ? (
                          <Input
                            type="select"
                            searchable={true}
                            value={formValues[field.name] || ''}
                            onChange={(e) => onFormChange(field.name, e.target.value)}
                            placeholder={field.placeholder || 'Select...'}
                            options={[
                              ...(field.options || []).map(o => ({ label: o, value: o })),
                              ...(formValues[field.name] &&
                                !(field.options || []).includes(formValues[field.name])
                                ? [{ label: `Add "${formValues[field.name]}"`, value: formValues[field.name] }]
                                : [])
                            ]}
                            colorScheme="white-100"
                            variant="filled"
                            height='57px'
                            fontSize='xl'
                            placeholderColor='black-100'
                            inputPaddingInline='2xl'
                            fontWeight='500'
                            squircle='10xl'
                            fullWidth={true}
                          />

                          ) : field.type === 'add-row-button' ? (
                            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                             <Button
                                text={field.label || '+ Add'}
                                type="button"
                                variant="gradient"
                                colorScheme="amber-600"
                                textColor="white-100"
                                font="md"
                               width="fit-content"
                                height="56px"
                                padding="0 20px"
                                squircle="6xl"
                                onClick={field.onAddRow}
                             />
                            {field.onRemoveRow && (
                              <Button
                                type="button"
                                iconCenter="close"
                                font='md'
                                variant="solid"
                                colorScheme="red-700"
                                textColor="white-100"
                                width="56px"
                                height="56px"
                                padding="0"
                                squircle="6xl"
                                onClick={field.onRemoveRow}
                             />
                            )}
                       </div>
                        
                        ) : field.type === 'file' ? (
                          <div className="dm-file-field">
                            <div
                              className="dm-file-preview"
                              onClick={() => document.getElementById(`dm-file-${field.name}`)?.click()}
                            >
                              {(filePreviews[field.name] || field.currentPreview) ? (
                                <img
                                  src={filePreviews[field.name] || field.currentPreview}
                                  alt="preview"
                                  className="dm-file-preview-img"
                                />
                              ) : (
                                <div className="dm-file-placeholder">
                                  <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
                                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                  </svg>
                                  <span>Click to upload</span>
                                </div>
                              )}
                            </div>
                            <input
                              id={`dm-file-${field.name}`}
                              type="file"
                              accept={field.accept || 'image/*'}
                              style={{ display: 'none' }}
                              onChange={(e) => handleFileChange(field.name, e)}
                            />
                            {(filePreviews[field.name] || field.currentPreview) && (
                              <span className="dm-file-name">{fileValues[field.name]?.name || 'Current file'}</span>
                            )}
                          </div>
                        ) : (
                          <Input
                            type={field.type || 'text'}
                            value={formValues[field.name] || ''}
                            onChange={(e) => onFormChange(field.name, e.target.value)}
                            placeholder={field.placeholder}
                            colorScheme="white-100"
                            variant="filled"
                            height='57px'
                            width='100%'
                            fontSize='xl'
                            placeholderColor='black-100'
                            inputPaddingInline='2xl'
                            fontWeight='500'
                            onCheckedColor="black-800"
                            onCheckedColorScheme='white-900'
                            squircle='10xl'
                            fullWidth="true"
                            spellCheck="true"
                          />
                        )}

                        {field.error && (
                          <div className="dm-form-field-error">{field.error}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {type === 'fileupload' && (
                <div className="dm-fileupload-section">
                  {message && (
                    <p className="dm-message" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {message}
                    </p>
                  )}

                  {/* ── Drop zone — entire area clickable ── */}
                  <div
                    className={`dm-dropzone ${dragging ? 'dm-dropzone--dragging' : ''}`}
                    onClick={handleDropZoneClick}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      style={{ display: 'none' }}
                      onChange={handleDropZoneChange}
                    />
                    <svg viewBox="0 0 24 24" width="36" height="36" fill="currentColor" style={{ opacity: 0.7 }}>
                      <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
                    </svg>
                    <span className="dm-dropzone-text">Drag the file or click here to upload</span>
                  </div>

                  {/* ── Uploaded file list ── */}
                  {uploadedFiles.length > 0 && (
                    <ul className="dm-uploaded-file-list">
                      {uploadedFiles.map((file, i) => (
                        <li key={i} className="dm-uploaded-file-item">
                          <span className="dm-uploaded-file-name">{file.name}</span>
                          <button
                            className="dm-uploaded-file-remove"
                            onClick={(e) => { e.stopPropagation(); handleRemoveUploadedFile(i); }}
                          >✕</button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {type === 'unauthorized' && (
                <div className="dm-unauthorized-section">
                  <div className="dm-unauthorized-icon">
                    <svg viewBox="0 0 24 24" width="64" height="64" fill="currentColor">
                      <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                  </div>
                  <p className="dm-message" style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {message || 'You do not have permission to access this resource.'}
                  </p>
                  {unauthorizedReason && (
                    <div className="dm-unauthorized-reason">
                      <strong>Reason:</strong> {unauthorizedReason}
                    </div>
                  )}
                  {contactEmail && (
                    <div className="dm-unauthorized-contact">
                      Need access? Contact <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
                    </div>
                  )}
                </div>
              )}

              {type === 'filters' && filterGroups.length > 0 && (
                <div className="dm-filters-section">
                  {message && (
                    <p className="dm-message dm-filters-message" style={{ color: 'rgba(255,255,255,0.9)' }}>
                      {message}
                    </p>
                  )}
                  <div className="dm-filters-groups">
                    {filterGroups.map((group, index) => (
                      <div key={group.name || index} className="dm-filter-group">
                        <label className="dm-filter-label">{group.label}</label>

                        {group.type === 'checkbox' && (
                          <div className="dm-filter-checkboxes">
                            {group.options?.map((option, i) => {
                              const optValue = option.value || option;
                              const optLabel = option.label || option;
                              const isChecked = Array.isArray(filterValues[group.name])
                                ? filterValues[group.name].includes(optValue)
                                : false;

                              return (
                                <label key={i} className="dm-filter-checkbox-label">
                                  <div className="dm-custom-checkbox">
                                    <input
                                      type="checkbox"
                                      className="dm-filter-checkbox-input"
                                      checked={isChecked}
                                      onChange={(e) => {
                                        const currentValues = filterValues[group.name] || [];
                                        const newValues = e.target.checked
                                          ? [...currentValues, optValue]
                                          : currentValues.filter(v => v !== optValue);
                                        onFilterChange(group.name, newValues);
                                      }}
                                    />
                                    <span className="dm-checkbox-custom" style={{
                                      borderColor: `${palette.accent}80`,
                                      backgroundColor: isChecked ? palette.accent : 'rgba(255,255,255,0.1)'
                                    }}>
                                      {isChecked && (
                                        <svg viewBox="0 0 24 24" width="14" height="14" fill="white">
                                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                                        </svg>
                                      )}
                                    </span>
                                  </div>
                                  <span className="dm-filter-checkbox-text">{optLabel}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {group.type === 'radio' && (
                          <div className="dm-filter-radios">
                            {group.options?.map((option, i) => {
                              const optValue = option.value || option;
                              const optLabel = option.label || option;
                              const isChecked = filterValues[group.name] === optValue;

                              return (
                                <label key={i} className="dm-filter-radio-label">
                                  <div className="dm-custom-radio">
                                    <input
                                      type="radio"
                                      className="dm-filter-radio-input"
                                      checked={isChecked}
                                      onChange={() => onFilterChange(group.name, optValue)}
                                    />
                                    <span className="dm-radio-custom" style={{
                                      borderColor: `${palette.accent}80`,
                                      backgroundColor: isChecked ? palette.accent : 'rgba(255,255,255,0.1)'
                                    }}>
                                      {isChecked && (
                                        <span className="dm-radio-dot" style={{
                                          backgroundColor: 'white'
                                        }}></span>
                                      )}
                                    </span>
                                  </div>
                                  <span className="dm-filter-radio-text">{optLabel}</span>
                                </label>
                              );
                            })}
                          </div>
                        )}

                        {group.type === 'select' && (
                          <div className="dm-custom-select-wrapper">
                            <div
                              className="dm-filter-select-custom"
                              onClick={() => {
                                const dropdown = document.getElementById(`dropdown-${group.name}`);
                                dropdown.classList.toggle('dm-select-dropdown-open');
                              }}
                              style={{
                                borderColor: `${palette.accent}40`,
                                color: 'var(--text-color)'
                              }}
                            >
                              <span className="dm-select-selected-text">
                                {filterValues[group.name]
                                  ? (group.options?.find(opt => (opt.value || opt) === filterValues[group.name])?.label || filterValues[group.name])
                                  : 'All'}
                              </span>
                              <div className="dm-select-arrow" style={{ color: palette.accent }}>
                                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                  <path d="M7 10l5 5 5-5z" />
                                </svg>
                              </div>
                            </div>

                            <div
                              id={`dropdown-${group.name}`}
                              className="dm-select-dropdown"
                              style={{
                                borderColor: `${palette.accent}40`
                              }}
                            >
                              <div
                                className="dm-select-option"
                                onClick={() => {
                                  onFilterChange(group.name, '');
                                  document.getElementById(`dropdown-${group.name}`).classList.remove('dm-select-dropdown-open');
                                }}
                              >
                                All
                              </div>
                              {group.options?.map((opt, i) => {
                                const optValue = opt.value || opt;
                                const optLabel = opt.label || opt;
                                return (
                                  <div
                                    key={i}
                                    className="dm-select-option"
                                    onClick={() => {
                                      onFilterChange(group.name, optValue);
                                      document.getElementById(`dropdown-${group.name}`).classList.remove('dm-select-dropdown-open');
                                    }}
                                  >
                                    {optLabel}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {group.type === 'date' && (
                          <div className="dm-custom-date-wrapper">
                            <Input
                              type="date"
                              value={filterValues[group.name] || ''}
                              onChange={(e) => onFilterChange(group.name, e.target.value)}
                              colorScheme="white-100"
                              variant="filled"
                              height='57px'
                              fontSize='xl'
                              placeholderColor='black-100'
                              inputPaddingInline='2xl'
                              fontWeight='500'
                              squircle='10xl'
                              fullWidth={true}
                            />
                            <div className="dm-date-icon" style={{ color: palette.accent }}>
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5zm2 4h10v2H7v-2z" />
                              </svg>
                            </div>
                          </div>
                        )}

                        {group.type === 'range' && (
                          <div className="dm-filter-range">
                            <Input
                              type="number"
                              placeholder="Min"
                              value={filterValues[group.name]?.min || ''}
                              onChange={(e) => onFilterChange(group.name, {
                                ...filterValues[group.name],
                                min: e.target.value
                              })}
                              colorScheme="white-100"
                              variant="filled"
                              height='57px'
                              fontSize='xl'
                              placeholderColor='black-100'
                              inputPaddingInline='2xl'
                              fontWeight='500'
                              squircle='10xl'
                            />
                            <span className="dm-filter-range-separator">-</span>
                            <Input
                              type="number"
                              placeholder="Max"
                              value={filterValues[group.name]?.max || ''}
                              onChange={(e) => onFilterChange(group.name, {
                                ...filterValues[group.name],
                                max: e.target.value
                              })}
                              colorScheme="white-100"
                              variant="filled"
                              height='57px'
                              fontSize='xl'
                              placeholderColor='black-100'
                              inputPaddingInline='2xl'
                              fontWeight='500'
                              squircle='10xl'
                            />
                          </div>
                        )}

                        {group.type === 'text' && (
                          <Input
                            type="text"
                            placeholder={group.placeholder || ''}
                            value={filterValues[group.name] || ''}
                            onChange={(e) => onFilterChange(group.name, e.target.value)}
                            colorScheme="white-100"
                            variant="filled"
                            height='57px'
                            fontSize='xl'
                            placeholderColor='black-100'
                            inputPaddingInline='2xl'
                            fontWeight='500'
                            squircle='10xl'
                            fullWidth={true}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {(buttonText || secondaryButtonText) && type !== 'progress' && (
              <div className="dm-footer">
                {type === 'filters' && onResetFilters && (
                  <button
                    className="dm-cta dm-cta-secondary"
                    onClick={onResetFilters}
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      color: 'white',
                      backdropFilter: 'blur(8px)'
                    }}
                  >
                    Reset
                  </button>
                )}
                {secondaryButtonText && type !== 'filters' && (
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
                    onClick={type === 'filters' ? onApplyFilters : handleCTA}
                    disabled={showInput && !!inputError}
                    style={{
                      backgroundColor: (showInput && inputError) ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.95)',
                      color: palette.ctaColor,
                      cursor: (showInput && inputError) ? 'not-allowed' : 'pointer'
                    }}
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

export default DevModal;