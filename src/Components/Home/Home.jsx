// ─────────────────────────────────────────────────────────────────────────────
// Home.jsx — Landing page
// Renders the public-facing hero, leadership team, company info, and services.
// Includes responsive navigation: sidebar on desktop, top nav + drawer on mobile.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { LoginLogic } from '../../utils/authUtils';

// ── Assets ───────────────────────────────────────────────────────────────────
import logoImage from '../../assets/images/al-ansari.png';
import Jcb from '../../assets/images/jcb.png';
import Excavator from '../../assets/images/excavator.jpg';
import Chairman from '../../assets/images/chairman.png';
import ViseChairman from '../../assets/images/vice-chairman.jpg';
import MD from '../../assets/images/md.jpg';
import CEO from '../../assets/images/ceo.jpg';
import Manager from '../../assets/images/manager.jpg';
import PurchaseManager from '../../assets/images/purchase-manager.jpg';
import SalesManager from '../../assets/images/sales-manager.JPG';
import WorkshopManager from '../../assets/images/workshop-manager.png';
import ItHead from '../../assets/images/it-head.png';

import './Home.css';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Breakpoint (px) at which the layout switches from mobile to desktop. */
const DESKTOP_BREAKPOINT = 992;

/** Leadership team data — update here when personnel changes. */
const LEADERSHIP_TEAM = [
  { id: 1, name: 'Mr. Abdulrahman Abdulla Al Ansari', position: 'Chairman', image: Chairman },
  { id: 2, name: 'Mr. Abu Kombathayil', position: 'Vise Chairman & Founder', image: ViseChairman },
  { id: 3, name: 'Mr. Mohammed Shaheen', position: 'Managing Director', image: MD },
  { id: 4, name: 'Mr. Ahammed Kamal', position: 'Chief Executive Officer', image: CEO },
  { id: 5, name: 'Mr. Suresh Kanth', position: 'Operation Manager', image: Manager },
  { id: 6, name: 'Mr. Abdul Malik', position: 'Purchase Manager', image: PurchaseManager },
  { id: 7, name: 'Mr. Sruthin Kezhuvappaly', position: 'Sales Manager', image: SalesManager },
  { id: 8, name: 'Mr. Firoz Khan', position: 'Workshop Manager', image: WorkshopManager },
  { id: 9, name: 'Mr. Muhammed Shafeek', position: 'IT Head', image: ItHead },
];

/**
 * Sidebar navigation, grouped into separate "tabs".
 * Each group renders as its own self-contained panel with its own scroll
 * area, so adding more groups or more items to a group never affects the
 * others. To add a new tab, push a new { id, label, links } entry here —
 * no JSX or CSS changes required.
 */
const NAV_GROUPS = [
  {
    id: 'garage',
    label: 'Garage',
    links: [
      { label: 'Equipments', path: '/equipments' },
      { label: 'Stock Manage', path: '/stock-manage' },
      { label: 'Tool Kits', path: '/toolkits' },
      { label: 'Mechanics', path: '/mechanics' },
      { label: 'LPO', path: '/lpo-list' },
      { label: 'Backcharges', path: '/backcharge-list' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations',
    links: [
      { label: 'Equipments', path: '/equipments' },
      { label: 'Operators', path: '/operators' },
    ],
  },
  {
    id: 'admin',
    label: 'Admin',
    links: [
      { label: 'Documents', path: '/documents' },
    ],
  },
  {
    id: 'alerts',
    label: 'Alerts',
    links: [
      { label: 'Notifications', path: '/notification' },
    ],
  },
  {
    id: 'overview',
    label: 'Overview',
    links: [
      { label: 'Dashboard', path: '/dashboard' },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Home Component
// ─────────────────────────────────────────────────────────────────────────────

function Home({ user_logged_in, currentUser, setUserLoggedIn }) {
  const location = useLocation();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────────────

  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeLink, setActiveLink] = useState('/');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const isDesktop = windowWidth >= DESKTOP_BREAKPOINT;

  // ── Effects ────────────────────────────────────────────────────────────────

  // Track window width for responsive layout switching
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect scroll to apply sticky nav style
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Sync active link with current route
  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location]);

  // Lock body scroll when the mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [menuOpen]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const toggleMenu = () => setMenuOpen((prev) => !prev);

  const handleNavClick = (path) => {
    setActiveLink(path);
    setMenuOpen(false);
  };

  /** Toggles light/dark theme and persists the preference to localStorage. */
  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    document.body.classList.toggle('dark-theme', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) return;
    LoginLogic.handleLogout(navigate, setUserLoggedIn);
    setMenuOpen(false);
  };

  /** Returns the first letter of the current user's name, or 'W' as fallback. */
  const getProfileInitial = () => currentUser?.name?.charAt(0).toUpperCase() ?? 'W';

  // ─────────────────────────────────────────────────────────────────────────
  // Sub-components (defined inline — small, tightly coupled to this view)
  // ─────────────────────────────────────────────────────────────────────────

  /** Shared user info + theme toggle + logout controls. Rendered as its own tab. */
  const UserControls = ({ isMobile }) => (
    <div className="user-section-home">
      <div className="user-details">
        <div className="profile-icon">{getProfileInitial()}</div>
        <span className="user-name">{currentUser?.name}</span>
      </div>
      <div className="user-actions">
        {isMobile ? (
          // Mobile: simple checkbox toggle
          <label className="theme-switch">
            <input type="checkbox" onChange={toggleTheme} checked={isDarkMode} />
            <span className="slider round">
              <span className="material-icons sun-icon">wb_sunny</span>
              <span className="material-icons moon-icon">nightlight_round</span>
            </span>
          </label>
        ) : (
          // Desktop: animated BB8 toggle
          <label className="bb8-toggle">
            <input className="bb8-toggle__checkbox" type="checkbox" onChange={toggleTheme} checked={isDarkMode} />
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
        )}

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
  );

  /**
   * Renders a single navigation tab/group as an isolated panel.
   * Each group has its own header + its own scrollable list, so a group
   * with many items scrolls internally without affecting sibling groups.
   */
  const NavGroup = ({ group, activeClass }) => (
    <div className="ansari-nav-group" data-group={group.id}>
      <div className="ansari-nav-group-title">{group.label}</div>
      <ul className="ansari-nav-group-list">
        {group.links.map(({ label, path }) => (
          <li key={`${group.id}-${path}`} className={activeLink === path ? activeClass : ''}>
            <Link to={path} onClick={() => handleNavClick(path)}>{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="ansari-main-wrapper">

      {/* ── Mobile Top Navigation ─────────────────────────────────────── */}
      {!isDesktop && (
        <header className={`ansari-top-nav ${scrolled ? 'ansari-nav-scrolled' : ''}`}>
          <div className="ansari-nav-container">

            <div className="ansari-logo-wrapper">
              <img src={logoImage} alt="Al Ansari Logo" className="ansari-nav-logo" />
            </div>

            {user_logged_in && <UserControls isMobile />}

            <div
              className={`ansari-burger-btn ${menuOpen ? 'ansari-burger-active' : ''}`}
              onClick={toggleMenu}
            >
              <div className="ansari-burger-inner">
                <span className="ansari-burger-line ansari-line-1"></span>
                <span className="ansari-burger-line ansari-line-2"></span>
                <span className="ansari-burger-line ansari-line-3"></span>
              </div>
            </div>
          </div>

          {/* Decorative background shapes */}
          <div className="ansari-header-bg">
            <div className="ansari-header-shape ansari-hshape-1"></div>
            <div className="ansari-header-shape ansari-hshape-2"></div>
            <div className="ansari-header-shape ansari-hshape-3"></div>
          </div>
        </header>
      )}

      {/* ── Mobile Navigation Drawer ──────────────────────────────────── */}
      {!isDesktop && (
        <nav className={`ansari-mobile-nav ${menuOpen ? 'ansari-nav-open' : ''}`}>
          <div className="ansari-mobile-bg">
            <div className="ansari-bg-shape ansari-shape-1"></div>
            <div className="ansari-bg-shape ansari-shape-2"></div>
            <div className="ansari-bg-shape ansari-shape-3"></div>
            <div className="ansari-bg-shape ansari-shape-4"></div>
          </div>

          <div className="ansari-mobile-nav-scroll">
            {NAV_GROUPS.map((group) => (
              <NavGroup key={group.id} group={group} activeClass="ansari-link-active" />
            ))}
          </div>
        </nav>
      )}

      {/* ── Main Content Area ─────────────────────────────────────────── */}
      <div className={`ansari-content-wrapper ${!isDesktop ? 'ansari-mobile-mode' : ''}`}>
        <main className={`ansari-main-content ${!isDesktop ? 'ansari-full-width' : ''}`}>

          {/* Hero */}
          <div className="ansari-hero-area">
            <div className="ansari-hero-overlay"></div>
            <img src={Excavator} alt="Hero" className="ansari-hero-img" />
            <div className="ansari-hero-text">
              <h1>Welcome to <br /> AI Ansari Connect</h1>
              <p>Your Trusted Partner in Transport & Enterprises</p>
            </div>
          </div>

          {/* Leadership Team */}
          <div className="ansari-leadership-section">
            <div className="ansari-section-heading">
              <h2>Our Leadership Team</h2>
              <p>The driving force behind our success</p>
            </div>
            <div className="ansari-leaders-grid">
              {LEADERSHIP_TEAM.map((leader) => (
                <div key={leader.id} className="ansari-leader-card">
                  <div className="ansari-leader-image">
                    <img src={leader.image} alt={leader.name} />
                  </div>
                  <div className="ansari-leader-info">
                    <h3>{leader.name}</h3>
                    <p>{leader.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Company Info Banner */}
          <div
            className="ansari-info-section"
            style={{ backgroundImage: `url(${Jcb})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}
          >
            <div className="ansari-hero-overlay-1"></div>
            <div className="ansari-company-info">
              <div className="ansari-comp-name">AI Ansari Transport & Enterprises W.L.L</div>
              <div>Building No. 24, Street No. 61, Area 92, Logistic Park-A,</div>
              <div>Birkat Al Awamer, Doha, Qatar, P.O Box 1265</div>
              <div className="ansari-logo-holder home-hero-logo">
                <img src={logoImage} alt="Company Logo" className="ansari-main-logo" />
              </div>
              <div className="ansari-contact-block">
                <div className="ansari-phone-info">
                  <span>Tel: +974 44505 700/800</span>
                  <span>Fax: +974 44505 900</span>
                </div>
                <div className="ansari-email-info">
                  <span>info@ansarigroup.co</span>
                  <span>www.ansarigroup.co</span>
                </div>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="ansari-info-section">
            <div className="ansari-section-heading">
              <h2>Our Services</h2>
            </div>
            <div className="ansari-feature-cards">
              <div className="ansari-card-item">
                <h3>Transport Services</h3>
                <p>We provide reliable and efficient transport solutions for all your needs.</p>
              </div>
              <div className="ansari-card-item">
                <h3>Logistics Management</h3>
                <p>End-to-end logistics solutions tailored to your business requirements.</p>
              </div>
              <div className="ansari-card-item">
                <h3>Global Network</h3>
                <p>Connected worldwide to serve you better across continents.</p>
              </div>
            </div>
          </div>

        </main>

        {/* ── Desktop Sidebar ─────────────────────────────────────────── */}
        {isDesktop && (
          <aside className="ansari-side-panel">
            {user_logged_in && <UserControls isMobile={false} />}

            {NAV_GROUPS.map((group) => (
              <NavGroup key={group.id} group={group} activeClass="ansari-nav-active" />
            ))}
          </aside>
        )}
      </div>
    </div>
  );
}

export default Home;