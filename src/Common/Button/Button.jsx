import React from 'react';
import './Button.css';

const Button = ({
  text = '',
  children,
  type = 'button',
  onClick = () => { },
  onMouseEnter = () => { },
  onMouseLeave = () => { },
  colorScheme = 'primary-500',
  textColor = 'white',
  size = 'md',
  font = 'md',
  title = '',
  variant = 'solid',
  width = 'auto',
  height = 'auto',
  padding = '14px 28px',
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

  const parseColorScheme = (scheme) => {
    const parts = scheme.split('-');
    if (parts.length === 2) {
      return { color: parts[0], shade: parts[1] };
    }
    return { color: 'primary', shade: '500' };
  };

  const { color, shade } = parseColorScheme(colorScheme);
  const mainColor = `var(--${color}-${shade})`;

  const getShade = (offset) => {
    const shadeNum = parseInt(shade);
    const newShade = Math.max(100, Math.min(900, shadeNum + offset));
    return `var(--${color}-${newShade})`;
  };

  const getTextColor = () => {
    if (textColor.includes('-')) {
      const [c, s] = textColor.split('-');
      return `var(--${c}-${s})`;
    }
    return textColor;
  };

  const getBorderColor = () => {
    if (borderColor === 'transparent' || borderColor === 'none') return 'transparent';
    if (borderColor.includes('-')) {
      const [c, s] = borderColor.split('-');
      return `var(--${c}-${s})`;
    }
    return borderColor;
  };

  const getShadowColor = () => {
    if (!shadowColor) return `${mainColor}60`;
    if (shadowColor.includes('-')) {
      const [c, s] = shadowColor.split('-');
      return `var(--${c}-${s})60`;
    }
    return `${shadowColor}60`;
  };

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

  const fontMap = {
    xs: '12px',
    sm: '13px',
    md: '15px',
    lg: '17px',
    xl: '19px',
    '2xl': '22px',
    '3xl': '26px',
  };

  const getButtonStyles = () => {
    const baseStyles = {
      width: fullWidth ? '100%' : width,
      padding: padding,
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

  const handleMouseEnter = (e) => {
    onMouseEnter(e);
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

      default:
        button.style.boxShadow = `0 0 20px ${mainColor}, 0 0 40px ${mainColor}, 0 0 60px ${mainColor}`;
        button.style.transform = 'scale(1.05)';
        break;
    }
  };

  const handleMouseLeave = (e) => {
    onMouseLeave(e);
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
      title={title}
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