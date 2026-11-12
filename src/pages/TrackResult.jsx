import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { computeProgress, formatDuration } from '../lib/progress.js';
import companyLogo from '../../images/Global Track Cargo logo.jfif';
import WorldMap from '../components/WorldMap.jsx';
import CheckpointStrip from '../components/CheckpointStrip.jsx';
import './public.css';

function formatFullDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-GB', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function statusToCheckpoint(status, progressCheckpoint, progressPercent) {
  if (progressPercent >= 100) return 4;
  switch (status) {
    case 'packaging':
      return 0;
    case 'queued':
      return 1;
    case 'in transit':
      return 2;
    case 'customs':
      return 3;
    case 'delivered':
      return 4;
    case 'on hold':
      return progressCheckpoint;
    default:
      return progressCheckpoint;
  }
}

export default function TrackResult() {
  const { trackingNumber } = useParams();
  const [shipment, setShipment] = useState(null);
  const [images, setImages] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api
      .trackPublic(trackingNumber)
      .then((data) => {
        if (cancelled) return;
        setShipment(data.shipment);
        setImages(data.images);
        setUpdates(data.updates || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [trackingNumber]);

  useEffect(() => {
    if (!shipment) return;
    const refresh = setInterval(() => {
      api.trackPublic(trackingNumber)
        .then((data) => {
          setShipment(data.shipment);
          setUpdates(data.updates || []);
        })
        .catch(() => {});
    }, 30000);

    return () => clearInterval(refresh);
  }, [shipment, trackingNumber]);

  if (loading) {
    return (
      <div className="track-result-screen track-result-loading">
        <div className="track-result-loader-panel">
          <div className="track-result-loader-brand">
            <img src={companyLogo} alt="Global Track Cargo" />
            <div>
              <span>Global Track Cargo</span>
              <small>Retrieving shipment details</small>
            </div>
          </div>
          <div className="track-result-loader-ring" />
          <div className="track-result-loader-messages">
            <span>Verifying tracking number...</span>
            <span>Connecting to shipment network...</span>
            <span>Retrieving shipment data...</span>
            <span>Preparing live tracking...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <div className="track-result-screen track-result-error-screen">
        <div className="track-result-error-card">
          <h1>Shipment lookup failed</h1>
          <p>{error || 'Shipment not found. Please verify your tracking code.'}</p>
          <Link to="/" className="track-back-link">← Track another shipment</Link>
        </div>
      </div>
    );
  }

  const progress = computeProgress(shipment);
  const progressPercent = Math.round(progress.fraction * 100);
  const RADIUS = 80;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const offset = CIRCUMFERENCE * (1 - progressPercent / 100);
  const ringColor = shipment.is_on_hold
    ? '#c4543a'
    : progressPercent >= 100
      ? '#5fb88f'
      : '#e8a23a';
  const statusLabel = shipment.is_on_hold
    ? 'On Hold'
    : shipment.status === 'delivered' || progressPercent >= 100
      ? 'Delivered'
      : shipment.status.split(' ').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');
  const progressCheckpoint = statusToCheckpoint(shipment.status, progress.checkpointIndex, progressPercent);

  const summary = [
    { label: 'Origin', value: shipment.origin || 'Unknown' },
    { label: 'Destination', value: shipment.destination || 'Unknown' },
    { label: 'Carrier', value: 'Global Track Cargo' },
    { label: 'Shipment Type', value: shipment.shipment_type },
    {
      label: 'Items',
      value: `${shipment.quantity} ${shipment.quantity === 1 ? 'item' : 'items'}`,
    },
    { label: 'Expected Delivery', value: formatFullDate(shipment.estimated_delivery) },
  ];

  const trustItems = [
    'Real-Time Tracking',
    'Secure Logistics Network',
    'Worldwide Coverage',
    '24/7 Monitoring',
    'Customs Support',
  ];

  return (
    <div className="track-result-screen">
      <header className="track-result-header">
        <div>
          <span className="eyebrow track-result-eyebrow">Shipment Tracking</span>
          <h1>{shipment.origin} → {shipment.destination}</h1>
        </div>
        <div className="track-result-meta">
          <span className={`status-pill ${statusLabel === 'Delivered' ? 'status-delivered' : 'status-in-transit'}`}>🟢 {statusLabel}</span>
          <div className="track-result-line"><span>Tracking number</span><strong>{shipment.tracking_number}</strong></div>
          <div className="track-result-line"><span>Estimated delivery</span><strong>{formatFullDate(shipment.estimated_delivery)}</strong></div>
        </div>
      </header>

      <section className="track-result-overview">
        <div className="track-result-stage-card">
          <div className="stage-title">Delivery Progress</div>
          <div className="circular-progress">
            <svg width="200" height="200" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                r={RADIUS}
                fill="none"
                stroke="#e8e3d6"
                strokeWidth="12"
              />
              <circle
                cx="100"
                cy="100"
                r={RADIUS}
                fill="none"
                stroke={ringColor}
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={CIRCUMFERENCE}
                strokeDashoffset={offset}
                transform="rotate(-90 100 100)"
                style={{ transition: 'stroke-dashoffset 0.5s ease' }}
              />
              <text
                x="100"
                y="92"
                textAnchor="middle"
                fontSize="32"
                fontWeight="700"
                fill="#0f1620"
                fontFamily="Space Grotesk, sans-serif"
              >
                {progressPercent}%
              </text>
              <text
                x="100"
                y="116"
                textAnchor="middle"
                fontSize="12"
                fill="#4a5a70"
                fontFamily="Inter, sans-serif"
                textTransform="capitalize"
              >
                {shipment.is_on_hold ? 'On Hold' : progressPercent >= 100 ? 'Delivered' : shipment.status}
              </text>
            </svg>
          </div>
        </div>

        <div className="track-result-stage-card track-result-timeline-card">
          <div className="stage-title">Shipment Timeline</div>
          <CheckpointStrip checkpointIndex={progressCheckpoint} fillPercent={progressPercent} />
        </div>
      </section>

      <section className="track-result-map-card">
        <div className="stage-title">Route Overview</div>
        <WorldMap
          origin={{ lat: shipment.origin_lat, lng: shipment.origin_lng }}
          destination={{ lat: shipment.destination_lat, lng: shipment.destination_lng }}
          originLabel={shipment.origin}
          destinationLabel={shipment.destination}
          progressFraction={progressPercent / 100}
          progressPercent={progressPercent}
          shipmentType={shipment.shipment_type}
        />
      </section>

      <section className="track-result-card-grid">
        {summary.map((item) => (
          <div className="info-card" key={item.label}>
            <span className="info-label">{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}

        <div className="info-card">
          <span className="info-label">Shipment Timeline</span>
          <div style={{ marginTop: 6 }}>
            {shipment.booked_at && (
              <div className="detail-line">
                <span>Booking Date</span>
                <span>{new Date(shipment.booked_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}

            {shipment.shipped_date && (
              <div className="detail-line">
                <span>Shipped Date</span>
                <span>{new Date(shipment.shipped_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
            )}

            <div className="detail-line">
              <span>Expected Delivery</span>
              <span>{formatFullDate(shipment.estimated_delivery)}</span>
            </div>
          </div>
        </div>
      </section>

      {images.length > 0 && (
        <section className="track-result-image-gallery">
          <div className="stage-title">Shipment Images</div>
          <div className="image-gallery-grid">
            {images.map((image, index) => {
              const url = typeof image === 'string' ? image : image.url || image.publicUrl || '';
              return (
                <div className="image-gallery-item" key={`${url}-${index}`}>
                  <img src={url} alt={`Shipment item ${index + 1}`} />
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="track-result-side-section">
        {updates.length > 0 && (
          <div className="activity-feed-card">
            <div className="stage-title">Recent Shipment Updates</div>
            <div className="activity-list">
              {updates.map((u) => (
                <div key={u.id} className="activity-item">
                  <span>{new Date(u.update_time).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}</span>
                  <p>{u.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="trust-card">
          <div className="stage-title">Trusted Logistics Services</div>
          <ul>
            {trustItems.map((item) => (
              <li key={item}>✓ {item}</li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="track-result-footer">
        <div className="footer-brand">
          <img src={companyLogo} alt="Global Track Cargo" />
          <div>
            <strong>Global Track Cargo</strong>
            <span>Global logistics. Premium service.</span>
          </div>
        </div>
        <div className="footer-links">
          <div>
            <strong>Quick Links</strong>
            <a href="/">Track Shipment</a>
            <a href="#services">Services</a>
            <a href="#">About Us</a>
            <a href="#">Contact</a>
          </div>
          <div>
            <strong>Support</strong>
            <a href="mailto:support@globaltrackcargo.com">support@globaltrackcargo.com</a>
            <a href="tel:+442079460958">+44 20 7946 0958</a>
          </div>
        </div>
        <div className="footer-copy">© 2026 Global Track Cargo</div>
      </footer>
    </div>
  );
}
