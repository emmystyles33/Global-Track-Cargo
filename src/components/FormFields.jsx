export function Field({ label, required, children, hint }) {
  return (
    <div className="field">
      <label className="field-label" style={{ display: 'block', marginBottom: 6 }}>
        {label}
        {required && <span className="required-star">*</span>}
      </label>
      {children}
      {hint && (
        <span style={{ display: 'block', fontSize: 11, color: 'var(--ink-600)', marginTop: 4 }}>
          {hint}
        </span>
      )}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" className="toggle-btn" onClick={() => onChange(!checked)}>
      <span className={`toggle-track ${checked ? 'on' : ''}`}>
        <span className="toggle-thumb" />
      </span>
      {label}
    </button>
  );
}

export function SectionCard({ eyebrow, title, children }) {
  return (
    <div className="section-card">
      <div className="section-head">
        <span className="eyebrow">{eyebrow}</span>
        <h2 className="section-title">{title}</h2>
      </div>
      {children}
    </div>
  );
}
