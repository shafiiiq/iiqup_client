import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoImage from '../../../assets/images/al-ansari.png';
import { LoginLogic } from '../../../utils/authUtils';
import { useSearch } from '../../../context/SearchContext';
import { useHeaderTitle } from '../../../context/HeaderTitleContext';
import { useHeaderVibration } from '../../../context/HeaderVibrationContext';
import { useAlert } from '../../../context/AlertContext';
import '../Header/Header.css';

const Header = ({ user_logged_in, currentUser, setUserLoggedIn }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { searchTerm, setSearchTerm, clearSearch } = useSearch();
  const { headerTitle, headerSubtitle } = useHeaderTitle();
  const { shouldVibrate, resetVibration } = useHeaderVibration();
  const { alert } = useAlert();
  const searchInputRef = useRef(null);
  const navRef = useRef(null);
  const activeItemRef = useRef(null);
  const indicatorRef = useRef(null);

  const [isVibrating, setIsVibrating] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('/');
  const [showNav, setShowNav] = useState(false);
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Navigation items with icons
  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: <span class="material-symbols-rounded">home</span>
    },
    {
      path: '/equipments',
      label: 'Equipments',
      icon: <span class="material-symbols-rounded">auto_towing</span>
    },
    {
      path: '/stock-manage',
      label: 'Stock',
      icon: <span class="material-symbols-rounded">shopping_cart</span>
    },
    {
      path: '/toolkits',
      label: 'Toolkits',
      icon: <span class="material-symbols-rounded">handyman</span>
    },
    {
      path: '/mechanics',
      label: 'Mechanics',
      icon: <span class="material-symbols-rounded">smart_toy</span>
    },
    {
      path: '/operators',
      label: 'Operators',
      icon: <span class="material-symbols-rounded">contacts_product</span>
    },
    {
      path: '/lpo-list',
      label: 'LPO',
      icon: <span class="material-symbols-rounded">edit_document</span>
    },
    {
      path: '/backcharge-list',
      label: 'Backcharges',
      icon: <span class="material-symbols-rounded">table_convert</span>
    },
    {
      path: '/documents',
      label: 'Documents',
      icon: <span class="material-symbols-rounded">files</span>
    },
    {
      path: '/notification',
      label: 'Notifications',
      icon: <span class="material-symbols-rounded">notification_audio</span>
    },
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: <span class="material-symbols-rounded">browse</span>
    }
  ];

  useEffect(() => {
    if (shouldVibrate) {
      setIsVibrating(true);

      // Remove the vibrating class after animation completes (300ms)
      setTimeout(() => {
        setIsVibrating(false);
        resetVibration();
      }, 300);
    }
  }, [shouldVibrate, resetVibration]);

  // In your Header component
  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark';
    if (isDark) {
      document.body.classList.add('dark-theme');
      setIsDarkMode(true);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    if (newTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    console.log(location.pathname);

    setActiveLink(location.pathname);
  }, [location]);

  useEffect(() => {
    updateIndicatorPosition();
  }, [activeLink]);

  const handleSearchToggle = () => {
    setSearchExpanded(!searchExpanded);
    if (!searchExpanded) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  };

  const handleSearchBlur = () => {
    if (!searchTerm) {
      setSearchExpanded(false);
    }
  };

  const updateIndicatorPosition = () => {
    if (!navRef.current) return;

    const navItems = navRef.current.querySelectorAll('li');
    let activeItem = null;

    navItems.forEach(item => {
      const link = item.querySelector('a');
      const href = link.getAttribute('href');
      const to = link.getAttribute('to');

      if ((to === activeLink) || (href === activeLink)) {
        activeItem = item;
      }
    });

    if (activeItem) {
      const activeLink = activeItem.querySelector('a');
      const { width, left } = activeLink.getBoundingClientRect();
      const navLeft = navRef.current.getBoundingClientRect().left;

      setIndicatorStyle({
        width: `${width * 0.8}px`,
        left: `${left - navLeft + (width * 0.1)}px`
      });
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleNavClick = (path) => {
    setActiveLink(path);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (confirmLogout) {
      LoginLogic.handleLogout(navigate, setUserLoggedIn);
      setMenuOpen(false);
    }
  };

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [menuOpen]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicatorPosition);
    setTimeout(updateIndicatorPosition, 100);

    return () => {
      window.removeEventListener('resize', updateIndicatorPosition);
    };
  }, []);

  // Get first letter of user's name for profile icon
  const getProfileInitial = () => {
    if (!currentUser?.name) return 'W';
    return currentUser.name.charAt(0).toUpperCase();
  };

  return (
    <header className={`main-header ${scrolled ? 'scrolled' : ''}`}>
      <div className="header-container">

        {/* user control section  */}
        {user_logged_in && (
          <div className="user-section">
            <div className="user-details">
              <div className="profile-icon">
                {getProfileInitial()}
              </div>
              <span className="user-name">{currentUser?.name}</span>
            </div>
            <div className="user-actions">
              <label className="theme-switch">
                <input type="checkbox" onChange={toggleTheme} checked={isDarkMode} />
                <span className="slider round">
                  <span className="material-icons sun-icon">wb_sunny</span>
                  <span className="material-icons moon-icon">nightlight_round</span>
                </span>
              </label>
              <button
                onClick={handleLogout}
                className="logout-btn"
                title="Logout"
              >
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <nav
          className={`header-nav ${searchExpanded ? 'shrink' : ''} ${headerTitle || alert ? 'has-title' : ''} ${isVibrating ? 'vibrating' : ''}`}
          ref={navRef}
          onMouseEnter={() => setShowNav(true)}
          onMouseLeave={() => setShowNav(false)}
        >
          {/* Alert Display - PRIORITY - shows for 3 seconds */}
          {alert && !showNav ? (
            <div className="header-alert">
              <span className="alert-icon material-symbols-rounded" style={{ color: `var(${alert.color})` }}>
                {alert.icon}
              </span>
              <span className="alert-message" style={{ color: `var(${alert.color})` }}>
                {alert.message}
              </span>
            </div>
          ) : headerTitle && !showNav ? (
            /* Title/Breadcrumb Display - shows only if NO alert */
            <div className="header-breadcrumb">
              <h1 className="breadcrumb-title">{headerTitle}</h1>
              {headerSubtitle && (
                <>
                  <span className="breadcrumb-separator">
                    <span class="material-symbols-rounded">
                      arrow_forward_ios
                    </span>
                  </span>
                  <h2 className="breadcrumb-subtitle">{headerSubtitle}</h2>
                </>
              )}
            </div>
          ) : null}

          {/* Normal Navigation */}
          <ul className={(headerTitle || alert) && !showNav ? 'nav-hidden' : ''}>
            {navItems.map((item, index) => (
              <li key={item.path} className={activeLink === item.path ? 'active' : ''}>
                <Link
                  to={item.path}
                  onClick={() => handleNavClick(item.path)}
                  title={item.label}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className={`global-search ${searchExpanded ? 'expanded' : ''}`}>
          <button
            className="search-icon-btn"
            onClick={handleSearchToggle}
            aria-label="Search"
          >
            <span className="material-symbols-rounded">
              search
            </span>
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
          {searchTerm && (  /* CHANGED from searchQuery */
            <button
              className="search-clear-btn"
              onClick={() => {
                clearSearch();  /* CHANGED */
                setSearchExpanded(false);
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* logo section  */}
        <div className="logo-section">
          <img src={logoImage} alt="Al Ansari Logo" className="header-logo" />
        </div>

      </div>
    </header>
  );
};

export default Header;