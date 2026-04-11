/**
 * scrollDrift — reacts to page scroll
 *
 * mode:
 *   'rotate'   — nodes rotate around viewport center (default)
 *   'wave'     — vertical wave pushes nodes away from scroll direction
 *   'scatter'  — nodes scatter outward from viewport center on scroll
 *   'custom'   — provide your own fn(node, delta, context) => void
 *
 * strength: multiplier for the effect intensity (default 1.0)
 */
export function scrollDrift({ mode = 'rotate', strength = 1.0, fn } = {}) {
  let lastScrollY = 0

  return (nodes, context) => {
    const { scrollY, width, height } = context
    const delta = scrollY - lastScrollY
    lastScrollY = scrollY
    if (delta === 0) return

    if (mode === 'custom' && typeof fn === 'function') {
      for (const node of nodes) fn(node, delta, context)
      return
    }

    const cx = width / 2
    const cy = height / 2

    for (const node of nodes) {
      if (mode === 'rotate') {
        const dx = node.x - cx
        const dy = node.y - cy
        const angle = delta * 0.003 * strength
        const cos = Math.cos(angle)
        const sin = Math.sin(angle)
        node.vx += (dx * cos - dy * sin + cx - node.x) * 0.06
        node.vy += (dx * sin + dy * cos + cy - node.y) * 0.06

      } else if (mode === 'wave') {
        // Push nodes up/down opposite scroll direction, with horizontal spread based on x position
        const wave = Math.sin((node.x / width) * Math.PI * 2 + scrollY * 0.01)
        node.vy -= delta * 0.04 * strength
        node.vx += wave * Math.abs(delta) * 0.015 * strength

      } else if (mode === 'scatter') {
        // Nodes scatter outward from canvas center, fall off near edges
        const dx = node.x - cx
        const dy = node.y - cy
        const dist = Math.hypot(dx, dy) || 1
        const maxDist = Math.hypot(cx, cy)
        const falloff = Math.max(0, 1 - dist / maxDist)
        const force = Math.abs(delta) * 0.008 * strength * falloff
        node.vx += (dx / dist) * force
        node.vy += (dy / dist) * force
      }
    }
  }
}
