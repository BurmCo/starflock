/**
 * gravity — pulls all nodes softly toward a fixed point
 *
 * x, y:     target — fraction 0..1 (relative to canvas size), absolute px if outside that range,
 *           or a function (context) => number evaluated each frame
 * strength: force multiplier (default 0.0003) — weakens with distance,
 *           never reaches zero (no singularity at the target point)
 */
export function gravity({ x = 0.5, y = 0.5, strength = 0.0003 } = {}) {
  return (nodes, context) => {
    const { width, height } = context

    const resolveCoord = (val, size) => {
      if (typeof val === 'function') return val(context)
      return (val >= 0 && val <= 1) ? val * size : val
    }

    const tx = resolveCoord(x, width)
    const ty = resolveCoord(y, height)

    for (const node of nodes) {
      const dx = tx - node.x
      const dy = ty - node.y
      const distSq = dx * dx + dy * dy + 1 // +1 avoids division by zero
      const f = strength / distSq * Math.sqrt(distSq)
      node.vx += dx * f
      node.vy += dy * f
    }
  }
}
