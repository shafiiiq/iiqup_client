import React from 'react';
import './Toast.css';

const Toast = ({
    isOpen = false,
    onClose = () => { },
    type = 'success', // 'success', 'error', 'warning', 'info'
    textColor = '#ffffff',
    message = '',
    duration = 4000,
    showCloseButton = true,
    showActionButton = false,
    actionButtonText = 'Action',
    onActionClick = () => { },
    position = 'top-center', // 'top-center', 'top-left', 'top-right', 'bottom-center', 'bottom-left', 'bottom-right'
}) => {
    const [visible, setVisible] = React.useState(false);
    const [exiting, setExiting] = React.useState(false);
    const timerRef = React.useRef(null);

    React.useEffect(() => {
        if (isOpen) {
            setVisible(true);
            setExiting(false);

            if (duration > 0) {
                timerRef.current = setTimeout(() => {
                    handleClose();
                }, duration);
            }

            return () => {
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                }
            };
        }
    }, [isOpen, duration]);

    const handleClose = () => {
        setExiting(true);
        setTimeout(() => {
            setVisible(false);
            setExiting(false);
            onClose();
        }, 300);
    };

    const handleActionClick = () => {
        onActionClick();
        handleClose();
    };

    const palette = {
        success: {
            bg: 'linear-gradient(135deg, #5ba754 0%, #5abd20 100%)',
            icon: 'check',
            iconColor: textColor
        },
        error: {
            bg: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            icon: 'times',
            iconColor: textColor
        },
        warning: {
            bg: 'linear-gradient(135deg, #f5f10b 0%, #c7ca09 100%)',
            icon: 'warning',
            iconColor: textColor
        },
        info: {
            bg: 'linear-gradient(135deg, #3b5df6 0%, #1d62f5 100%)',
            icon: 'info',
            iconColor: textColor
        }
    }[type] || palette.success;

    const renderIcon = () => {
        const iconProps = {
            viewBox: "0 0 24 24",
            xmlns: "http://www.w3.org/2000/svg",
            width: "100",
            height: "100",
            fill: palette.iconColor
        };

        switch (palette.icon) {
            case 'check':
                return (
                    <svg {...iconProps}>
                        <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                );
            case 'times':
                return (
                    <svg {...iconProps}>
                        <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                );
            case 'warning':
                return (
                    <svg {...iconProps}>
                        <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                );
            case 'info':
                return (
                    <svg {...iconProps}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                    </svg>
                );
            default:
                return null;
        }
    };

    if (!visible) return null;

    return (
        <div className={`toast-container toast-${position}`}>
            <div
                className={`toast toast-${type} ${exiting ? 'toast-exit' : 'toast-enter'}`}
                style={{ background: palette.bg }}
                role="alert"
                aria-live="polite"
            >
                <div className="toast-icon">
                    {renderIcon()}
                </div>

                <div className="toast-content">
                    <p className="toast-message" style={{ color: textColor }}>
                        {message}
                    </p>
                </div>

                <div className="toast-actions">
                    {showActionButton && (
                        <button
                            className="toast-action-btn"
                            onClick={handleActionClick}
                            aria-label={actionButtonText}
                        >
                            {actionButtonText}
                        </button>
                    )}

                    {showCloseButton && (
                        <button
                            className="toast-close-btn"
                            onClick={handleClose}
                            aria-label="Close notification"
                            style={{ color: textColor }}
                        >
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Toast;