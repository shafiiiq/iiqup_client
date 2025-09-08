import React, { useEffect, useState, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoImage from '../../../assets/images/al-ansari.png';
import { LoginLogic } from '../../../utils/authUtils';
import '../Header/Header.css';

const Header = ({ user_logged_in, currentUser, setUserLoggedIn }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('/');
  const [indicatorStyle, setIndicatorStyle] = useState({});
  const navRef = useRef(null);
  const activeItemRef = useRef(null);
  const indicatorRef = useRef(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
    setActiveLink(location.pathname);
  }, [location]);

  useEffect(() => {
    updateIndicatorPosition();
  }, [activeLink]);

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
        <div className="logo-section">
          <img src={logoImage} alt="Al Ansari Logo" className="header-logo" />
        </div>

        <div className={`hamburger-menu ${menuOpen ? 'active' : ''}`} onClick={toggleMenu}>
          <div className="hamburger-inner">
            <span className="line line-1"></span>
            <span className="line line-2"></span>
            <span className="line line-3"></span>
          </div>
        </div>

        <nav className={`header-nav ${menuOpen ? 'open' : ''}`} ref={navRef}>
          <div className="mobile-nav-background">
            <div className="animated-shape shape1"></div>
            <div className="animated-shape shape2"></div>
            <div className="animated-shape shape3"></div>
            <div className="animated-shape shape4"></div>
          </div>

          <div className="nav-indicator" ref={indicatorRef} style={indicatorStyle}></div>

          <ul>
            <li className={activeLink === '/' ? 'active' : ''}>
              <Link to="/">Home</Link>
            </li>
            <li className={activeLink === '/equipments' ? 'active' : ''}>
              <Link to="/equipments" onClick={() => handleNavClick('/equipments')}>Equipements Inventory</Link>
            </li>
            <li className={activeLink === '/stock-manage' ? 'active' : ''}>
              <Link to="/stock-manage" onClick={() => handleNavClick('/stock-manage')}>Stock Manage</Link>
            </li>
            <li className={activeLink === '#clients' ? 'active' : ''}>
              <a href="/toolkits" onClick={() => handleNavClick('/toolkits')}>Tool kits</a>
            </li>
            <li className={activeLink === '#clients' ? 'active' : ''}>
              <a href="/mechanics" onClick={() => handleNavClick('/mechanics')}>Mechanics</a>
            </li>
            <li className={activeLink === '#clients' ? 'active' : ''}>
              <a href="/operators" onClick={() => handleNavClick('/operators')}>Operators</a>
            </li>
            <li className={activeLink === '#clients' ? 'active' : ''}>
              <a href="/lpo-list" onClick={() => handleNavClick('/lpo-list')}>LPO For Quatation</a>
            </li>
            <li className={activeLink === '/documents' ? 'active' : ''}>
              <Link to="/documents" onClick={() => handleNavClick('/documents')}>Documents</Link>
            </li>
            <li className={activeLink === '/notification' ? 'active' : ''}>
              <Link to="/notification" onClick={() => handleNavClick('/notification')}>Notifications</Link>
            </li>
            <li className={activeLink === '/dashboard' ? 'active' : ''}>
              <Link to="/dashboard" onClick={() => handleNavClick('/dashboard')}>Dashboard</Link>
            </li>
          </ul>
        </nav>


        {user_logged_in && (
          <div className="user-section">
            <label className="theme-switch">
              <input type="checkbox" onChange={toggleTheme} checked={isDarkMode} />
              <span className="slider round">
                <span className="material-icons sun-icon">wb_sunny</span>
                <span className="material-icons moon-icon">nightlight_round</span>
              </span>
            </label>
            <div className="profile-icon">
              {getProfileInitial()}
            </div>
            <div className="user-actions">
              <span className="user-name">{currentUser?.name}</span>
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
      </div>

      <div className="header-background">
        <div className="animated-shape shape1"></div>
        <div className="animated-shape shape2"></div>
        <div className="animated-shape shape3"></div>
      </div>
    </header>
  );
};

export default Header;