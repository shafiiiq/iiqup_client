// ─────────────────────────────────────────────────────────────────────────────
// SplashScreen.jsx — App entry animation screen
// Shown once per session (guarded by sessionStorage).
// Renders a Spline 3D scene with a comet-trail SVG loader and brand copy.
// Auto-redirects to /login after the scene loads or on WebGL/Spline failure.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useState } from 'react';
import { useNavigate }                 from 'react-router';
import Spline                          from '@splinetool/react-spline';

import { checkWebGLSupport } from '../utils/compatibility';
import Button                from '../common/Button/Button';

import './SplashScreen.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Fallback redirect delay (ms) when WebGL is unavailable. */
const NO_WEBGL_REDIRECT_DELAY = 2000;

/** Fallback redirect delay (ms) when Spline fails to load. */
const SPLINE_ERROR_REDIRECT_DELAY = 1000;

/**
 * The animated loader path — a looping figure-8 bezier curve.
 * Shared by all comet-trail circles so it's defined once.
 */
const LOADER_PATH = 'M 23.8 0.5 C 17.5 -1.4 1.4 20.9 9.9 27.3 C 14.2 30.5 21.9 22.9 23.8 17.8 C 28 7 2.1 3.3 0.4 11.6 C -0.4 15.9 10 18.3 12.6 18.7 C 25.2 20.5 31.5 2.9 23.8 0.5 Z';

/**
 * Comet trail circle definitions — 150 circles that grow from r=0 to r=1
 * and shift hue from red (#ff0000) to yellow (#ffff00) across the path,
 * each staggered by a small animation-delay to create the trailing effect.
 *
 * Generated programmatically: r increments by 1/150, delay by ~2.83/150s.
 * Colors interpolate red→yellow across 150 steps.
 */
const COMET_CIRCLES = Array.from({ length: 150 }, (_, i) => {
  const t      = i / 149;                          // 0 → 1
  const r      = parseFloat((i * (1 / 149)).toFixed(3));
  const delay  = parseFloat((-(t * 2.827)).toFixed(3));

  // Interpolate hue: red (0°) → yellow (60°) in HSL, expressed as hex
  // Green channel goes 0 → 255 as t goes 0 → 1; red stays at 255
  const green  = Math.round(t * 255).toString(16).padStart(2, '0');
  const fill   = `#ff${green}00`;

  return { r, delay, fill };
});

// ─────────────────────────────────────────────────────────────────────────────
// SplashScreen Component
// ─────────────────────────────────────────────────────────────────────────────

function SplashScreen() {
  const navigate       = useNavigate();
  const processingRef  = useRef(null);

  const [splineLoaded,   setSplineLoaded]   = useState(false);
  const [splineError,    setSplineError]    = useState(false);
  const [supportsWebGL,  setSupportsWebGL]  = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  // Check WebGL on mount. If unavailable, redirect after a short delay
  // so users without GPU acceleration aren't stuck on the splash.
  useEffect(() => {
    const hasWebGL = checkWebGLSupport();
    setSupportsWebGL(hasWebGL);

    if (!hasWebGL) {
      const timer = setTimeout(() => navigate('/login', { replace: true }), NO_WEBGL_REDIRECT_DELAY);
      return () => clearTimeout(timer);
    }
  }, [navigate]);

  // If the Spline scene throws (network error, corrupt asset), redirect quickly
  // rather than leaving the user on a broken screen.
  useEffect(() => {
    if (!splineError) return;
    const timer = setTimeout(() => navigate('/login', { replace: true }), SPLINE_ERROR_REDIRECT_DELAY);
    return () => clearTimeout(timer);
  }, [splineError, navigate]);

  // Animate the "Setting things up for you" text once Spline has loaded.
  // Uses a mirror-delay pattern: characters at the edges animate last,
  // creating an outward wave effect from the centre of the string.
  useEffect(() => {
    if (!processingRef.current || !splineLoaded) return;

    const text       = 'Setting things up for you';
    const characters = text.split('');
    const total      = characters.length;

    processingRef.current.innerHTML = characters
      .map((char, i) => {
        // Mirror index: chars nearest the centre animate first
        const mirrorIndex = Math.min(i, total - 1 - i);
        const delay       = 2.1 + mirrorIndex * 0.08;
        return char === ' '
          ? '&nbsp;'
          : `<span style="animation-delay: ${delay}s">${char}</span>`;
      })
      .join('');
  }, [splineLoaded]);

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="splash-container">

      {/* ── Initial loading state — before Spline scene is ready ─────── */}
      {!splineLoaded && (
        <div className="splash-loading">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      )}

      <div className={`splash-content ${splineLoaded ? 'loaded' : ''}`}>

        {/* ── 3D Hero Scene ─────────────────────────────────────────────── */}
        <div className="splash-heroic">
          <div className="heroic-overlay"></div>
          {supportsWebGL ? (
            <Spline
              scene="https://prod.spline.design/0yhU6N4dQxKeYrkc/scene.splinecode"
              onLoad={() => setSplineLoaded(true)}
              onError={() => setSplineError(true)}
              style={{ width: '100%', height: '105vh' }}
            />
          ) : (
            <div className="spline-fallback" />
          )}
        </div>

        {/* ── Brand Copy + Buttons ──────────────────────────────────────── */}
        <div className="splash-info-knw-wrapper">
          <div className="splash-info-knw">
            <h1 className="organisation-name">Al Ansari</h1>

            {/* Animated character reveal — populated by the useEffect above */}
            <h1 className="processing" ref={processingRef}>
              Setting things up for you
            </h1>

            <p className="process-loading">
              Hang tight — we're getting everything ready for you.
            </p>

            {/* Decorative non-interactive buttons — cursors set to not-allowed */}
            <div className="infomation-buttons">
              <Button
                text="Sit Back"
                onClick={() => {}}
                colorScheme="white-500"
                variant="gradient"
                font="3xl"
                animation=""
                squircle="6xl"
                width="220px"
                height="58px"
                type="submit"
                textColor="black-200"
                shadowPosition="to-bottom"
                cursor="not-allowed"
                shadowColor="white-600"
              />
              <Button
                text="Take a Breath"
                onClick={() => {}}
                colorScheme="yellow-500"
                variant="gradient"
                font="3xl"
                animation=""
                squircle="6xl"
                width="220px"
                height="58px"
                type="submit"
                textColor="black-200"
                cursor="not-allowed"
                shadowPosition="to-bottom"
                shadowColor="white-600"
              />
            </div>
          </div>
        </div>

        {/* ── Comet Trail SVG Loader ────────────────────────────────────── */}
        {/*
          150 circles travel the same figure-8 bezier path.
          Each circle is slightly larger and warmer in colour than the last,
          and starts its animation a few milliseconds later — producing a
          comet-tail effect that fades from red to yellow.
        */}
        <div className="splash-loader">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="-2 -2 32 32" height="150" width="150">
            {COMET_CIRCLES.map(({ r, delay, fill }, i) => (
              <circle key={i} r={r} fill={fill}>
                <animateMotion
                  dur="5s"
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                  path={LOADER_PATH}
                />
              </circle>
            ))}
          </svg>
        </div>

      </div>
    </div>
  );
}

export default SplashScreen;