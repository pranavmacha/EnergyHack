// GridShield AI — Hyderabad Power Grid Data
// Real substation locations with simulated telemetry

export const GRID_NODES = [
  // ── Original 8 nodes ───────────────────────────────────────
  { id: 'N1',  name: 'Gachibowli 132kV',    lat: 17.4400, lng: 78.3489, type: '132kV Substation', area: 'West Zone',          voltage: 230, current: 485, load: 72, packetRate: 512, status: 'online' },
  { id: 'N2',  name: 'HITEC City 220kV',     lat: 17.4487, lng: 78.3764, type: '220kV Substation', area: 'West Zone',          voltage: 231, current: 520, load: 78, packetRate: 498, status: 'online' },
  { id: 'N3',  name: 'Kukatpally 132kV',     lat: 17.4947, lng: 78.3996, type: '132kV Substation', area: 'Northwest Zone',     voltage: 229, current: 460, load: 65, packetRate: 523, status: 'online' },
  { id: 'N4',  name: 'Secunderabad 220kV',   lat: 17.4399, lng: 78.4983, type: '220kV Substation', area: 'Northeast Zone',     voltage: 232, current: 540, load: 81, packetRate: 507, status: 'online' },
  { id: 'N5',  name: 'Begumpet 132kV',       lat: 17.4437, lng: 78.4672, type: '132kV Substation', area: 'Central Zone',       voltage: 228, current: 475, load: 68, packetRate: 515, status: 'online' },
  { id: 'N6',  name: 'Mehdipatnam 220kV',    lat: 17.3950, lng: 78.4422, type: '220kV Substation', area: 'South-Central Zone', voltage: 230, current: 510, load: 75, packetRate: 501, status: 'online' },
  { id: 'N7',  name: 'LB Nagar 132kV',       lat: 17.3457, lng: 78.5522, type: '132kV Substation', area: 'Southeast Zone',     voltage: 229, current: 445, load: 62, packetRate: 519, status: 'online' },
  { id: 'N8',  name: 'Charminar 132kV',      lat: 17.3616, lng: 78.4747, type: '132kV Substation', area: 'South Zone',         voltage: 231, current: 490, load: 70, packetRate: 508, status: 'online' },

  // ── New nodes (N9–N15) ─────────────────────────────────────
  { id: 'N9',  name: 'Jubilee Hills 220kV',  lat: 17.4325, lng: 78.4072, type: '220kV Substation', area: 'West-Central Zone',  voltage: 230, current: 505, load: 76, packetRate: 510, status: 'online' },
  { id: 'N10', name: 'Ameerpet 132kV',       lat: 17.4375, lng: 78.4482, type: '132kV Substation', area: 'Central Zone',       voltage: 229, current: 470, load: 69, packetRate: 518, status: 'online' },
  { id: 'N11', name: 'Uppal 132kV',          lat: 17.4005, lng: 78.5595, type: '132kV Substation', area: 'East Zone',          voltage: 228, current: 435, load: 60, packetRate: 525, status: 'online' },
  { id: 'N12', name: 'Miyapur 220kV',        lat: 17.4965, lng: 78.3535, type: '220kV Substation', area: 'Northwest Zone',     voltage: 231, current: 495, load: 71, packetRate: 505, status: 'online' },
  { id: 'N13', name: 'Madhapur 132kV',       lat: 17.4484, lng: 78.3908, type: '132kV Substation', area: 'West Zone',          voltage: 230, current: 480, load: 73, packetRate: 502, status: 'online' },
  { id: 'N14', name: 'Shamshabad 220kV',     lat: 17.2403, lng: 78.4294, type: '220kV Substation', area: 'Far South Zone',     voltage: 232, current: 550, load: 84, packetRate: 496, status: 'online' },
  { id: 'N15', name: 'Tarnaka 132kV',        lat: 17.4268, lng: 78.5310, type: '132kV Substation', area: 'East-Central Zone',  voltage: 229, current: 455, load: 66, packetRate: 520, status: 'online' },
];

export const GRID_EDGES = [
  // ── Original 10 trunk lines ────────────────────────────────
  { source: 'N1',  target: 'N2',  capacity: 150, load: 65, label: 'Trunk-A1' },
  { source: 'N2',  target: 'N3',  capacity: 120, load: 58, label: 'Trunk-A2' },
  { source: 'N2',  target: 'N5',  capacity: 180, load: 72, label: 'Trunk-B1' },
  { source: 'N3',  target: 'N4',  capacity: 130, load: 61, label: 'Trunk-C1' },
  { source: 'N5',  target: 'N4',  capacity: 160, load: 69, label: 'Trunk-B2' },
  { source: 'N5',  target: 'N6',  capacity: 140, load: 74, label: 'Trunk-D1' },
  { source: 'N6',  target: 'N8',  capacity: 110, load: 55, label: 'Trunk-E1' },
  { source: 'N8',  target: 'N7',  capacity: 100, load: 48, label: 'Trunk-E2' },
  { source: 'N4',  target: 'N7',  capacity: 120, load: 52, label: 'Trunk-C2' },
  { source: 'N1',  target: 'N6',  capacity: 90,  load: 44, label: 'Trunk-F1' },

  // ── New transmission lines ─────────────────────────────────
  { source: 'N1',  target: 'N13', capacity: 140, load: 62, label: 'Trunk-G1' },   // Gachibowli → Madhapur
  { source: 'N13', target: 'N9',  capacity: 130, load: 58, label: 'Trunk-G2' },   // Madhapur → Jubilee Hills
  { source: 'N9',  target: 'N10', capacity: 150, load: 67, label: 'Trunk-H1' },   // Jubilee Hills → Ameerpet
  { source: 'N10', target: 'N5',  capacity: 160, load: 71, label: 'Trunk-H2' },   // Ameerpet → Begumpet
  { source: 'N12', target: 'N3',  capacity: 120, load: 55, label: 'Trunk-I1' },   // Miyapur → Kukatpally
  { source: 'N12', target: 'N13', capacity: 110, load: 50, label: 'Trunk-I2' },   // Miyapur → Madhapur
  { source: 'N4',  target: 'N15', capacity: 140, load: 63, label: 'Trunk-J1' },   // Secunderabad → Tarnaka
  { source: 'N15', target: 'N11', capacity: 130, load: 57, label: 'Trunk-J2' },   // Tarnaka → Uppal
  { source: 'N11', target: 'N7',  capacity: 100, load: 46, label: 'Trunk-K1' },   // Uppal → LB Nagar
  { source: 'N8',  target: 'N14', capacity: 90,  load: 40, label: 'Trunk-L1' },   // Charminar → Shamshabad
  { source: 'N6',  target: 'N9',  capacity: 120, load: 60, label: 'Trunk-M1' },   // Mehdipatnam → Jubilee Hills
  { source: 'N10', target: 'N15', capacity: 110, load: 53, label: 'Trunk-N1' },   // Ameerpet → Tarnaka
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
