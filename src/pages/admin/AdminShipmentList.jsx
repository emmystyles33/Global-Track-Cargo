import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import StatusBadge from '../../components/StatusBadge.jsx';

export default function AdminShipmentList() {
  const [shipments, setShipments] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (query) => {
    setLoading(true);
    setError('');
    try {
      const { shipments } = await api.listShipments(query);
      setShipments(shipments);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load('');
  }, [load]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  return (
    <div>
      <div className="list-toolbar">
        <input
          className="search-input"
          placeholder="Search by tracking number, sender, or receiver…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Link to="/admin/new" className="btn-primary" style={{ textDecoration: 'none', padding: '10px 18px' }}>
          + New Shipment
        </Link>
      </div>

      {error && <p className="error-text">{error}</p>}

      {!loading && shipments.length === 0 ? (
        <div className="empty-state">
          <h3>No shipments yet</h3>
          <p>Create your first shipment to get started.</p>
        </div>
      ) : (
        <div className="shipment-table-wrap">
          <div className="shipment-row header-row">
            <span>Tracking #</span>
            <span>Sender → Receiver</span>
            <span>Route</span>
            <span>Type</span>
            <span>Status</span>
            <span>Created</span>
          </div>
          {shipments.map((s) => (
            <Link to={`/admin/${s.id}`} key={s.id} className="shipment-row">
              <span className="tracking-code">{s.tracking_number}</span>
              <span>
                {s.sender_name} → {s.receiver_name}
              </span>
              <span>
                {s.origin} → {s.destination}
              </span>
              <span>{s.shipment_type}</span>
              <span>
                <StatusBadge status={s.status} />
              </span>
              <span className="mono" style={{ fontSize: 12, color: 'var(--ink-600)' }}>
                {new Date(s.created_at).toLocaleDateString()}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
