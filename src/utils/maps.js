const BASE = {
    height: 32,
    width: 32,
    fontSize: 12,
    lineHeight: 18,
    iconSize: 16,
    padding: 6,
    paddingInline: 10,
    paddingBlock: 10,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 6,
    paddingBottom: 6,
    margin: 6,
    marginInline: 10,
    marginLeft: 10,
    marginRight: 10,
    marginTop: 6,
    marginBottom: 6,
    gap: 6,
    borderWidth: 1,
    borderRadius: 6,
    outlineWidth: 1,
};

const STEP = {
    height: 4,
    width: 4,
    fontSize: 1,
    lineHeight: 1.5,
    iconSize: 2,
    padding: 2,
    paddingInline: 2,
    paddingBlock: 2,
    paddingLeft: 2,
    paddingRight: 2,
    paddingTop: 2,
    paddingBottom: 2,
    margin: 2,
    marginInline: 2,
    marginLeft: 2,
    marginRight: 2,
    marginTop: 2,
    marginBottom: 2,
    gap: 2,
    borderWidth: 0.5,
    borderRadius: 4,
    outlineWidth: 0.5,
};

const STANDARD = ['xs', 'sm', 'md', 'lg', 'xl'];

const getIndex = (size) => {
    if (size === 'none') return -1;

    const standardIndex = STANDARD.indexOf(size);
    if (standardIndex !== -1) return standardIndex;

    const match = size.match(/^(\d+)xl$/);
    if (match) return 4 + parseInt(match[1]);

    return 2;
};

const calc = (size, category) => {
    const index = getIndex(size);
    if (index === -1) return 0;
    return BASE[category] + (STEP[category] * index);
};

export const fontMap = new Proxy({}, {
    get: (_, size) => calc(size, 'fontSize') + 'px'
});

export const sizeMap = new Proxy({}, {
    get: (_, size) => ({
        padding: `${calc(size, 'padding')}px ${calc(size, 'paddingInline')}px`,
        height: `${calc(size, 'height')}px`,
        iconSize: `${calc(size, 'iconSize')}px`,
    })
});

export const cornerRadiusMap = new Proxy({ none: '0' }, {
    get: (target, size) => {
        if (size === 'none') return '0';
        return calc(size, 'borderRadius') + 'px';
    }
});

export const heightMap = new Proxy({}, {
    get: (_, size) => calc(size, 'height') + 'px'
});

export const paddingMap = new Proxy({}, {
    get: (_, size) => calc(size, 'padding') + 'px'
});

export const paddingInlineMap = new Proxy({}, {
    get: (_, size) => calc(size, 'paddingInline') + 'px'
});

export const paddingBlockMap = new Proxy({}, {
    get: (_, size) => calc(size, 'paddingBlock') + 'px'
});

export const paddingLeftMap = new Proxy({}, {
    get: (_, size) => calc(size, 'paddingLeft') + 'px'
});

export const paddingRightMap = new Proxy({}, {
    get: (_, size) => calc(size, 'paddingRight') + 'px'
});

export const paddingTopMap = new Proxy({}, {
    get: (_, size) => calc(size, 'paddingTop') + 'px'
});

export const paddingBottomMap = new Proxy({}, {
    get: (_, size) => calc(size, 'paddingBottom') + 'px'
});

export const marginMap = new Proxy({}, {
    get: (_, size) => calc(size, 'margin') + 'px'
});

export const marginInlineMap = new Proxy({}, {
    get: (_, size) => calc(size, 'marginInline') + 'px'
});

export const marginLeftMap = new Proxy({}, {
    get: (_, size) => calc(size, 'marginLeft') + 'px'
});

export const marginRightMap = new Proxy({}, {
    get: (_, size) => calc(size, 'marginRight') + 'px'
});

export const marginTopMap = new Proxy({}, {
    get: (_, size) => calc(size, 'marginTop') + 'px'
});

export const marginBottomMap = new Proxy({}, {
    get: (_, size) => calc(size, 'marginBottom') + 'px'
});

export const gapMap = new Proxy({}, {
    get: (_, size) => calc(size, 'gap') + 'px'
});

export const iconSizeMap = new Proxy({}, {
    get: (_, size) => calc(size, 'iconSize') + 'px'
});

export const borderRadiusMap = new Proxy({}, {
    get: (_, size) => calc(size, 'borderRadius') + 'px'
});

export const borderWidthMap = new Proxy({}, {
    get: (_, size) => calc(size, 'borderWidth') + 'px'
});

export const scaleAll = (multiplier) => {
    Object.keys(BASE).forEach(key => BASE[key] *= multiplier);
    Object.keys(STEP).forEach(key => STEP[key] *= multiplier);
};

console.log('fontMap["71xl"]:', fontMap['71xl']);
console.log('sizeMap["33xl"]:', sizeMap['33xl']);
console.log('cornerRadiusMap["4xl"]:', cornerRadiusMap['4xl']);
console.log('paddingInlineMap["80xl"]:', paddingInlineMap['80xl']);