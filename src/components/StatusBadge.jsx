const STATUS_CLASS = {
  packaging: 'status-packaging',
  queued: 'status-queued',
  'in transit': 'status-in-transit',
  customs: 'status-customs',
  'on hold': 'status-on-hold',
  delivered: 'status-delivered',
};

export default function StatusBadge({ status }) {
  const cls = STATUS_CLASS[status] || 'status-packaging';
  return (
    <span className={`status-badge ${cls}`}>
      <span className="dot" />
      {status}
    </span>
  );
}
