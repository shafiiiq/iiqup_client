import { useEffect, useMemo, useRef, useState } from 'react';
import { applySplitRatios, splitBlock, MIN_SPLIT_REMAINING_RATIO } from './a2.block.split';

export const useA2BlockPagination = (blocks, budget, firstPageOffset = 0) => {
  const measureRef = useRef(null);
  const [splitRatios, setSplitRatios] = useState({});
  const [pageSizes, setPageSizes] = useState(null);
  const debounceRef = useRef(null);
  const hasPaginatedRef = useRef(false);
  const isSplitPassRef = useRef(false);

  const measuredBlocks = useMemo(() => applySplitRatios(blocks, splitRatios), [blocks, splitRatios]);

  useEffect(() => {
    if (!budget || !measureRef.current || !measuredBlocks.length) {
      setPageSizes(null);
      return undefined;
    }

    const requestSplit = (index, availableHeight, height) => {
      const block = measuredBlocks[index];
      const fitRatio = availableHeight / height;
      if (!splitBlock(block, fitRatio)) return false;
      isSplitPassRef.current = true;
      setSplitRatios((previous) => ({ ...previous, [block.key]: fitRatio }));
      return true;
    };

    const runPagination = () => {
      if (!measureRef.current) return;
      const nodes = Array.from(measureRef.current.children);
      const sizes = [];
      let count = 0;
      let currentHeight = 0;

      for (let index = 0; index < measuredBlocks.length; index += 1) {
        const height = nodes[index]?.getBoundingClientRect().height || 0;
        let pageBudget = sizes.length === 0 ? Math.max(0, budget - firstPageOffset) : budget;

        if (count && currentHeight + height > pageBudget) {
          const remaining = pageBudget - currentHeight;
          const canFillRemaining = height > budget && remaining >= budget * MIN_SPLIT_REMAINING_RATIO;
          if (canFillRemaining && requestSplit(index, remaining, height)) return;
          sizes.push(count);
          count = 0;
          currentHeight = 0;
          pageBudget = budget;
        }

        if (!count && height > pageBudget && requestSplit(index, pageBudget, height)) return;

        count += 1;
        currentHeight += height;
      }

      if (count) sizes.push(count);
      setPageSizes(sizes);
      hasPaginatedRef.current = true;
    };

    clearTimeout(debounceRef.current);
    const isImmediate = !hasPaginatedRef.current || isSplitPassRef.current;
    isSplitPassRef.current = false;
    if (isImmediate) runPagination();
    else debounceRef.current = setTimeout(runPagination, 150);

    return () => clearTimeout(debounceRef.current);
  }, [measuredBlocks, budget, firstPageOffset]);

  const pages = useMemo(() => {
    if (!measuredBlocks.length) return [[]];
    if (!pageSizes || !pageSizes.length) return [measuredBlocks];

    const result = [];
    let offset = 0;
    for (const size of pageSizes) {
      if (offset >= measuredBlocks.length) break;
      result.push(measuredBlocks.slice(offset, offset + size));
      offset += size;
    }
    if (offset < measuredBlocks.length) {
      if (result.length) result[result.length - 1] = result[result.length - 1].concat(measuredBlocks.slice(offset));
      else result.push(measuredBlocks.slice(offset));
    }
    return result.length ? result : [measuredBlocks];
  }, [measuredBlocks, pageSizes]);

  return { measureRef, pages, measuredBlocks };
};