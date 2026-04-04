import React, { useEffect, useRef, useState } from 'react';
import Barcode from 'react-barcode';
import './Sidebar.css';
import {
    fontMap,
    cornerRadiusMap,
    paddingMap,
    paddingInlineMap,
    paddingBlockMap,
    borderWidthMap,
} from '../../utils/maps';
import Button from '../Button/Button';
import Input from '../Input/Input';

// ─────────────────────────────────────────────────────────────────────────────
// SidebarTable
// columns: [{ key, label, align, width, flex, fontSize, fontWeight, color }]
// rows: [{ ...data, _actions: [{ label, onClick, colorScheme, variant, textColor, squircle, font, width, height }] }]
// ─────────────────────────────────────────────────────────────────────────────
export const SidebarTable = ({
    columns = [],
    rows = [],
    rowGap = '6px',
    gap = '8px',
    rowRadius = '12px',
    headRadius = '12px',
    squircle = null,
    headBg = 'var(--amber-600)',
    rowBg = 'var(--amber-400)',
    rowAltBg = 'var(--amber-500)',
    headGrad = '',
    headGradVariant = 'filled',
    rowGrad = '',
    rowGradVariant = 'filled',
    rowAltGrad = '',
    rowAltGradVariant = 'filled',
    headColor = 'var(--white-100)',
    rowColor = 'var(--white-100)',
    headFontSize = '12px',
    headFontWeight = '700',
    rowFontSize = '13px',
    rowFontWeight = '400',
    actionPosition = 'right',
    onRowClick = null,
    style = {},
}) => {
    const buildBg = (colorScheme, variant) => {
        if (!colorScheme) return null;
        const parts = colorScheme.split('-');
        const color = parts[0];
        const shade = parseInt(parts[1]);
        if (variant === 'gradient') {
            return `linear-gradient(135deg, var(--${color}-${Math.max(100, shade - 200)}), var(--${color}-${shade}), var(--${color}-${Math.min(900, shade + 100)}))`;
        }
        return `var(--${color}-${shade})`;
    };

    const resolvedHeadBg = buildBg(headGrad, headGradVariant) || headBg;
    const resolvedRowBg = buildBg(rowGrad, rowGradVariant) || rowBg;
    const resolvedRowAltBg = buildBg(rowAltGrad, rowAltGradVariant) || rowAltBg;
    return (
        <div className="sb-table" style={{ gap: rowGap, ...style }}>
            <div className="sb-table-head" style={{ gap: gap, borderRadius: headRadius, 'corner-shape': squircle ? 'squircle' : null, '--sb-head-bg': resolvedHeadBg }}>
                {actionPosition === 'left' && rows[0]?._actions?.length > 0 && <div className="sb-table-cell sb-table-action-cell" style={{ visibility: 'hidden' }}>{rows[0]._actions.map((action, ai) => <Button key={ai} text={action.label} height={action.height || '28px'} font={action.font || 'sm'} width={action.width || 'auto'} padding="0 10px" colorScheme="gray-600" />)}</div>}
                {columns.map((col) => (
                    <div
                        key={col.key}
                        className="sb-table-cell sb-table-head-cell"
                        style={{
                            textAlign: col.align || 'left',
                            width: col.width,
                            flex: col.flex ?? 1,
                            color: col.headColor || headColor,
                            fontSize: col.headFontSize || headFontSize,
                            fontWeight: col.headFontWeight || headFontWeight,
                            borderRadius: headRadius,
                            cornerShape: squircle ? 'squircle' : null,
                        }}
                    >
                        {col.label}
                    </div>
                ))}
                {actionPosition === 'right' && rows[0]?._actions?.length > 0 && <div className="sb-table-cell sb-table-action-cell" style={{ visibility: 'hidden' }}>{rows[0]._actions.map((action, ai) => <Button key={ai} text={action.label} height={action.height || '28px'} font={action.font || 'sm'} width={action.width || 'auto'} padding="0 10px" colorScheme="gray-600" />)}</div>}
            </div>

            {rows.map((row, i) => (
                <div
                    key={i}
                    className={`sb-table-row ${onRowClick ? 'sb-table-row-clickable' : ''}`}
                    cornerShape="squircle"
                    style={{
                        gap: gap,
                        borderRadius: rowRadius,
                        'corner-shape': squircle ? 'squircle' : null,
                        '--sb-row-bg': i % 2 === 0 ? resolvedRowBg : resolvedRowAltBg,
                        cursor: onRowClick ? 'pointer' : 'default',
                    }}
                    onClick={onRowClick ? () => onRowClick(row, i) : undefined}
                >
                    {actionPosition === 'left' && row._actions?.length > 0 && (
                        <div className="sb-table-cell sb-table-action-cell" onClick={e => e.stopPropagation()}>
                            {row._actions.map((action, ai) => (
                                <Button
                                    key={ai}
                                    text={action.label}
                                    onClick={action.onClick}
                                    colorScheme={action.colorScheme || 'gray-600'}
                                    variant={action.variant || 'gradient'}
                                    textColor={action.textColor || 'white-100'}
                                    squircle={action.squircle || '4xl'}
                                    font={action.font || 'sm'}
                                    width={action.width || 'auto'}
                                    height={action.height || '28px'}
                                    padding="0 10px"
                                />
                            ))}
                        </div>
                    )}
                    {columns.map((col) => (
                        <div
                            key={col.key}
                            className="sb-table-cell sb-table-data-cell"
                            style={{
                                textAlign: col.align || 'left',
                                width: col.width,
                                flex: col.flex ?? 1,
                                color: col.rowColor || rowColor,
                                fontSize: col.rowFontSize || rowFontSize,
                                fontWeight: col.rowFontWeight || rowFontWeight,
                                borderRadius: rowRadius,
                                cornerShape: squircle ? 'squircle' : null,
                            }}
                        >
                            {row[col.key] ?? '—'}
                        </div>
                    ))}
                    {actionPosition === 'right' && row._actions?.length > 0 && (
                        <div className="sb-table-cell sb-table-action-cell" style={{ borderRadius: rowRadius, cornerShape: squircle ? 'squircle' : null }} onClick={e => e.stopPropagation()}>
                            {row._actions.map((action, ai) => (
                                <Button
                                    key={ai}
                                    text={action.label}
                                    onClick={action.onClick}
                                    colorScheme={action.colorScheme || 'gray-600'}
                                    variant={action.variant || 'gradient'}
                                    textColor={action.textColor || 'white-100'}
                                    squircle={action.squircle || '4xl'}
                                    font={action.font || 'sm'}
                                    width={action.width || 'auto'}
                                    height={action.height || '28px'}
                                    padding="0 10px"
                                />
                            ))}
                        </div>
                    )}
                </div>
            ))}

            {rows.length === 0 && (
                <div className="sb-table-empty">No data available</div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SidebarRow
// ─────────────────────────────────────────────────────────────────────────────
export const SidebarRow = ({
    label = '',
    value = '',
    radius = '10px',
    squircle = null,
    colorScheme = 'amber-400',
    variant = 'filled',
    labelColor = 'var(--white-100)',
    valueColor = 'var(--white-100)',
    labelFontSize = '13px',
    labelFontWeight = '500',
    valueFontSize = '13px',
    valueFontWeight = '500',
    action = null,
    actionPosition = 'right',
    style = {},
    children,
}) => {
    const parts = colorScheme.split('-');
    const color = parts[0];
    const shade = parts[1];
    const bg = variant === 'gradient'
        ? `linear-gradient(135deg, var(--${color}-${Math.max(100, parseInt(shade) - 200)}), var(--${color}-${shade}), var(--${color}-${Math.min(900, parseInt(shade) + 100)}))`
        : `var(--${color}-${shade})`;
    return (
    <div className="sb-row" style={{ borderRadius: radius, 'corner-shape': squircle ? 'squircle' : null, background: bg, ...style }}>
        {action && actionPosition === 'left' && (
            <Button
                text={action.label}
                onClick={action.onClick}
                colorScheme={action.colorScheme || 'gray-600'}
                variant={action.variant || 'gradient'}
                textColor={action.textColor || 'white-100'}
                squircle={action.squircle || '4xl'}
                font={action.font || 'sm'}
                width={action.width || 'auto'}
                height={action.height || '30px'}
                padding="0 12px"
            />
        )}
        <div className="sb-row-label" style={{ color: labelColor, fontSize: labelFontSize, fontWeight: labelFontWeight }}>{label}</div>
        <div className="sb-row-value" style={{ color: valueColor, fontSize: valueFontSize, fontWeight: valueFontWeight }}>
            {children || value}
        </div>
        {action && actionPosition === 'right' && (
            <Button
                text={action.label}
                onClick={action.onClick}
                colorScheme={action.colorScheme || 'gray-600'}
                variant={action.variant || 'gradient'}
                textColor={action.textColor || 'white-100'}
                squircle={action.squircle || '4xl'}
                font={action.font || 'sm'}
                width={action.width || 'auto'}
                height={action.height || '30px'}
                padding="0 12px"
            />
        )}
    </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SidebarSection
// ─────────────────────────────────────────────────────────────────────────────
export const SidebarSection = ({
    title = '',
    titleFontSize = '11px',
    titleFontWeight = '700',
    titleColor = 'var(--gray-400)',
    children,
    gap = '6px',
    style = {},
}) => (
    <div className="sb-section" style={{ gap, ...style }}>
        {title && (
            <div className="sb-section-title" style={{ fontSize: titleFontSize, fontWeight: titleFontWeight, color: titleColor }}>
                {title}
            </div>
        )}
        {children}
    </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// SidebarActions — uses Button component
// buttons: [{ label, onClick, colorScheme, variant, textColor, squircle, font, width, height, icon, disabled }]
// ─────────────────────────────────────────────────────────────────────────────
export const SidebarActions = ({
    buttons = [],
    position = 'left',
    gap = '8px',
    style = {},
}) => {
    const justifyMap = {
        left: 'flex-start',
        center: 'center',
        right: 'flex-end',
        'space-between': 'space-between',
    };
    return (
        <div className="sb-actions" style={{ justifyContent: justifyMap[position] || 'flex-start', gap, ...style }}>
            {buttons.map((btn, i) => (
                <Button
                    key={i}
                    text={btn.label}
                    onClick={btn.onClick}
                    colorScheme={btn.colorScheme || 'gray-700'}
                    variant={btn.variant || 'gradient'}
                    textColor={btn.textColor || 'white-100'}
                    squircle={btn.squircle || '4xl'}
                    font={btn.font || 'md'}
                    width={btn.width || 'auto'}
                    height={btn.height || '36px'}
                    padding={btn.padding || '0 16px'}
                    disabled={btn.disabled || false}
                    iconLeft={btn.iconLeft || null}
                    iconRight={btn.iconRight || null}
                    animation=""
                    shadowPosition="to-bottom"
                    shadowColor="white-600"
                />
            ))}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// SidebarInput — wraps Input component with sidebar-aware defaults
// Pass any Input props, they go through directly
// ─────────────────────────────────────────────────────────────────────────────
export const SidebarInput = (props) => (
    <Input
        colorScheme={props.colorScheme || 'gray-700'}
        variant={props.variant || 'filled'}
        textColor={props.textColor || 'white-100'}
        squircle={props.squircle || '6xl'}
        height={props.height || '40px'}
        width={props.width || '100%'}
        fontWeight={props.fontWeight || '400'}
        fontSize={props.fontSize || 'md'}
        placeholderColor={props.placeholderColor || 'gray-400'}
        {...props}
    />
);

// ─────────────────────────────────────────────────────────────────────────────
// SidebarBarcode — wraps Barcode component with sidebar-aware defaults
// Pass any Barcode props, they go through directly
// ─────────────────────────────────────────────────────────────────────────────
export const SidebarBarcode = ({
    value = '',
    width = 2,
    height = 50,
    displayValue = true,
    fontSize = 12,
    lineColor = '#000000',
    background = 'transparent',
    margin = 10,
    format = 'CODE128',
    colorScheme = 'white-100',
    variant = 'filled',
    radius = '12px',
    squircle = null,
    padding = '12px',
    align = 'center',
    containerWidth = '100%',
    style = {},
}) => {
    const parts = colorScheme.split('-');
    const color = parts[0];
    const shade = parts[1];
    const bg = variant === 'gradient'
        ? `linear-gradient(135deg, var(--${color}-${Math.max(100, parseInt(shade) - 200)}), var(--${color}-${shade}), var(--${color}-${Math.min(900, parseInt(shade) + 100)}))`
        : `var(--${color}-${shade})`;
    return (
        <div style={{
            background: bg,
            borderRadius: radius,
            'corner-shape': squircle ? 'squircle' : null,
            padding,
            display: 'flex',
            justifyContent: align,
            width: containerWidth,
            boxSizing: 'border-box',
            ...style
        }}>
            <Barcode
                value={value}
                width={width}
                height={height}
                displayValue={displayValue}
                fontSize={fontSize}
                lineColor={lineColor}
                background={background}
                margin={margin}
                format={format}
            />
        </div>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Sidebar
// ─────────────────────────────────────────────────────────────────────────────
const Sidebar = ({
    show = false,
    onClose = () => { },
    onMinimize = () => { },
    onMaximize = () => { },
    isMinimized = false,
    isMaximized = false,
    title = '',
    children = null,
    footer = null,
    width = '800px',
    minWidth = '320px',
    maxWidth = '95vw',
    colorScheme = 'gray-800',
    bgColor = '',
    variant = 'filled',
    headerBgColor = '',
    titleColor = '',
    titleSize = '2xl',
    titleFontWeight = '600',
    bodyBgColor = '',
    bodyPadding = null,
    bodyPaddingInline = null,
    bodyPaddingBlock = null,
    borderWidth = '0',
    borderColor = '',
    showBorder = false,
    rounded = '6xl',
    squircle = null,
    bevel = null,
    scoop = null,
    shadowColor = null,
    shadowSize = 'xxl',
    overlayColor = 'rgba(0, 0, 0, 0.5)',
    overlayBlur = '2px',
    closeOnOverlay = true,
    showClose = true,
    showMinimize = true,
    showMaximize = true,
    closeColor = '#ff4339',
    minimizeColor = '#febc2e',
    maximizeColor = '#28c840',
    backColor = '#880c46',    
    trafficLightSize = '14px',
    backButtonSize = '14px',
    animation = 'slide',
    isLoading = false,
    loader = null,
    className = '',
    style = {},
    headerClassName = '',
    bodyClassName = '',
    footerClassName = '',
    ...props
}) => {
    const sidebarRef = useRef(null);
    const resizeRef = useRef(null);
    const [panelWidth, setPanelWidth] = useState(null);
    const [splitColumns, setSplitColumns] = useState(3);
    const [secondaryScreen, setSecondaryScreen] = useState(null);
    const [tertiaryStack, setTertiaryStack] = useState([]);

    const pushScreen = (screen) => { setSecondaryScreen(screen); setTertiaryStack([]); };
    const pushTertiary = (screen) => setTertiaryStack(prev => [...prev, screen]);
    const popTertiary = () => setTertiaryStack(prev => prev.slice(0, -1));
    const popScreen = () => {
        if (tertiaryStack.length > 0) popTertiary();
        else setSecondaryScreen(null);
    };

    const currentTertiary = tertiaryStack.length > 0 ? tertiaryStack[tertiaryStack.length - 1] : null;
    const isOnSecondaryScreen = !!secondaryScreen || tertiaryStack.length > 0;
    const currentTitle = isMaximized ? title : (currentTertiary ? currentTertiary.title : secondaryScreen ? secondaryScreen.title : title);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && show) {
                if (isOnSecondaryScreen) popScreen();
                else onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [show, onClose, isOnSecondaryScreen]);

    useEffect(() => {
        if (show) document.body.style.overflow = 'hidden';
        else {
            document.body.style.overflow = '';
            setSecondaryScreen(null);
            setTertiaryStack([]);
        }
        return () => { document.body.style.overflow = ''; };
    }, [show]);

    useEffect(() => {
        if (!isMaximized) {
            setPanelWidth(null);
            return;
     }
     const updateColumns = () => {
            const w = window.innerWidth;
         if (w < 700) setSplitColumns(1);
         else if (w < 1100) setSplitColumns(2);
         else setSplitColumns(3);
        };
        updateColumns();
        window.addEventListener('resize', updateColumns);
     return () => window.removeEventListener('resize', updateColumns);
    }, [isMaximized]);
    
    if (!show) return null;

    const startResize = (e) => {
        if (isMaximized) return;
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = sidebarRef.current?.getBoundingClientRect().width || parseInt(width);
        const onMove = (me) => {
            const delta = startX - me.clientX;
            const newWidth = Math.max(320, Math.min(window.innerWidth - 60, startWidth + delta));
            setPanelWidth(newWidth + 'px');
        };
        const onUp = () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    };

    const parseColor = (colorStr) => {
        if (!colorStr) return null;
        if (colorStr.startsWith('rgba') || colorStr.startsWith('#') || colorStr.startsWith('rgb')) return colorStr;
        if (colorStr.includes('-')) {
            const parts = colorStr.split('-');
            return `var(--${parts[0]}-${parts[1]})`;
        }
        return colorStr;
    };

    const parseColorScheme = (scheme) => {
        const parts = scheme.split('-');
        if (parts.length === 2) return { color: parts[0], shade: parseInt(parts[1]) };
        return { color: 'gray', shade: 800 };
    };

    const { color, shade } = parseColorScheme(colorScheme);
    const isDark = shade >= 500;

    const getBackground = () => {
        if (bgColor) return parseColor(bgColor);
        if (variant === 'gradient') {
            const lighter = Math.max(100, shade - 200);
            const darker = Math.min(900, shade + 100);
            return `linear-gradient(135deg, var(--${color}-${lighter}), var(--${color}-${shade}), var(--${color}-${darker}))`;
        }
        if (variant === 'glass') return `var(--gradient-glass-${shade})`;
        return `var(--${color}-${shade})`;
    };

    const getBorderRadius = () => cornerRadiusMap?.[squircle || rounded] || 'var(--radius-6xl)';
    const getCornerShape = () => squircle ? 'squircle' : bevel ? 'bevel' : scoop ? 'scoop' : null;
    const getShadow = () => {
        if (shadowColor) return `0 8px 48px ${parseColor(shadowColor)}55`;
        const sizes = {
            sm: `0 2px 16px rgba(0,0,0,0.18)`,
            md: `0 4px 24px rgba(0,0,0,0.24)`,
            lg: `0 8px 36px rgba(0,0,0,0.30)`,
            xl: `0 12px 48px rgba(0,0,0,0.36)`,
            xxl: `0 20px 70px rgba(0,0,0,0.45)`,
        };
        return sizes[shadowSize] || sizes.xxl;
    };

    const getTitleColor = () => {
        if (titleColor) return parseColor(titleColor);
        return isDark ? 'var(--white-100)' : 'var(--gray-900)';
    };

    const borderVal = showBorder
        ? `${borderWidthMap?.[borderWidth] || borderWidth + 'px'} solid ${parseColor(borderColor) || `var(--${color}-${Math.max(100, shade - 200)})`}`
        : 'none';

const sidebarTransition = 'width 0.42s cubic-bezier(0.4, 0, 0.2, 1), border-radius 0.42s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.42s ease';

const panelStyle = isMinimized ? {
    position: 'fixed', bottom: '30px', right: '30px',
    width: '280px', height: '60px', top: 'auto',
    background: getBackground(), boxShadow: getShadow(),
    borderRadius: '20px', border: borderVal,
    cornerShape: getCornerShape(),
    overflow: 'hidden', display: 'flex', flexDirection: 'row',
    alignItems: 'center', zIndex: 1001,
    transition: sidebarTransition,
} : isMaximized ? {
    position: 'fixed', top: '30px', right: '30px', bottom: '30px',
    width: 'calc(100vw - 60px)',
    background: getBackground(), boxShadow: getShadow(),
    borderRadius: getBorderRadius(), border: borderVal,
    cornerShape: getCornerShape(),
    overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 1001,
    transition: sidebarTransition,
} : {
    position: 'fixed', top: '30px', right: '30px', bottom: '30px',
    width: panelWidth || width, minWidth, maxWidth,
    background: getBackground(), boxShadow: getShadow(),
    borderRadius: getBorderRadius(), border: borderVal,
    cornerShape: getCornerShape(),
    overflow: 'hidden', display: 'flex', flexDirection: 'column', zIndex: 1001,
    transition: sidebarTransition,
    ...style,
};

    const titleStyle = {
        fontSize: fontMap?.[titleSize] || '2rem',
        fontWeight: titleFontWeight,
        color: getTitleColor(),
    };

    const bodyStyle = {
        background: bodyBgColor ? parseColor(bodyBgColor) : 'transparent',
        padding: bodyPadding ? paddingMap?.[bodyPadding] : undefined,
        paddingInline: bodyPaddingInline ? paddingInlineMap?.[bodyPaddingInline] : undefined,
        paddingBlock: bodyPaddingBlock ? paddingBlockMap?.[bodyPaddingBlock] : undefined,
    };

    const animClass =
        animation === 'slide' ? 'sidebar-anim-slide' :
        animation === 'fade' ? 'sidebar-anim-fade' :
        animation === 'scale' ? 'sidebar-anim-scale' : '';

    return (
        <div
            className="sidebar-overlay"
            style={{ backgroundColor: overlayColor, backdropFilter: `blur(${overlayBlur})` }}
            onClick={closeOnOverlay ? onClose : undefined}
        >
            <div
                ref={sidebarRef}
                className={`sidebar-panel ${animClass} ${isMinimized ? 'sidebar-minimized' : ''} ${className}`}
                style={panelStyle}
                cornerShape={getCornerShape()}
                onClick={(e) => e.stopPropagation()}
                {...props}
            >
                {!isMaximized && !isMinimized && (
                    <div className="sidebar-resize-handle" onMouseDown={startResize} />
                )}
                {/* Header */}
                <div className={`sidebar-header ${headerClassName}`} style={{ background: headerBgColor ? parseColor(headerBgColor) : 'transparent' }}>
                    <div className="sidebar-header-left">
                        <div className="sidebar-traffic-lights">
                            {showClose && (
                                <button className="sidebar-traffic-btn sidebar-btn-close" onClick={onClose} title="Close"
                                    style={{ width: trafficLightSize, height: trafficLightSize, background: closeColor }} />
                            )}
                            {showMinimize && (
                                <button className="sidebar-traffic-btn sidebar-btn-minimize" onClick={onMinimize} title="Minimize"
                                    style={{ width: trafficLightSize, height: trafficLightSize, background: minimizeColor }} />
                            )}
                            {showMaximize && (
                                <button className="sidebar-traffic-btn sidebar-btn-maximize" onClick={onMaximize} title={isMaximized ? 'Restore' : 'Maximize'}
                                    style={{ width: trafficLightSize, height: trafficLightSize, background: maximizeColor }} />
                            )}
                        </div>
                        {isOnSecondaryScreen && !isMaximized && (
                            <button className="sidebar-back-btn" onClick={popScreen} title="Back"
                                style={{ width: backButtonSize, height: backButtonSize, background: backColor }} />
                        )}
                    </div>
                    {currentTitle && (
                        <h2 className="sidebar-title" style={titleStyle}>{currentTitle}</h2>
                    )}
                </div>

                {/* Body */}
                <div className={`sidebar-body ${bodyClassName}`} style={isMaximized ? { ...bodyStyle, padding: 0, flexDirection: 'row' } : bodyStyle}>
                    {isLoading
                        ? (loader || <div className="sidebar-loader-default" />)
                            : isMaximized
                               ? (
                                  <>
                                      {/* Column 1 — always visible */}
                                      <div className="sidebar-split-pane">
                                          {splitColumns === 1
                                                ? (currentTertiary
                                                    ? <>
                                                        <div className="sidebar-split-pane-title-row">
                                                            {tertiaryStack.length > 1 && <button className="sidebar-split-back-btn" onClick={popTertiary}>←</button>}
                                                            <div className="sidebar-split-pane-title">{currentTertiary.title}</div>
                                                        </div>
                                                        {currentTertiary.content}
                                                     </>
                                                   : secondaryScreen
                                                       ? <>
                                                           <div className="sidebar-split-pane-title">{secondaryScreen.title}</div>
                                                          {secondaryScreen.content}
                                                         </>
                                                       : (typeof children === 'function' ? children({ pushScreen, pushTertiary, popScreen }) : children)
                                               )
                                               : (typeof children === 'function' ? children({ pushScreen, pushTertiary, popScreen }) : children)
                                           }
                                       </div>
                            
                                        {/* Column 2 — visible at 2+ columns */}
                                        {splitColumns >= 2 && (
                                            <div className="sidebar-split-pane sidebar-split-pane-right">
                                                {splitColumns === 2
                                                    ? (currentTertiary
                                                        ? <>
                                                            <div className="sidebar-split-pane-title-row">
                                                                {tertiaryStack.length > 1 && <button className="sidebar-split-back-btn" onClick={popTertiary}>←</button>}
                                                                <div className="sidebar-split-pane-title">{currentTertiary.title}</div>
                                                            </div>
                                                            {currentTertiary.content}
                                                          </>
                                                        : secondaryScreen
                                                            ? <>
                                                                <div className="sidebar-split-pane-title">{secondaryScreen.title}</div>
                                                                {secondaryScreen.content}
                                                              </>
                                                           : <div className="sidebar-split-placeholder">
                                                               <span className="sidebar-split-placeholder-icon">↖</span>
                                                               <p>Select an item from the left to view details here</p>
                                                              </div>
                                                    )
                                                    : (secondaryScreen
                                                        ? <>
                                                            <div className="sidebar-split-pane-title">{secondaryScreen.title}</div>
                                                            {secondaryScreen.content}
                                                          </>
                                                        : <div className="sidebar-split-placeholder">
                                                            <span className="sidebar-split-placeholder-icon">↖</span>
                                                            <p>Select an item from the left to view details here</p>
                                                          </div>
                                                    )
                                                }
                                            </div>
                                        )}
                            
                                        {/* Column 3 — visible at 3 columns */}
                                        {splitColumns >= 3 && (
                                            <div className="sidebar-split-pane sidebar-split-pane-right">
                                                {currentTertiary ? (
                                                    <>
                                                        <div className="sidebar-split-pane-title-row">
                                                            {tertiaryStack.length > 1 && <button className="sidebar-split-back-btn" onClick={popTertiary}>←</button>}
                                                            <div className="sidebar-split-pane-title">{currentTertiary.title}</div>
                                                        </div>
                                                        {currentTertiary.content}
                                                    </>
                                                ) : (
                                                    <div className="sidebar-split-placeholder">
                                                        <span className="sidebar-split-placeholder-icon">↖</span>
                                                        <p>Select an item from the middle panel to view more details here</p>
                                                 </div>
                                                )}
                                            </div>
                                        )}
                                    </>
                             )
                            : currentTertiary
                                ? currentTertiary.content
                                : secondaryScreen
                                    ? secondaryScreen.content
                                    : typeof children === 'function'
                                        ? children({ pushScreen, pushTertiary, popScreen })
                                        : children
                    }
                </div>

                {/* Footer */}
                {footer && !isOnSecondaryScreen && (
                    <div className={`sidebar-footer ${footerClassName}`}>{footer}</div>
                )}
            </div>
        </div>
    );
};

export default Sidebar;