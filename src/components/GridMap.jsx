import { memo, useMemo, useRef } from 'react';
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

function GridMap({ nodes, edges, selectedId, onSelect, reroutePath }) {
  const markerClickedRef = useRef(false);

  const nodeById = useMemo(
    () => new Map(nodes.map((node) => [node.id, node])),
    [nodes]
  );

  const rerouteEdgeKeys = useMemo(() => {
    if (!reroutePath?.edges) return new Set();
    return new Set(
      reroutePath.edges.map((edge) => [edge.source, edge.target].sort().join('|'))
    );
  }, [reroutePath]);

  const rerouteNodeIds = useMemo(
    () => new Set(reroutePath?.path || []),
    [reroutePath]
  );

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
        const src = nodeById.get(edge.source);
        const tgt = nodeById.get(edge.target);
        if (!src || !tgt) return null;
        const highlighted = selectedId && (edge.source === selectedId || edge.target === selectedId);
        const isReroute = rerouteEdgeKeys.has([edge.source, edge.target].sort().join('|'));
        return (
          <Polyline
            key={`${edge.source}-${edge.target}`}
            positions={[[src.lat, src.lng], [tgt.lat, tgt.lng]]}
            pathOptions={{
              color: isReroute ? '#00e5ff' : highlighted ? '#0aff99' : '#00ff41',
              weight: isReroute ? 4 : highlighted ? 2.5 : 1.5,
              opacity: isReroute ? 0.9 : highlighted ? 0.8 : 0.3,
              dashArray: isReroute ? '10 6' : null,
            }}
          />
        );
      })}

      {/* Dijkstra reroute glow layer (rendered on top for visual emphasis) */}
      {reroutePath && reroutePath.edges && reroutePath.edges.map((edge, i) => {
        const src = nodeById.get(edge.source);
        const tgt = nodeById.get(edge.target);
        if (!src || !tgt) return null;
        return (
          <Polyline
            key={`reroute-glow-${i}`}
            positions={[[src.lat, src.lng], [tgt.lat, tgt.lng]]}
            pathOptions={{
              color: '#00e5ff',
              weight: 8,
              opacity: 0.2,
            }}
          />
        );
      })}

      {/* Grid Nodes (substations) */}
      {nodes.map(node => {
        const isSelected = node.id === selectedId;
        const isOnReroute = rerouteNodeIds.has(node.id);
        const color = NODE_COLORS[node.status] || NODE_COLORS.online;
        return (
          <CircleMarker
            key={node.id}
            center={[node.lat, node.lng]}
            radius={isSelected ? 12 : isOnReroute ? 10 : 8}
            pathOptions={{
              fillColor: isSelected ? '#0aff99' : isOnReroute ? '#00e5ff' : color,
              fillOpacity: 0.85,
              color: isSelected ? '#0aff99' : isOnReroute ? '#00e5ff' : color,
              weight: isSelected ? 3 : isOnReroute ? 3 : 2,
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

export default memo(GridMap);
