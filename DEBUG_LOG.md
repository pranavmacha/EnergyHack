# Debug Log

This file tracks important bugs encountered during the development of GridShield AI and serves as a lesson-learned document to prevent them from recurring.

---

## 📈 Perf Process Update: Phase 1 Baseline Setup

**What changed:**
- Added repeatable Lighthouse scripts in `package.json`:
  - `perf:lighthouse:mobile`
  - `perf:lighthouse:desktop`
- Added measurement workflow guide:
  - `perf/MEASUREMENT_GUIDE.md`
- Added baseline/after-results template:
  - `perf/BASELINE_RESULTS.md`
- Added report output directory:
  - `perf/reports/`

**Why this matters:**
Phase 2 optimizations are now in place, but without baseline numbers we cannot verify real gains or detect regressions confidently. This measurement setup makes each performance phase evidence-driven.

**Known blocker in current shell/runtime:**
- Frontend commands in this terminal still fail due missing optional Rollup binary:
  - `@rollup/rollup-linux-x64-gnu`
- Performance runs should be executed in the same environment where frontend currently runs successfully.

## 🐛 Bug: React Blank Screen (ReferenceError: Cannot access before initialization)

**Description:**
The application compiled successfully, but navigating to `http://localhost:3000` resulted in a completely blank white/black screen. The attack simulator at `/simulator.html` was still working fine.

**Root Cause:**
A `ReferenceError` inside the main `App.jsx` component. 

A newly added function, `const triggerReroute = useCallback(...)`, was referenced inside the dependency array of a `useEffect` hook that was placed **above** the function declaration in the code.

Unlike `function triggerReroute() {}` (which is hoisted), variables declared with `const` or `let` (like `const triggerReroute = useCallback(...)`) are **not hoisted**. When the component first executed, JavaScript reached the `useEffect` hook, tried to read `triggerReroute` for the dependency array, and crashed because it hadn't been initialized yet. This crash prevented React from returning the JSX, leading to a blank screen.

**The Broken Pattern:**
```javascript
useEffect(() => {
  // some logic
}, [triggerReroute]); // ❌ CRASH: triggerReroute is not initialized yet

const triggerReroute = useCallback(() => { ... }, []);
```

**The Fix:**
Moved the `triggerReroute` declaration higher up within the `App` component body, *before* any `useEffect` loops that depend on it.

```javascript
const triggerReroute = useCallback(() => { ... }, []); // ✅ Initialized first

useEffect(() => {
  // some logic
}, [triggerReroute]); // ✅ Safe to use here
```

**Takeaway & Prevention:**
- **Order Matters in Hooks**: When using `useCallback` or `useMemo` with `const`, always declare the functions **before** the `useEffect` hooks that call them or list them in their dependency arrays.
- **Console is King**: When React shows a blank screen but Vite says everything compiled fine, always check the browser's Developer Tools Console (`F12` -> Console). The exact `ReferenceError` will be printed there.
