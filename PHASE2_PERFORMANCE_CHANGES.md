# Phase 2 Performance Changes

## Goal
Reduce avoidable UI work during live telemetry and threat scans by minimizing unnecessary re-renders and expensive repeated lookups.

## What Was Implemented

### 1) App-level derived state memoization
File: `src/App.jsx`

- Added memoized node index (`nodeById`) with `useMemo`.
- Memoized `selectedNode`, `onlineCount`, and `neighbors` derived values.
- Replaced repeated `GRID_NODES.find(...)` lookups in reroute logging with a precomputed static node-name map.
- Replaced inline `onDeselect` handler with stable `useCallback` handler.

Performance effect:
- Avoids repeated `Array.find/filter/map` work on every render path.
- Helps memoized children skip re-render when relevant props do not change.

### 2) Grid map render-path optimization
File: `src/components/GridMap.jsx`

- Wrapped component with `React.memo`.
- Added memoized `nodeById` map for O(1) node lookup while drawing edges.
- Added memoized reroute edge-key set and reroute node set.
- Replaced repeated nested scans (`nodes.find`, `reroutePath.edges.some`, `reroutePath.path.includes`) with set/map lookups.

Performance effect:
- Reduces compute cost for edge/node drawing, especially under frequent updates.

### 3) Telemetry chart optimization
File: `src/components/TelemetryPanel.jsx`

- Wrapped component with `React.memo`.
- Memoized labels, chart options, and dataset objects (`voltageData`, `trafficData`).
- Added memoized per-node history cache to reduce repeated history traversal per dataset build.
- Kept existing node color fixes and fallback color support.

Performance effect:
- Reduces chart data/object churn and expensive recalculation noise.

### 4) Threat scan loop stabilization (major fix)
File: `src/components/ThreatPanel.jsx`

- Wrapped component with `React.memo`.
- Replaced effect dependency on `nodes` with a stable interval design:
  - uses refs for latest `nodes` and latest `onThreatDetected` callback.
- Added memoized edge adjacency map for fast neighbor access.
- Added `buildPayload()` callback using current refs and adjacency map.
- Added in-flight request guard to prevent overlapping scans.
- Added abort handling for stale requests on next tick/unmount.
- Memoized threat counters (`NORMAL`, `FDI`, `DDOS`, `GENUINE_FAILURE`).

Performance effect:
- Prevents interval teardown/recreation every 1.5s.
- Avoids overlapping network calls and unnecessary scan-loop churn.
- Cuts repeated `edges.filter + nodes.find` work per node per scan.

### 5) Memoized lightweight display components
Files:
- `src/components/Header.jsx`
- `src/components/Sidebar.jsx`
- `src/components/StatusBar.jsx`

- Wrapped each with `React.memo`.
- Removed unused import from `Sidebar`.

Performance effect:
- Reduces trivial but frequent UI re-renders from parent updates.

## Files Changed

- `src/App.jsx`
- `src/components/GridMap.jsx`
- `src/components/TelemetryPanel.jsx`
- `src/components/ThreatPanel.jsx`
- `src/components/Header.jsx`
- `src/components/Sidebar.jsx`
- `src/components/StatusBar.jsx`

## Verification Status

Runtime validation from this terminal is currently blocked by local dependency issue:

- Missing package: `@rollup/rollup-linux-x64-gnu`
- Affects both `npm run dev` and `npm run build` in this environment.

Once dependencies are reinstalled in the same OS/runtime, validate with:

1. `npm run dev`
2. Test map/telemetry/threat interactions under attack simulator load.
3. Compare before/after with React Profiler and browser performance panel.

