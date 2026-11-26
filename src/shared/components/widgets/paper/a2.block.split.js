export const SPLIT_FIT_SAFETY = 0.9;
export const MIN_SPLIT_REMAINING_RATIO = 0.15;

export const splitBlock = (block, fitRatio) => (block.split ? block.split(fitRatio * SPLIT_FIT_SAFETY) : null);

export const applySplitRatios = (blocks, splitRatios) =>
  blocks.flatMap((block) => {
    const fitRatio = splitRatios[block.key];
    const parts = fitRatio === undefined ? null : splitBlock(block, fitRatio);
    return parts ? applySplitRatios(parts, splitRatios) : [block];
  });