// Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoImage from '../../assets/images/al-ansari.png';
import Jcb from '../../assets/images/jcb.png';
import Excavator from '../../assets/images/excavator.jpg';
import Heavy from '../../assets/images/heavy.jpg';
import ViseChairman from '../../assets/images/vice-chairman.jpg';
import Chairman from '../../assets/images/chairman.png';
import MD from '../../assets/images/md.jpg';
import CEO from '../../assets/images/ceo.jpg';
import Manager from '../../assets/images/manager.jpg';
import WorkshopManager from '../../assets/images/workshop-manager.png';
import SalesManager from '../../assets/images/manager.jpg';
import ItHead from '../../assets/images/it-head.png';
import PurchaseManager from '../../assets/images/purchase-manager.jpg';
import { LoginLogic } from '../../utils/authUtils';
import "./Home.css";

// Leadership team data
const LEADERSHIP_TEAM = [
    {
        id: 1,
        name: 'Mr. Abdulrahman Abdulla Al Ansari',
        position: 'Chairman',
        image: Chairman
    },
    {
        id: 2,
        name: 'Mr. Abu Kombathayil',
        position: 'Vise Chairman & Founder',
        image: ViseChairman
    },
    {
        id: 3,
        name: 'Mr. Mohammed Shaheen',
        position: 'Managing Director',
        image: MD
    },
    {
        id: 4,
        name: 'Mr. Ahammed Kamal',
        position: 'Chief Executive Officer',
        image: CEO
    },
    {
        id: 5,
        name: 'Mr. Suresh Kanth',
        position: 'Operation Manager',
        image: Manager
    },
    {
        id: 6,
        name: 'Mr. Abdul Malik',
        position: 'Purchase Manager',
        image: PurchaseManager
    },
    {
        id: 7,
        name: 'Mr. Sruthin Kezhuvappaly',
        position: 'Sales Manager',
        image: SalesManager
    },
    {
        id: 8,
        name: 'Mr. Firoz Khan',
        position: 'Workshop Manger',
        image: WorkshopManager
    },
    {
        id: 9,
        name: 'Mr. Muhammed Shafeek',
        position: 'IT Head',
        image: ItHead
    }
];

function Home({ user_logged_in, currentUser, setUserLoggedIn }) {
    const location = useLocation();
    const navigate = useNavigate();
    const navRef = useRef(null);
    const activeItemRef = useRef(null);
    const indicatorRef = useRef(null);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeLink, setActiveLink] = useState('/');
    const [indicatorStyle, setIndicatorStyle] = useState({});
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

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
            const activeLinkElement = activeItem.querySelector('a');
            const { width, left } = activeLinkElement.getBoundingClientRect();
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

    const isDesktop = windowWidth >= 992;

    return (
        <div className="ansari-main-wrapper">
            {!isDesktop && (
                <header className={`ansari-top-nav ${scrolled ? 'ansari-nav-scrolled' : ''}`}>
                    <div className="ansari-nav-container">
                        <div className="ansari-logo-wrapper">
                            <img src={logoImage} alt="Al Ansari Logo" className="ansari-nav-logo" />
                        </div>

                        {/* user control section  */}
                        {user_logged_in && (
                            <div className="user-section-home">
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

                        <div className={`ansari-burger-btn ${menuOpen ? 'ansari-burger-active' : ''}`} onClick={toggleMenu}>
                            <div className="ansari-burger-inner">
                                <span className="ansari-burger-line ansari-line-1"></span>
                                <span className="ansari-burger-line ansari-line-2"></span>
                                <span className="ansari-burger-line ansari-line-3"></span>
                            </div>
                        </div>
                    </div>

                    <div className="ansari-header-bg">
                        <div className="ansari-header-shape ansari-hshape-1"></div>
                        <div className="ansari-header-shape ansari-hshape-2"></div>
                        <div className="ansari-header-shape ansari-hshape-3"></div>
                    </div>
                </header>
            )}

            {/* Mobile Navigation - Moved outside of header */}
            {!isDesktop && (
                <nav className={`ansari-mobile-nav ${menuOpen ? 'ansari-nav-open' : ''}`} ref={navRef}>
                    <div className="ansari-mobile-bg">
                        <div className="ansari-bg-shape ansari-shape-1"></div>
                        <div className="ansari-bg-shape ansari-shape-2"></div>
                        <div className="ansari-bg-shape ansari-shape-3"></div>
                        <div className="ansari-bg-shape ansari-shape-4"></div>
                    </div>

                    <div className="nav-indicator" ref={indicatorRef} style={indicatorStyle}></div>

                    <ul>
                        <li className={activeLink === '/' ? 'ansari-link-active' : ''}>
                            <Link to="/" onClick={() => handleNavClick('/')}>Home</Link>
                        </li>
                        <li className={activeLink === '/equipments' ? 'ansari-link-active' : ''}>
                            <Link to="/equipments" onClick={() => handleNavClick('/equipments')}>Equipments</Link>
                        </li>
                        <li className={activeLink === '/stock-manage' ? 'ansari-link-active' : ''}>
                            <Link to="/stock-manage" onClick={() => handleNavClick('/stock-manage')}>Stock Manage</Link>
                        </li>
                        <li className={activeLink === '/toolkits' ? 'ansari-link-active' : ''}>
                            <a href="/toolkits" onClick={() => handleNavClick('/toolkits')}>Tool kits</a>
                        </li>
                        <li className={activeLink === '/mechanics' ? 'ansari-link-active' : ''}>
                            <a href="/mechanics" onClick={() => handleNavClick('/mechanics')}>Mechanics</a>
                        </li>
                        <li className={activeLink === '#clients' ? 'active' : ''}>
                            <a href="/operators" onClick={() => handleNavClick('/operators')}>Operators</a>
                        </li>
                        <li className={activeLink === '/lpo-list' ? 'ansari-link-active' : ''}>
                            <a href="/lpo-list" onClick={() => handleNavClick('/lpo-list')}>LPO</a>
                        </li>
                        <li className={activeLink === '/backcharge-list' ? 'active' : ''}>
                            <a href="/backcharge-list" onClick={() => handleNavClick('/backcharge-list')}>Backcharges</a>
                        </li>
                        <li className={activeLink === '/documents' ? 'active' : ''}>
                            <Link to="/documents" onClick={() => handleNavClick('/documents')}>Documents</Link>
                        </li>
                        {/* <li className={activeLink === '#clients' ? 'active' : ''}>
                            <a href="/application-form" onClick={() => handleNavClick('/application-form')}>Leave/Loan Apply</a>
                        </li> */}
                        <li className={activeLink === '/notification/' ? 'ansari-link-active' : ''}>
                            <Link to="/notification" onClick={() => handleNavClick('/notification')}>Notifications</Link>
                        </li>
                        <li className={activeLink === '/dashboard' ? 'ansari-link-active' : ''}>
                            <Link to="/dashboard" onClick={() => handleNavClick('/dashboard')}>Dashboard</Link>
                        </li>
                    </ul>
                </nav>
            )}

            <div className={`ansari-content-wrapper ${!isDesktop ? 'ansari-mobile-mode' : ''}`}>
                <main className={`ansari-main-content ${!isDesktop ? 'ansari-full-width' : ''}`}>
                    <div className="ansari-hero-area">
                        <div className="ansari-hero-overlay"></div>
                        <img src={Excavator} alt="Hero Img" className="ansari-hero-img" />
                        <div className="ansari-hero-text">
                            <h1>Welcome to <br /> AI Ansari Connect</h1>
                            <p>Your Trusted Partner in Transport & Enterprises</p>
                        </div>
                    </div>

                    {/* Leadership Team Section */}
                    <div className="ansari-leadership-section">

                        <div className="ansari-section-heading">
                            <h2>Our Leadership Team</h2>
                            <p>The driving force behind our success</p>
                        </div>

                        <div className="ansari-leaders-grid">
                            {LEADERSHIP_TEAM.map(leader => (
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

                    <div className="ansari-info-section"
                        style={{
                            backgroundImage: `url(${Jcb})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundRepeat: 'no-repeat'
                        }}>
                        <div className="ansari-hero-overlay-1"></div>
                        <div className="ansari-company-info">
                            <div className="ansari-comp-name">AI Ansari Transport & Enterprises W.L.L</div>
                            <div>Building No .24, Street No .61, Area 92,
                                Logistic Park-A,
                            </div>
                            <div>Birkat Al Awamer, Doha, Qatar,
                                P.O Box 1265
                            </div>
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

                    <div className="ansari-info-section">
                        <div className="ansari-section-heading">
                            <h2>Our Services</h2>
                            {/* <p>The driving force behind our success</p> */}
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

                {isDesktop && (
                    <aside className="ansari-side-panel">
                        {user_logged_in && (
                            <div className="user-section-home">
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

                        <nav className="ansari-side-nav" ref={navRef}>
                            <ul>
                                <li className={activeLink === '/' ? 'ansari-nav-active' : ''}>
                                    <Link to="/" onClick={() => handleNavClick('/')}>Home</Link>
                                </li>
                                <li className={activeLink === '/equipments' ? 'ansari-nav-active' : ''}>
                                    <Link to="/equipments" onClick={() => handleNavClick('/equipments')}>Equipments</Link>
                                </li>
                                <li className={activeLink === '/stock-manage' ? 'ansari-nav-active' : ''}>
                                    <Link to="/stock-manage" onClick={() => handleNavClick('/stock-manage')}>Stock Manage</Link>
                                </li>
                                <li className={activeLink === '/toolkits' ? 'ansari-nav-active' : ''}>
                                    <a href="/toolkits" onClick={() => handleNavClick('/toolkits')}>Tool kits</a>
                                </li>
                                <li className={activeLink === '/mechanics' ? 'ansari-nav-active' : ''}>
                                    <a href="/mechanics" onClick={() => handleNavClick('/mechanics')}>Mechanics</a>
                                </li>
                                <li className={activeLink === '#clients' ? 'active' : ''}>
                                    <a href="/operators" onClick={() => handleNavClick('/operators')}>Operators</a>
                                </li>
                                <li className={activeLink === '/lpo-list' ? 'ansari-nav-active' : ''}>
                                    <a href="/lpo-list" onClick={() => handleNavClick('/lpo-list')}>LPO</a>
                                </li>
                                <li className={activeLink === '/backcharge-list' ? 'active' : ''}>
                                    <a href="/backcharge-list" onClick={() => handleNavClick('/backcharge-list')}>Backcharges</a>
                                </li>
                                <li className={activeLink === '/documents' ? 'active' : ''}>
                                    <Link to="/documents" onClick={() => handleNavClick('/documents')}>Documents</Link>
                                </li>
                                {/* <li className={activeLink === '#clients' ? 'active' : ''}>
                                    <a href="/application-form" onClick={() => handleNavClick('/application-form')}>Leave/Loan Apply</a>
                                </li> */}
                                <li className={activeLink === '/notification' ? 'ansari-nav-active' : ''}>
                                    <Link to="/notification" onClick={() => handleNavClick('/notification')}>Notifications</Link>
                                </li>
                                <li className={activeLink === '/dashboard' ? 'ansari-nav-active' : ''}>
                                    <Link to="/dashboard" onClick={() => handleNavClick('/dashboard')}>Dashboard</Link>
                                </li>
                            </ul>
                        </nav>
                    </aside>
                )}
            </div>
        </div>
    )
}

export default Home