import { constellation, constellationEdges } from '../layouts/constellations.js'

/**
 * presets — full WorldOptions bundles with layout + opinionated defaults.
 * Spread into the World constructor; any key you pass after overrides the preset.
 *
 * Example:
 *   new World({ canvas, ...presets.orion(), forces: [twinkle(), mouseRepel()] })
 */

export function orion(overrides = {}) {
  return {
    layout: constellation('orion'),
    edges: constellationEdges('orion'),
    colors: ['#ffffff', '#aad4ff', '#ffd2aa'],
    nodeSize: [1.5, 3.5],
    edgeMaxOpacity: 0.55,
    ...overrides,
  }
}

export function bigDipper(overrides = {}) {
  return {
    layout: constellation('big-dipper'),
    edges: constellationEdges('big-dipper'),
    colors: ['#ffffff', '#cce8ff', '#e8f4ff'],
    nodeSize: [1.5, 3],
    edgeMaxOpacity: 0.5,
    ...overrides,
  }
}
