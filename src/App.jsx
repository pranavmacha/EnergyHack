import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import GridMap from './components/GridMap';
import Sidebar from './components/Sidebar';
import StatusBar from './components/StatusBar';
import TelemetryPanel from './components/TelemetryPanel';
import ThreatPanel from './components/ThreatPanel';
import { GRID_NODES, GRID_EDGES, clamp } from './data/gridData';

function App() {
  const [nodes, setNodes] = useState(GRID_NODES);
  const [selectedId, setSelectedId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState('map');

  const addLog = useCallback((message) => {
    const time = new Date().toTimeString().slice(0, 8);
    setLogs(prev => [{ time, message }, ...prev.slice(0, 9)]);
  }, []);

  // Initialize telemetry history with 20 pre-filled data points
  const [telemetryHistory, setTelemetryHistory] = useState(() => {
    const now = Date.now();
    return Array.from({ length: 20 }, (_, i) => ({
      time: new Date(now - (19 - i) * 1500).toTimeString().slice(0, 8),
      nodes: GRID_NODES.map(n => ({
        id: n.id,
        voltage: Math.round(n.voltage + (Math.random() - 0.5) * 4),
        packetRate: Math.round(n.packetRate + (Math.random() - 0.5) * 30),
      }))
    }));
  });

  // Real-time telemetry simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setNodes(prev => {
        const newNodes = prev.map(node => {
          // Attacked/quarantined nodes have special behavior
          if (node.status === 'attacked' && node._attackType === 'FDI') {
            return { ...node, voltage: 0, current: 0 }; // Spoofed to 0
          }
          if (node.status === 'offline' && node._attackType === 'DDOS') {
            return { ...node, packetRate: Math.round(2000000 + Math.random() * 500000) }; // Active DDoS flood
          }
          if (node.status === 'quarantined') {
            // Quarantined nodes show recovering values
            return {
              ...node,
              voltage: Math.round(clamp(node.voltage + (Math.random() - 0.5) * 1, 225, 235)),
              current: Math.round(clamp(node.current + (Math.random() - 0.5) * 5, 400, 580)),
              load: Math.round(clamp(node.load + (Math.random() - 0.5) * 2, 40, 95)),
              packetRate: Math.round(clamp(node.packetRate + (Math.random() - 0.5) * 10, 450, 580)),
            };
          }
          if (node.status !== 'online') return node;
          return {
            ...node,
            voltage: Math.round(clamp(node.voltage + (Math.random() - 0.5) * 2, 225, 235)),
            current: Math.round(clamp(node.current + (Math.random() - 0.5) * 10, 400, 580)),
            load: Math.round(clamp(node.load + (Math.random() - 0.5) * 3, 40, 95)),
            packetRate: Math.round(clamp(node.packetRate + (Math.random() - 0.5) * 20, 450, 580)),
          };
        });

        const time = new Date().toTimeString().slice(0, 8);
        setTelemetryHistory(prevH => [
          ...prevH.slice(-19),
          { time, nodes: newNodes.map(n => ({ id: n.id, voltage: n.voltage, packetRate: n.packetRate })) }
        ]);

        return newNodes;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // BroadcastChannel — listen for attack events from simulator
  useEffect(() => {
    const channel = new BroadcastChannel('gridshield-attacks');

    channel.onmessage = (event) => {
      const { action, type, nodeId, nodeName } = event.data;

      if (action === 'ATTACK_START') {
        if (type === 'FDI') {
          // FDI: Node turns red (attacked), voltage spoofed to 0
          setNodes(prev => prev.map(n =>
            n.id === nodeId ? { ...n, status: 'attacked', _attackType: 'FDI', voltage: 0, current: 0 } : n
          ));
          addLog(`⚠️ CRITICAL: FDI signature detected at ${nodeName}. Voltage spoofed to 0V.`);


        } else if (type === 'DDOS') {
          // DDoS: Node goes offline, packet rate spikes
          setNodes(prev => prev.map(n =>
            n.id === nodeId ? { ...n, status: 'offline', _attackType: 'DDOS', packetRate: 2400000 } : n
          ));
          addLog(`🔴 ALERT: DDoS attack on ${nodeName}. 2.4M packets/sec. Traffic filtering deployed.`);
        }
      }

      if (action === 'ATTACK_STOP') {
        // Restore node to online with recovery cooldown
        const originalNode = GRID_NODES.find(n => n.id === nodeId);
        if (originalNode) {
          setNodes(prev => prev.map(n =>
            n.id === nodeId ? { ...n, status: 'online', _attackType: null, _recoveredAt: Date.now(), voltage: originalNode.voltage, current: originalNode.current, packetRate: originalNode.packetRate } : n
          ));
          addLog(`🟢 ${nodeName} recovered. All systems nominal.`);
        }
      }
    };

    return () => channel.close();
  }, [addLog]);

  // Initial system logs
  useEffect(() => {
    const time = new Date().toTimeString().slice(0, 8);
    setLogs([
      { time, message: 'Telemetry sync complete. Network scan clear.' },
      { time, message: 'System initialized. All nodes reporting healthy.' },
    ]);
  }, []);



  const selectedNode = selectedId ? nodes.find(n => n.id === selectedId) : null;
  const onlineCount = nodes.filter(n => n.status === 'online').length;

  const getNeighbors = useCallback((nodeId) => {
    const connectedEdges = GRID_EDGES.filter(e => e.source === nodeId || e.target === nodeId);
    return connectedEdges.map(e => {
      const neighborId = e.source === nodeId ? e.target : e.source;
      return nodes.find(n => n.id === neighborId);
    }).filter(Boolean);
  }, [nodes]);

  // ML model triggers actual defense actions
  const handleThreatDetected = useCallback((threat) => {
    setNodes(prev => prev.map(n => {
      if (n.id !== threat.nodeId) return n;
      // Don't re-trigger if already handled
      if (n.status === 'quarantined' || n.status === 'offline') return n;
      // Don't re-trigger during recovery cooldown (10s after manual stop)
      if (n._recoveredAt && Date.now() - n._recoveredAt < 10000) return n;

      if (threat.prediction === 'FDI_ATTACK') {
        addLog(`🤖 ML ENGINE: FDI_ATTACK on ${threat.nodeName} (${threat.confidence} confidence). Auto-quarantining.`);
        return { ...n, status: 'quarantined', _attackType: 'FDI' };
      }
      if (threat.prediction === 'DDOS_ATTACK') {
        addLog(`🤖 ML ENGINE: DDOS_ATTACK on ${threat.nodeName} (${threat.confidence} confidence). Auto-filtering traffic.`);
        return { ...n, status: 'quarantined', _attackType: null, packetRate: 500 };
      }
      if (threat.prediction === 'GENUINE_FAILURE') {
        addLog(`🤖 ML ENGINE: Genuine failure at ${threat.nodeName} (${threat.confidence}). Dispatching repair.`);
        return { ...n, status: 'quarantined', _attackType: null };
      }
      return n;
    }));
  }, [addLog]);

  return (
    <div id="app">
      <Header onlineCount={onlineCount} totalCount={nodes.length} currentPage={currentPage} onPageChange={setCurrentPage} />
      <main>
        <div className="content-area">
          {currentPage === 'map' && (
            <div id="map-wrapper">
              <GridMap
                nodes={nodes}
                edges={GRID_EDGES}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          )}
          {currentPage === 'telemetry' && (
            <TelemetryPanel
              history={telemetryHistory}
              selectedId={selectedId}
              nodes={nodes}
              onSelectNode={setSelectedId}
            />
          )}
          <div style={{ display: currentPage === 'threats' ? 'block' : 'none' }}>
            <ThreatPanel
              nodes={nodes}
              edges={GRID_EDGES}
              selectedId={selectedId}
              onSelectNode={setSelectedId}
              onThreatDetected={handleThreatDetected}
            />
          </div>
        </div>
        <Sidebar
          selectedNode={selectedNode}
          nodes={nodes}
          edges={GRID_EDGES}
          logs={logs}
          neighbors={selectedNode ? getNeighbors(selectedId) : []}
          onDeselect={() => setSelectedId(null)}
        />
      </main>
      <StatusBar nodes={nodes} />
    </div>
  );
}

export default App;
