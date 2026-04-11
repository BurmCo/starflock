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
  return (nodes) => {
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]
        const b = nodes[j]
        const dx = a.x - b.x
        const dy = a.y - b.y
        const dist = Math.hypot(dx, dy)
        if (dist >= radius || dist === 0) continue

        const t = (radius - dist) / radius // 1 at center, 0 at edge
        const f = t * strength / dist
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
