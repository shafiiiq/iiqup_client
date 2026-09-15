import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { LoginLogic } from '@/features/screen/oauth/login/helper/login.helper';
import { useSearch } from '@/shared/context/SearchContext';
import { useHeaderTitle } from '@/shared/context/TitleContext';
import { useHeaderVibration } from '@/shared/context/VibrationContext';
import { useAlert } from '@/shared/context/AlertContext';
import { useNavTree } from '@/shared/context/NavTreeContext';
import { resolveNavTreeView } from '@/shared/context/navTree.util';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';

import brandLogo from '@assets/images/brand-logo.png';
import '@shared/components/app/header/Header.css';

const VIBRATION_DURATION_MS = 300;

const NAV_ITEMS = [
  { path: '/', label: 'Home', componentIcon: 'IconlyHome' },
  { path: '/equipments', label: 'Equipments', componentIcon: 'CraneIcon' },
  { path: '/stock/parts', label: 'Spare Parts', componentIcon: 'IconlyBuy' },
  { path: '/stock/toolkits', label: 'Safety Items', componentIcon: 'JacketIcon' },
  { path: '/mechanics', label: 'Mechanics', componentIcon: 'IconlyFace' },
  { path: '/operators', label: 'Operators', componentIcon: 'Iconly3user' },
  { path: '/order/purchase/list', label: 'PurchaseOrder', componentIcon: 'IconlyBag2' },
  { path: '/order/hire/list', label: 'Hire Orders', componentIcon: 'BrandIcon' },
  { path: '/quotation/list', label: 'Quotations', componentIcon: 'IconlyPaper' },
  { path: '/backcharge/list', label: 'Backcharges', componentIcon: 'ReturnIcon' },
  { path: '/documents', label: 'Documents', componentIcon: 'FolderIcon' },
  { path: '/notification', label: 'Notifications', componentIcon: 'IconlyNotification' },
  { path: '/dashboard', label: 'Dashboard', componentIcon: 'IconlyCategory' },
];

const joinClassNames = (...classNames) => classNames.filter(Boolean).join(' ');

const Header = ({ user_logged_in, currentUser, setUserLoggedIn }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { registration: navTreeReg } = useNavTree();
  const navTreeView = navTreeReg
    ? resolveNavTreeView(navTreeReg.rootLabel, navTreeReg.tree, navTreeReg.selectedPath)
    : null;
  const isNavTreeActive = Boolean(navTreeView);

  const subrouteBarRef = useRef(null);

  const { searchTerm, setSearchTerm, clearSearch } = useSearch();
  const { headerTitle, headerSubtitle } = useHeaderTitle();
  const { shouldVibrate, resetVibration } = useHeaderVibration();
  const { alert } = useAlert();

  const searchInputRef = useRef(null);
  const navRef = useRef(null);
  const userSectionRef = useRef(null);

  const [isVibrating, setIsVibrating] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeNavPath, setActiveNavPath] = useState('/');
  const [isNavHovered, setIsNavHovered] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      setIsDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (!shouldVibrate) return;
    setIsVibrating(true);
    const timer = setTimeout(() => {
      setIsVibrating(false);
      resetVibration();
    }, VIBRATION_DURATION_MS);
    return () => clearTimeout(timer);
  }, [shouldVibrate, resetVibration]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setActiveNavPath(location.pathname);
  }, [location]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (userSectionRef.current && !userSectionRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    const navEl = navRef.current;
    if (!navEl) return;

    let rafId;
    const updateOffsets = () => {
      const navRect = navEl.getBoundingClientRect();
      const barWidth = subrouteBarRef.current?.getBoundingClientRect().width ?? 0;
      const gap = 16;

      document.documentElement.style.setProperty('--shared-widget-header-subroute-left', `${navRect.right + gap}px`);
      document.documentElement.style.setProperty(
        '--shared-widget-header-search-left',
        `${navRect.right + gap + (subrouteBarRef.current ? barWidth + gap : 0)}px`
      );
      rafId = requestAnimationFrame(updateOffsets);
    };

    rafId = requestAnimationFrame(updateOffsets);
    return () => cancelAnimationFrame(rafId);
  }, [navTreeView]);

  const toggleTheme = () => {
    const nextIsDarkMode = !isDarkMode;
    setIsDarkMode(nextIsDarkMode);
    document.body.classList.toggle('dark-theme', nextIsDarkMode);
    localStorage.setItem('theme', nextIsDarkMode ? 'dark' : 'light');
  };

  const handleSearchToggle = () => {
    setIsSearchExpanded((wasExpanded) => {
      if (!wasExpanded) setTimeout(() => searchInputRef.current?.focus(), 300);
      return !wasExpanded;
    });
  };

  const handleNavClick = (path) => setActiveNavPath(path);

  const handleUserMenuToggle = () => setIsUserMenuOpen((wasOpen) => !wasOpen);

  const handleLogout = () => {
    if (!window.confirm('Are you sure you want to logout?')) return;
    LoginLogic.handleLogout(navigate, setUserLoggedIn);
  };

  const getProfileInitial = () => currentUser?.name?.charAt(0).toUpperCase() ?? 'W';

  const getActiveNavIcon = () =>
    NAV_ITEMS.find((item) => item.path === activeNavPath)?.componentIcon ?? 'IconlyPaper';

  const handleDownloadCenterClick = () => navigate('/download-center');

  const isContextualDisplayVisible = (headerTitle || alert) && !isNavHovered;

  return (
    <header
      className={joinClassNames(
        'shared-widget-header-root',
        isScrolled && 'shared-widget-header-root--scrolled'
      )}
    >
      <div className="shared-widget-header-container">

        <nav
          className={joinClassNames(
            'shared-widget-header-nav',
            isSearchExpanded && 'shared-widget-header-nav--shrink',
            isNavTreeActive && !isNavHovered && 'shared-widget-header-nav--shrink-tree',
            isContextualDisplayVisible && 'shared-widget-header-nav--has-title',
            isVibrating && 'shared-widget-header-nav--vibrating'
          )}
          ref={navRef}
          onMouseEnter={() => setIsNavHovered(true)}
          onMouseLeave={() => setIsNavHovered(false)}
        >
          {alert && !isNavHovered && (
            <div className="shared-widget-header-alert">
              <span className="material-symbols-rounded shared-widget-header-alert-icon" style={{ color: `var(${alert.color})` }}>
                {alert.icon}
              </span>
              <span className="shared-widget-header-alert-message" style={{ color: `var(${alert.color})` }}>
                {alert.message}
              </span>
            </div>
          )}

          <div className="shared-widget-header-logo-section">
            <img src={brandLogo} alt="R" className="shared-widget-header-logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }} />
          </div>

          {headerTitle && !alert && !isNavHovered && (
            <div className="shared-widget-header-breadcrumb">
              {isSearchExpanded ? (
                <span className="shared-widget-header-breadcrumb-icon">
                  {renderComponentIcon(getActiveNavIcon(), 40, 'currentColor')}
                </span>
              ) : (
                <>
                  <h1 className="shared-widget-header-breadcrumb-title">{headerTitle}</h1>
                  {headerSubtitle && (
                    <>
                      <span className="shared-widget-header-breadcrumb-separator">
                        <span className="material-symbols-rounded">arrow_forward_ios</span>
                      </span>
                      <h2 className="shared-widget-header-breadcrumb-subtitle">{headerSubtitle}</h2>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {isNavTreeActive && !isNavHovered ? (
            <div className="shared-widget-header-nav-tree-pill">
              {renderComponentIcon(navTreeReg.rootIcon || getActiveNavIcon(), 40, 'currentColor')}
              <span className="shared-widget-header-nav-tree-pill-label">{navTreeView.label}</span>
            </div>
          ) : (
            <ul className={joinClassNames(isContextualDisplayVisible && 'shared-widget-header-nav-hidden')}>
              {NAV_ITEMS.map((item) => (
                <li
                  key={item.path}
                  className={joinClassNames(activeNavPath === item.path && 'shared-widget-header-nav-item--active')}
                >
                  <Link to={item.path} onClick={() => handleNavClick(item.path)} title={item.label}>
                    <span className="shared-widget-header-nav-icon">
                      {renderComponentIcon(item.componentIcon, 40, 'currentColor')}
                    </span>
                    <span className="shared-widget-header-nav-text">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </nav>

        {isNavTreeActive && !isNavHovered && (
          <div className="shared-widget-header-subroute-bar" ref={subrouteBarRef}>
            {navTreeView.options.map((opt) => (
              <button
                key={opt.key}
                className={joinClassNames(
                  'shared-widget-header-subroute-item',
                  opt.key === navTreeView.selectedKey && 'shared-widget-header-subroute-item--active'
                )}
                onClick={() => navTreeReg.onSelect(navTreeView.depth, opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        <div
          className={joinClassNames('shared-widget-header-search', isSearchExpanded && 'shared-widget-header-search--expanded')}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="shared-widget-header-search-icon-btn" onClick={handleSearchToggle} aria-label="Search">
            {renderComponentIcon('IconlySearch', 40, 'currentColor')}
          </button>

          <input
            ref={searchInputRef}
            type="text"
            className="shared-widget-header-search-input"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {isSearchExpanded && (
            <button
              className="shared-widget-header-search-clear-btn"
              onClick={() => { clearSearch(); setIsSearchExpanded(false); }}
            >
              ×
            </button>
          )}
        </div>

        {user_logged_in && (
          <div
            ref={userSectionRef}
            className={joinClassNames('shared-widget-header-user-section', isUserMenuOpen && 'shared-widget-header-user-section--open')}
          >
            <button
              type="button"
              className="shared-widget-header-profile-icon"
              onClick={handleUserMenuToggle}
              aria-label="Account menu"
              aria-expanded={isUserMenuOpen}
            >
              {getProfileInitial()}
            </button>

            <div className="shared-widget-header-user-actions">
              <button type="button" className="shared-widget-header-theme-toggle" onClick={toggleTheme}>
                <span className="material-symbols-rounded shared-widget-header-theme-toggle-icon">
                  {isDarkMode ? 'dark_mode' : 'light_mode'}
                </span>
                <span className="shared-widget-header-action-label">
                  {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                </span>
              </button>

              <button type="button" className="shared-widget-header-logout-btn" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="16,17 21,12 16,7"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="21" y1="12" x2="9" y2="12"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="shared-widget-header-action-label">Logout</span>
              </button>

              <button type="button" className="shared-widget-header-download-btn" onClick={handleDownloadCenterClick}>
                <span className="material-symbols-rounded">download</span>
                <span className="shared-widget-header-action-label">Download Center</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </header>
  );
};

export default Header;