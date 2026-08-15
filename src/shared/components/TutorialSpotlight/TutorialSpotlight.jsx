import React, { useState, useEffect, createContext, useContext } from 'react';

export const TutorialContext = createContext(null);
export const useTutorial = () => useContext(TutorialContext);

export function TutorialSpotlight() {
  const { activeStep, goNext, goPrev, skip, done, close, activeIndex, pendingCount, isFirst, isLast } = useTutorial();
  const [rect, setRect] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ top: 0, left: 0 });
  const PADDING = 12;
  const GAP = 10;

  useEffect(() => {
    if (!activeStep?.ref?.current) return;

    const update = () => {
      const el = activeStep.ref.current;
      if (!el) return;

      const target = el.getBoundingClientRect().width === 0
        ? el.firstElementChild
        : el;

      if (!target) return;
      const r = target.getBoundingClientRect();
      setRect(r);

      const TOOLTIP_WIDTH = 661;
      const TOOLTIP_HEIGHT = 220;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const spaceBelow = vh - r.bottom;
      const spaceAbove = r.top;

      let top;
      if (spaceBelow >= TOOLTIP_HEIGHT + GAP) {
        top = r.bottom + PADDING + GAP;
      } else if (spaceAbove >= TOOLTIP_HEIGHT + GAP) {
        top = r.top - TOOLTIP_HEIGHT - PADDING - GAP;
      } else {
        top = Math.max(GAP, (vh - TOOLTIP_HEIGHT) / 2);
      }

      let left = r.left;
      if (left + TOOLTIP_WIDTH > vw - GAP) {
        left = vw - TOOLTIP_WIDTH - GAP;
      }
      if (left < GAP) {
        left = GAP;
      }

      setTooltipPos({ top, left });
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    const timer = setTimeout(update, 100);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [activeStep]);

  if (!rect) return null;

  return (
    <>
      <div className="tut-overlay" onClick={close}>
        <svg className="tut-svg" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="tut-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect
                x={rect.left - PADDING}
                y={rect.top - PADDING}
                width={rect.width + PADDING * 2}
                height={rect.height + PADDING * 2}
                rx="10"
                fill="black"
              />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="rgba(0,0,0,0.72)" mask="url(#tut-mask)" />
        </svg>

        <div
          className="tut-spotlight-border"
          style={{
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
          }}
        />
      </div>

      <div
        className="tut-tooltip"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
        onClick={e => e.stopPropagation()}
      >
        <div className="tut-tooltip-header">
          <span className="tut-step-badge">{activeIndex + 1} / {pendingCount}</span>
          <button className="tut-close" onClick={close}>×</button>
        </div>

        <h3 className="tut-title">{activeStep.title}</h3>
        <p className="tut-description">{activeStep.description}</p>

        <div className="tut-footer">
          <div className="tut-footer-left">
            {!isFirst && (
              <button className="tut-btn tut-btn-prev" onClick={goPrev}>Prev</button>
            )}
            <button className="tut-btn tut-btn-skip" onClick={skip}>Skip</button>
          </div>
          <div className="tut-footer-right">
            {isLast
              ? <button className="tut-btn tut-btn-done" onClick={done}>Done</button>
              : <button className="tut-btn tut-btn-next" onClick={goNext}>Next</button>
            }
          </div>
        </div>
      </div>
    </>
  );
}