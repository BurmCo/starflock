/**
 * mouseRepel — reacts to cursor position
 *
 * mode:
 *   'repel'   — nodes flee from cursor (default)
 *   'attract' — nodes are pulled toward cursor
 *   'orbit'   — nodes orbit around cursor
 *   'custom'  — provide your own fn(node, mouse, context) => void
 *
 * radius:   influence radius in px (default 120)
 * strength: force multiplier (default 0.012)
 */
export function mouseRepel({ mode = 'repel', radius = 120, strength = 0.012, fn } = {}) {
  return (nodes, context) => {
    const { mouse } = context
    if (!mouse) return

    if (mode === 'custom' && typeof fn === 'function') {
      for (const node of nodes) fn(node, mouse, context)
      return
    }

    for (const node of nodes) {
      const dx = node.x - mouse.x
      const dy = node.y - mouse.y
      const dist = Math.hypot(dx, dy)
      if (dist >= radius || dist === 0) continue

      const t = (radius - dist) / radius // 0..1, stronger near center

      if (mode === 'repel') {
        const f = t * strength
        node.vx += (dx / dist) * f
        node.vy += (dy / dist) * f

      } else if (mode === 'attract') {
        const f = t * strength
        node.vx -= (dx / dist) * f
        node.vy -= (dy / dist) * f

      } else if (mode === 'orbit') {
        // perpendicular force creates circular motion
        const f = t * strength
        node.vx += (-dy / dist) * f
        node.vy += (dx / dist) * f
      }
    }
  }
}
