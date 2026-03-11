# Phase 1: Performance Measurement Guide

This phase establishes a repeatable baseline before additional optimization work.

## Prerequisites

1. Run frontend in the same runtime where dependencies are installed:
   - `npm install`
   - `npm run dev`
2. Run backend API for threat scan path validation:
   - `cd fdi && python api.py`
3. Open simulator for attack-load scenarios:
   - `http://127.0.0.1:3000/simulator.html`

## 1) Lighthouse Baseline (Load Performance)

With frontend running on port `3000`:

1. Mobile baseline:
   - `npm run perf:lighthouse:mobile`
2. Desktop baseline:
   - `npm run perf:lighthouse:desktop`

Artifacts are generated in `perf/reports/`:
- `lighthouse-mobile.report.html`
- `lighthouse-mobile.report.json`
- `lighthouse-desktop.report.html`
- `lighthouse-desktop.report.json`

## 2) Runtime Interaction Baseline (Smoothness)

Use Chrome DevTools `Performance` tab and record these scenarios for 30-45 seconds each:

1. Idle dashboard (`Grid Map` page, no attacks)
2. Telemetry page with node selection toggling
3. Threat page with API scanning active
4. Attack simulator running one FDI + one DDoS attack

Capture:
- Average FPS
- Main-thread long tasks count
- JS heap trend
- CPU time distribution

## 3) React Render Baseline

Use React DevTools Profiler:

1. Profile each page switch: `map -> telemetry -> threats -> map`
2. While on telemetry page, wait for 3 telemetry ticks (~5s)
3. While on threats page, wait for 2 scan cycles (~6s)

Capture:
- Commit count
- Largest commit duration (ms)
- Components with highest render cost

## 4) Record Results

Copy final numbers into `perf/BASELINE_RESULTS.md`.
Use one row per run and keep date/time and environment (Windows/WSL, browser version).

## Notes

- Run at least 2 passes and keep the median.
- Close extra tabs/extensions to reduce noise.
- Compare future phases against the same scenarios.
