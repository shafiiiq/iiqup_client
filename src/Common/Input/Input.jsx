import React, { useState, useRef, useEffect } from 'react';
import './Input.css';
import {
    fontMap,
    sizeMap,
    cornerRadiusMap,
    paddingMap,
    paddingInlineMap,
    paddingLeftMap,
    paddingRightMap,
    paddingTopMap,
    paddingBottomMap,
    marginMap,
    marginInlineMap,
    marginLeftMap,
    marginRightMap,
    marginTopMap,
    marginBottomMap,
    gapMap,
    heightMap,
    iconSizeMap,
    borderRadiusMap,
    borderWidthMap,
    paddingBlockMap
} from '../../utils/maps';

const Input = ({
    type = 'text',
    value = '',
    onChange = () => { },
    onFocus = () => { },
    onBlur = () => { },
    placeholder = '',
    name = '',
    id = '',
    ref = null,
    disabled = false,
    readOnly = false,
    required = false,
    spellCheck = false,
    autoFocus = false,

    label = '',
    labelPosition = 'top',
    labelColor = 'white-100',
    labelBgColor = 'gray-700',
    labelSize = 'sm',
    labelFontWeight = '300',

    colorScheme = 'gray-500',
    bgColor = '',
    placeholderColor = 'gray-200',
    textColor = 'gray-900',
    variant = 'filled',
    size = 'md',
    fontSize = 'md',
    fontWeight = '300',
    width = '100%',
    height = 'auto',
    fullWidth = false,
    rounded = 'md',
    squircle = null,
    bevel = null,
    scoop = null,

    padding = null,
    paddingInline = null,
    paddingBlock = null,
    paddingLeft = null,
    paddingRight = null,
    paddingTop = null,
    paddingBottom = null,
    margin = null,
    marginInline = null,
    marginLeft = null,
    marginRight = null,
    marginTop = null,
    marginBottom = null,
    gap = null,

    iconPadding = null,
    iconPaddingInline = null,
    iconMargin = null,
    iconMarginLeft = null,
    iconMarginRight = null,

    labelPadding = null,
    labelPaddingInline = null,
    labelMargin = null,
    labelMarginLeft = null,
    labelMarginRight = null,

    inputPadding = null,
    inputPaddingRight = null,
    inputPaddingLeft = null,
    inputPaddingInline = null,
    inputPaddingBlock = null,

    borderWidth = '0',
    borderColor = 'gray-300',
    focusBorderColor = '',
    showBorder = true,
    showFocus = true,

    shadowPosition = 'bottom',
    shadowColor = null,
    shadowSize = 'md',

    iconLeft = null,
    iconRight = null,
    iconColor = null,
    iconFontSize = 'md',
    iconPosition = 'center',
    iconHover = null,
    iconClick = null,
    iconToggle = false,

    onCheckedColor = null,
    onCheckedColorScheme = null,
    onCheckedSize = null,

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
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [selectedHour, setSelectedHour] = useState(12);
    const [selectedMinute, setSelectedMinute] = useState(0);
    const [selectedPeriod, setSelectedPeriod] = useState('AM');
    const [is24Hour, setIs24Hour] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [isClicked, setIsClicked] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
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
                setShowDatePicker(false);
                setShowTimePicker(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (inputValue && type === 'time') {
            const [hours, minutes] = inputValue.split(':');
            const hour24 = parseInt(hours);
            const minute = parseInt(minutes);

            if (is24Hour) {
                setSelectedHour(hour24);
            } else {
                if (hour24 === 0) {
                    setSelectedHour(12);
                    setSelectedPeriod('AM');
                } else if (hour24 === 12) {
                    setSelectedHour(12);
                    setSelectedPeriod('PM');
                } else if (hour24 > 12) {
                    setSelectedHour(hour24 - 12);
                    setSelectedPeriod('PM');
                } else {
                    setSelectedHour(hour24);
                    setSelectedPeriod('AM');
                }
            }
            setSelectedMinute(minute);
        }
    }, [inputValue, is24Hour, type]);

    const parseColor = (colorStr) => {
        if (!colorStr) return null;
        if (colorStr.includes('-')) {
            const [c, s] = colorStr.split('-');
            return `var(--${c}-${s})`;
        }
        return colorStr;
    };

    const parseColorScheme = (scheme) => {
        const parts = scheme.split('-');
        if (parts.length === 2) {
            return { color: parts[0], shade: parts[1] };
        }
        return { color: 'primary', shade: '500' };
    };

    const { color, shade } = parseColorScheme(colorScheme);
    const mainColor = parseColor(colorScheme) || `var(--${color}-${shade})`;

    const getBackgroundStyle = () => {
        const { color, shade } = parseColorScheme(colorScheme);

        if (bgColor) {
            return parseColor(bgColor);
        }

        if (variant === 'gradient') {
            const lighterShade = Math.max(100, parseInt(shade) - 200);
            const darkerShade = Math.min(900, parseInt(shade) + 100);
            return `linear-gradient(135deg, var(--${color}-${lighterShade}), var(--${color}-${shade}), var(--${color}-${darkerShade}))`;
        }

        if (variant === 'filled') {
            return `var(--${color}-${shade})`;
        }

        if (variant === 'outline') {
            return 'white';
        }

        return 'white';
    };

    const getBgColor = () => {
        return getBackgroundStyle();
    };

    const getTextColor = () => {
        if (textColor) return parseColor(textColor);
        if ((variant === 'gradient' || variant === 'filled')) {
            const { shade } = parseColorScheme(colorScheme);
            if (parseInt(shade) >= 500) {
                return 'white';
            }
        }

        return 'var(--gray-900)';
    };

    const getPlaceholderColor = () => {
        if (placeholderColor) return parseColor(placeholderColor);

        if ((variant === 'gradient' || variant === 'filled')) {
            const { shade } = parseColorScheme(colorScheme);
            if (parseInt(shade) >= 500) {
                return 'rgb(92, 92, 92)';
            }
        }

        return 'var(--gray-200)';
    };

    const getBorderColor = () => {
        if (error) return 'var(--error-500)';
        if (success) return 'var(--success-500)';
        if (isFocused && showFocus) {
            return parseColor(focusBorderColor) || mainColor;
        }
        return parseColor(borderColor) || 'var(--gray-300)';
    };

    const getShadow = () => {
        if (!showFocus && isFocused) return 'none';
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
                return `0 ${s.offset}px ${s.blur}px ${shadowCol}`;
            case 'left':
                return `-${s.offset}px 0 ${s.blur}px ${shadowCol}`;
            case 'right':
                return `${s.offset}px 0 ${s.blur}px ${shadowCol}`;
            case 'all':
                return `0 0 ${s.blur}px ${s.spread}px ${shadowCol}`;
            default:
                return `0 ${s.offset}px ${s.blur}px ${shadowCol}`;
        }
    };

    const getBorderRadius = () => {
        if (squircle) return cornerRadiusMap[squircle];
        if (bevel) return cornerRadiusMap[bevel];
        if (scoop) return cornerRadiusMap[scoop];
        return cornerRadiusMap[rounded];
    };

    const getCornerShape = () => {
        if (squircle) return 'squircle';
        if (bevel) return 'bevel';
        if (scoop) return 'scoop';
        return null;
    };

    const getBaseStyles = () => {
        return {
            width: fullWidth ? '100%' : width,
            height: height !== 'auto' ? height : (sizeMap[size]?.height || heightMap[size]),
            fontSize: fontMap[fontSize],
            borderRadius: getBorderRadius(),
            border: showBorder ? `${borderWidthMap[borderWidth] || borderWidth + 'px'} solid ${getBorderColor()}` : 'none',
            padding: padding ? paddingRightMap[padding] : undefined,
            paddingLeft: inputPaddingLeft ? paddingLeftMap[inputPaddingLeft] : undefined,
            paddingRight: inputPaddingRight ? paddingRightMap[inputPaddingRight] : undefined,
            paddingTop: paddingTop ? paddingTopMap[paddingTop] : undefined,
            paddingBottom: paddingBottom ? paddingBottomMap[paddingBottom] : undefined,
            paddingInline: inputPaddingInline ? paddingInlineMap[inputPaddingInline] : undefined,
            paddingBlock: inputPaddingBlock ? paddingBlockMap[inputPaddingBlock] : undefined,
            margin: margin ? marginMap[margin] : undefined,
            marginInline: marginInline ? marginInlineMap[marginInline] : undefined,
            marginLeft: marginLeft ? marginLeftMap[marginLeft] : undefined,
            marginRight: marginRight ? marginRightMap[marginRight] : undefined,
            marginTop: marginTop ? marginTopMap[marginTop] : undefined,
            marginBottom: marginBottom ? marginBottomMap[marginBottom] : undefined,
            gap: gap ? gapMap[gap] : undefined,
            fontWeight: fontWeight,
            color: getTextColor(),
            background: getBgColor(),
            border: showBorder ? `${borderWidth}px solid ${getBorderColor()}` : 'none',
            boxShadow: (isFocused && showFocus) ? getShadow() : 'none',
            cornerShape: getCornerShape(),
            '--placeholder-color': getPlaceholderColor(),
        };
    };

    const getBaseListStyles = () => {
        return {
            width: fullWidth ? '100%' : width,
            height: height !== 'auto' ? height : sizeMap[size]?.height,
            fontSize: fontMap[fontSize] || fontMap.md,
            borderRadius: getBorderRadius(),
            color: getTextColor(),
            background: getBgColor(),
            border: showBorder ? `${borderWidth}px solid ${getBorderColor()}` : 'none',
            boxShadow: (isFocused && showFocus) ? getShadow() : 'none',
            cornerShape: getCornerShape(),
            '--placeholder-color': getPlaceholderColor(),
        };
    };

    const handleClick = () => {
        if (disabled) return;
        setIsClicked(!isClicked);
        if (!isFocused) {
            setIsFocused(true);
            onFocus({ target: { name, value: inputValue } });
        }
    };

    const handleBlurEvent = () => {
        setIsFocused(false);
        onBlur({ target: { name, value: inputValue } });
    };

    const getCurrentIcon = (baseIcon, position) => {
        if (!baseIcon) return null;

        if (iconToggle && isClicked && iconClick) return iconClick;
        if (isHovered && iconHover) return iconHover;
        return baseIcon;
    };

    const getIconPositionStyle = () => {
        const iconSize = sizeMap[size]?.iconSize || '20px';
        const positions = {
            center: {
                top: '50%',
                transform: 'translateY(-50%)',
            },
            top: {
                top: '8px',
            },
            bottom: {
                bottom: '8px',
            },
        };
        return positions[iconPosition] || positions.center;
    };

    const renderIcon = (iconName, side) => {
        if (!iconName) return null;

        const currentIcon = getCurrentIcon(iconName, side);
        const iconSize = sizeMap[iconFontSize]?.iconSize || '20px';
        const positionStyle = getIconPositionStyle();

        const iconStyle = {
            color: parseColor(iconColor) || getTextColor(),
            fontSize: iconSizeMap[iconFontSize] || sizeMap[iconFontSize]?.iconSize,
            padding: iconPadding ? paddingMap[iconPadding] : undefined,
            paddingInline: iconPaddingInline ? paddingInlineMap[iconPaddingInline] : undefined,
            margin: iconMargin ? marginMap[iconMargin] : undefined,
            marginLeft: iconMarginLeft ? marginLeftMap[iconMarginLeft] : undefined,
            marginRight: iconMarginRight ? marginRightMap[iconMarginRight] : undefined,
            ...positionStyle,
        };

        return (
            <span
                className={`custom-input-icon custom-input-icon-${side}`}
                style={iconStyle}
            >
                <span className="material-symbols-rounded">{currentIcon}</span>
            </span>
        );
    };

    const renderLabel = () => {
        if (!label) return null;

        const labelStyles = {
            color: parseColor(labelColor) || 'var(--gray-700)',
            fontSize: fontMap[labelSize],
            background: parseColor(labelBgColor) || 'white',
            padding: labelPadding ? paddingMap[labelPadding] : undefined,
            paddingInline: labelPaddingInline ? paddingInlineMap[labelPaddingInline] : undefined,
            margin: labelMargin ? marginMap[labelMargin] : undefined,
            marginLeft: labelMarginLeft ? marginLeftMap[labelMarginLeft] : undefined,
            marginRight: labelMarginRight ? marginRightMap[labelMarginRight] : undefined,
            fontWeight: labelFontWeight ? labelFontWeight : undefined
        };

        return (
            <div
                className={`custom-input-label custom-input-label-${labelPosition} ${isFocused || inputValue ? 'custom-input-label-active' : ''}`}
                style={labelStyles}
            >
                {label}
                {required &&
                    <span
                        className="custom-input-required"
                        style={{
                            color: parseColor(labelColor)
                        }}>
                        *
                    </span>}
            </div>
        );
    };

    const renderMessage = () => {
        if (error && errorMessage) {
            return <span className="custom-input-message custom-input-error">{errorMessage}</span>;
        }
        if (success && successMessage) {
            return <span className="custom-input-message custom-input-success">{successMessage}</span>;
        }
        if (helperText) {
            return <span className="custom-input-message custom-input-helper">{helperText}</span>;
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
        const displayValueObj = options.find(opt =>
            (typeof opt === 'string' ? opt : opt.value) === inputValue
        );
        const displayLabel = displayValueObj
            ? (typeof displayValueObj === 'string' ? displayValueObj : displayValueObj.label)
            : placeholder;

        return (
            <div className="custom-input-select-wrapper" ref={dropdownRef}>
                <input
                    ref={hiddenInputRef}
                    type="text"
                    value={inputValue}
                    onChange={() => { }}
                    style={{ display: 'none' }}
                    name={name}
                    id={id}
                />
                <div
                    className={`custom-input-select-trigger ${isOpen ? 'custom-input-select-open' : ''}`}
                    onClick={() => {
                        if (!disabled) {
                            setIsOpen(!isOpen);
                            setIsFocused(!isOpen);
                        }
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={getBaseStyles()}
                >
                    {iconLeft && renderIcon(iconLeft, 'left')}
                    <span className="custom-input-select-value" style={{ color: inputValue ? getTextColor() : getPlaceholderColor() }}>
                        {displayLabel || placeholder}
                    </span>
                    {renderIcon(iconRight || (isOpen ? 'expand_less' : 'expand_more'), 'right')}
                </div>

                {isOpen && (
                    <div className="custom-input-select-dropdown" style={{
                        ...getBaseListStyles(),
                        height: 'auto',
                        maxHeight: '300px',
                        overflow: 'hidden',
                    }}>
                        {searchable && (
                            <div className="custom-input-select-search">
                                <div
                                    className="custom-input-select-search-field"
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={(e) => setSearchQuery(e.currentTarget.textContent)}
                                    data-placeholder="Search..."
                                    style={{
                                        color: getTextColor(),
                                        background: getBgColor(),
                                        borderRadius: getBorderRadius(),
                                        '--placeholder-color': getPlaceholderColor(),
                                    }}
                                />
                            </div>
                        )}
                        <div className="custom-input-select-options">
                            {filteredOptions.length === 0 ? (
                                <div
                                    className="custom-input-select-option custom-input-select-empty"
                                    style={{ color: getPlaceholderColor() }}
                                >
                                    No options found
                                </div>
                            ) : (
                                filteredOptions.map((option, index) => {
                                    const optValue = typeof option === 'string' ? option : option.value;
                                    const optLabel = typeof option === 'string' ? option : option.label;
                                    const isSelected = inputValue === optValue;
                                    return (
                                        <div
                                            key={index}
                                            className={`custom-input-select-option ${isSelected ? 'custom-input-select-selected' : ''}`}
                                            onClick={() => {
                                                setInputValue(optValue);
                                                onChange({ target: { name, value: optValue } });
                                                setIsOpen(false);
                                                setSearchQuery('');
                                            }}
                                            style={{
                                                color: getTextColor(),
                                                background: isSelected ? `${mainColor}20` : 'transparent',
                                                borderRadius: getBorderRadius(),
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

    const renderSearchSelect = () => {
        const filteredSuggestions = inputValue && options
            ? options.filter(opt =>
                (typeof opt === 'string' ? opt : opt.label)
                    .toLowerCase()
                    .includes(inputValue.toLowerCase())
            )
            : options;

        return (
            <div className="custom-input-search-select-wrapper" ref={dropdownRef}
                style={{ width: width }}
            >
                <div className="custom-input-search-select-inner">
                    {iconLeft && renderIcon(iconLeft, 'left')}

                    <input
                        ref={hiddenInputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => {
                            const newValue = e.target.value;
                            setInputValue(newValue);
                            onChange({ target: { name, value: newValue } });
                            setShowSuggestions(true);
                        }}
                        onFocus={() => {
                            setIsFocused(true);
                            setShowSuggestions(true);
                            onFocus({ target: { name, value: inputValue } });
                        }}
                        onBlur={() => {
                            setTimeout(() => {
                                setShowSuggestions(false);
                                setIsFocused(false);
                            }, 200);
                            onBlur({ target: { name, value: inputValue } });
                        }}
                        onMouseEnter={() => setIsHovered(true)}
                        onMouseLeave={() => setIsHovered(false)}
                        name={name}
                        id={id}
                        disabled={disabled}
                        readOnly={readOnly}
                        placeholder={placeholder}
                        className="custom-input-field"
                        style={getBaseStyles()}
                    />

                    {iconRight && renderIcon(iconRight, 'right')}
                </div>

                {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="custom-input-select-dropdown" style={{
                        ...getBaseListStyles(),
                        height: 'auto',
                        maxHeight: '300px',
                        overflow: 'hidden',
                        marginTop: '4px',
                    }}>
                        <div className="custom-input-select-options">
                            {filteredSuggestions.map((option, index) => {
                                const optValue = typeof option === 'string' ? option : option.value;
                                const optLabel = typeof option === 'string' ? option : option.label;
                                return (
                                    <div
                                        key={index}
                                        className="custom-input-select-option"
                                        onClick={() => {
                                            setInputValue(optValue);
                                            onChange({ target: { name, value: optValue } });
                                            setShowSuggestions(false);
                                        }}
                                        style={{
                                            color: getTextColor(),
                                            background: 'transparent',
                                            borderRadius: getBorderRadius(),
                                        }}
                                    >
                                        {optLabel}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderCheckbox = () => {
        const checkboxSize = sizeMap[size]?.height || '44px';
        const boxSize = parseInt(checkboxSize);

        const getCheckedBgColor = () => {
            if (inputValue && onCheckedColorScheme) {
                const { color, shade } = parseColorScheme(onCheckedColorScheme);
                return `var(--${color}-${shade})`;
            }
            return inputValue ? mainColor : getBgColor();
        };

        const getCheckedIconColor = () => {
            if (inputValue && onCheckedColor) {
                return parseColor(onCheckedColor);
            }
            return parseColor(iconColor) || 'white';
        };

        return (
            <div
                className="custom-input-checkbox-wrapper"
                onClick={() => {
                    if (disabled) return;
                    const newValue = !inputValue;
                    setInputValue(newValue);
                    setIsClicked(newValue);
                    onChange({ target: { name, value: newValue, checked: newValue } });
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <input
                    type="checkbox"
                    checked={inputValue}
                    onChange={() => { }}
                    style={{ display: 'none' }}
                    name={name}
                    id={id}
                />
                <div
                    className={`custom-input-checkbox ${inputValue ? 'custom-input-checkbox-checked' : ''}`}
                    style={{
                        width: boxSize,
                        height: boxSize,
                        minWidth: boxSize,
                        minHeight: boxSize,
                        borderColor: getBorderColor(),
                        background: getCheckedBgColor(),
                        border: showBorder ? `${borderWidth}px solid ${getBorderColor()}` : 'none',
                        borderRadius: getBorderRadius(),
                        cornerShape: getCornerShape(),
                        boxShadow: (isFocused && showFocus) ? getShadow() : 'none',
                    }}
                >
                    {inputValue && (
                        iconClick ? (
                            <span className="material-symbols-rounded" style={{
                                color: getCheckedIconColor(),
                                fontSize: `calc(${boxSize}px * 0.7)`,
                            }}>
                                {getCurrentIcon(iconClick, 'check')}
                            </span>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke={getCheckedIconColor()} strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                            </svg>
                        )
                    )}
                </div>
            </div>
        );
    };

    const renderRadio = () => {
        const checkboxSize = sizeMap[size]?.height || '44px';
        const boxSize = parseInt(checkboxSize);

        const getCheckedDotColor = () => {
            if (checked && onCheckedColor) {
                return parseColor(onCheckedColor);
            }
            return mainColor;
        };

        const getCheckedDotSize = () => {
            if (checked && onCheckedSize) {
                const checkedBoxSize = parseInt(sizeMap[onCheckedSize]?.height || boxSize);
                return `calc(${checkedBoxSize}px * 0.5)`;
            }
            return `calc(${boxSize}px * 0.5)`;
        };

        return (
            <div
                className="custom-input-radio-wrapper"
                onClick={() => {
                    if (disabled) return;
                    onChange({ target: { name, value: true, checked: true } });
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                <input
                    type="radio"
                    checked={checked}
                    onChange={() => { }}
                    style={{ display: 'none' }}
                    name={name}
                    id={id}
                />
                <div
                    className='custom-input-radio-outline'
                    style={{
                        width: boxSize,
                        height: boxSize,
                        minWidth: boxSize,
                        minHeight: boxSize,
                        borderColor: getBorderColor(),
                        borderRadius: getBorderRadius(),
                        cornerShape: getCornerShape(),
                        border: showBorder ? `${borderWidth}px solid ${getBorderColor()}` : 'none',
                        boxShadow: (isFocused && showFocus) ? getShadow() : 'none',
                    }}
                >
                    <div
                        className={`custom-input-radio ${checked ? 'custom-input-radio-checked' : ''}`}
                        style={{
                            borderColor: getBorderColor(),
                            background: getBgColor(),
                            borderRadius: getBorderRadius(),
                            cornerShape: getCornerShape(),
                            boxShadow: (isFocused && showFocus) ? getShadow() : 'none',
                        }}
                    >
                        {checked && (
                            <span
                                className="custom-input-radio-dot"
                                style={{
                                    background: getCheckedDotColor(),
                                    width: getCheckedDotSize(),
                                    height: getCheckedDotSize(),
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderFile = () => {
        return (
            <div className="custom-input-file-wrapper">
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
                    className="custom-input-file-trigger"
                    onClick={() => !disabled && hiddenFileInput.current?.click()}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={getBaseStyles()}
                >
                    {renderIcon(iconLeft || 'upload_file', 'left')}
                    <span className="custom-input-file-text" style={{ color: inputValue ? getTextColor() : getPlaceholderColor() }}>
                        {inputValue || placeholder || 'Choose file...'}
                    </span>
                    {iconRight && renderIcon(iconRight, 'right')}
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

        const getDaysInMonth = (year, month) => {
            return new Date(year, month + 1, 0).getDate();
        };

        const getFirstDayOfMonth = (year, month) => {
            return new Date(year, month, 1).getDay();
        };

        const handleDateSelect = (day) => {
            const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            setInputValue(dateStr);
            setDisplayValue(dateStr);
            onChange({ target: { name, value: dateStr } });
            setShowDatePicker(false);
        };

        const handlePrevMonth = () => {
            if (selectedMonth === 0) {
                setSelectedMonth(11);
                setSelectedYear(selectedYear - 1);
            } else {
                setSelectedMonth(selectedMonth - 1);
            }
        };

        const handleNextMonth = () => {
            if (selectedMonth === 11) {
                setSelectedMonth(0);
                setSelectedYear(selectedYear + 1);
            } else {
                setSelectedMonth(selectedMonth + 1);
            }
        };

        const handlePrevYear = () => {
            setSelectedYear(selectedYear - 1);
        };

        const handleNextYear = () => {
            setSelectedYear(selectedYear + 1);
        };

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
        const firstDay = getFirstDayOfMonth(selectedYear, selectedMonth);

        return (
            <div className="custom-input-date-wrapper" ref={dropdownRef}>
                <input
                    ref={hiddenInputRef}
                    type="text"
                    value={inputValue}
                    onChange={() => { }}
                    style={{ display: 'none' }}
                    name={name}
                    id={id}
                />
                <div
                    className="custom-input-date-trigger"
                    onClick={() => {
                        if (!disabled) {
                            setShowDatePicker(!showDatePicker);
                            setIsFocused(!showDatePicker);
                        }
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={getBaseStyles()}
                >
                    {iconLeft && renderIcon(iconLeft, 'left')}
                    <span className="custom-input-date-text">
                        {inputValue ? (
                            <span style={{ color: getTextColor() }}>{formatDate(inputValue)}</span>
                        ) : (
                            <span style={{ color: getPlaceholderColor() }}>{placeholder || 'Select date...'}</span>
                        )}
                    </span>
                    {renderIcon(iconRight || 'calendar_month', 'right')}
                </div>

                {showDatePicker && (
                    <div className="custom-input-date-picker" style={{
                        ...getBaseStyles(),
                        height: 'auto',
                        padding: 'clamp(8px, 2%, 16px)',
                    }}>
                        <div className="custom-input-date-year-nav">
                            <div
                                className="custom-input-date-nav"
                                onClick={handlePrevYear}
                                style={{ color: getTextColor() }}
                            >
                                <span className="material-symbols-rounded">keyboard_double_arrow_left</span>
                            </div>
                            <div className="custom-input-date-year-display" style={{ color: getTextColor() }}>
                                {selectedYear}
                            </div>
                            <div
                                className="custom-input-date-nav"
                                onClick={handleNextYear}
                                style={{ color: getTextColor() }}
                            >
                                <span className="material-symbols-rounded">keyboard_double_arrow_right</span>
                            </div>
                        </div>

                        <div className="custom-input-date-header">
                            <div
                                className="custom-input-date-nav"
                                onClick={handlePrevMonth}
                                style={{ color: getTextColor() }}
                            >
                                <span className="material-symbols-rounded">chevron_left</span>
                            </div>
                            <div className="custom-input-date-title" style={{ color: getTextColor() }}>
                                {monthNames[selectedMonth]}
                            </div>
                            <div
                                className="custom-input-date-nav"
                                onClick={handleNextMonth}
                                style={{ color: getTextColor() }}
                            >
                                <span className="material-symbols-rounded">chevron_right</span>
                            </div>
                        </div>

                        <div className="custom-input-date-weekdays">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, i) => (
                                <div key={i} className="custom-input-date-weekday" style={{ color: `${getTextColor()}80` }}>
                                    {day}
                                </div>
                            ))}
                        </div>
                        <div className="custom-input-date-days">
                            {[...Array(firstDay)].map((_, i) => (
                                <div key={`empty-${i}`} className="custom-input-date-day custom-input-date-day-empty"></div>
                            ))}
                            {[...Array(daysInMonth)].map((_, i) => {
                                const day = i + 1;
                                const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const isSelected = inputValue === dateStr;
                                return (
                                    <div
                                        key={day}
                                        className={`custom-input-date-day ${isSelected ? 'custom-input-date-day-selected' : ''}`}
                                        onClick={() => handleDateSelect(day)}
                                        style={{
                                            color: getTextColor(),
                                            background: isSelected ? mainColor : 'transparent',
                                            borderRadius: getBorderRadius(),
                                        }}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const renderTime = () => {
        const formatTime = (timeStr) => {
            if (!timeStr) return '';
            const [hours, minutes] = timeStr.split(':');
            const hour24 = parseInt(hours);
            const minute = parseInt(minutes);

            if (is24Hour) {
                return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            } else {
                const period = hour24 >= 12 ? 'PM' : 'AM';
                let hour12 = hour24 % 12;
                if (hour12 === 0) hour12 = 12;
                return `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${period}`;
            }
        };

        const handleTimeSelect = (hour, minute, period) => {
            let hour24;
            if (is24Hour) {
                hour24 = hour;
            } else {
                if (period === 'AM') {
                    hour24 = hour === 12 ? 0 : hour;
                } else {
                    hour24 = hour === 12 ? 12 : hour + 12;
                }
            }

            const timeStr = `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            setInputValue(timeStr);
            setDisplayValue(timeStr);
            onChange({ target: { name, value: timeStr } });
        };

        const handleHourSelect = (hour) => {
            setSelectedHour(hour);
            handleTimeSelect(hour, selectedMinute, selectedPeriod);
        };

        const handleMinuteSelect = (minute) => {
            setSelectedMinute(minute);
            handleTimeSelect(selectedHour, minute, selectedPeriod);
        };

        const handleFormatToggle = () => {
            setIs24Hour(!is24Hour);
        };

        const hours24 = Array.from({ length: 24 }, (_, i) => i);
        const hours12 = Array.from({ length: 12 }, (_, i) => i + 1);
        const minutes = Array.from({ length: 60 }, (_, i) => i);

        return (
            <div className="custom-input-time-wrapper" ref={dropdownRef} style={{ width: width }}>
                <input
                    ref={hiddenInputRef}
                    type="text"
                    value={inputValue}
                    onChange={() => { }}
                    style={{ display: 'none' }}
                    name={name}
                    id={id}
                />
                <div
                    className="custom-input-time-trigger"
                    onClick={() => {
                        if (!disabled) {
                            setShowTimePicker(!showTimePicker);
                            setIsFocused(!showTimePicker);
                        }
                    }}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    style={getBaseStyles()}
                >
                    {iconLeft && renderIcon(iconLeft, 'left')}
                    <span className="custom-input-time-text">
                        {inputValue ? (
                            <span style={{ color: getTextColor() }}>{formatTime(inputValue)}</span>
                        ) : (
                            <span style={{ color: getPlaceholderColor() }}>{placeholder || 'Select time...'}</span>
                        )}
                    </span>
                    {renderIcon(iconRight || 'schedule', 'right')}
                </div>

                {showTimePicker && (
                    <div className="custom-input-time-picker" style={{
                        ...getBaseStyles(),
                        height: 'auto',
                        padding: 'clamp(12px, 2%, 20px)',
                    }}>
                        {/* Format Toggle */}
                        <div className="custom-input-time-format-toggle">
                            <button
                                type="button"
                                onClick={handleFormatToggle}
                                className="custom-input-time-format-btn"
                                style={{
                                    color: getTextColor(),
                                    background: `${mainColor}20`,
                                    borderRadius: getBorderRadius(),
                                }}
                            >
                                {is24Hour ? '24H' : '12H'}
                            </button>
                        </div>

                        {/* Time Selection */}
                        <div className="custom-input-time-selection">
                            {/* Hours Column */}
                            <div className="custom-input-time-column">
                                <div className="custom-input-time-column-label" style={{ color: getTextColor() }}>
                                    Hours
                                </div>
                                <div className="custom-input-time-column-scroll">
                                    {(is24Hour ? hours24 : hours12).map((hour) => (
                                        <div
                                            key={hour}
                                            className={`custom-input-time-option ${selectedHour === hour ? 'custom-input-time-selected' : ''}`}
                                            onClick={() => handleHourSelect(hour)}
                                            style={{
                                                color: getTextColor(),
                                                background: selectedHour === hour ? mainColor : 'transparent',
                                                borderRadius: getBorderRadius(),
                                            }}
                                        >
                                            {String(hour).padStart(2, '0')}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Minutes Column */}
                            <div className="custom-input-time-column">
                                <div className="custom-input-time-column-label" style={{ color: getTextColor() }}>
                                    Minutes
                                </div>
                                <div className="custom-input-time-column-scroll">
                                    {minutes.map((minute) => (
                                        <div
                                            key={minute}
                                            className={`custom-input-time-option ${selectedMinute === minute ? 'custom-input-time-selected' : ''}`}
                                            onClick={() => handleMinuteSelect(minute)}
                                            style={{
                                                color: getTextColor(),
                                                background: selectedMinute === minute ? mainColor : 'transparent',
                                                borderRadius: getBorderRadius(),
                                            }}
                                        >
                                            {String(minute).padStart(2, '0')}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* AM/PM Toggle (12-hour format only) */}
                            {!is24Hour && (
                                <div className="custom-input-time-column custom-input-time-period-column">
                                    <div className="custom-input-time-column-label" style={{ color: getTextColor() }}>
                                        Period
                                    </div>
                                    <div className="custom-input-time-period-toggle">
                                        <div
                                            className={`custom-input-time-period-option ${selectedPeriod === 'AM' ? 'custom-input-time-period-selected' : ''}`}
                                            onClick={() => {
                                                setSelectedPeriod('AM');
                                                handleTimeSelect(selectedHour, selectedMinute, 'AM');
                                            }}
                                            style={{
                                                color: selectedPeriod === 'AM' ? 'white' : getTextColor(),
                                                background: selectedPeriod === 'AM' ? mainColor : `${mainColor}20`,
                                                borderRadius: getBorderRadius(),
                                            }}
                                        >
                                            AM
                                        </div>
                                        <div
                                            className={`custom-input-time-period-option ${selectedPeriod === 'PM' ? 'custom-input-time-period-selected' : ''}`}
                                            onClick={() => {
                                                setSelectedPeriod('PM');
                                                handleTimeSelect(selectedHour, selectedMinute, 'PM');
                                            }}
                                            style={{
                                                color: selectedPeriod === 'PM' ? 'white' : getTextColor(),
                                                background: selectedPeriod === 'PM' ? mainColor : `${mainColor}20`,
                                                borderRadius: getBorderRadius(),
                                            }}
                                        >
                                            PM
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Apply Button */}
                        <button
                            type="button"
                            onClick={() => {
                                setShowTimePicker(false);
                                setIsFocused(false);
                            }}
                            className="custom-input-time-apply-btn"
                            style={{
                                color: 'white',
                                background: mainColor,
                                borderRadius: getBorderRadius(),
                            }}
                        >
                            Apply
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const renderTextarea = () => {
        return (
            <div className="custom-input-textarea-wrapper" style={{ width: width }}>
                <textarea
                    ref={hiddenInputRef}
                    value={inputValue}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        setInputValue(newValue);
                        setDisplayValue(newValue);
                        onChange(e);
                    }}
                    onFocus={() => {
                        setIsFocused(true);
                        onFocus({ target: { name, value: inputValue } });
                    }}
                    onBlur={handleBlurEvent}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={handleClick}
                    name={name}
                    id={id}
                    disabled={disabled}
                    readOnly={readOnly}
                    placeholder={placeholder}
                    rows={rows}
                    spellCheck={spellCheck}
                    autoFocus={autoFocus}
                    className="custom-input-textarea"
                    style={{
                        ...getBaseStyles(),
                        minHeight: `${rows * 24}px`,
                        resize: 'vertical',
                    }}
                />
            </div>
        );
    };

    const renderTextInput = () => {
        return (
            <>
                <input
                    ref={ref ? ref : hiddenInputRef}
                    type={type}
                    value={inputValue}
                    onChange={(e) => {
                        const newValue = e.target.value;
                        setInputValue(newValue);
                        setDisplayValue(newValue);
                        onChange(e);
                    }}
                    onFocus={() => {
                        setIsFocused(true);
                        onFocus({ target: { name, value: inputValue } });
                    }}
                    onBlur={handleBlurEvent}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    onClick={handleClick}
                    onKeyDown={props.onKeyDown}
                    onPaste={props.onPaste}
                    min={min}
                    max={max}
                    step={step}
                    name={name}
                    id={id}
                    disabled={disabled}
                    readOnly={readOnly}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    autoFocus={autoFocus}
                    className="custom-input-field"
                    style={getBaseStyles()}
                />
            </>
        );
    };

    const renderInput = () => {
        if (type === 'select' || type === 'dropdown') return renderSelect();
        if (type === 'search-select') return renderSearchSelect();
        if (type === 'checkbox') return renderCheckbox();
        if (type === 'radio') return renderRadio();
        if (type === 'file') return renderFile();
        if (type === 'date') return renderDate();
        if (type === 'time') return renderTime();
        if (type === 'textarea') return renderTextarea();

        return renderTextInput();
    };

    const containerClasses = [
        'custom-input-container',
        `custom-input-${size}`,
        fullWidth && 'custom-input-full',
        disabled && 'custom-input-disabled',
        error && 'custom-input-error-state',
        success && 'custom-input-success-state',
        isFocused && 'custom-input-focused',
        animation === 'glow' && 'custom-input-glow',
        animation === 'pulse' && 'custom-input-pulse',
        animation === 'shake' && 'custom-input-shake-anim',
        className,
    ].filter(Boolean).join(' ');

    const wrapperClasses = [
        'custom-input-wrapper',
        `custom-input-label-${labelPosition}`,
    ].filter(Boolean).join(' ');

    return (
        <div className={containerClasses} style={style}>
            {labelPosition === 'top' && renderLabel()}

            <div className={wrapperClasses}>
                {labelPosition === 'left' && renderLabel()}

                <div className="custom-input-inner">
                    {(labelPosition === 'inside' || labelPosition === 'floating') && renderLabel()}

                    {iconLeft && !['checkbox', 'radio', 'file', 'select', 'dropdown', 'date', 'search-select'].includes(type) && (
                        renderIcon(iconLeft, 'left')
                    )}

                    {renderInput()}

                    {iconRight && type !== 'password' && !['checkbox', 'radio', 'file', 'select', 'dropdown', 'date', 'search-select'].includes(type) && (
                        renderIcon(iconRight, 'right')
                    )}
                </div>

                {labelPosition === 'right' && renderLabel()}
            </div>

            {renderMessage()}
        </div>
    );
};

export default Input;