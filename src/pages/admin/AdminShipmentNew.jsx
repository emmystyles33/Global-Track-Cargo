import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { Field, Toggle, SectionCard } from '../../components/FormFields.jsx';
import ImageUploader from '../../components/ImageUploader.jsx';
import companyLogo from '../../../images/Global Track Cargo logo.jfif';

const SHIPMENT_TYPES = ['Air Freight', 'Ocean Freight', 'Road Freight', 'Rail Freight', 'Reverse Freight'];
const STATUSES = ['packaging', 'queued', 'in transit', 'customs', 'on hold', 'delivered'];

const initialForm = {
  courier: '',
  sender_name: '',
  sender_email: '',
  sender_phone: '',
  receiver_name: '',
  receiver_email: '',
  receiver_phone: '',
  origin: '',
  destination: '',
  shipment_type: 'Air Freight',
  quantity: 1,
  is_fragile: false,
  is_express: false,
  progress_speed: 'medium',
  progress_percent: 0,
  description: '',
  booked_at: '',
  shipped_date: '',
  estimated_delivery: '',
  status: 'packaging',
  payment_status: 'pending',
  amount_to_pay: '',
  payment_method: '',
  payment_reason: '',
};

export default function AdminShipmentNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [imageUrls, setImageUrls] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.sender_name || !form.receiver_name || !form.origin || !form.destination || !form.estimated_delivery) {
      setError('Please fill in all required fields (marked with *).');
      return;
    }

    setSubmitting(true);
    try {
      // Geocode origin & destination so the public tracker can plot a route.
      const [originGeo, destGeo] = await Promise.all([
        api.geocode(form.origin).catch(() => null),
        api.geocode(form.destination).catch(() => null),
      ]);

      const [datePart, timePart] = form.estimated_delivery.split('T');
      const [year, month, day] = datePart.split('-').map(Number);
      const [hour, minute] = timePart.split(':').map(Number);
      const deliveryDate = new Date(year, month - 1, day, hour, minute);
      const nowDate = new Date();

      if (isNaN(deliveryDate.getTime())) {
        setError('Estimated delivery date is invalid.');
        setSubmitting(false);
        return;
      }

      if (deliveryDate <= nowDate) {
        setError('Estimated delivery date must be in the future.');
        setSubmitting(false);
        return;
      }

      // Optional booking and shipped dates (datetime-local -> ISO)
      let bookedISO = null;
      if (form.booked_at) {
        const [bDatePart, bTimePart] = form.booked_at.split('T');
        const [by, bm, bd] = bDatePart.split('-').map(Number);
        const [bh, bmin] = bTimePart.split(':').map(Number);
        const bookedDate = new Date(by, bm - 1, bd, bh, bmin);
        if (isNaN(bookedDate.getTime())) {
          setError('Booking date is invalid.');
          setSubmitting(false);
          return;
        }
        bookedISO = bookedDate.toISOString();
      }

      let shippedISO = null;
      if (form.shipped_date) {
        const [sDatePart, sTimePart] = form.shipped_date.split('T');
        const [sy, sm, sd] = sDatePart.split('-').map(Number);
        const [sh, smin] = sTimePart.split(':').map(Number);
        const shippedDate = new Date(sy, sm - 1, sd, sh, smin);
        if (isNaN(shippedDate.getTime())) {
          setError('Shipped date is invalid.');
          setSubmitting(false);
          return;
        }
        shippedISO = shippedDate.toISOString();
      }

      const payload = {
        ...form,
        quantity: Number(form.quantity) || 1,
        amount_to_pay: form.amount_to_pay ? Number(form.amount_to_pay) : null,
        estimated_delivery: deliveryDate.toISOString(),
        booked_at: bookedISO,
        shipped_date: shippedISO,
        progress_percent: Number(form.progress_percent) || 0,
        origin_lat: originGeo?.lat ?? null,
        origin_lng: originGeo?.lng ?? null,
        destination_lat: destGeo?.lat ?? null,
        destination_lng: destGeo?.lng ?? null,
        image_urls: imageUrls,
      };

      const { shipment } = await api.createShipment(payload);
      setCreated(shipment);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    const handleDownloadReceipt = () => {
      const element = document.getElementById('shipment-receipt');
      const opt = {
        margin: 10,
        filename: `SHT-${created.tracking_number}-receipt.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' }
      };
      window.print();
    };

    const receiptDate = new Date(created.created_at).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    return (
      <div id="shipment-receipt" style={{ maxWidth: 800, margin: '0 auto', fontFamily: 'Inter, sans-serif' }}>
        <div style={{
          background: 'linear-gradient(135deg, var(--ink-950) 0%, var(--ink-900) 100%)',
          color: 'var(--paper)',
          padding: 40,
          borderRadius: 12,
          marginBottom: 30,
          boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 40 }}>
            <div>
              <div style={{ fontSize: 32, fontWeight: 700, fontFamily: 'var(--font-display)', marginBottom: 4 }}>
                <img className="receipt-brand-logo" src={companyLogo} alt="" />
                Global Track Cargo
              </div>
              <div style={{ fontSize: 13, color: 'var(--ink-300)' }}>Global Logistics & Express Delivery</div>
            </div>
            <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--ink-400)' }}>
              <div style={{ marginBottom: 8 }}>Receipt</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--amber)' }}>
                SHT-{created.tracking_number}
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ borderTop: '2px solid var(--ink-700)', marginBottom: 30 }} />

          {/* Main Content */}
          <div style={{ marginBottom: 30 }}>
            <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 20, color: 'var(--amber)' }}>
              ✓ Shipment Booked
            </div>

            {/* Two Column Layout */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30, marginBottom: 30 }}>
              {/* Left Column */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                  Tracking Number
                </div>
                <div style={{ fontSize: 22, fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: 20, color: 'var(--paper)' }}>
                  {created.tracking_number}
                </div>

                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                  Courier / Carrier
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--paper)' }}>
                  {created.courier || 'Standard Carrier'}
                </div>

                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                  Shipment Type
                </div>
                <div style={{ fontSize: 14, marginBottom: 20, color: 'var(--paper)' }}>
                  {created.shipment_type}
                </div>

                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                  Booking Date
                </div>
                <div style={{ fontSize: 14, color: 'var(--paper)' }}>
                  {receiptDate}
                </div>
              </div>

              {/* Right Column */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                  Route
                </div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, color: 'var(--paper)' }}>
                  {created.origin} → {created.destination}
                </div>

                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                  Quantity
                </div>
                <div style={{ fontSize: 14, marginBottom: 20, color: 'var(--paper)' }}>
                  {created.quantity} {created.quantity === 1 ? 'item' : 'items'}
                </div>

                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                  Estimated Delivery
                </div>
                <div style={{ fontSize: 14, marginBottom: 20, color: 'var(--amber)', fontWeight: 600 }}>
                  {new Date(created.estimated_delivery).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>

                <div style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 4, textTransform: 'uppercase', fontWeight: 600 }}>
                  Status
                </div>
                <div style={{ fontSize: 14, color: 'var(--ink-300)', textTransform: 'capitalize' }}>
                  {created.status}
                </div>
              </div>
            </div>

            {/* Recipient Info */}
            <div style={{ borderTop: '1px solid var(--ink-700)', paddingTop: 20 }}>
              <div style={{ fontSize: 11, color: 'var(--ink-400)', marginBottom: 12, textTransform: 'uppercase', fontWeight: 600 }}>
                Recipient
              </div>
              <div style={{ fontSize: 14, color: 'var(--paper)' }}>
                <strong>{created.receiver_name}</strong><br />
                {created.receiver_email && <>{created.receiver_email}<br /></>}
                {created.receiver_phone && <>{created.receiver_phone}</>}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '2px solid var(--ink-700)', paddingTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--ink-400)' }}>
            <div style={{ marginBottom: 8 }}>This booking receipt confirms your shipment has been successfully registered in our system.</div>
            <div>Share the tracking number <strong>{created.tracking_number}</strong> with the receiver for live tracking.</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 20 }}>
          <button
            onClick={handleDownloadReceipt}
            style={{
              padding: '12px 24px',
              background: 'var(--amber)',
              color: 'var(--ink-950)',
              border: 'none',
              borderRadius: 6,
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              fontFamily: 'Inter, sans-serif'
            }}
          >
            📥 Download as PDF
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate(`/admin/${created.id}`)}
          >
            View Shipment
          </button>
          <button
            className="btn-secondary"
            onClick={() => {
              setCreated(null);
              setForm(initialForm);
              setImageUrls([]);
            }}
          >
            Create Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 20 }}>
        <span className="eyebrow">New Entry</span>
        <h1 style={{ fontFamily: 'var(--font-display)', color: 'var(--paper)', margin: '4px 0 0' }}>
          Create Shipment
        </h1>
      </div>

      <div className="form-grid">
        <SectionCard eyebrow="Step 1" title="Courier & Parties">
          <Field label="Courier">
            <input className="text-input" value={form.courier} onChange={(e) => update('courier', e.target.value)} placeholder="e.g. DHL, FedEx, in-house fleet" />
          </Field>

          <div className="field-row">
            <Field label="Sender Name" required>
              <input className="text-input" value={form.sender_name} onChange={(e) => update('sender_name', e.target.value)} />
            </Field>
            <Field label="Sender Email">
              <input className="text-input" type="email" value={form.sender_email} onChange={(e) => update('sender_email', e.target.value)} />
            </Field>
          </div>
          <Field label="Sender Phone">
            <input className="text-input" value={form.sender_phone} onChange={(e) => update('sender_phone', e.target.value)} />
          </Field>

          <div className="field-row">
            <Field label="Receiver Name" required>
              <input className="text-input" value={form.receiver_name} onChange={(e) => update('receiver_name', e.target.value)} />
            </Field>
            <Field label="Receiver Email">
              <input className="text-input" type="email" value={form.receiver_email} onChange={(e) => update('receiver_email', e.target.value)} />
            </Field>
          </div>
          <Field label="Receiver Phone">
            <input className="text-input" value={form.receiver_phone} onChange={(e) => update('receiver_phone', e.target.value)} />
          </Field>
        </SectionCard>

        <SectionCard eyebrow="Step 2" title="Package & Route">
          <div className="field-row">
            <Field label="Origin" required hint="City, Country — used to plot the route">
              <input className="text-input" value={form.origin} onChange={(e) => update('origin', e.target.value)} placeholder="Lagos, Nigeria" />
            </Field>
            <Field label="Destination" required>
              <input className="text-input" value={form.destination} onChange={(e) => update('destination', e.target.value)} placeholder="London, UK" />
            </Field>
          </div>

          <div className="field-row">
            <Field label="Shipment Type" required>
              <select className="select-input" value={form.shipment_type} onChange={(e) => update('shipment_type', e.target.value)}>
                {SHIPMENT_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <input className="text-input" type="number" min="1" value={form.quantity} onChange={(e) => update('quantity', e.target.value)} />
            </Field>
          </div>

          <Field label="Fragile / Express">
            <div className="toggle-row">
              <Toggle checked={form.is_fragile} onChange={(v) => update('is_fragile', v)} label="Fragile" />
              <Toggle checked={form.is_express} onChange={(v) => update('is_express', v)} label="Express" />
            </div>
          </Field>

          <Field label="Description">
            <textarea className="textarea-input" value={form.description} onChange={(e) => update('description', e.target.value)} placeholder="What's inside the package…" />
          </Field>
        </SectionCard>

        <SectionCard eyebrow="Step 3" title="Status & Timing">
          <div className="field-row">
            <Field label="Shipment Status">
              <select className="select-input" value={form.status} onChange={(e) => update('status', e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
            <Field label="Progress Speed" hint="Affects animation style, not arrival time">
              <select className="select-input" value={form.progress_speed} onChange={(e) => update('progress_speed', e.target.value)}>
                <option value="slow">Slow</option>
                <option value="medium">Medium</option>
                <option value="fast">Fast</option>
              </select>
            </Field>
            <Field label="Initial Progress %" hint="Set where the shipment starts (0 = not started, 100 = delivered)">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <input
                  className="text-input"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={form.progress_percent}
                  onChange={(e) => update('progress_percent', Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--amber)' }}
                />
                <span style={{
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--amber)',
                  fontSize: 18,
                  fontWeight: 700,
                  minWidth: 48,
                  textAlign: 'right'
                }}>
                  {form.progress_percent}%
                </span>
              </div>
            </Field>          </div>

          <div className="field-row">
            <Field label="Booking Date" hint="When the shipment was booked">
              <input
                className="text-input"
                type="datetime-local"
                value={form.booked_at}
                onChange={(e) => update('booked_at', e.target.value)}
              />
            </Field>
            <Field label="Shipped Date" hint="When item physically left the sender">
              <input
                className="text-input"
                type="datetime-local"
                value={form.shipped_date}
                onChange={(e) => update('shipped_date', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Estimated Delivery" required hint="The shipment will arrive exactly at this date/time">
            <input className="text-input" type="datetime-local" value={form.estimated_delivery} onChange={(e) => update('estimated_delivery', e.target.value)} />
          </Field>
        </SectionCard>

        <SectionCard eyebrow="Step 4" title="Payment Details">
          <div className="field-row">
            <Field label="Payment Status">
              <select className="select-input" value={form.payment_status} onChange={(e) => update('payment_status', e.target.value)}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
              </select>
            </Field>
            <Field label="Amount To Pay">
              <input className="text-input" type="number" step="0.01" value={form.amount_to_pay} onChange={(e) => update('amount_to_pay', e.target.value)} placeholder="0.00" />
            </Field>
          </div>
          <div className="field-row">
            <Field label="Payment Method">
              <input className="text-input" value={form.payment_method} onChange={(e) => update('payment_method', e.target.value)} placeholder="Bank transfer, card, cash…" />
            </Field>
            <Field label="Reason For Payment">
              <input className="text-input" value={form.payment_reason} onChange={(e) => update('payment_reason', e.target.value)} placeholder="Shipping fee, customs…" />
            </Field>
          </div>
        </SectionCard>

        <SectionCard eyebrow="Step 5" title="Images">
          <ImageUploader urls={imageUrls} onChange={setImageUrls} />
        </SectionCard>
      </div>

      {error && <p className="error-text" style={{ marginTop: 16 }}>{error}</p>}

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Creating…' : 'Create Shipment'}
        </button>
      </div>
    </form>
  );
}
