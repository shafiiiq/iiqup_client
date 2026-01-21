import React from 'react';
import './Button.css';

const Button = ({
  text = '',
  children,
  type = 'button',
  onClick = () => { },
  colorScheme = 'primary-500',
  textColor = 'white',
  size = 'md',
  font = 'md',
  variant = 'solid',
  width = 'auto',
  height = 'auto',
  disabled = false,
  loading = false,
  fullWidth = false,
  icon = null,
  iconPosition = 'left',
  animation = 'none',
  rounded = 'md',
  squircle = null,
  bevel = null,
  scoop = null,
  borderWidth = '0',
  borderColor = 'transparent',
  shadowPosition = 'bottom',
  shadowColor = null,
  shadowSize = 'md',
  className = '',
  style = {},
  cursor = 'pointer',
  iconLeft = null,
  iconCenter = null,
  iconRight = null,
  iconColor = null,
  ...props
}) => {
  const buttonRef = React.useRef(null);

  // Parse color scheme (e.g., "blue-500" -> { color: "blue", shade: "500" })
  const parseColorScheme = (scheme) => {
    const parts = scheme.split('-');
    if (parts.length === 2) {
      return { color: parts[0], shade: parts[1] };
    }
    return { color: 'primary', shade: '500' };
  };

  const { color, shade } = parseColorScheme(colorScheme);
  const mainColor = `var(--${color}-${shade})`;

  // Get adjacent shades for gradients and effects
  const getShade = (offset) => {
    const shadeNum = parseInt(shade);
    const newShade = Math.max(100, Math.min(900, shadeNum + offset));
    return `var(--${color}-${newShade})`;
  };

  // Parse text color
  const getTextColor = () => {
    if (textColor.includes('-')) {
      const [c, s] = textColor.split('-');
      return `var(--${c}-${s})`;
    }
    return textColor;
  };

  // Parse border color
  const getBorderColor = () => {
    if (borderColor === 'transparent' || borderColor === 'none') return 'transparent';
    if (borderColor.includes('-')) {
      const [c, s] = borderColor.split('-');
      return `var(--${c}-${s})`;
    }
    return borderColor;
  };

  // Parse shadow color
  const getShadowColor = () => {
    if (!shadowColor) return `${mainColor}60`;
    if (shadowColor.includes('-')) {
      const [c, s] = shadowColor.split('-');
      return `var(--${c}-${s})60`;
    }
    return `${shadowColor}60`;
  };

  // Get shadow based on position and size
  const getShadow = () => {
    const shadowCol = getShadowColor();
    const sizes = {
      sm: { blur: 8, spread: 2, offset: 2 },
      md: { blur: 12, spread: 4, offset: 4 },
      lg: { blur: 20, spread: 8, offset: 6 },
      xl: { blur: 28, spread: 12, offset: 8 },
    };
    const s = sizes[shadowSize] || sizes.md;

    switch (shadowPosition) {
      case 'top':
        return `0 -${s.offset}px ${s.blur}px ${shadowCol}`;
      case 'bottom':
      case 'to-bottom':
        return `0 ${s.offset}px ${s.blur}px ${shadowCol}`;
      case 'left':
        return `-${s.offset}px 0 ${s.blur}px ${shadowCol}`;
      case 'right':
        return `${s.offset}px 0 ${s.blur}px ${shadowCol}`;
      case 'all':
      case 'around':
        return `0 0 ${s.blur}px ${s.spread}px ${shadowCol}`;
      default:
        return `0 ${s.offset}px ${s.blur}px ${shadowCol}`;
    }
  };

  // Rounded corners mapping
  const roundedMap = {
    none: '0',
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    '2xl': '24px',
    '3xl': '48px',
    '4xl': '62px',
    '5xl': '86px',
    '6xl': '110px',
    '7xl': '134px',
    '8xl': '158px',
    '9xl': '182px',
    '10xl': '206px',
    full: '9999px',
  };

  // Corner shape radius mapping
  const cornerRadiusMap = {
    sm: '6px',
    md: '10px',
    lg: '14px',
    xl: '18px',
    '2xl': '24px',
    '3xl': '48px',
    '4xl': '62px',
    '5xl': '86px',
    '6xl': '110px',
    '7xl': '134px',
    '8xl': '158px',
    '9xl': '182px',
    '10xl': '206px',
  };

  // Font size mapping
  const fontMap = {
    xs: '12px',
    sm: '13px',
    md: '15px',
    lg: '17px',
    xl: '19px',
    '2xl': '22px',
    '3xl': '26px',
  };

  // Generate dynamic styles
  const getButtonStyles = () => {
    const baseStyles = {
      width: fullWidth ? '100%' : width,
      height: height,
      fontSize: fontMap[font] || fontMap.md,
      borderRadius: squircle ? (cornerRadiusMap[squircle] || cornerRadiusMap.md)
        : bevel ? (cornerRadiusMap[bevel] || cornerRadiusMap.md)
          : scoop ? (cornerRadiusMap[scoop] || cornerRadiusMap.md)
            : (roundedMap[rounded] || roundedMap.md),
      border: borderWidth !== '0' ? `${borderWidth}px solid ${getBorderColor()}` : 'none',
      color: getTextColor(),
      cornerShape: squircle ? 'squircle' : bevel ? 'bevel' : scoop ? 'scoop' : 'round',
      cursor: disabled || loading ? 'not-allowed' : cursor,
    };

    switch (variant) {
      case 'solid':
        return {
          ...baseStyles,
          background: mainColor,
          boxShadow: getShadow(),
          '--db-focus-color': getShade(-200),
          '--db-glow-color': mainColor,
        };

      case 'gradient':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${getShade(-100)} 0%, ${mainColor} 50%, ${getShade(100)} 100%)`,
          boxShadow: getShadow(),
          '--db-focus-color': getShade(-200),
          '--db-glow-color': mainColor,
        };

      case 'outline':
        return {
          ...baseStyles,
          background: 'transparent',
          color: mainColor,
          border: `${borderWidth || 2}px solid ${getBorderColor() === 'transparent' ? mainColor : getBorderColor()}`,
          boxShadow: 'none',
          '--db-focus-color': getShade(-200),
          '--db-glow-color': mainColor,
        };

      case 'ghost':
        return {
          ...baseStyles,
          background: 'transparent',
          color: mainColor,
          border: 'none',
          boxShadow: 'none',
          '--db-focus-color': getShade(-200),
          '--db-glow-color': mainColor,
        };

      case 'glass':
        return {
          ...baseStyles,
          background: `${mainColor}20`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${mainColor}40`,
          boxShadow: getShadow(),
          '--db-focus-color': getShade(-200),
          '--db-glow-color': mainColor,
        };

      case 'neon':
        return {
          ...baseStyles,
          background: mainColor,
          boxShadow: `0 0 10px ${mainColor}, 0 0 20px ${mainColor}, 0 0 30px ${mainColor}`,
          '--db-focus-color': getShade(-200),
          '--db-glow-color': mainColor,
        };

      default:
        return baseStyles;
    }
  };

  // Hover effects
  const handleMouseEnter = (e) => {
    if (disabled || loading) return;
    const button = e.currentTarget;

    switch (variant) {
      case 'solid':
        button.style.background = getShade(100);
        button.style.transform = 'translateY(-3px) scale(1.02)';
        button.style.boxShadow = `0 8px 20px ${getShadowColor()}`;
        break;

      case 'gradient':
        button.style.background = `linear-gradient(135deg, ${mainColor} 0%, ${getShade(100)} 50%, ${getShade(200)} 100%)`;
        button.style.transform = 'translateY(-3px) scale(1.02)';
        button.style.boxShadow = `0 12px 28px ${getShadowColor()}`;
        break;

      case 'outline':
        button.style.background = `${mainColor}15`;
        button.style.borderColor = getShade(100);
        button.style.transform = 'scale(1.02)';
        break;

      case 'ghost':
        button.style.background = `${mainColor}20`;
        button.style.transform = 'scale(1.02)';
        break;

      case 'glass':
        button.style.background = `${mainColor}35`;
        button.style.transform = 'translateY(-2px)';
        break;

      case 'neon':
        button.style.boxShadow = `0 0 20px ${mainColor}, 0 0 40px ${mainColor}, 0 0 60px ${mainColor}`;
        button.style.transform = 'scale(1.05)';
        break;
    }
  };

  const handleMouseLeave = (e) => {
    if (disabled || loading) return;
    const button = e.currentTarget;
    const styles = getButtonStyles();
    Object.keys(styles).forEach(key => {
      button.style[key] = styles[key];
    });
    button.style.transform = 'translateY(0) scale(1)';
  };

  const handleMouseDown = (e) => {
    if (disabled || loading) return;
    const button = e.currentTarget;
    button.style.transform = 'translateY(1px) scale(0.98)';
  };

  const handleMouseUp = (e) => {
    if (disabled || loading) return;
    const button = e.currentTarget;
    button.style.transform = 'translateY(-3px) scale(1.02)';
  };

  const handleClick = (e) => {
    if (disabled || loading) return;
    onClick(e);
  };

  // Class names
  const classes = [
    'dev-button',
    `dev-button-${size}`,
    fullWidth && 'dev-button-full',
    loading && 'dev-button-loading',
    animation === 'pulse' && 'dev-button-pulse',
    animation === 'glow' && 'dev-button-glow',
    animation === 'bounce' && 'dev-button-bounce',
    animation === 'spin' && 'dev-button-spin',
    animation === 'shake' && 'dev-button-shake',
    animation === 'float' && 'dev-button-float',
    animation === 'morph' && 'dev-button-morph',
    className,
  ].filter(Boolean).join(' ');

  // Render icon
  const renderIcon = () => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <span className="dev-button-icon">{getBuiltInIcon(icon)}</span>;
    }
    return <span className="dev-button-icon">{icon}</span>;
  };

  // Render Material Icons
  const renderMaterialIcon = (iconName, position) => {
    if (!iconName) return null;

    const iconStyle = {
      color: iconColor || getTextColor(),
      fontSize: 'inherit',
      transition: 'var(--db-transition)',
    };

    return (
      <span
        className={`dev-button-icon dev-button-icon-${position}`}
        style={iconStyle}
      >
        <span className="material-symbols-rounded">
          {iconName}
        </span>
      </span>
    );
  };

  const getBuiltInIcon = (iconName) => {
    const icons = {
      check: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12" /></svg>,
      plus: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
      arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>,
      download: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
      upload: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>,
      heart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg>,
      star: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>,
      trash: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
      edit: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
      save: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>,
    };
    return icons[iconName] || null;
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      className={classes}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      disabled={disabled}
      style={{ ...getButtonStyles(), ...style }}
      {...props}
    >
      {loading && <span className="dev-button-spinner" />}
      <span className="dev-button-content">
        {iconLeft && renderMaterialIcon(iconLeft, 'left')}
        {(text || children) && <span className="dev-button-text">{text || children}</span>}
        {iconRight && renderMaterialIcon(iconRight, 'right')}
        {iconCenter && renderMaterialIcon(iconCenter, 'center')}
      </span>
    </button>
  );
};

export default Button;