import { useRef } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import { NODE_COLORS } from '../data/gridData';
import 'leaflet/dist/leaflet.css';

const HYD_CENTER = [17.385, 78.4867];
const HYD_BOUNDS = [[17.20, 78.25], [17.55, 78.65]];

// Component to handle map background clicks (deselect only if no marker was clicked)
function MapClickHandler({ onSelect, markerClickedRef }) {
  useMapEvents({
    click: () => {
      if (markerClickedRef.current) {
        markerClickedRef.current = false;
        return;
      }
      onSelect(null);
    },
  });
  return null;
}

function GridMap({ nodes, edges, selectedId, onSelect }) {
  const markerClickedRef = useRef(false);
  // Find connected edges for the selected node
  const isEdgeHighlighted = (edge) => {
    return selectedId && (edge.source === selectedId || edge.target === selectedId);
  };

  return (
    <MapContainer
      center={HYD_CENTER}
      zoom={12}
      maxBounds={HYD_BOUNDS}
      maxBoundsViscosity={1.0}
      minZoom={11}
      maxZoom={15}
      zoomControl={true}
      attributionControl={false}
      style={{ width: '100%', height: '100%', background: '#050a05' }}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={15}
      />
      <MapClickHandler onSelect={onSelect} markerClickedRef={markerClickedRef} />

      {/* Power Lines (edges) */}
      {edges.map(edge => {
        const src = nodes.find(n => n.id === edge.source);
        const tgt = nodes.find(n => n.id === edge.target);
        if (!src || !tgt) return null;
        const highlighted = isEdgeHighlighted(edge);
        return (
          <Polyline
            key={`${edge.source}-${edge.target}`}
            positions={[[src.lat, src.lng], [tgt.lat, tgt.lng]]}
            pathOptions={{
              color: highlighted ? '#0aff99' : '#00ff41',
              weight: highlighted ? 2.5 : 1.5,
              opacity: highlighted ? 0.8 : 0.3,
              dashArray: null,
            }}
          />
        );
      })}

      {/* Grid Nodes (substations) */}
      {nodes.map(node => {
        const isSelected = node.id === selectedId;
        const color = NODE_COLORS[node.status] || NODE_COLORS.online;
        return (
          <CircleMarker
            key={node.id}
            center={[node.lat, node.lng]}
            radius={isSelected ? 12 : 8}
            pathOptions={{
              fillColor: isSelected ? '#0aff99' : color,
              fillOpacity: 0.85,
              color: isSelected ? '#0aff99' : color,
              weight: isSelected ? 3 : 2,
              opacity: 0.8,
            }}
            eventHandlers={{
              click: () => {
                markerClickedRef.current = true;
                onSelect(node.id);
              },
            }}
          >
            <Tooltip permanent direction="bottom" offset={[0, 8]} className="node-tooltip">
              {node.name}
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}

export default GridMap;
