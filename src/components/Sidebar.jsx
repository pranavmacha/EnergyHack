import { NODE_COLORS } from '../data/gridData';

function Sidebar({ selectedNode, nodes, edges, logs, neighbors, onDeselect }) {
  const onlineCount = nodes.filter(n => n.status === 'online').length;
  const avgLoad = Math.round(nodes.reduce((s, n) => s + n.load, 0) / nodes.length);
  const totalCapacity = edges.reduce((s, e) => s + e.capacity, 0);

  if (selectedNode) {
    const loadClass = selectedNode.load > 85 ? 'danger' : selectedNode.load > 70 ? 'warning' : '';
    const connectedCount = edges.filter(e => e.source === selectedNode.id || e.target === selectedNode.id).length;

    return (
      <div id="sidebar">
        <div className="sidebar-section fade-in">
          <div className="section-title">Node Details</div>
          <div className="node-name">{selectedNode.name}</div>
          <div className="node-type">{selectedNode.type} · {selectedNode.area}</div>
          <div className={`node-status ${selectedNode.status}`}>
            <span className={`status-dot ${selectedNode.status === 'attacked' ? 'red' : selectedNode.status === 'quarantined' ? 'amber' : ''}`}></span>
            {selectedNode.status.toUpperCase()}
          </div>
          <button className="deselect-btn" onClick={onDeselect}>✕ Close</button>
        </div>

        <div className="sidebar-section fade-in">
          <div className="section-title">Power Telemetry</div>
          <div className="data-row">
            <span className="data-label">Voltage</span>
            <span className="data-value highlight">{selectedNode.voltage}V</span>
          </div>
          <div className="data-row">
            <span className="data-label">Current</span>
            <span className="data-value">{selectedNode.current}A</span>
          </div>
          <div className="data-row">
            <span className="data-label">Load</span>
            <span>
              <span className="data-value">{selectedNode.load}%</span>
              <div className="mini-bar">
                <div className={`mini-bar-fill ${loadClass}`} style={{ width: `${selectedNode.load}%` }}></div>
              </div>
            </span>
          </div>
          <div className="data-row">
            <span className="data-label">Limit</span>
            <span className="data-value">250V</span>
          </div>
        </div>

        <div className="sidebar-section fade-in">
          <div className="section-title">Network</div>
          <div className="data-row">
            <span className="data-label">Packet Rate</span>
            <span className="data-value">{selectedNode.packetRate}/s</span>
          </div>
          <div className="data-row">
            <span className="data-label">Connections</span>
            <span className="data-value">{connectedCount}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Coordinates</span>
            <span className="data-value" style={{ fontSize: '10px' }}>{selectedNode.lat.toFixed(4)}, {selectedNode.lng.toFixed(4)}</span>
          </div>
        </div>

        <div className="sidebar-section fade-in">
          <div className="section-title">Connected Nodes</div>
          {neighbors.map(n => (
            <div className="data-row" key={n.id}>
              <span className="data-label" style={{ color: 'var(--text-primary)', textTransform: 'none' }}>{n.name}</span>
              <span className={`status-dot ${n.status === 'attacked' ? 'red' : n.status === 'quarantined' ? 'amber' : ''}`} style={{ animation: 'none' }}></span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default overview
  return (
    <div id="sidebar">
      <div className="sidebar-section">
        <div className="section-title">Grid Overview</div>
        <div className="data-row">
          <span className="data-label">Nodes Online</span>
          <span className="data-value highlight">{onlineCount}/{nodes.length}</span>
        </div>
        <div className="data-row">
          <span className="data-label">Avg Load</span>
          <span>
            <span className="data-value">{avgLoad}%</span>
            <div className="mini-bar">
              <div className="mini-bar-fill" style={{ width: `${avgLoad}%` }}></div>
            </div>
          </span>
        </div>
        <div className="data-row">
          <span className="data-label">Grid Status</span>
          <span className="data-value highlight">NOMINAL</span>
        </div>
        <div className="data-row">
          <span className="data-label">Threats</span>
          <span className="data-value">0 DETECTED</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-title">Topology</div>
        <div className="data-row">
          <span className="data-label">Edges</span>
          <span className="data-value">{edges.length} active</span>
        </div>
        <div className="data-row">
          <span className="data-label">Capacity</span>
          <span className="data-value">{totalCapacity} MW</span>
        </div>
      </div>

      <div className="sidebar-section">
        <div className="section-title">System Log</div>
        {logs.map((log, i) => (
          <div className="log-entry" key={i}>
            <span className="log-time">{log.time}</span>
            {log.message}
          </div>
        ))}
      </div>

      <div className="sidebar-section">
        <div className="placeholder-text">
          Click a node on the grid map<br />to view detailed telemetry
        </div>
      </div>
    </div>
  );
}

export default Sidebar;
