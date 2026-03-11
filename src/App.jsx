import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import GridMap from './components/GridMap';
import Sidebar from './components/Sidebar';
import StatusBar from './components/StatusBar';
import TelemetryPanel from './components/TelemetryPanel';
import { GRID_NODES, GRID_EDGES, clamp } from './data/gridData';

function App() {
  const [nodes, setNodes] = useState(GRID_NODES);
  const [selectedId, setSelectedId] = useState(null);
  const [logs, setLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState('map');

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
          if (node.status !== 'online') return node;
          return {
            ...node,
            voltage: Math.round(clamp(node.voltage + (Math.random() - 0.5) * 2, 225, 235)),
            current: Math.round(clamp(node.current + (Math.random() - 0.5) * 10, 400, 580)),
            load: Math.round(clamp(node.load + (Math.random() - 0.5) * 3, 40, 95)),
            packetRate: Math.round(clamp(node.packetRate + (Math.random() - 0.5) * 20, 450, 580)),
          };
        });

        // Update telemetry history with new readings
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

  // Initial system logs
  useEffect(() => {
    const time = new Date().toTimeString().slice(0, 8);
    setLogs([
      { time, message: 'Telemetry sync complete. Network scan clear.' },
      { time, message: 'System initialized. All nodes reporting healthy.' },
    ]);
  }, []);

  const addLog = useCallback((message) => {
    const time = new Date().toTimeString().slice(0, 8);
    setLogs(prev => [{ time, message }, ...prev.slice(0, 9)]);
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

  return (
    <div id="app">
      <Header onlineCount={onlineCount} totalCount={nodes.length} currentPage={currentPage} onPageChange={setCurrentPage} />
      <main>
        <div className="content-area">
          {currentPage === 'map' ? (
            <div id="map-wrapper">
              <GridMap
                nodes={nodes}
                edges={GRID_EDGES}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          ) : (
            <TelemetryPanel
              history={telemetryHistory}
              selectedId={selectedId}
              nodes={nodes}
              onSelectNode={setSelectedId}
            />
          )}
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
