import React from 'react';
import './DevModal.css';

const DevModal = ({
  isOpen = false,
  onClose = () => {},
  type = 'success', // 'success' | 'error' | 'warning' | 'updates' | 'progress' | 'announcements'
  title = '',
  message = '',
  buttonText = null,
  onButtonClick = null,
  autoClose = false,
  autoCloseDelay = 4000,
  // Progress specific props
  progress = 0, // 0-100 for progress type
  progressText = '',
  // Updates specific props
  updatesList = [], // array of update items for updates type
}) => {
  const [visible, setVisible] = React.useState(false);
  const modalRef = React.useRef(null);
  const autoCloseRef = React.useRef(null);
  const lastActive = React.useRef(null);

  React.useEffect(() => {
    if (isOpen) {
      lastActive.current = document.activeElement;
      setVisible(true);
      window.requestAnimationFrame(() => focusFirst());
      if (autoClose && type !== 'progress') { // Don't auto-close progress modals
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
    if (e.key === 'Escape' && type !== 'progress') { // Don't allow escape on progress
      e.preventDefault();
      handleClose();
    } else if (e.key === 'Tab') {
      trapTab(e);
    }
  };

  const focusFirst = () => {
    if (!modalRef.current) return;
    const el = modalRef.current.querySelector('button, a, input, [tabindex]:not([tabindex="-1"])');
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
    if (type === 'progress') return; // Prevent closing progress modals
    clearTimeout(autoCloseRef.current);
    setVisible(false);
    setTimeout(() => {
      onClose();
      if (lastActive.current && lastActive.current.focus) lastActive.current.focus();
    }, 360);
  };

  const handleOverlayClick = () => {
    if (type !== 'progress') handleClose();
  };

  const stop = (e) => e.stopPropagation();

  const handleCTA = () => {
    if (onButtonClick) onButtonClick();
    if (type !== 'progress') handleClose();
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
      default:
        return null;
    }
  };

  if (!isOpen) return null;

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
          className={`dm-card dm-card-${type} ${visible ? 'dm-enter' : ''}`}
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
          {/* Premium geometric shapes overlay */}
          <div className="dm-shapes-overlay">
            <div className="dm-shape dm-shape-1" style={{ background: `linear-gradient(45deg, ${palette.accent}40, ${palette.accent}20)` }}></div>
            <div className="dm-shape dm-shape-2" style={{ background: `linear-gradient(-45deg, ${palette.accent}30, ${palette.accent}10)` }}></div>
          </div>

          {/* Large watermark icon */}
          <div className="dm-watermark" aria-hidden="true">
            {renderIcon()}
          </div>

          {/* Close button - hidden for progress type */}
          {type !== 'progress' && (
            <button className="dm-close" onClick={handleClose} aria-label="Close">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          )}

          {/* Content */}
          <div className="dm-content">
            <h2 className="dm-title" style={{ color: palette.textColor }}>
              {title}
            </h2>
            
            {/* Regular message for most types */}
            {type !== 'updates' && type !== 'progress' && (
              <p className="dm-message" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {message}
              </p>
            )}

            {/* Updates list */}
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

            {/* Progress bar and text */}
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

          {/* CTA Button */}
          {buttonText && type !== 'progress' && (
            <div className="dm-footer">
              <button
                className="dm-cta"
                onClick={handleCTA}
                style={{ 
                  backgroundColor: 'rgba(255,255,255,0.95)',
                  color: palette.ctaColor 
                }}
              >
                {buttonText}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DevModal;