import { constellation } from '../layouts/constellations.js'

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
    colors: ['#ffffff', '#aad4ff', '#ffd2aa'],
    nodeSize: [1.5, 3.5],
    edgeMaxDist: 120,
    edgeMaxOpacity: 0.25,
    ...overrides,
  }
}

export function bigDipper(overrides = {}) {
  return {
    layout: constellation('big-dipper'),
    colors: ['#ffffff', '#cce8ff', '#e8f4ff'],
    nodeSize: [1.5, 3],
    edgeMaxDist: 130,
    edgeMaxOpacity: 0.22,
    ...overrides,
  }
}
