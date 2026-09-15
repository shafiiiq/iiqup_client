import React, { useState } from 'react';
import {
  Truck,
  UserCheck,
  Wrench,
  PackageSearch,
  Award,
  ShieldCheck,
  Users,
  MapPin,
  Phone,
  Mail,
} from 'lucide-react';
import Tabs from '@/shared/components/widgets/tabs/Tabs';
import { useHome } from '../hooks/useHome';
import {
  LEADERSHIP_TEAM,
  OFFICE_STAFF_DEPARTMENTS,
  NAV_GROUPS,
} from '../constants/home.constant';

import Excavator from '@assets/images/fleet/excavator.jpg';
import Excavators from '@assets/images/fleet/excavators.jpg';
import Dozer from '@assets/images/fleet/dozer.jpg';
import DumpTruck from '@assets/images/fleet/dump-truck.jpg';
import Crane from '@assets/images/fleet/crane.jpg';
import Driller from '@assets/images/fleet/driller.jpg';

import './Home.css';

const buildTabItems = (links) =>
  links.map((link) => ({ key: link.path, label: link.label, iconName: link.componentIcon }));

const SIDEBAR_GROUPS = NAV_GROUPS.map((group) => ({
  key: group.key,
  label: group.label,
  children: buildTabItems(group.items),
}));

const SERVICES = [
  {
    icon: Truck,
    title: 'Heavy Equipment Rental',
    description:
      'We offer an extensive fleet of heavy equipment for rent, including Earth Moving, Lifting, Power, and Transport Equipment.',
  },
  {
    icon: UserCheck,
    title: 'Skilled Operator Supply',
    description:
      'Our certified and experienced operators are proficient in a diverse range of heavy machinery.',
  },
  {
    icon: Wrench,
    title: 'Heavy Equipment Maintenance',
    description:
      'We provide comprehensive service solutions tailored to meet all equipment needs, ensuring reliability and performance excellence.',
  },
  {
    icon: PackageSearch,
    title: 'Heavy Equipment Transportation',
    description:
      'Our transport services are designed to handle the safe and efficient movement of machinery to and from your project sites.',
  },
];

const WHY_CHOOSE_US = [
  {
    icon: Award,
    title: 'Proven Expertise and Experience',
    description:
      'With over two decades of industry experience, we understand the unique needs of various sectors, including government projects, Oil & Gas, and energy fields. Our expertise ensures tailored solutions that meet your specific project requirements.',
  },
  {
    icon: Users,
    title: 'High-Quality Fleet and Certified Operators',
    description:
      'Our extensive fleet of well-maintained, cutting-edge equipment is complemented by certified, highly trained operators. This combination ensures optimal performance, safety, and efficiency for your projects.',
  },
  {
    icon: ShieldCheck,
    title: 'Commitment to Safety and Quality',
    description:
      'We adhere to international standards of safety and quality, ensuring that all operations are conducted with the highest levels of care and diligence. Our commitment to excellence guarantees reliable and top-tier service for all your heavy equipment needs.',
  },
];

const FLEET_CATEGORIES = [
  { id: 'earth-moving', title: 'Earth Moving', image: Excavator },
  { id: 'lifting', title: 'Lifting Equipment', image: Crane },
  { id: 'power', title: 'Power Equipment', image: Driller },
  { id: 'transport', title: 'Transport Equipment', image: DumpTruck },
];

const STATS = [
  { value: '1000+', label: 'Successful Projects' },
  { value: '40+', label: 'Major Clients' },
  { value: '10+', label: 'Ongoing Projects' },
];

const CLIENT_LOGOS = [
  { id: 1, name: 'Client 1', image: null },
  { id: 2, name: 'Client 2', image: null },
  { id: 3, name: 'Client 3', image: null },
  { id: 4, name: 'Client 4', image: null },
  { id: 5, name: 'Client 5', image: null },
  { id: 6, name: 'Client 6', image: null },
];

const COMPANY_MAP_EMBED_SRC =
  'https://www.google.com/maps?q=25.0781386,51.5332801&z=17&output=embed';
const COMPANY_MAP_LINK =
  'https://www.google.com/maps/place/AL+ANSARI+TRANSPORT+%26+ENTERPRISES+W.L.L/@25.0781385,51.5284092,17z/data=!3m1!4b1!4m6!3m5!1s0x3e45db3c2ab0bcd5:0x811ea21eb7725684!8m2!3d25.0781386!4d51.5332801!16s%2Fg%2F11dxb7_rb5?entry=ttu&g_ep=EgoyMDI1MDYzMC4wIKXMDSoASAFQAw%3D%3D';

const CONTACT_INFO = {
  addressLines: [
    'Building No .24, Street No .61, Area 92,',
    'Logistic Park-A ,Birkat Al Awamer, Doha, Qatar,',
    'P.O Box 1265',
  ],
  phones: [
    { label: '+974 44505700', href: 'tel:+97444505700' },
    { label: '/800', href: 'tel:+97444505800' },
  ],
  email: 'info@ansarigroup.co',
};

const INITIAL_CONTACT_FORM = { name: '', email: '', phone: '', message: '' };

function Home({ user_logged_in, currentUser, setUserLoggedIn }) {
  const {
    activeLink,
    isDarkMode,
    profileInitial,
    handleNavSelect,
    toggleTheme,
    handleLogout,
  } = useHome({ currentUser, setUserLoggedIn });

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [contactForm, setContactForm] = useState(INITIAL_CONTACT_FORM);
  const [contactStatus, setContactStatus] = useState('idle');

  const activeTopLevelKey =
    NAV_GROUPS.find((group) => group.items.some((item) => item.path === activeLink))?.key
    ?? NAV_GROUPS[0].key;

  const handleTabsSelect = (path) => {
    const [, routePath] = path;
    if (!routePath) return;
    handleNavSelect([routePath]);
  };

  const handleContactFieldChange = (field) => (e) => {
    setContactForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleContactSubmit = (e) => {
    e.preventDefault();
    console.log('Contact form submitted:', contactForm);
    setContactStatus('submitted');
    setContactForm(INITIAL_CONTACT_FORM);
  };

  const sidebarControls = user_logged_in
    ? [
      {
        key: 'theme',
        text: isDarkMode ? 'Dark Mode' : 'Light Mode',
        onClick: toggleTheme,
        colorScheme: 'primary-700',
        textColor: 'white-100',
        width: '100%',
        height: '44px',
        squircle: '3xl',
        type: 'button',
      },
      {
        key: 'logout',
        text: 'Logout',
        onClick: handleLogout,
        colorScheme: 'error-700',
        textColor: 'white-100',
        width: '100%',
        height: '44px',
        squircle: '3xl',
        type: 'button',
      },
    ]
    : [];

  return (
    <div className="features screen home wrapper">
      <div
        className={`features screen home sidebar ${sidebarCollapsed ? 'features screen home sidebar-collapsed' : ''
          }`}
      >
        <Tabs
          title={null}
          items={SIDEBAR_GROUPS}
          activePath={[activeTopLevelKey, activeLink]}
          onSelect={handleTabsSelect}
          showSearch={true}
          controls={sidebarControls}
          user={
            user_logged_in
              ? { name: currentUser?.name || 'Guest User', role: currentUser?.role || 'Team Member' }
              : undefined
          }
          maxHeight="calc(100vh - 2rem)"
          collapsed={sidebarCollapsed}
          onToggleCollapse={setSidebarCollapsed}
          openAllByDefault={true}
        />
      </div>

      <main className="features screen home main">
        <div className="features screen home content">
          <section className="features screen home hero">
            <h1 className="features screen home hero-title">
              <span className="features screen home hero-title-milky">
                Al ansari
              </span>
              <br />
              connect
            </h1>
            <p className="features screen home hero-subtitle">
              Al Ansari Transport &amp; Enterprises connects businesses across Qatar with reliable
              transport, logistics, and heavy-equipment solutions built on decades of trust.
            </p>
          </section>

          <section className="features screen home gallery">
            <div className="features screen home gallery-col">
              <div className="features screen home gallery-item gallery-item-sm">
                <img src={Excavators} alt="Excavators" />
              </div>
              <div className="features screen home gallery-item gallery-item-lg gallery-item-contain">
                <img src={Crane} alt="Mobile Crane" />
              </div>
            </div>

            <div className="features screen home gallery-col">
              <div className="features screen home gallery-item gallery-item-tall">
                <img src={Dozer} alt="Dozer" />
              </div>
            </div>

            <div className="features screen home gallery-col">
              <div className="features screen home gallery-item gallery-item-md">
                <img src={DumpTruck} alt="Dump Truck" />
              </div>
              <div className="features screen home gallery-split">
                <div className="features screen home gallery-item gallery-item-half">
                  <img src={Driller} alt="Mobile Crane" />
                </div>
                <div className="features screen home gallery-item gallery-item-half">
                  <img src={Excavator} alt="Excavator" />
                </div>
              </div>
            </div>
          </section>

          <section className="features screen home leadership">
            <h2 className="features screen home section-title">Leadership</h2>
            <div className="features screen home leader-pyramid">
              {LEADERSHIP_TEAM.map((leader) => (
                <div
                  key={leader.id}
                  className={`features screen home leader-pyramid-item leader-size-${leader.size}`}
                >
                  <div className="features screen home leader-pyramid-image">
                    {leader.image ? (
                      <img src={leader.image} alt={leader.name} />
                    ) : (
                      <div
                        className="features screen home leader-pyramid-placeholder"
                        aria-label={`${leader.name} photo not yet added`}
                      />
                    )}
                  </div>
                  <div className="features screen home leader-pyramid-info">
                    <h4 className="features screen home leader-pyramid-name">{leader.name}</h4>
                    <p className="features screen home leader-pyramid-role">{leader.position}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="features screen home office-staff">
            <h2 className="features screen home section-title">Office Staffs</h2>
            <div className="features screen home office-staff-masonry">
              {OFFICE_STAFF_DEPARTMENTS.map((dept) => (
                <div
                  key={dept.id}
                  className="features screen home office-staff-department"
                  style={{ '--staff-count': dept.staff.length }}
                >
                  <h3 className="features screen home office-staff-department-title">
                    {dept.department}
                    <span className="features screen home office-staff-department-count">
                      {dept.staff.length}
                    </span>
                  </h3>
                  <div className="features screen home office-staff-grid">
                    {dept.staff.map((staff) => (
                      <div
                        key={`${dept.id}-${staff.id}`}
                        className="features screen home office-staff-item"
                      >
                        <div className="features screen home office-staff-image">
                          {staff.image ? (
                            <img src={staff.image} alt={staff.name} />
                          ) : (
                            <div
                              className="features screen home office-staff-placeholder"
                              aria-label={`${staff.name} photo not yet added`}
                            />
                          )}
                        </div>
                        <div className="features screen home office-staff-info">
                          <h4 className="features screen home office-staff-name">{staff.name}</h4>
                          <p className="features screen home office-staff-role">{staff.position}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="features screen home about">
            <h2 className="features screen home section-title">About Us</h2>
            <p className="features screen home about-eyebrow">
              Delivering Excellence in Equipment Rental
            </p>
            <p className="features screen home about-body">
              Established in 2004 and headquartered in Birkat Al Awamer, Al Ansari Transport &amp;
              Enterprises has earned a reputation for reliability and excellence in the heavy
              equipment rental industry. Under the visionary leadership of Mr. Abu Kombathayil,
              along with his two sons, Mr. Mohammad Shaheen and Mr. Ahammed Kamal, our journey
              reflects a legacy rooted in unwavering commitment, integrity, and a dedication to
              setting unmatched service standards.
            </p>

            <h3 className="features screen home about-subtitle">Moving Your Business Forward</h3>
            <div className="features screen home about-grid">
              <div className="features screen home about-card">
                <h4 className="features screen home about-card-title">Vision</h4>
                <p className="features screen home about-card-desc">
                  Our vision extends beyond mere provision; it is dedicated to delivering
                  reliable, value-added services. We aim to set the standard for quality,
                  innovation, and customer satisfaction in the region, striving to exceed our
                  clients&apos; expectations. We envision becoming a trusted industry leader,
                  synonymous with integrity, reliability, and exceptional service, thereby
                  contributing to the growth and prosperity of our clients.
                </p>
              </div>
              <div className="features screen home about-card">
                <h4 className="features screen home about-card-title">Mission</h4>
                <p className="features screen home about-card-desc">
                  Our mission is to lay the foundation for a brighter future, solidifying our
                  position as the preferred choice for our clients. By adhering rigorously to
                  international standards of quality and safety, we continually enhance our
                  service reputation across the region. Our primary objective is to emerge as the
                  premier supplier of safe, high-quality, and reliable heavy equipment rental
                  services for our esteemed customers. We are committed to providing cutting-edge
                  technology-equipped heavy equipment, ensuring unparalleled efficiency and
                  productivity in both the Construction and Industrial sectors.
                </p>
              </div>
            </div>
          </section>

          <section className="features screen home fleets">
            <h2 className="features screen home section-title">Fleets on Rental</h2>
            <p className="features screen home fleets-subtitle">
              Our fleet includes equipment from top global manufacturers
            </p>
            <div className="features screen home fleets-grid">
              {FLEET_CATEGORIES.map((category) => (
                <div key={category.id} className="features screen home fleets-card">
                  <div className="features screen home fleets-card-image">
                    <img src={category.image} alt={category.title} />
                  </div>
                  <h3 className="features screen home fleets-card-title">{category.title}</h3>
                </div>
              ))}
            </div>

            <div className="features screen home stats-grid">
              {STATS.map((stat) => (
                <div key={stat.label} className="features screen home stats-item">
                  <span className="features screen home stats-value">{stat.value}</span>
                  <span className="features screen home stats-label">{stat.label}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="features screen home clients">
            <h2 className="features screen home section-title">Our Clients</h2>
            <div className="features screen home clients-grid">
              {CLIENT_LOGOS.map((client) => (
                <div key={client.id} className="features screen home clients-item">
                  {client.image ? (
                    <img src={client.image} alt={client.name} />
                  ) : (
                    <div
                      className="features screen home clients-placeholder"
                      aria-label={`${client.name} logo not yet added`}
                    >
                      {client.name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="features screen home services">
            <h2 className="features screen home section-title">Our Services</h2>
            <p className="features screen home services-intro">
              Since 2004, we have been committed to supplying heavy equipment and providing
              certified operators on a rental basis in Qatar. We cater to a wide range of project
              needs across various sectors, including Government projects, Oil &amp; Gas, and
              energy fields. Our services include:
            </p>
            <div className="features screen home services-grid">
              {SERVICES.map((service) => {
                const ServiceIcon = service.icon;
                return (
                  <div key={service.title} className="features screen home service-card">
                    <div className="features screen home service-icon">
                      <ServiceIcon size={22} strokeWidth={1.75} />
                    </div>
                    <h3 className="features screen home service-title">{service.title}</h3>
                    <p className="features screen home service-desc">{service.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="features screen home why-us">
            <h2 className="features screen home section-title">Why Choose Us?</h2>
            <p className="features screen home why-us-subtitle">
              Learn More What We Do And Get Involved
            </p>
            <div className="features screen home why-us-grid">
              {WHY_CHOOSE_US.map((reason, index) => {
                const ReasonIcon = reason.icon;
                return (
                  <div key={reason.title} className="features screen home why-us-card">
                    <span className="features screen home why-us-number">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div className="features screen home why-us-icon">
                      <ReasonIcon size={22} strokeWidth={1.75} />
                    </div>
                    <h3 className="features screen home why-us-title">{reason.title}</h3>
                    <p className="features screen home why-us-desc">{reason.description}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="features screen home contact">
            <h2 className="features screen home section-title">Contact Us</h2>
            <div className="features screen home contact-grid">
              <form
                className="features screen home contact-form"
                onSubmit={handleContactSubmit}
              >
                <div className="features screen home contact-field">
                  <label htmlFor="contact-name">Name</label>
                  <input
                    id="contact-name"
                    name="name"
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={handleContactFieldChange('name')}
                    placeholder="Your name"
                  />
                </div>
                <div className="features screen home contact-field">
                  <label htmlFor="contact-email">Email</label>
                  <input
                    id="contact-email"
                    name="email"
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={handleContactFieldChange('email')}
                    placeholder="you@example.com"
                  />
                </div>
                <div className="features screen home contact-field">
                  <label htmlFor="contact-phone">Phone</label>
                  <input
                    id="contact-phone"
                    name="phone"
                    type="tel"
                    value={contactForm.phone}
                    onChange={handleContactFieldChange('phone')}
                    placeholder="+974 ..."
                  />
                </div>
                <div className="features screen home contact-field">
                  <label htmlFor="contact-message">Message</label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    required
                    value={contactForm.message}
                    onChange={handleContactFieldChange('message')}
                    placeholder="Tell us about your project..."
                  />
                </div>
                <button type="submit" className="features screen home contact-submit">
                  Send Message
                </button>
                {contactStatus === 'submitted' && (
                  <p className="features screen home contact-success" role="status">
                    Thanks — your message has been noted. We&apos;ll get back to you shortly.
                  </p>
                )}
              </form>

              <div className="features screen home contact-side">
                <div className="features screen home contact-map">
                  <iframe
                    title="Al Ansari Transport & Enterprises location"
                    src={COMPANY_MAP_EMBED_SRC}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                  />
                </div>

                <div className="features screen home contact-info">
                  <h3 className="features screen home contact-info-title">
                    <MapPin size={16} strokeWidth={1.75} />
                    Address
                  </h3>
                  <p className="features screen home contact-address">
                    {CONTACT_INFO.addressLines.map((line) => (
                      <a
                        key={line}
                        href={COMPANY_MAP_LINK}
                        target="_blank"
                        rel="noreferrer"
                        className="features screen home contact-address-line"
                      >
                        {line}
                      </a>
                    ))}
                  </p>

                  <p className="features screen home contact-line">
                    <Phone size={16} strokeWidth={1.75} />
                    {CONTACT_INFO.phones.map((phone, index) => (
                      <React.Fragment key={phone.href}>
                        {index > 0 && ' '}
                        <a href={phone.href}>{phone.label}</a>
                      </React.Fragment>
                    ))}
                  </p>

                  <p className="features screen home contact-line">
                    <Mail size={16} strokeWidth={1.75} />
                    <a href={`mailto:${CONTACT_INFO.email}`}>{CONTACT_INFO.email}</a>
                  </p>
                </div>
              </div>
            </div>
          </section>

          <footer className="features screen home footer">
            <p className="features screen home footer-copyright">
              Copyright © 2025 Al Ansari Transport &amp; Enterprises W.L.L. All Rights Reserved
            </p>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default Home;