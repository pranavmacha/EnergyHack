import { useState, useEffect } from 'react';

const STATUS_STYLES = {
  NORMAL: { color: '#00ff41', icon: '✓', bg: 'rgba(0,255,65,0.06)' },
  FDI_ATTACK: { color: '#ff0040', icon: '⚠', bg: 'rgba(255,0,64,0.08)' },
  GENUINE_FAILURE: { color: '#ffaa00', icon: '⚡', bg: 'rgba(255,170,0,0.08)' },
  SCANNING: { color: '#4a8a4a', icon: '◌', bg: 'transparent' },
  ERROR: { color: '#555', icon: '✕', bg: 'rgba(85,85,85,0.06)' },
};

function ThreatPanel({ nodes, edges, onSelectNode, selectedId, onThreatDetected }) {
  const [scanResults, setScanResults] = useState([]);
  const [lastScan, setLastScan] = useState(null);
  const [apiStatus, setApiStatus] = useState('connecting');
  const [scanHistory, setScanHistory] = useState([]);

  // Get neighbor voltages for a node
  const getNeighborVoltages = (nodeId) => {
    const connectedEdges = edges.filter(e => e.source === nodeId || e.target === nodeId);
    return connectedEdges.map(e => {
      const neighborId = e.source === nodeId ? e.target : e.source;
      const neighbor = nodes.find(n => n.id === neighborId);
      return neighbor ? neighbor.voltage : null;
    }).filter(v => v !== null);
  };

  // Periodic ML scan
  useEffect(() => {
    let interval;

    const runScan = async () => {
      try {
        const payload = {
          nodes: nodes.map(n => ({
            nodeId: n.id,
            nodeName: n.name,
            voltage: n.voltage,
            neighborVoltages: getNeighborVoltages(n.id),
          }))
        };

        const res = await fetch('http://localhost:8000/api/scan-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        setScanResults(data.results);
        setLastScan(new Date().toTimeString().slice(0, 8));
        setApiStatus('connected');

        // Track threats in history
        const threats = data.results.filter(r => r.prediction !== 'NORMAL');
        if (threats.length > 0) {
          const time = new Date().toTimeString().slice(0, 8);
          setScanHistory(prev => [
            ...threats.map(t => ({ time, ...t })),
            ...prev,
          ].slice(0, 20));

          // ML model triggers actual defense — quarantine attacked nodes
          if (onThreatDetected) {
            threats.forEach(t => onThreatDetected(t));
          }
        }
      } catch (err) {
        setApiStatus('error');
      }
    };

    runScan();
    interval = setInterval(runScan, 3000);
    return () => clearInterval(interval);
  }, [nodes]);

  const threatCount = scanResults.filter(r => r.prediction === 'FDI_ATTACK').length;
  const failureCount = scanResults.filter(r => r.prediction === 'GENUINE_FAILURE').length;
  const normalCount = scanResults.filter(r => r.prediction === 'NORMAL').length;

  return (
    <div id="threat-panel">
      {/* Status Bar */}
      <div className="threat-status-bar">
        <div className="threat-stat">
          <span className="threat-stat-label">ML ENGINE</span>
          <span className={`threat-stat-value ${apiStatus === 'connected' ? 'green' : apiStatus === 'error' ? 'red' : 'dim'}`}>
            {apiStatus === 'connected' ? '● ONLINE' : apiStatus === 'error' ? '● OFFLINE' : '◌ CONNECTING'}
          </span>
        </div>
        <div className="threat-stat">
          <span className="threat-stat-label">LAST SCAN</span>
          <span className="threat-stat-value">{lastScan || '--:--:--'}</span>
        </div>
        <div className="threat-stat">
          <span className="threat-stat-label">NORMAL</span>
          <span className="threat-stat-value green">{normalCount}</span>
        </div>
        <div className="threat-stat">
          <span className="threat-stat-label">FDI ATTACKS</span>
          <span className="threat-stat-value red">{threatCount}</span>
        </div>
        <div className="threat-stat">
          <span className="threat-stat-label">FAILURES</span>
          <span className="threat-stat-value amber">{failureCount}</span>
        </div>
      </div>

      <div className="threat-content">
        {/* Node Scan Results */}
        <div className="threat-grid">
          <div className="threat-section-title">REAL-TIME NODE ANALYSIS</div>
          <div className="scan-results">
            {scanResults.length === 0 ? (
              <div className="threat-empty">
                {apiStatus === 'error' 
                  ? '⚠ Cannot reach FDI API. Start the backend:\ncd fdi && python api.py'
                  : 'Waiting for first scan...'}
              </div>
            ) : (
              scanResults.map(result => {
                const style = STATUS_STYLES[result.prediction] || STATUS_STYLES.SCANNING;
                const isSelected = selectedId === result.nodeId;
                return (
                  <div
                    key={result.nodeId}
                    className={`scan-card ${isSelected ? 'selected' : ''}`}
                    style={{ borderColor: style.color, background: style.bg }}
                    onClick={() => onSelectNode(result.nodeId)}
                  >
                    <div className="scan-card-header">
                      <span className="scan-icon" style={{ color: style.color }}>{style.icon}</span>
                      <span className="scan-node-name">{result.nodeName}</span>
                      <span className="scan-badge" style={{ color: style.color, borderColor: style.color }}>
                        {result.prediction}
                      </span>
                    </div>
                    <div className="scan-card-body">
                      <div className="scan-metric">
                        <span className="scan-metric-label">Confidence</span>
                        <span className="scan-metric-value" style={{ color: style.color }}>{result.confidence}</span>
                      </div>
                      <div className="scan-metric">
                        <span className="scan-metric-label">Voltage</span>
                        <span className="scan-metric-value">{result.extracted_features?.voltage?.toFixed(1)}V</span>
                      </div>
                      <div className="scan-metric">
                        <span className="scan-metric-label">Neighbor Avg</span>
                        <span className="scan-metric-value">{result.extracted_features?.neighbor_mean?.toFixed(1)}V</span>
                      </div>
                      <div className="scan-metric">
                        <span className="scan-metric-label">Deviation</span>
                        <span className="scan-metric-value">{result.extracted_features?.difference_from_neighbors?.toFixed(2)}V</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Threat History */}
        <div className="threat-history">
          <div className="threat-section-title">THREAT LOG</div>
          {scanHistory.length === 0 ? (
            <div className="threat-empty">No threats detected yet. All nodes nominal.</div>
          ) : (
            scanHistory.map((entry, i) => {
              const style = STATUS_STYLES[entry.prediction] || STATUS_STYLES.SCANNING;
              return (
                <div key={i} className="threat-log-entry" style={{ borderLeftColor: style.color }}>
                  <span className="threat-log-time">{entry.time}</span>
                  <span className="threat-log-icon" style={{ color: style.color }}>{style.icon}</span>
                  <span className="threat-log-node">{entry.nodeName}</span>
                  <span className="threat-log-pred" style={{ color: style.color }}>{entry.prediction}</span>
                  <span className="threat-log-conf">{entry.confidence}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default ThreatPanel;
