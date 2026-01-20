import React, { useState, useRef, useEffect } from 'react';
import './Input.css';

const Input = ({
  type = 'text',
  value = '',
  onChange = () => {},
  onFocus = () => {},
  onBlur = () => {},
  placeholder = '',
  name = '',
  id = '',
  disabled = false,
  readOnly = false,
  required = false,
  
  label = '',
  labelPosition = 'top',
  labelColor = 'gray-700',
  labelSize = 'sm',
  
  colorScheme = 'primary-500',
  textColor = 'white',
  variant = 'outline',
  size = 'md',
  font = 'md',
  width = 'auto',
  height = 'auto',
  fullWidth = false,
  rounded = 'md',
  squircle = null,
  bevel = null,
  scoop = null,
  
  borderWidth = '2',
  borderColor = '',
  focusBorderColor = '',
  
  shadowPosition = 'bottom',
  shadowColor = null,
  shadowSize = 'md',
  
  iconLeft = null,
  iconRight = null,
  iconColor = null,
  
  error = false,
  errorMessage = '',
  success = false,
  successMessage = '',
  helperText = '',
  
  options = [],
  searchable = false,
  min = '',
  max = '',
  step = '1',
  rows = 4,
  checked = false,
  accept = '',
  
  animation = 'none',
  
  className = '',
  style = {},
  maxLength = '',
  ...props
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [displayValue, setDisplayValue] = useState(value);
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const hiddenInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const hiddenFileInput = useRef(null);

  useEffect(() => {
    setInputValue(value);
    setDisplayValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const parseColor = (colorStr) => {
    if (!colorStr) return null;
    if (colorStr.includes('-')) {
      const [c, s] = colorStr.split('-');
      return `var(--${c}-${s})`;
    }
    return colorStr;
  };

  const getTextColor = () => {
    if (textColor.includes('-')) {
      const [c, s] = textColor.split('-');
      return `var(--${c}-${s})`;
    }
    return textColor;
  };

  const getShadow = () => {
    const shadowCol = shadowColor ? parseColor(shadowColor) + '60' : `${mainColor}60`;
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
  };

  const fontMap = {
    xs: '12px',
    sm: '13px',
    md: '15px',
    lg: '17px',
    xl: '19px',
    '2xl': '22px',
  };

  const sizeMap = {
    sm: { padding: '8px 12px', height: '36px' },
    md: { padding: '12px 16px', height: '44px' },
    lg: { padding: '14px 20px', height: '52px' },
    xl: { padding: '16px 24px', height: '60px' },
  };

  const getBorderRadius = () => {
    if (squircle) {
      return cornerRadiusMap[squircle] || cornerRadiusMap['4xl'];
    }
    if (bevel) {
      return cornerRadiusMap[bevel] || cornerRadiusMap.md;
    }
    if (scoop) {
      return cornerRadiusMap[scoop] || cornerRadiusMap.md;
    }
    return roundedMap[rounded] || roundedMap.md;
  };

  const getCornerShape = () => {
    if (squircle) return 'squircle';
    if (bevel) return 'bevel';
    if (scoop) return 'scoop';
    return null;
  };

  const getInputStyles = () => {
    const baseStyles = {
      width: fullWidth ? '100%' : width,
      height: height !== 'auto' ? height : sizeMap[size]?.height,
      fontSize: fontMap[font] || fontMap.md,
      borderRadius: getBorderRadius(),
      padding: type === 'checkbox' || type === 'radio' ? '0' : sizeMap[size]?.padding,
      color: getTextColor(),
      cornerShape: getCornerShape(),
    };

    const borderCol = isFocused 
      ? (parseColor(focusBorderColor) || mainColor)
      : (parseColor(borderColor) || 'var(--gray-300)');

    switch (variant) {
      case 'solid':
        return {
          ...baseStyles,
          background: mainColor,
          border: 'none',
          boxShadow: getShadow(),
        };

      case 'gradient':
        return {
          ...baseStyles,
          background: `linear-gradient(135deg, ${getShade(-100)} 0%, ${mainColor} 50%, ${getShade(100)} 100%)`,
          border: 'none',
          boxShadow: getShadow(),
        };

      case 'outline':
        return {
          ...baseStyles,
          background: 'white',
          border: `${borderWidth}px solid ${error ? 'var(--error-500)' : success ? 'var(--success-500)' : borderCol}`,
          color: 'var(--gray-900)',
          boxShadow: isFocused ? getShadow() : 'none',
        };

      case 'filled':
        return {
          ...baseStyles,
          background: isFocused ? mainColor : `${mainColor}20`,
          border: `${borderWidth}px solid ${error ? 'var(--error-500)' : success ? 'var(--success-500)' : (isFocused ? mainColor : 'transparent')}`,
          boxShadow: isFocused ? getShadow() : 'none',
        };

      case 'ghost':
        return {
          ...baseStyles,
          background: 'transparent',
          border: 'none',
          borderBottom: `${borderWidth}px solid ${error ? 'var(--error-500)' : success ? 'var(--success-500)' : borderCol}`,
          borderRadius: '0',
          boxShadow: 'none',
          color: mainColor,
        };

      case 'neon':
        return {
          ...baseStyles,
          background: 'rgba(0, 0, 0, 0.8)',
          border: `${borderWidth}px solid ${mainColor}`,
          color: mainColor,
          boxShadow: isFocused ? `0 0 10px ${mainColor}, 0 0 20px ${mainColor}` : `0 0 5px ${mainColor}`,
        };

      case 'glass':
        return {
          ...baseStyles,
          background: `${mainColor}20`,
          backdropFilter: 'blur(10px)',
          border: `1px solid ${mainColor}40`,
          boxShadow: isFocused ? getShadow() : 'none',
        };

      default:
        return baseStyles;
    }
  };

  const handleKeyDown = (e) => {
    if (disabled || readOnly) return;

    if (type === 'text' || type === 'email' || type === 'password' || type === 'search' || type === 'url' || type === 'tel') {
      if (e.key === 'Backspace') {
        e.preventDefault();
        const newValue = displayValue.slice(0, -1);
        setDisplayValue(newValue);
        setInputValue(newValue);
        onChange({ target: { name, value: newValue } });
      } else if (e.key.length === 1) {
        e.preventDefault();
        if (maxLength && displayValue.length >= maxLength) return;
        const newValue = displayValue + e.key;
        setDisplayValue(newValue);
        setInputValue(newValue);
        onChange({ target: { name, value: newValue } });
      }
    }

    if (type === 'number') {
      if (e.key === 'Backspace') {
        e.preventDefault();
        const newValue = displayValue.slice(0, -1);
        setDisplayValue(newValue);
        setInputValue(newValue);
        onChange({ target: { name, value: newValue } });
      } else if (/^[0-9.-]$/.test(e.key)) {
        e.preventDefault();
        const newValue = displayValue + e.key;
        setDisplayValue(newValue);
        setInputValue(newValue);
        onChange({ target: { name, value: newValue } });
      }
    }
  };

  const handleClick = () => {
    if (disabled) return;
    if (!isFocused) {
      setIsFocused(true);
      onFocus({ target: { name, value: inputValue } });
    }
  };

  const handleBlurEvent = () => {
    setIsFocused(false);
    onBlur({ target: { name, value: inputValue } });
  };

  const handleMouseEnter = (e) => {
    if (disabled || type !== 'select') return;
    const trigger = e.currentTarget;

    switch (variant) {
      case 'solid':
      case 'gradient':
        trigger.style.transform = 'translateY(-3px) scale(1.02)';
        trigger.style.boxShadow = `0 8px 20px ${getShadow()}`;
        break;
      case 'outline':
        trigger.style.borderColor = getShade(100);
        trigger.style.transform = 'scale(1.02)';
        break;
    }
  };

  const handleMouseLeave = (e) => {
    if (disabled || type !== 'select') return;
    const trigger = e.currentTarget;
    const styles = getInputStyles();
    Object.keys(styles).forEach(key => {
      trigger.style[key] = styles[key];
    });
    trigger.style.transform = 'translateY(0) scale(1)';
  };

  const renderMaterialIcon = (iconName, position) => {
    if (!iconName) return null;

    const iconStyle = {
      color: iconColor || getTextColor(),
      fontSize: 'inherit',
    };

    return (
      <span className={`dev-input-icon dev-input-icon-${position}`} style={iconStyle}>
        <span className="material-symbols-rounded">{iconName}</span>
      </span>
    );
  };

  const renderLabel = () => {
    if (!label) return null;

    const labelStyles = {
      color: parseColor(labelColor) || 'var(--gray-700)',
      fontSize: fontMap[labelSize] || fontMap.sm,
    };

    return (
      <div 
        className={`dev-input-label dev-input-label-${labelPosition} ${isFocused || inputValue ? 'dev-input-label-active' : ''}`}
        style={labelStyles}
      >
        {label}
        {required && <span className="dev-input-required">*</span>}
      </div>
    );
  };

  const renderMessage = () => {
    if (error && errorMessage) {
      return <span className="dev-input-message dev-input-error">{errorMessage}</span>;
    }
    if (success && successMessage) {
      return <span className="dev-input-message dev-input-success">{successMessage}</span>;
    }
    if (helperText) {
      return <span className="dev-input-message dev-input-helper">{helperText}</span>;
    }
    return null;
  };

  const filteredOptions = searchable && searchQuery
    ? options.filter(opt => 
        (typeof opt === 'string' ? opt : opt.label)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : options;

  const renderSelect = () => {
    const displayValue = options.find(opt => 
      (typeof opt === 'string' ? opt : opt.value) === inputValue
    );
    const displayLabel = displayValue 
      ? (typeof displayValue === 'string' ? displayValue : displayValue.label)
      : (placeholder || 'Select...');

    return (
      <div className="dev-input-select-wrapper" ref={dropdownRef}>
        <input
          ref={hiddenInputRef}
          type="text"
          value={inputValue}
          onChange={() => {}}
          style={{ display: 'none' }}
          name={name}
          id={id}
        />
        <div
          className={`dev-input-select-trigger ${isOpen ? 'dev-input-select-open' : ''}`}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={getInputStyles()}
        >
          <span className="dev-input-select-value">
            {displayLabel}
          </span>
          {renderMaterialIcon(isOpen ? 'expand_less' : 'expand_more', 'right')}
        </div>

        {isOpen && (
          <div className="dev-input-select-dropdown" style={{ borderRadius: getBorderRadius(), cornerShape: getCornerShape() }}>
            {searchable && (
              <div className="dev-input-select-search">
                <div className="dev-input-select-search-wrapper">
                  <div
                    className="dev-input-select-search-field"
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => setSearchQuery(e.currentTarget.textContent)}
                    data-placeholder="Search..."
                  />
                </div>
              </div>
            )}
            <div className="dev-input-select-options">
              {filteredOptions.length === 0 ? (
                <div className="dev-input-select-option dev-input-select-empty">No options found</div>
              ) : (
                filteredOptions.map((option, index) => {
                  const optValue = typeof option === 'string' ? option : option.value;
                  const optLabel = typeof option === 'string' ? option : option.label;
                  return (
                    <div
                      key={index}
                      className={`dev-input-select-option ${inputValue === optValue ? 'dev-input-select-selected' : ''}`}
                      onClick={() => {
                        setInputValue(optValue);
                        onChange({ target: { name, value: optValue } });
                        setIsOpen(false);
                        setSearchQuery('');
                      }}
                    >
                      {optLabel}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCheckbox = () => {
    return (
      <div 
        className="dev-input-checkbox-wrapper"
        onClick={() => {
          if (disabled) return;
          const newValue = !inputValue;
          setInputValue(newValue);
          onChange({ target: { name, value: newValue, checked: newValue } });
        }}
      >
        <input
          type="checkbox"
          checked={inputValue}
          onChange={() => {}}
          style={{ display: 'none' }}
          name={name}
          id={id}
        />
        <div 
          className={`dev-input-checkbox ${inputValue ? 'dev-input-checkbox-checked' : ''}`}
          style={{
            borderColor: inputValue ? mainColor : 'var(--gray-300)',
            background: inputValue ? mainColor : 'transparent',
            borderRadius: getBorderRadius(),
            cornerShape: getCornerShape(),
          }}
        >
          {inputValue && (
            <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>
        {label && <span className="dev-input-checkbox-label">{label}</span>}
      </div>
    );
  };

  const renderRadio = () => {
    return (
      <div 
        className="dev-input-radio-wrapper"
        onClick={() => {
          if (disabled) return;
          setInputValue(true);
          onChange({ target: { name, value: true, checked: true } });
        }}
      >
        <input
          type="radio"
          checked={inputValue}
          onChange={() => {}}
          style={{ display: 'none' }}
          name={name}
          id={id}
        />
        <div 
          className={`dev-input-radio ${inputValue ? 'dev-input-radio-checked' : ''}`}
          style={{
            borderColor: inputValue ? mainColor : 'var(--gray-300)',
          }}
        >
          {inputValue && (
            <span 
              className="dev-input-radio-dot"
              style={{ background: mainColor }}
            />
          )}
        </div>
        {label && <span className="dev-input-radio-label">{label}</span>}
      </div>
    );
  };

  const renderFile = () => {
    return (
      <div className="dev-input-file-wrapper">
        <input
          ref={hiddenFileInput}
          type="file"
          accept={accept}
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              setInputValue(file.name);
              onChange({ target: { name, value: file, files: e.target.files } });
            }
          }}
          style={{ display: 'none' }}
          name={name}
          id={id}
        />
        <div
          className="dev-input-file-trigger"
          onClick={() => !disabled && hiddenFileInput.current?.click()}
          style={getInputStyles()}
        >
          {renderMaterialIcon(iconLeft || 'upload_file', 'left')}
          <span className="dev-input-file-text">
            {inputValue || placeholder || 'Choose file...'}
          </span>
        </div>
      </div>
    );
  };

  const renderDate = () => {
    const formatDate = (dateStr) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    return (
      <div className="dev-input-date-wrapper">
        <input
          ref={hiddenInputRef}
          type="date"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setDisplayValue(e.target.value);
            onChange({ target: { name, value: e.target.value } });
          }}
          min={min}
          max={max}
          style={{ display: 'none' }}
          name={name}
          id={id}
        />
        <div
          className="dev-input-date-trigger"
          onClick={() => !disabled && hiddenInputRef.current?.showPicker?.()}
          style={{
            ...getInputStyles(),
            paddingLeft: iconLeft ? '44px' : sizeMap[size]?.padding.split(' ')[1],
            paddingRight: '44px',
          }}
        >
          {iconLeft && renderMaterialIcon(iconLeft, 'left')}
          <span className="dev-input-date-text">
            {inputValue ? formatDate(inputValue) : (placeholder || 'Select date...')}
          </span>
          {renderMaterialIcon('calendar_month', 'right')}
        </div>
      </div>
    );
  };

  const renderTextarea = () => {
    return (
      <div className="dev-input-textarea-wrapper">
        <input
          ref={hiddenInputRef}
          type="text"
          value={inputValue}
          onChange={() => {}}
          style={{ display: 'none' }}
          name={name}
          id={id}
        />
        <div
          className="dev-input-textarea"
          contentEditable={!disabled && !readOnly}
          suppressContentEditableWarning
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onFocus={() => {
            setIsFocused(true);
            onFocus({ target: { name, value: inputValue } });
          }}
          onBlur={handleBlurEvent}
          onInput={(e) => {
            const newValue = e.currentTarget.textContent;
            setDisplayValue(newValue);
            setInputValue(newValue);
            onChange({ target: { name, value: newValue } });
          }}
          style={{
            ...getInputStyles(),
            minHeight: `${rows * 24}px`,
            whiteSpace: 'pre-wrap',
            overflowY: 'auto',
          }}
          data-placeholder={placeholder}
        >
          {displayValue}
        </div>
      </div>
    );
  };

  const renderTextInput = () => {
    const showValue = type === 'password' && !showPassword 
      ? '•'.repeat(displayValue.length) 
      : displayValue;

    return (
      <>
        <input
          ref={hiddenInputRef}
          type={type}
          value={inputValue}
          onChange={() => {}}
          min={min}
          max={max}
          step={step}
          style={{ display: 'none' }}
          name={name}
          id={id}
        />
        <div
          className="dev-input-field"
          contentEditable={!disabled && !readOnly}
          suppressContentEditableWarning
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onFocus={() => {
            setIsFocused(true);
            onFocus({ target: { name, value: inputValue } });
          }}
          onBlur={handleBlurEvent}
          style={{
            ...getInputStyles(),
            paddingLeft: iconLeft ? '44px' : sizeMap[size]?.padding.split(' ')[1],
            paddingRight: (iconRight || type === 'password') ? '44px' : sizeMap[size]?.padding.split(' ')[1],
          }}
          data-placeholder={placeholder}
        >
          {showValue}
        </div>
      </>
    );
  };

  const renderInput = () => {
    if (type === 'select' || type === 'dropdown') return renderSelect();
    if (type === 'checkbox') return renderCheckbox();
    if (type === 'radio') return renderRadio();
    if (type === 'file') return renderFile();
    if (type === 'date') return renderDate();
    if (type === 'textarea') return renderTextarea();

    return renderTextInput();
  };

  const containerClasses = [
    'dev-input-container',
    `dev-input-${size}`,
    fullWidth && 'dev-input-full',
    disabled && 'dev-input-disabled',
    error && 'dev-input-error-state',
    success && 'dev-input-success-state',
    isFocused && 'dev-input-focused',
    animation === 'glow' && 'dev-input-glow',
    animation === 'pulse' && 'dev-input-pulse',
    animation === 'shake' && 'dev-input-shake-anim',
    className,
  ].filter(Boolean).join(' ');

  const wrapperClasses = [
    'dev-input-wrapper',
    `dev-input-label-${labelPosition}`,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses} style={style}>
      {labelPosition === 'top' && renderLabel()}
      
      <div className={wrapperClasses}>
        {labelPosition === 'left' && renderLabel()}
        
        <div className="dev-input-inner">
          {(labelPosition === 'inside' || labelPosition === 'floating') && renderLabel()}
          
          {iconLeft && !['checkbox', 'radio', 'file', 'select', 'dropdown', 'date'].includes(type) && (
            renderMaterialIcon(iconLeft, 'left')
          )}

          {renderInput()}

          {type === 'password' && (
            <span 
              className="dev-input-icon dev-input-icon-right dev-input-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              <span className="material-symbols-rounded">
                {showPassword ? 'visibility_off' : 'visibility'}
              </span>
            </span>
          )}

          {iconRight && type !== 'password' && !['checkbox', 'radio', 'file', 'select', 'dropdown', 'date'].includes(type) && (
            renderMaterialIcon(iconRight, 'right')
          )}
        </div>
      </div>

      {renderMessage()}
    </div>
  );
};

export default Input;