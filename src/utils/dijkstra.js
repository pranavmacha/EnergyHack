/**
 * GridShield AI — Dijkstra's Shortest Path Algorithm
 * Used for autonomous power rerouting when nodes are compromised.
 *
 * Edge weights are calculated as: (load / capacity) * 100
 * Lower weight = less congested line = preferred reroute path
 */

/**
 * Build an adjacency list from edges, excluding edges connected to downed nodes.
 * @param {Array} edges - Grid edges with {source, target, capacity, load}
 * @param {Set} downNodes - Set of node IDs that are offline/quarantined/attacked
 * @returns {Object} adjacency list: { nodeId: [{ neighbor, weight, edge }] }
 */
function buildGraph(edges, downNodes) {
  const graph = {};

  for (const edge of edges) {
    // Skip edges touching downed nodes
    if (downNodes.has(edge.source) || downNodes.has(edge.target)) continue;

    // Weight = congestion ratio (lower = better path)
    const weight = Math.round((edge.load / edge.capacity) * 100);

    if (!graph[edge.source]) graph[edge.source] = [];
    if (!graph[edge.target]) graph[edge.target] = [];

    graph[edge.source].push({ neighbor: edge.target, weight, edge });
    graph[edge.target].push({ neighbor: edge.source, weight, edge });
  }

  return graph;
}

/**
 * Dijkstra's shortest path from source to target, avoiding downed nodes.
 * @param {Array} edges - All grid edges
 * @param {Array} nodes - All grid nodes
 * @param {string} sourceId - Start node ID
 * @param {string} targetId - End node ID
 * @param {Set} downNodes - Set of node IDs to avoid
 * @returns {Object|null} { path: [nodeIds], edges: [edgeLabels], totalWeight, hops }
 */
export function dijkstra(edges, nodes, sourceId, targetId, downNodes) {
  const graph = buildGraph(edges, downNodes);

  // If source or target is down, no path
  if (downNodes.has(sourceId) || downNodes.has(targetId)) return null;

  const dist = {};     // shortest distance to each node
  const prev = {};     // previous node in shortest path
  const prevEdge = {}; // edge used to reach this node
  const visited = new Set();

  // Init all nodes with Infinity distance
  for (const node of nodes) {
    if (!downNodes.has(node.id)) {
      dist[node.id] = Infinity;
    }
  }
  dist[sourceId] = 0;

  while (true) {
    // Find unvisited node with smallest distance (priority queue substitute)
    let minDist = Infinity;
    let current = null;

    for (const nodeId of Object.keys(dist)) {
      if (!visited.has(nodeId) && dist[nodeId] < minDist) {
        minDist = dist[nodeId];
        current = nodeId;
      }
    }

    if (current === null) break;       // No more reachable nodes
    if (current === targetId) break;   // Found shortest path to target

    visited.add(current);

    // Relax neighbors
    const neighbors = graph[current] || [];
    for (const { neighbor, weight, edge } of neighbors) {
      if (visited.has(neighbor)) continue;

      const newDist = dist[current] + weight;
      if (newDist < dist[neighbor]) {
        dist[neighbor] = newDist;
        prev[neighbor] = current;
        prevEdge[neighbor] = edge;
      }
    }
  }

  // No path found
  if (dist[targetId] === Infinity) return null;

  // Reconstruct path
  const path = [];
  const pathEdges = [];
  let current = targetId;

  while (current !== sourceId) {
    path.unshift(current);
    if (prevEdge[current]) pathEdges.unshift(prevEdge[current]);
    current = prev[current];
  }
  path.unshift(sourceId);

  return {
    path,
    edges: pathEdges,
    totalWeight: dist[targetId],
    hops: path.length - 1,
  };
}

/**
 * Find the best reroute path around a downed node.
 * Finds the shortest path between the downed node's healthy neighbors.
 * @param {Array} allEdges - All grid edges
 * @param {Array} allNodes - All grid nodes
 * @param {string} downNodeId - The node that went down
 * @param {Array} currentNodes - Current node state (with statuses)
 * @returns {Object|null} { reroutePath, source, target, ... }
 */
export function findReroutePath(allEdges, allNodes, downNodeId, currentNodes) {
  // Find all nodes that are currently down
  const downNodes = new Set(
    currentNodes
      .filter(n => n.status === 'attacked' || n.status === 'quarantined' || n.status === 'offline')
      .map(n => n.id)
  );

  // Find the healthy neighbors of the downed node
  const neighbors = allEdges
    .filter(e => e.source === downNodeId || e.target === downNodeId)
    .map(e => e.source === downNodeId ? e.target : e.source)
    .filter(id => !downNodes.has(id));

  if (neighbors.length < 2) return null; // Need at least 2 healthy neighbors to reroute between

  // Find the shortest path between the first two healthy neighbors
  // (this represents the "reroute" around the downed node)
  let bestRoute = null;

  for (let i = 0; i < neighbors.length; i++) {
    for (let j = i + 1; j < neighbors.length; j++) {
      const route = dijkstra(allEdges, allNodes, neighbors[i], neighbors[j], downNodes);
      if (route && (!bestRoute || route.totalWeight < bestRoute.totalWeight)) {
        bestRoute = {
          ...route,
          source: neighbors[i],
          target: neighbors[j],
          bypassedNode: downNodeId,
        };
      }
    }
  }

  return bestRoute;
}
