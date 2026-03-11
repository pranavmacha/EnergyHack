// GridShield AI — Hyderabad Power Grid Data
// Real substation locations with simulated telemetry

export const GRID_NODES = [
  { id: 'N1', name: 'Gachibowli 132kV', lat: 17.4400, lng: 78.3489, type: '132kV Substation', area: 'West Zone', voltage: 230, current: 485, load: 72, packetRate: 512, status: 'online' },
  { id: 'N2', name: 'HITEC City 220kV', lat: 17.4487, lng: 78.3764, type: '220kV Substation', area: 'West Zone', voltage: 231, current: 520, load: 78, packetRate: 498, status: 'online' },
  { id: 'N3', name: 'Kukatpally 132kV', lat: 17.4947, lng: 78.3996, type: '132kV Substation', area: 'Northwest Zone', voltage: 229, current: 460, load: 65, packetRate: 523, status: 'online' },
  { id: 'N4', name: 'Secunderabad 220kV', lat: 17.4399, lng: 78.4983, type: '220kV Substation', area: 'Northeast Zone', voltage: 232, current: 540, load: 81, packetRate: 507, status: 'online' },
  { id: 'N5', name: 'Begumpet 132kV', lat: 17.4437, lng: 78.4672, type: '132kV Substation', area: 'Central Zone', voltage: 228, current: 475, load: 68, packetRate: 515, status: 'online' },
  { id: 'N6', name: 'Mehdipatnam 220kV', lat: 17.3950, lng: 78.4422, type: '220kV Substation', area: 'South-Central Zone', voltage: 230, current: 510, load: 75, packetRate: 501, status: 'online' },
  { id: 'N7', name: 'LB Nagar 132kV', lat: 17.3457, lng: 78.5522, type: '132kV Substation', area: 'Southeast Zone', voltage: 229, current: 445, load: 62, packetRate: 519, status: 'online' },
  { id: 'N8', name: 'Charminar 132kV', lat: 17.3616, lng: 78.4747, type: '132kV Substation', area: 'South Zone', voltage: 231, current: 490, load: 70, packetRate: 508, status: 'online' },
];

export const GRID_EDGES = [
  { source: 'N1', target: 'N2', capacity: 150, load: 65, label: 'Trunk-A1' },
  { source: 'N2', target: 'N3', capacity: 120, load: 58, label: 'Trunk-A2' },
  { source: 'N2', target: 'N5', capacity: 180, load: 72, label: 'Trunk-B1' },
  { source: 'N3', target: 'N4', capacity: 130, load: 61, label: 'Trunk-C1' },
  { source: 'N5', target: 'N4', capacity: 160, load: 69, label: 'Trunk-B2' },
  { source: 'N5', target: 'N6', capacity: 140, load: 74, label: 'Trunk-D1' },
  { source: 'N6', target: 'N8', capacity: 110, load: 55, label: 'Trunk-E1' },
  { source: 'N8', target: 'N7', capacity: 100, load: 48, label: 'Trunk-E2' },
  { source: 'N4', target: 'N7', capacity: 120, load: 52, label: 'Trunk-C2' },
  { source: 'N1', target: 'N6', capacity: 90, load: 44, label: 'Trunk-F1' },
];

export const NODE_COLORS = {
  online: '#00ff41',
  attacked: '#ff0040',
  quarantined: '#ffaa00',
  offline: '#555555',
};

export function clamp(val, min, max) {
  return Math.min(max, Math.max(min, val));
}
