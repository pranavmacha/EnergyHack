import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const NODE_COLORS = {
  N1: '#00ff41', N2: '#0aff99', N3: '#00aaff', N4: '#ffaa00',
  N5: '#ff6600', N6: '#cc44ff', N7: '#ff4488', N8: '#44ffcc'
};

function makeChartOptions(title, yLabel, suggestedMin, suggestedMax) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 200 },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: title,
        color: '#00ff41',
        font: { family: 'Orbitron, sans-serif', size: 10, weight: '400' },
        padding: { bottom: 8 },
      },
      tooltip: {
        backgroundColor: 'rgba(5,10,5,0.9)',
        borderColor: 'rgba(0,255,65,0.3)',
        borderWidth: 1,
        titleColor: '#00ff41',
        bodyColor: '#c0ffc0',
        titleFont: { family: 'Share Tech Mono', size: 11 },
        bodyFont: { family: 'Share Tech Mono', size: 10 },
      },
    },
    scales: {
      x: {
        grid: { color: 'rgba(0,255,65,0.06)' },
        ticks: { color: '#4a8a4a', font: { size: 9, family: 'Share Tech Mono' }, maxRotation: 0, maxTicksLimit: 8 },
        border: { color: 'rgba(0,255,65,0.15)' },
      },
      y: {
        grid: { color: 'rgba(0,255,65,0.06)' },
        ticks: { color: '#4a8a4a', font: { size: 9, family: 'Share Tech Mono' } },
        border: { color: 'rgba(0,255,65,0.15)' },
        suggestedMin,
        suggestedMax,
        title: {
          display: true, text: yLabel,
          color: '#4a8a4a', font: { size: 9, family: 'Share Tech Mono' },
        },
      },
    },
  };
}

function TelemetryPanel({ history, selectedId, nodes, onSelectNode }) {
  const labels = history.map(h => h.time.slice(3, 8));

  const makeNodeDatasets = (field) =>
    nodes.map(node => {
      const isSelected = selectedId === node.id;
      const noSelection = selectedId === null;
      return {
        label: node.name,
        data: history.map(h => {
          const r = h.nodes.find(n => n.id === node.id);
          return r ? r[field] : null;
        }),
        borderColor: isSelected
          ? NODE_COLORS[node.id]
          : noSelection
            ? `${NODE_COLORS[node.id]}60`
            : `${NODE_COLORS[node.id]}20`,
        borderWidth: isSelected ? 2.5 : noSelection ? 1.2 : 0.8,
        pointRadius: isSelected ? 2 : 0,
        pointBackgroundColor: NODE_COLORS[node.id],
        fill: false,
        tension: 0.3,
      };
    });

  // Voltage chart — includes limit line
  const voltageData = {
    labels,
    datasets: [
      {
        label: '⚠ LIMIT (250V)',
        data: Array(history.length).fill(250),
        borderColor: '#ff004066',
        borderDash: [8, 4],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      },
      ...makeNodeDatasets('voltage'),
    ],
  };

  // Traffic chart
  const trafficData = {
    labels,
    datasets: makeNodeDatasets('packetRate'),
  };

  return (
    <div id="telemetry-panel" className="telemetry-fullpage">
      <div className="telemetry-legend">
        {nodes.map(node => (
          <button
            key={node.id}
            className={`legend-item ${selectedId === node.id ? 'active' : ''}`}
            style={{ '--node-color': NODE_COLORS[node.id] }}
            onClick={() => onSelectNode(selectedId === node.id ? null : node.id)}
          >
            <span className="legend-dot" style={{ background: NODE_COLORS[node.id] }}></span>
            {node.name}
          </button>
        ))}
      </div>
      <div className="charts-row">
        <div className="chart-container">
          <Line data={voltageData} options={makeChartOptions('POWER TELEMETRY', 'Voltage (V)', 210, 260)} />
        </div>
        <div className="chart-container">
          <Line data={trafficData} options={makeChartOptions('NETWORK TRAFFIC', 'Packets/s', 420, 600)} />
        </div>
      </div>
    </div>
  );
}

export default TelemetryPanel;
