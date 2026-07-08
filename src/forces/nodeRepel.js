/**
 * nodeRepel — nodes push each other apart when too close
 *
 * radius:   distance threshold in px below which repulsion activates (default 60)
 * strength: force multiplier (default 0.002) — stronger when nodes are closer
 *
 * Note: O(n²) complexity — pairs outside radius are skipped immediately,
 * keeping it practical for typical particle counts (up to ~500 nodes).
 */
export function nodeRepel({ radius = 60, strength = 0.002 } = {}) {
  const radiusSq = radius * radius
  return (nodes, { dt = 1 } = {}) => {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const distSq = dx * dx + dy * dy
        if (distSq >= radiusSq || distSq < 1e-12) continue

        const dist = Math.sqrt(distSq)
        const t = (radius - dist) / radius // 1 at center, 0 at edge
        const f = t * strength / dist * dt
        const fx = dx * f
        const fy = dy * f

        a.vx += fx
        a.vy += fy
        b.vx -= fx
        b.vy -= fy
      }
    }
  }
}
