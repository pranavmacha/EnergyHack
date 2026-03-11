import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STATUS_STYLES = {
  NORMAL: { color: '#00ff41', icon: '✓', bg: 'rgba(0,255,65,0.06)' },
  FDI_ATTACK: { color: '#ff0040', icon: '⚠', bg: 'rgba(255,0,64,0.08)' },
  DDOS_ATTACK: { color: '#ff4400', icon: '🌊', bg: 'rgba(255,68,0,0.08)' },
  GENUINE_FAILURE: { color: '#ffaa00', icon: '⚡', bg: 'rgba(255,170,0,0.08)' },
  SCANNING: { color: '#4a8a4a', icon: '◌', bg: 'transparent' },
  ERROR: { color: '#555', icon: '✕', bg: 'rgba(85,85,85,0.06)' },
};

function ThreatPanel({ nodes, edges, onSelectNode, selectedId, onThreatDetected }) {
  const [scanResults, setScanResults] = useState([]);
  const [lastScan, setLastScan] = useState(null);
  const [apiStatus, setApiStatus] = useState('connecting');
  const [scanHistory, setScanHistory] = useState([]);

  const nodesRef = useRef(nodes);
  const onThreatDetectedRef = useRef(onThreatDetected);
  const inFlightRef = useRef(false);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    onThreatDetectedRef.current = onThreatDetected;
  }, [onThreatDetected]);

  const edgeNeighbors = useMemo(() => {
    const map = new Map();
    for (const edge of edges) {
      if (!map.has(edge.source)) map.set(edge.source, []);
      if (!map.has(edge.target)) map.set(edge.target, []);
      map.get(edge.source).push(edge.target);
      map.get(edge.target).push(edge.source);
    }
    return map;
  }, [edges]);

  const buildPayload = useCallback(() => {
    const currentNodes = nodesRef.current;
    const nodeById = new Map(currentNodes.map((node) => [node.id, node]));

    return {
      nodes: currentNodes.map((node) => {
        const neighborVoltages = (edgeNeighbors.get(node.id) || [])
          .map((neighborId) => nodeById.get(neighborId))
          .filter(
            (neighbor) =>
              neighbor &&
              neighbor.status !== 'attacked' &&
              neighbor.status !== 'quarantined' &&
              neighbor.status !== 'offline'
          )
          .map((neighbor) => neighbor.voltage);

        return {
          nodeId: node.id,
          nodeName: node.name,
          voltage: node.voltage,
          neighborVoltages,
          packetRate: node.packetRate || 500,
          packetSize: 512,
          connections: node.packetRate > 100000 ? 2000 : 50,
          errorRate: node.packetRate > 100000 ? 0.3 : 0.01,
        };
      }),
    };
  }, [edgeNeighbors]);

  // Periodic ML scan
  useEffect(() => {
    let intervalId = null;
    let abortController = null;

    const runScan = async () => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      if (abortController) abortController.abort();
      abortController = new AbortController();

      try {
        const payload = buildPayload();

        const res = await fetch('http://localhost:8000/api/scan-all', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: abortController.signal,
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
          if (onThreatDetectedRef.current) {
            threats.forEach((threat) => onThreatDetectedRef.current(threat));
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setApiStatus('error');
      } finally {
        inFlightRef.current = false;
      }
    };

    runScan();
    intervalId = setInterval(runScan, 3000);

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (abortController) abortController.abort();
    };
  }, [buildPayload]);

  const threatCount = useMemo(
    () => scanResults.filter((result) => result.prediction === 'FDI_ATTACK').length,
    [scanResults]
  );
  const ddosCount = useMemo(
    () => scanResults.filter((result) => result.prediction === 'DDOS_ATTACK').length,
    [scanResults]
  );
  const failureCount = useMemo(
    () => scanResults.filter((result) => result.prediction === 'GENUINE_FAILURE').length,
    [scanResults]
  );
  const normalCount = useMemo(
    () => scanResults.filter((result) => result.prediction === 'NORMAL').length,
    [scanResults]
  );

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
          <span className="threat-stat-label">DDOS ATTACKS</span>
          <span className="threat-stat-value" style={{color: '#ff4400'}}>{ddosCount}</span>
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
                        <span className="scan-metric-label">FDI Status</span>
                        <span className="scan-metric-value" style={{ color: result.fdi?.prediction === 'FDI_ATTACK' ? '#ff0040' : '#00ff41', fontSize: '9px' }}>
                          {result.fdi?.prediction || 'N/A'}
                        </span>
                      </div>
                      <div className="scan-metric">
                        <span className="scan-metric-label">DDoS Status</span>
                        <span className="scan-metric-value" style={{ color: result.ddos?.prediction === 'DDOS_ATTACK' ? '#ff4400' : '#00ff41', fontSize: '9px' }}>
                          {result.ddos?.prediction === 'DDOS_ATTACK' ? 'ATTACK' : 'NORMAL'}
                        </span>
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

export default memo(ThreatPanel);
