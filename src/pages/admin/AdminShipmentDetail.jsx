import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import { computeProgress, formatDuration } from '../../lib/progress.js';

export default function AdminShipmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [shipment, setShipment] = useState(null);
  const [images, setImages] = useState([]);
  const [history, setHistory] = useState([]);
  const [updates, setUpdates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [addingUpdate, setAddingUpdate] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [newUpdateTime, setNewUpdateTime] = useState('');
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getShipment(id);
      setShipment(data.shipment);
      setImages(data.images);
      setHistory(data.history);
      setUpdates(data.updates || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleHoldToggle() {
    setBusy(true);
    try {
      const action = shipment.is_on_hold ? 'resume' : 'hold';
      const { shipment: updated } = await api.setHold(id, action);
      setShipment(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleStatusChange(newStatus) {
    setBusy(true);
    try {
      const { shipment: updated } = await api.updateShipment(id, { status: newStatus });
      setShipment(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete shipment ${shipment.tracking_number}? This can't be undone.`)) return;
    setBusy(true);
    try {
      await api.deleteShipment(id);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  async function handleAddUpdate(e) {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setAddingUpdate(true);
    try {
      const { update } = await api.addShipmentUpdate(shipment.id, {
        message: newMessage.trim(),
        update_time: newUpdateTime || undefined,
      });
      setUpdates((prev) => [...prev, update]);
      setNewMessage('');
      setNewUpdateTime('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAddingUpdate(false);
    }
  }

  async function handleDeleteUpdate(updateId) {
    try {
      await api.deleteShipmentUpdate(shipment.id, updateId);
      setUpdates((prev) => prev.filter((u) => u.id !== updateId));
    } catch (err) {
      setError(err.message);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(shipment.tracking_number);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (loading) return <p style={{ color: 'var(--ink-600)' }}>Loading…</p>;
  if (error && !shipment) return <p className="error-text">{error}</p>;
  if (!shipment) return null;

  const progress = computeProgress(shipment);

  return (
    <div>
      <div className="detail-header">
        <div>
          <span className="eyebrow">Shipment Detail</span>
          <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--paper)', margin: '4px 0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="tracking-code" style={{ fontSize: 20 }}>{shipment.tracking_number}</span>
            <button className="copy-btn" onClick={handleCopy}>{copied ? 'Copied!' : 'Copy'}</button>
          </h1>
          <StatusBadge status={shipment.status} />
        </div>

        <div className="action-row">
          <button className="btn-secondary" onClick={handleHoldToggle} disabled={busy}>
            {shipment.is_on_hold ? '▶ Resume Shipment' : '⏸ Hold Shipment'}
          </button>
          <button className="btn-danger" onClick={handleDelete} disabled={busy}>
            Delete
          </button>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <div className="detail-grid">
        <div className="section-card">
          <div className="section-head">
            <span className="eyebrow">Progress</span>
            <h2 className="section-title">
              {progress.arrived ? 'Delivered' : shipment.is_on_hold ? 'On Hold' : 'In Transit'}
            </h2>
          </div>

          {/* Progress percentage display */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8
          }}>
            <span className="eyebrow">Delivery Progress</span>
            <span style={{
              fontFamily: 'var(--font-mono)',
              color: shipment.is_on_hold
                ? 'var(--rust)'
                : progress.arrived
                  ? 'var(--mint)'
                  : 'var(--amber)',
              fontSize: 28,
              fontWeight: 700
            }}>
              {shipment.progress_percent}%
            </span>
          </div>

          {/* Visual progress bar */}
          <div style={{
            background: 'var(--ink-800)',
            borderRadius: 999,
            height: 10,
            overflow: 'hidden',
            marginBottom: 8
          }}>
            <div style={{
              width: `${shipment.progress_percent}%`,
              height: '100%',
              background: shipment.is_on_hold
                ? 'var(--rust)'
                : progress.arrived
                  ? 'var(--mint)'
                  : 'var(--amber)',
              transition: 'width 0.4s ease',
              borderRadius: 999,
            }}/>
          </div>

          {/* Interactive slider to update progress */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <input
              type="range"
              min="0"
              max="100"
              step="1"
              value={shipment.progress_percent}
              onChange={(e) => {
                if (shipment.is_on_hold) return;
                setShipment(prev => ({
                  ...prev,
                  progress_percent: Number(e.target.value)
                }));
              }}
              onMouseUp={(e) => {
                if (shipment.is_on_hold) return;
                api.updateShipment(shipment.id, {
                  progress_percent: Number(e.target.value)
                }).catch(err => setError(err.message));
              }}
              onTouchEnd={(e) => {
                if (shipment.is_on_hold) return;
                api.updateShipment(shipment.id, {
                  progress_percent: Number(e.target.value)
                }).catch(err => setError(err.message));
              }}
              style={{ flex: 1, accentColor: 'var(--amber)', cursor: shipment.is_on_hold ? 'not-allowed' : 'pointer' }}
              disabled={busy || shipment.is_on_hold}
            />
            <span style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--amber)',
              minWidth: 42,
              fontSize: 13
            }}>
              {shipment.progress_percent}%
            </span>
          </div>

          {/* Quick jump buttons for common values */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            {[0, 10, 25, 50, 75, 90, 100].map(val => (
              <button
                key={val}
                className="btn-secondary"
                style={{
                  padding: '4px 10px',
                  fontSize: 12,
                  background: shipment.progress_percent === val
                    ? 'var(--amber)'
                    : undefined,
                  color: shipment.progress_percent === val
                    ? 'var(--ink-950)'
                    : undefined,
                }}
                disabled={busy || shipment.is_on_hold}
                onClick={() => {
                  if (shipment.is_on_hold) return;
                  setShipment(prev => ({ ...prev, progress_percent: val }));
                  api.updateShipment(shipment.id, { progress_percent: val })
                    .catch(err => setError(err.message));
                }}
              >
                {val}%
              </button>
            ))}
          </div>

          <div className="kv-row">
            <span className="kv-label">Set Status</span>
            <select
              className="select-input"
              style={{ width: 'auto' }}
              value={shipment.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={busy}
            >
              {['packaging', 'queued', 'in transit', 'customs', 'on hold', 'delivered'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="kv-row">
            <span className="kv-label">Progress Speed</span>
            <span className="kv-value" style={{ textTransform: 'capitalize' }}>{shipment.progress_speed}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">Created</span>
            <span className="kv-value">{new Date(shipment.created_at).toLocaleString()}</span>
          </div>

          {shipment.booked_at && (
            <div className="kv-row">
              <span className="kv-label">Booking Date</span>
              <span className="kv-value">{new Date(shipment.booked_at).toLocaleString()}</span>
            </div>
          )}

          {shipment.shipped_date && (
            <div className="kv-row">
              <span className="kv-label">Shipped Date</span>
              <span className="kv-value">{new Date(shipment.shipped_date).toLocaleString()}</span>
            </div>
          )}
          <div className="kv-row">
            <span className="kv-label">Estimated Delivery</span>
            <span className="kv-value">{new Date(shipment.estimated_delivery).toLocaleString()}</span>
          </div>
          <div className="kv-row">
            <span className="kv-label">Total Held Time</span>
            <span className="kv-value">{shipment.total_held_seconds}s</span>
          </div>

          {history.length > 0 && (
            <>
              <div className="section-head" style={{ marginTop: 22 }}>
                <span className="eyebrow">Status History</span>
              </div>
              {history.map((h) => (
                <div className="kv-row" key={h.id}>
                  <span className="kv-label" style={{ textTransform: 'none' }}>{new Date(h.changed_at).toLocaleString()}</span>
                  <span className="kv-value" style={{ textTransform: 'capitalize' }}>{h.status}</span>
                </div>
              ))}
            </>
          )}
        </div>

        <div>
          <div className="section-card" style={{ marginBottom: 20 }}>
            <div className="section-head">
              <span className="eyebrow">Route</span>
              <h2 className="section-title">{shipment.origin} → {shipment.destination}</h2>
            </div>
            <div className="kv-row"><span className="kv-label">Type</span><span className="kv-value">{shipment.shipment_type}</span></div>
            <div className="kv-row"><span className="kv-label">Courier</span><span className="kv-value">{shipment.courier || '—'}</span></div>
            <div className="kv-row"><span className="kv-label">Quantity</span><span className="kv-value">{shipment.quantity}</span></div>
            <div className="kv-row"><span className="kv-label">Fragile</span><span className="kv-value">{shipment.is_fragile ? 'Yes' : 'No'}</span></div>
            <div className="kv-row"><span className="kv-label">Express</span><span className="kv-value">{shipment.is_express ? 'Yes' : 'No'}</span></div>
            {shipment.description && (
              <div className="kv-row"><span className="kv-label">Description</span><span className="kv-value">{shipment.description}</span></div>
            )}
          </div>

          <div className="section-card" style={{ marginBottom: 20 }}>
            <div className="section-head">
              <span className="eyebrow">Sender / Receiver</span>
            </div>
            <div className="kv-row"><span className="kv-label">Sender</span><span className="kv-value">{shipment.sender_name}</span></div>
            {shipment.sender_email && <div className="kv-row"><span className="kv-label">Email</span><span className="kv-value">{shipment.sender_email}</span></div>}
            {shipment.sender_phone && <div className="kv-row"><span className="kv-label">Phone</span><span className="kv-value">{shipment.sender_phone}</span></div>}
            <div className="kv-row"><span className="kv-label">Receiver</span><span className="kv-value">{shipment.receiver_name}</span></div>
            {shipment.receiver_email && <div className="kv-row"><span className="kv-label">Email</span><span className="kv-value">{shipment.receiver_email}</span></div>}
            {shipment.receiver_phone && <div className="kv-row"><span className="kv-label">Phone</span><span className="kv-value">{shipment.receiver_phone}</span></div>}
          </div>

          <div className="section-card">
            <div className="section-head">
              <span className="eyebrow">Payment</span>
            </div>
            <div className="kv-row"><span className="kv-label">Status</span><span className="kv-value" style={{ textTransform: 'capitalize' }}>{shipment.payment_status}</span></div>
            {shipment.amount_to_pay != null && (
              <div className="kv-row"><span className="kv-label">Amount</span><span className="kv-value">{shipment.amount_to_pay}</span></div>
            )}
            {shipment.payment_method && (
              <div className="kv-row"><span className="kv-label">Method</span><span className="kv-value">{shipment.payment_method}</span></div>
            )}
            {shipment.payment_reason && (
              <div className="kv-row"><span className="kv-label">Reason</span><span className="kv-value">{shipment.payment_reason}</span></div>
            )}
          </div>

          {images.length > 0 && (
            <div className="section-card" style={{ marginTop: 20 }}>
              <div className="section-head">
                <span className="eyebrow">Images</span>
              </div>
              <div className="image-preview-grid">
                {images.map((img) => (
                  <a href={img.url} target="_blank" rel="noreferrer" className="image-preview" key={img.id}>
                    <img src={img.url} alt="Shipment" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="section-card" style={{ marginTop: 20 }}>
            <div className="section-head">
              <span className="eyebrow">Shipment Updates</span>
              <h2 className="section-title">Recent Updates</h2>
            </div>

            <form onSubmit={handleAddUpdate} style={{ marginBottom: 20 }}>
              <div style={{ marginBottom: 10 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>
                  Update Message
                </label>
                <textarea
                  className="textarea-input"
                  placeholder="e.g. Shipment departed Lagos. Shipment arrived Paris Hub."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={2}
                  style={{ minHeight: 70 }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>
                  Update Time
                  <span style={{ color: 'var(--ink-600)', marginLeft: 6, fontSize: 10 }}>
                    (leave blank to use current time)
                  </span>
                </label>
                <input
                  className="text-input"
                  type="datetime-local"
                  value={newUpdateTime}
                  onChange={(e) => setNewUpdateTime(e.target.value)}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={addingUpdate || !newMessage.trim()}
                style={{ padding: '8px 20px' }}
              >
                {addingUpdate ? 'Adding…' : '+ Add Update'}
              </button>
            </form>

            {updates.length === 0 ? (
              <p style={{ color: 'var(--ink-600)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>
                No updates yet. Add the first one above.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {updates.map((u) => (
                  <div
                    key={u.id}
                    style={{
                      background: 'var(--ink-800)',
                      border: '1px solid var(--ink-700)',
                      borderRadius: 8,
                      padding: '10px 14px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 12,
                    }}
                  >
                    <div>
                      <span style={{
                        display: 'block',
                        fontFamily: 'var(--font-mono)',
                        fontSize: 11,
                        color: 'var(--amber)',
                        marginBottom: 4,
                      }}>
                        {new Date(u.update_time).toLocaleString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span style={{ color: 'var(--paper)', fontSize: 13 }}>
                        {u.message}
                      </span>
                    </div>
                    <button
                      onClick={() => handleDeleteUpdate(u.id)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--rust)',
                        cursor: 'pointer',
                        fontSize: 16,
                        flexShrink: 0,
                        padding: '0 4px',
                      }}
                      title="Delete this update"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
