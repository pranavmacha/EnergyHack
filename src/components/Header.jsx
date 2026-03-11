import { useState, useEffect } from 'react';

function Header({ onlineCount, totalCount, currentPage, onPageChange }) {
  const [clock, setClock] = useState('--:--:--');

  useEffect(() => {
    const update = () => setClock(new Date().toTimeString().slice(0, 8));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header>
      <div className="header-left">
        <div className="header-brand">
          <span className="shield-icon">🛡️</span>
          <h1>GridShield AI</h1>
          <span className="subtitle">AUTONOMOUS CYBER-PHYSICAL DEFENSE</span>
        </div>
        <nav className="header-nav">
          <button
            className={`nav-tab ${currentPage === 'map' ? 'active' : ''}`}
            onClick={() => onPageChange('map')}
          >
            ⬡ Grid Map
          </button>
          <button
            className={`nav-tab ${currentPage === 'telemetry' ? 'active' : ''}`}
            onClick={() => onPageChange('telemetry')}
          >
            📈 Telemetry
          </button>
          <button
            className={`nav-tab ${currentPage === 'threats' ? 'active' : ''}`}
            onClick={() => onPageChange('threats')}
          >
            🔍 Threats
          </button>
        </nav>
      </div>
      <div className="header-status">
        <div className="status-chip">
          <span className="status-dot"></span>
          <span>SYSTEMS ONLINE</span>
        </div>
        <span className="header-clock">{clock}</span>
      </div>
    </header>
  );
}

export default Header;
