import { CHECKPOINTS } from '../lib/progress.js';

export default function CheckpointStrip({ checkpointIndex, fillPercent }) {
  return (
    <div className="checkpoint-track">
      <div className="checkpoint-line" />
      <div className="checkpoint-line-fill" style={{ width: `${fillPercent}%` }} />
      {CHECKPOINTS.map((cp, i) => {
        const state = i < checkpointIndex ? 'done' : i === checkpointIndex ? 'current' : '';
        return (
          <div className={`checkpoint-item ${state}`} key={cp.key}>
            <span className={`checkpoint-dot ${state}`} />
            <span className="checkpoint-label">{cp.label}</span>
          </div>
        );
      })}
    </div>
  );
}
