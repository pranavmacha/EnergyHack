import { memo } from 'react';

function StatusBar({ nodes }) {
  const onlineCount = nodes.filter(n => n.status === 'online').length;
  const avgLoad = Math.round(nodes.reduce((s, n) => s + n.load, 0) / nodes.length);
  const allNominal = onlineCount === nodes.length;

  return (
    <footer>
      <div className="footer-item">
        <span>●</span>
        <span className="footer-value">{allNominal ? 'ALL NOMINAL' : 'ALERT'}</span>
      </div>
      <div className="footer-item">
        <span>NODES:</span>
        <span className="footer-value">{onlineCount}/{nodes.length}</span>
      </div>
      <div className="footer-item">
        <span>GRID LOAD:</span>
        <span className="footer-value">{avgLoad}%</span>
      </div>
      <div className="footer-item">
        <span>REGION:</span>
        <span className="footer-value">HYDERABAD · TSSPDCL</span>
      </div>
    </footer>
  );
}

export default memo(StatusBar);
