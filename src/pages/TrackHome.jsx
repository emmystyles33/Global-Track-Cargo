import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import companyLogo from '../../images/Global Track Cargo logo.jfif';
import './public.css';

function TrackLaunchScreen({ trackingNumber }) {
  return (
    <div className="tracking-launch-screen">
      <div className="tracking-launch-container">
        <div className="tracking-brand">
          <img className="tracking-brand-logo" src={companyLogo} alt="Global Track Cargo" />
          <div>
            <p className="tracking-brand-title">Global Track Cargo</p>
            <p className="tracking-brand-subtitle">Premium tracking experience</p>
          </div>
        </div>

        <div className="tracking-loader-ring" />

        <div className="tracking-loader-bar">
          <div className="tracking-loader-fill" />
        </div>

        <div className="tracking-loader-steps">
          <span>Verifying tracking number…</span>
          <span>Connecting to shipment network…</span>
          <span>Retrieving shipment data…</span>
          <span>Preparing live tracking…</span>
        </div>

        <p className="tracking-loader-identifier">Tracking {trackingNumber}</p>
      </div>
    </div>
  );
}

export default function TrackHome() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState('');

  useEffect(() => {
    if (!loading || !target) return;
    const timer = setTimeout(() => {
      navigate(`/track/${target}`);
    }, 2100);
    return () => clearTimeout(timer);
  }, [loading, navigate, target]);

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setTarget(trimmed);
    setLoading(true);
  }

  return (
    <div className="track-screen">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand">
            <img className="brand-logo" src={companyLogo} alt="Global Track Cargo" />
            <div>
              <p className="brand-company">Global Track Cargo</p>
              <p className="brand-tagline">Your Package, Our Promise</p>
            </div>
          </div>
          <ul className="nav-links">
            <li><a href="#home">Home</a></li>
            <li><a href="#track">Track</a></li>
            <li><a href="#operations">Network</a></li>
            <li><a href="#services">Services</a></li>
            <li><a href="#contact">Contact</a></li>
          </ul>
          {/* Get a Quote removed per design - unused */}
        </div>
      </nav>

      <main>
        <section className="homepage-hero-section" id="home">
          <div className="homepage-hero-content">
            <span className="homepage-hero-eyebrow">Global Logistics. Premium Service.</span>
            <h1 className="homepage-hero-title">Fast. Secure. Trusted Worldwide Logistics Solutions.</h1>
            <p className="homepage-hero-subtitle">Track shipments in real time across 180+ countries with complete transparency.</p>
            <div className="homepage-hero-actions">
              <form className="homepage-hero-form" onSubmit={handleSubmit} id="track">
                <label htmlFor="tracking-code" className="sr-only">Tracking number</label>
                <input
                  id="tracking-code"
                  className="homepage-hero-input"
                  placeholder="Enter tracking number"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                />
                <button type="submit" className="homepage-hero-button homepage-hero-primary">Track Shipment</button>
              </form>
            </div>
            <div className="homepage-hero-badges">
              <span>✈ Air Freight</span>
              <span>🚢 Ocean Freight</span>
              <span>🚛 Road Transport</span>
              <span>🚆 Rail Cargo</span>
            </div>
            <div className="homepage-hero-stats">
              <div>
                <strong>180+</strong>
                <span>Countries Served</span>
              </div>
              <div>
                <strong>25K+</strong>
                <span>Deliveries Completed</span>
              </div>
              <div>
                <strong>99%</strong>
                <span>Customer Satisfaction</span>
              </div>
              <div>
                <strong>24/7</strong>
                <span>Global Support</span>
              </div>
            </div>
          </div>
        </section>

        <section className="operations-section" id="operations">
          <div className="section-header">
            <p className="section-eyebrow">Global Logistics Network</p>
            <h2>Integrated transportation across air, sea, road, and rail.</h2>
          </div>
          <div className="operations-grid">
            <article className="operation-card">
              <div className="operation-icon">✈️</div>
              <h3>Air Freight</h3>
              <p>High-priority shipments delivered fast with global air connectivity.</p>
              <div className="operation-meta">3-5 day delivery • door-to-door</div>
            </article>
            <article className="operation-card">
              <div className="operation-icon">🚢</div>
              <h3>Ocean Freight</h3>
              <p>Cost-efficient sea freight for large cargo and international ports.</p>
              <div className="operation-meta">Bulk capacity • end-to-end visibility</div>
            </article>
            <article className="operation-card">
              <div className="operation-icon">🚛</div>
              <h3>Road Transport</h3>
              <p>Flexible regional routing with secure door-to-door delivery.</p>
              <div className="operation-meta">Regional lanes • fast transit</div>
            </article>
            <article className="operation-card">
              <div className="operation-icon">🚆</div>
              <h3>Rail Cargo</h3>
              <p>Eco-friendly long-distance transport with reliable schedules.</p>
              <div className="operation-meta">Sustainable routes • consistent capacity</div>
            </article>
          </div>
        </section>

        <section className="services-section" id="services">
          <div className="section-header">
            <p className="section-eyebrow">Our Services</p>
            <h2>Comprehensive logistics solutions for modern supply chains.</h2>
          </div>
          <div className="services-grid">
            <article className="service-card">
              <div className="service-marker">🌐</div>
              <h3>International Shipping</h3>
              <p>Seamless export and import coordination across global trade lanes.</p>
            </article>
            <article className="service-card">
              <div className="service-marker">📦</div>
              <h3>Cargo Handling</h3>
              <p>Secure loading, unloading, and storage with expert handling teams.</p>
            </article>
            <article className="service-card">
              <div className="service-marker">⚡</div>
              <h3>Express Delivery</h3>
              <p>Urgent delivery options designed to keep your supply chain moving.</p>
            </article>
            <article className="service-card">
              <div className="service-marker">🏬</div>
              <h3>Warehousing</h3>
              <p>Safe warehouse storage with inventory tracking and flexible space.</p>
            </article>
            <article className="service-card">
              <div className="service-marker">🔗</div>
              <h3>Supply Chain Management</h3>
              <p>Integrated planning, coordination, and performance monitoring.</p>
            </article>
            <article className="service-card">
              <div className="service-marker">🛃</div>
              <h3>Custom Clearance</h3>
              <p>Regulatory expertise to clear goods quickly and without delays.</p>
            </article>
          </div>
        </section>

        <section className="gallery-section" id="gallery">
          <div className="section-header">
            <p className="section-eyebrow">Inside Our Operations</p>
            <h2>See how Global Track Cargo powers international logistics.</h2>
          </div>
          <div className="gallery-grid">
            <img src="/images/cargo-airplane.jpg" alt="Cargo airplane" loading="lazy" decoding="async" />
            <img src="/images/cargo-ship.jpg" alt="Cargo ship" loading="lazy" decoding="async" />
            <img src="/images/container-yard.jpg" alt="Container yard" loading="lazy" decoding="async" />
            <img src="/images/warehouse.jpg" alt="Warehouse" loading="lazy" decoding="async" />
            <img src="/images/delivery-truck.jpg" alt="Delivery truck" loading="lazy" decoding="async" />
            <img src="/images/rail-terminal.jpg" alt="Rail terminal" loading="lazy" decoding="async" />
          </div>
        </section>

        <section className="stats-section">
          <div className="section-header">
            <p className="section-eyebrow">Company Statistics</p>
            <h2>Performance metrics built for global enterprise logistics.</h2>
          </div>
          <div className="stats-grid">
            <div className="stats-card">
              <strong className="stats-number">180+</strong>
              <p>Countries Served</p>
            </div>
            <div className="stats-card">
              <strong className="stats-number">25K+</strong>
              <p>Deliveries Completed</p>
            </div>
            <div className="stats-card">
              <strong className="stats-number">350+</strong>
              <p>Global Partners</p>
            </div>
            <div className="stats-card">
              <strong className="stats-number">99%</strong>
              <p>Customer Satisfaction</p>
            </div>
            <div className="stats-card">
              <strong className="stats-number">150+</strong>
              <p>Distribution Centers</p>
            </div>
          </div>
        </section>

        <section className="testimonials-section" id="testimonials">
          <div className="section-header">
            <p className="section-eyebrow">Trusted By Businesses Worldwide</p>
            <h2>International companies rely on our logistics network.</h2>
          </div>
          <div className="testimonials-grid">
            {[{
              name: 'Michael Anderson',
              role: 'Germany',
              img: 'https://randomuser.me/api/portraits/men/75.jpg',
              text: "Global Track Cargo handled our European shipments with precision and speed. Their communication kept every delivery on track."
            }, {
              name: 'Sarah Johnson',
              role: 'UK',
              img: 'https://randomuser.me/api/portraits/women/65.jpg',
              text: 'Their real-time tracking and customs support make cross-border shipping effortless.'
            }, {
              name: 'Daniel Cooper',
              role: 'USA',
              img: 'https://randomuser.me/api/portraits/men/32.jpg',
              text: 'Excellent logistics planning and reliable delivery windows.'
            }, {
              name: 'Emma Williams',
              role: 'Australia',
              img: 'https://randomuser.me/api/portraits/women/44.jpg',
              text: "Global Track Cargo's global reach helped us move shipments across Asia-Pacific with confidence."
            }, {
              name: 'David Miller',
              role: 'Canada',
              img: 'https://randomuser.me/api/portraits/men/12.jpg',
              text: 'Their secure handling and customs clearance process saved us time and money.'
            }, {
              name: 'Sophie Martin',
              role: 'France',
              img: 'https://randomuser.me/api/portraits/women/10.jpg',
              text: 'From port operations to final delivery, Global Track Cargo handled every step with a premium standard.'
            }].map((t) => (
              <article key={t.name} className="testimonial-card">
                <div className="testimonial-profile">
                  <img src={t.img} alt={t.name} loading="lazy" decoding="async" />
                  <div>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-role">{t.role}</p>
                  </div>
                </div>
                <p>{t.text}</p>
                <div className="testimonial-stars">★★★★★</div>
              </article>
            ))}
          </div>
        </section>

        <section className="why-section" id="why">
          <div className="section-header">
            <p className="section-eyebrow">Why Choose Us</p>
            <h2>Built for businesses that demand flawless logistics.</h2>
          </div>
          <div className="why-grid">
            <article className="why-card">
              <div className="why-icon">📍</div>
              <h3>Real Time Tracking</h3>
              <p>Stay informed with live updates at every shipment milestone.</p>
            </article>
            <article className="why-card">
              <div className="why-icon">🕒</div>
              <h3>24/7 Support</h3>
              <p>Global customer service available around the clock.</p>
            </article>
            <article className="why-card">
              <div className="why-icon">🌍</div>
              <h3>Global Coverage</h3>
              <p>Worldwide routes with strong local logistics partnerships.</p>
            </article>
            <article className="why-card">
              <div className="why-icon">🔐</div>
              <h3>Secure Handling</h3>
              <p>Strict quality controls and secure cargo operations.</p>
            </article>
          </div>
        </section>

        <section className="partners-section" id="partners">
          <div className="section-header">
            <p className="section-eyebrow">Trusted Global Partners</p>
            <h2>Industry leaders rely on our network.</h2>
          </div>
          <div className="partner-grid">
            <span className="partner-logo">FedEx</span>
            <span className="partner-logo">DHL</span>
            <span className="partner-logo">UPS</span>
            <span className="partner-logo">Maersk</span>
            <span className="partner-logo">MSC</span>
            <span className="partner-logo">CMA CGM</span>
          </div>
        </section>
      </main>

      <footer className="footer" id="contact">
        <div className="footer-content">
          <div className="footer-block">
            <p className="footer-logo">
              <img className="company-logo" src={companyLogo} alt="" />
              Global Track Cargo
            </p>
            <p>International logistics with premium service, trusted by companies around the world.</p>
          </div>
          <div className="footer-grid">
            <div>
              <p className="footer-title">Services</p>
              <a href="#services">International Shipping</a>
              <a href="#services">Express Delivery</a>
              <a href="#services">Warehousing</a>
            </div>
            <div>
              <p className="footer-title">Tracking</p>
              <a href="#track">Track Shipment</a>
              <a href="#operations">Network</a>
              <a href="#why">Why Choose Us</a>
            </div>
            <div>
              <p className="footer-title">Support</p>
              <a href="tel:+18001234567">+1 800 123 4567</a>
              <a href="mailto:contact@globaltrackcargo.com">contact@globaltrackcargo.com</a>
              <a href="#contact">123 Logistics Ave, London</a>
            </div>
            <div>
              <p className="footer-title">Legal</p>
              <a href="#privacy">Privacy Policy</a>
              <a href="#terms">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <div className="footer-meta">
            <span>TW</span>
            <span>IG</span>
            <span>LI</span>
            <span>FB</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
