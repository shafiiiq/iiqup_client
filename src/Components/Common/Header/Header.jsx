// ─────────────────────────────────────────────────────────────────────────────
// Header.jsx — Global application header
// Renders the sticky top nav with: logo, navigation pills, global search,
// user controls (theme toggle + logout), alert banner, and breadcrumb title.
// Visibility and content are driven by context (search, title, alert, vibration).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate }     from 'react-router-dom';

import { LoginLogic }           from '../../../utils/authUtils';
import { useSearch }            from '../../../context/SearchContext';
import { useHeaderTitle }       from '../../../context/HeaderTitleContext';
import { useHeaderVibration }   from '../../../context/HeaderVibrationContext';
import { useAlert }             from '../../../context/AlertContext';

import logoImage from '../../../assets/images/al-ansari.png';
import '../Header/Header.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Duration (ms) of the header shake animation on triggered vibration. */
const VIBRATION_DURATION_MS = 300;

/**
 * Primary navigation items.
 * Icons use the Material Symbols Rounded font via className, not SVG imports,
 * so they render as ligature text nodes — no bundle cost.
 */
const NAV_ITEMS = [
  { path: '/',                label: 'Home',          icon: 'home'        },
  { path: '/equipments',      label: 'Equipments',    icon: 'auto_towing'        },
  { path: '/stock-manage',    label: 'Stock',         icon: 'shopping_cart'      },
  { path: '/toolkits',        label: 'Toolkits',      icon: 'handyman'           },
  { path: '/mechanics',       label: 'Mechanics',     icon: 'smart_toy'          },
  { path: '/operators',       label: 'Operators',     icon: 'contacts_product'   },
  { path: '/lpo-list',        label: 'LPO',           icon: 'edit_document'      },
  { path: '/backcharge-list', label: 'Backcharges',   icon: 'table_convert'      },
  { path: '/documents',       label: 'Documents',     icon: 'files'              },
  { path: '/notification',    label: 'Notifications', icon: 'notification_audio' },
  { path: '/dashboard',       label: 'Dashboard',     icon: 'browse'             },
];

// ─────────────────────────────────────────────────────────────────────────────
// Header Component
// ─────────────────────────────────────────────────────────────────────────────

const Header = ({ user_logged_in, currentUser, setUserLoggedIn }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // ── Context ────────────────────────────────────────────────────────────────

  const { searchTerm, setSearchTerm, clearSearch } = useSearch();
  const { headerTitle, headerSubtitle }            = useHeaderTitle();
  const { shouldVibrate, resetVibration }          = useHeaderVibration();
  const { alert }                                  = useAlert();

  // ── Refs ───────────────────────────────────────────────────────────────────

  const searchInputRef = useRef(null);
  const navRef         = useRef(null);

  // ── State ──────────────────────────────────────────────────────────────────

  const [isVibrating,     setIsVibrating]     = useState(false);
  const [scrolled,        setScrolled]        = useState(false);
  const [activeLink,      setActiveLink]      = useState('/');
  const [showNav,         setShowNav]         = useState(false);   // true on nav hover
  const [isDarkMode,      setIsDarkMode]      = useState(false);
  const [searchExpanded,  setSearchExpanded]  = useState(false);

  // ─────────────────────────────────────────────────────────────────────────
  // Effects
  // ─────────────────────────────────────────────────────────────────────────

  // Restore persisted dark-mode preference on mount.
  useEffect(() => {
    if (localStorage.getItem('theme') === 'dark') {
      document.body.classList.add('dark-theme');
      setIsDarkMode(true);
    }
  }, []);

  // Trigger the CSS shake animation when an external vibration event fires.
  useEffect(() => {
    if (!shouldVibrate) return;
    setIsVibrating(true);
    const timer = setTimeout(() => {
      setIsVibrating(false);
      resetVibration();
    }, VIBRATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [shouldVibrate, resetVibration]);

  // Apply the 'scrolled' class once the page scrolls past 10px.
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync the active nav item with the current route.
  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location]);

  // ─────────────────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────────────────

  /** Toggles light/dark theme and persists the choice to localStorage. */
  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.body.classList.toggle('dark-theme', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  /** Expands the search bar and auto-focuses the input after the CSS transition. */
  const handleSearchToggle = () => {
    setSearchExpanded((prev) => {
      if (!prev) setTimeout(() => searchInputRef.current?.focus(), 300);
      return !prev;
    });
  };

  /** Collapses the search bar when the input loses focus and is empty. */
  const handleSearchBlur = () => {
    if (!searchTerm) setSearchExpanded(false);
  };

  const handleNavClick = (path) => setActiveLink(path);

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) return;
    LoginLogic.handleLogout(navigate, setUserLoggedIn);
  };

  /** Returns the first letter of the current user's name, or 'W' as fallback. */
  const getProfileInitial = () => currentUser?.name?.charAt(0).toUpperCase() ?? 'W';

  // ─────────────────────────────────────────────────────────────────────────
  // Derived Values
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * When the user is NOT hovering the nav, the nav pills are hidden and replaced
   * by either an alert banner (priority) or a breadcrumb title.
   */
  const hasContextualDisplay = (headerTitle || alert) && !showNav;

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-container">

        {/* ── User Controls ────────────────────────────────────────────── */}
        {user_logged_in && (
          <div className="user-section">
            <div className="user-details">
              <div className="profile-icon">{getProfileInitial()}</div>
              <span className="user-name">{currentUser?.name}</span>
            </div>

            <div className="user-actions">
              {/* BB8 animated day/night theme toggle */}
              <label className="bb8-toggle">
                <input
                  className="bb8-toggle__checkbox"
                  type="checkbox"
                  onChange={toggleTheme}
                  checked={isDarkMode}
                />
                <div className="bb8-toggle__container">
                  <div className="bb8-toggle__scenery">
                    <div className="bb8-toggle__star"></div>
                    <div className="bb8-toggle__star"></div>
                    <div className="bb8-toggle__star"></div>
                    <div className="bb8-toggle__star"></div>
                    <div className="bb8-toggle__star"></div>
                    <div className="bb8-toggle__star"></div>
                    <div className="bb8-toggle__star"></div>
                    <div className="tatto-1"></div>
                    <div className="tatto-2"></div>
                    <div className="gomrassen"></div>
                    <div className="hermes"></div>
                    <div className="chenini"></div>
                    <div className="bb8-toggle__cloud"></div>
                    <div className="bb8-toggle__cloud"></div>
                    <div className="bb8-toggle__cloud"></div>
                  </div>
                  <div className="bb8">
                    <div className="bb8__head-container">
                      <div className="bb8__antenna"></div>
                      <div className="bb8__antenna"></div>
                      <div className="bb8__head"></div>
                    </div>
                    <div className="bb8__body"></div>
                  </div>
                  <div className="artificial__hidden">
                    <div className="bb8__shadow"></div>
                  </div>
                </div>
              </label>

              <button onClick={handleLogout} className="logout-btn" title="Logout">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="16,17 21,12 16,7"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="21" y1="12" x2="9" y2="12"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* ── Navigation ───────────────────────────────────────────────── */}
        <nav
          className={[
            'header-nav',
            searchExpanded          ? 'shrink'     : '',
            hasContextualDisplay    ? 'has-title'  : '',
            isVibrating             ? 'vibrating'  : '',
          ].filter(Boolean).join(' ')}
          ref={navRef}
          onMouseEnter={() => setShowNav(true)}
          onMouseLeave={() => setShowNav(false)}
        >
          {/* Alert banner — highest priority, replaces nav pills and title */}
          {alert && !showNav && (
            <div className="header-alert">
              <span className="alert-icon material-symbols-rounded" style={{ color: `var(${alert.color})` }}>
                {alert.icon}
              </span>
              <span className="alert-message" style={{ color: `var(${alert.color})` }}>
                {alert.message}
              </span>
            </div>
          )}

          {/* Breadcrumb title — shown when no alert and user is not hovering */}
          {headerTitle && !alert && !showNav && (
            <div className="header-breadcrumb">
              <h1 className="breadcrumb-title">{headerTitle}</h1>
              {headerSubtitle && (
                <>
                  <span className="breadcrumb-separator">
                    <span className="material-symbols-rounded">arrow_forward_ios</span>
                  </span>
                  <h2 className="breadcrumb-subtitle">{headerSubtitle}</h2>
                </>
              )}
            </div>
          )}

          {/* Nav pills — hidden behind alert/title until user hovers */}
          <ul className={hasContextualDisplay ? 'nav-hidden' : ''}>
            {NAV_ITEMS.map((item) => (
              <li key={item.path} className={activeLink === item.path ? 'active' : ''}>
                <Link to={item.path} onClick={() => handleNavClick(item.path)} title={item.label}>
                  <span className="nav-icon">
                    <span className="material-symbols-rounded">{item.icon}</span>
                  </span>
                  <span className="nav-text">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* ── Global Search ─────────────────────────────────────────────── */}
        <div className={`global-search ${searchExpanded ? 'expanded' : ''}`}>
          <button className="search-icon-btn" onClick={handleSearchToggle} aria-label="Search">
            <span className="material-symbols-rounded">search</span>
          </button>

          <input
            ref={searchInputRef}
            type="text"
            className="search-input"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onBlur={handleSearchBlur}
          />

          {searchTerm && (
            <button
              className="search-clear-btn"
              onClick={() => { clearSearch(); setSearchExpanded(false); }}
            >
              ×
            </button>
          )}
        </div>

        {/* ── Logo ─────────────────────────────────────────────────────── */}
        <div className="logo-section">
          <img src={logoImage} alt="Al Ansari Logo" className="header-logo" />
        </div>

      </div>
    </header>
  );
};

export default Header;