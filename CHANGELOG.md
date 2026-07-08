# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.1] - 2026-07-08

### Fixed
- Constellation layouts now preserve each constellation's true sky aspect ratio (projected from J2000 RA/Dec with cos-declination compression). Previously every constellation was stretched to a square, which squashed Leo, the Big Dipper and Cassiopeia vertically and widened Orion and Crux.

## [0.6.0] - 2026-07-08

### Added
- `bounds` option (`'wrap' | 'solid'`, default `'wrap'`): `'solid'` bounces nodes off the world edges; both modes are switchable live via `update({ bounds })`.

### Changed
- Wrap-around no longer teleports a node once its center crosses the edge — it drifts fully out (including its glow halo) and visibly drifts back in from the opposite side.
- The undocumented 40px fade-out zone at the world edges is gone. It parked slow-drifting stars as barely visible, flickering ghosts near the borders for minutes; nodes now stay at full brightness up to the edge.

## [0.5.0] - 2026-07-08

### Breaking
- `autoResize: true` now uses a viewport-sized canvas that must be styled `position: fixed; top: 0; left: 0`; the render is translated by page scroll internally. Fixes huge canvas memory use and silent blank rendering past Safari/Firefox canvas limits on long pages.
- The scroll and resize listeners are only registered when `autoResize` is true — with `autoResize: false`, `world.scrollY` is fully caller-owned.
- Frame-rate-independent motion: integration and built-in forces scale by a normalized `dt` (1.0 at 60fps, 50ms clamp). Visuals are unchanged at 60Hz; custom forces should multiply velocity increments by `context.dt`.

### Fixed
- `update({ edgeColors: null })` no longer crashes the render loop.
- `world.stop()` called from `onFrame` actually stops the loop.
- A tab switch no longer resumes a world paused by `pauseWhenOffscreen`.
- `glowScale <= 0` only disables the halo instead of hiding large nodes.
- 3-digit hex colors work in `gradient`/`by-position` modes; non-hex CSS colors fall back gracefully instead of killing the animation.
- Explicitly passing `undefined` for an option no longer clobbers its default (e.g. `minEdgesPerNode`).
- QuadTree: bounded subdivision depth; coincident points are never dropped from the index.
- The min-edges fallback honors `maxEdgesPerFrame` and no longer skips near neighbors after an early main-pass abort.
- scrollDrift no longer kicks all nodes on pages restored at a scroll offset; `World.start()` seeds `scrollY`.
- Reassigning `node.shape` takes effect; shape lookups are guarded against prototype-chain keys.
- Window resizes are debounced and rescale node positions instead of recreating all nodes.

### Added
- `world.update()` live-applies every option: recolors in place, rebuilds nodes for creation-time options, reconciles listeners/observers (including `autoResize`/`pixelRatio`); memoized force arrays are kept when element-wise identical.
- TypeScript: types condition in the exports map, dedicated `react.d.ts` for `starflock/react`, corrected `World` declaration (`ctx`, `mouse`, `scrollY`, `raf`, honest `options` type), `star` point-count parameter, `context.dt`.
- `react` declared as an optional peer dependency (`>=16.8`); `engines: node >= 18`; this changelog.
- Zero-dependency test suite (`npm test`, node:test).

### Performance
- Glow halos render from cached sprites instead of per-node-per-frame radial gradients.
- `nodeRepel` uses a squared-distance early-out.
- `noise()` shares its lattice table across instances (no 512KB/9ms cost per construction) and allocates nothing per node.
- The min-edges fallback uses the spatial index and bounded selection instead of a full sort per node.

## [0.4.0] - 2026-04-16

### Added

- `layout` param, constellation presets, and a dev server for the demo

### Fixed

- Corrected all constellation star positions and edges from real RA/Dec data
- Zero initial node velocity so nodes only move via forces

## [0.3.0] and earlier

- See [git history](https://github.com/BurmCo/starflock/commits/main) for changes prior to 0.4.0
