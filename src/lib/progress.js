// Checkpoints a shipment passes through, in order. Used to translate a
// 0..1 progress fraction into a human-readable "where is it" label, and
// to drive which checkpoint dot is lit up in the UI.
export const CHECKPOINTS = [
  { key: 'packaging', label: 'Packaging' },
  { key: 'queued', label: 'Queued' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'customs', label: 'Customs Clearance' },
  { key: 'delivered', label: 'Delivered' },
];

/**
 * Use manual progress_percent directly — no time math needed.
 * Admin sets progress_percent (0-100) when creating a shipment and
 * can update it anytime from the detail page.
 */
export function computeProgress(shipment) {
  // Use manual progress_percent directly — no time math needed
  const pct = shipment.progress_percent ?? 0;
  const fraction = Math.min(Math.max(pct / 100, 0), 1);

  const checkpointIndex = Math.min(
    Math.floor(fraction * (CHECKPOINTS.length - 1)),
    CHECKPOINTS.length - 1
  );

  return {
    fraction,
    eased: fraction,
    arrived: pct >= 100,
    msRemaining: 0,
    checkpointIndex,
    percent: pct,
  };
}

export function formatDuration(ms) {
  if (ms <= 0) return 'Arriving now';
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days}d ${hours}h remaining`;
  if (hours > 0) return `${hours}h ${minutes}m remaining`;
  return `${minutes}m remaining`;
}
