// Home.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import logoImage from '../../assets/images/al-ansari.png';
import Jcb from '../../assets/images/jcb.png';
import { LoginLogic } from '../../utils/authUtils';
import "./Home.css";

function Home({ user_logged_in, currentUser, setUserLoggedIn }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const [menuOpen, setMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [activeLink, setActiveLink] = useState('/');
    const [indicatorStyle, setIndicatorStyle] = useState({});
    const navRef = useRef(null);
    const activeItemRef = useRef(null);
    const indicatorRef = useRef(null);

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

                        <div className={`ansari-burger-btn ${menuOpen ? 'ansari-burger-active' : ''}`} onClick={toggleMenu}>
                            <div className="ansari-burger-inner">
                                <span className="ansari-burger-line ansari-line-1"></span>
                                <span className="ansari-burger-line ansari-line-2"></span>
                                <span className="ansari-burger-line ansari-line-3"></span>
                            </div>
                        </div>

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
                                    <Link to="/equipments" onClick={() => handleNavClick('/equipments')}>Equipements Inventory</Link>
                                </li>
                                <li className={activeLink === '/documents' ? 'ansari-link-active' : ''}>
                                    <Link to="/documents" onClick={() => handleNavClick('/documents')}>Documents</Link>
                                </li>
                                <li className={activeLink === '/stock-manage' ? 'ansari-link-active' : ''}>
                                    <Link to="/stock-manage" onClick={() => handleNavClick('/stock-manage')}>Stock Manage</Link>
                                </li>
                                <li className={activeLink === '/notification/next-full-service' ? 'ansari-link-active' : ''}>
                                    <Link to="/notification/next-full-service" onClick={() => handleNavClick('/notification/next-full-service')}>Notifications</Link>
                                </li>
                                <li className={activeLink === '/lpo-list' ? 'ansari-link-active' : ''}>
                                    <a href="/lpo-list" onClick={() => handleNavClick('/lpo-list')}>LPO For Quatation</a>
                                </li>
                                <li className={activeLink === '/toolkits' ? 'ansari-link-active' : ''}>
                                    <a href="/toolkits" onClick={() => handleNavClick('/toolkits')}>Tool kits</a>
                                </li>
                                <li className={activeLink === '/mechanics' ? 'ansari-link-active' : ''}>
                                    <a href="/mechanics" onClick={() => handleNavClick('/mechanics')}>Mechanics</a>
                                </li>
                                <li className={activeLink === '/dashboard' ? 'ansari-link-active' : ''}>
                                    <Link to="/dashboard" onClick={() => handleNavClick('/dashboard')}>Dashboard</Link>
                                </li>
                            </ul>
                        </nav>

                        {user_logged_in && (
                            <div className="ansari-user-section">
                                <div className="ansari-profile-icon">
                                    {getProfileInitial()}
                                </div>
                                <div className="ansari-user-actions">
                                    <span className="ansari-user-name">{currentUser?.name}</span>
                                    <button 
                                        onClick={handleLogout}
                                        className="ansari-logout-btn"
                                        title="Logout"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="ansari-header-bg">
                        <div className="ansari-header-shape ansari-hshape-1"></div>
                        <div className="ansari-header-shape ansari-hshape-2"></div>
                        <div className="ansari-header-shape ansari-hshape-3"></div>
                    </div>
                </header>
            )}

            <div className={`ansari-content-wrapper ${!isDesktop ? 'ansari-mobile-mode' : ''}`}>
                {isDesktop && (
                    <aside className="ansari-side-panel">
                        <div className="ansari-sidebar-bg">
                            <div className="ansari-side-shape ansari-sshape-1"></div>
                            <div className="ansari-side-shape ansari-sshape-2"></div>
                            <div className="ansari-side-shape ansari-sshape-3"></div>
                        </div>

                        <div className="ansari-logo-holder">
                            <img src={logoImage} alt="Company Logo" className="ansari-main-logo" />
                        </div>

                        <nav className="ansari-side-nav" ref={navRef}>
                            <ul>
                                <li className={activeLink === '/' ? 'ansari-nav-active' : ''}>
                                    <Link to="/" onClick={() => handleNavClick('/')}>Home</Link>
                                </li>
                                <li className={activeLink === '/equipments' ? 'ansari-nav-active' : ''}>
                                    <Link to="/equipments" onClick={() => handleNavClick('/equipments')}>Equipements Inventory</Link>
                                </li>
                                <li className={activeLink === '/documents' ? 'ansari-nav-active' : ''}>
                                    <Link to="/documents" onClick={() => handleNavClick('/documents')}>Documents</Link>
                                </li>
                                <li className={activeLink === '/stock-manage' ? 'ansari-nav-active' : ''}>
                                    <Link to="/stock-manage" onClick={() => handleNavClick('/stock-manage')}>Stock Manage</Link>
                                </li>
                                <li className={activeLink === '/notification/next-full-service' ? 'ansari-nav-active' : ''}>
                                    <Link to="/notification/next-full-service" onClick={() => handleNavClick('/notification/next-full-service')}>Notifications</Link>
                                </li>
                                <li className={activeLink === '/lpo-list' ? 'ansari-nav-active' : ''}>
                                    <a href="/lpo-list" onClick={() => handleNavClick('/lpo-list')}>LPO For Quatation</a>
                                </li>
                                <li className={activeLink === '/toolkits' ? 'ansari-nav-active' : ''}>
                                    <a href="/toolkits" onClick={() => handleNavClick('/toolkits')}>Tool kits</a>
                                </li>
                                <li className={activeLink === '/mechanics' ? 'ansari-nav-active' : ''}>
                                    <a href="/mechanics" onClick={() => handleNavClick('/mechanics')}>Mechanics</a>
                                </li>
                                <li className={activeLink === '/dashboard' ? 'ansari-nav-active' : ''}>
                                    <Link to="/dashboard" onClick={() => handleNavClick('/dashboard')}>Dashboard</Link>
                                </li>
                            </ul>
                        </nav>

                        {user_logged_in && (
                            <div className="ansari-side-user-section">
                                <div className="ansari-profile-icon">
                                    {getProfileInitial()}
                                </div>
                                <div className="ansari-user-actions">
                                    <span className="ansari-user-name">{currentUser?.name}</span>
                                    <button 
                                        onClick={handleLogout}
                                        className="ansari-logout-btn"
                                        title="Logout"
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <polyline points="16,17 21,12 16,7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="21" y1="12" x2="9" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        )}
                    </aside>
                )}

                <main className={`ansari-main-content ${!isDesktop ? 'ansari-full-width' : ''}`}>
                    <div className="ansari-hero-area">
                        <div className="ansari-hero-overlay"></div>
                        <img src={Jcb} alt="Hero Img" className="ansari-hero-img" />
                        <div className="ansari-hero-text">
                            <h1>Welcome to AI Ansari Transport & Enterprises</h1>
                            <p>Your Trusted Partner in Transport and Logistics</p>
                        </div>
                    </div>

                    <div className="ansari-info-section">
                        <div className="ansari-company-info">
                            <div className="ansari-comp-name">AI Ansari Transport & Enterprises W.L.L</div>
                            <div>Office No.2 Floor No.1 Gate No.3 Town Centre</div>
                            <div>Bin Omran, Doha, Qatar, P.O BOX-1265</div>
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

                        <div className="ansari-feature-cards">
                            <div className="ansari-card-item">
                                <div className="ansari-card-icon">
                                    <i className="ansari-icon-transport"></i>
                                </div>
                                <h3>Transport Services</h3>
                                <p>We provide reliable and efficient transport solutions for all your needs.</p>
                            </div>

                            <div className="ansari-card-item">
                                <div className="ansari-card-icon">
                                    <i className="ansari-icon-logistics"></i>
                                </div>
                                <h3>Logistics Management</h3>
                                <p>End-to-end logistics solutions tailored to your business requirements.</p>
                            </div>

                            <div className="ansari-card-item">
                                <div className="ansari-card-icon">
                                    <i className="ansari-icon-global"></i>
                                </div>
                                <h3>Global Network</h3>
                                <p>Connected worldwide to serve you better across continents.</p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}

export default Home