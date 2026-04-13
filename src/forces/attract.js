/**
 * attract — pulls nodes toward a point, but only within a radius (falloff to zero at edge)
 *
 * Unlike gravity (which always pulls), attract only affects nodes within radius.
 *
 * x, y: target position — values 0..1 are treated as relative (0.5 = center),
 *        values > 1 as absolute pixels, or a function (width, height) => value
 * radius: influence zone in pixels
 * strength: force magnitude
 */
export function attract({ x = 0.5, y = 0.5, radius = 200, strength = 0.001 } = {}) {
  return (nodes, context) => {
    const { width, height } = context
    const tx = typeof x === 'function' ? x(width, height) : (x >= 0 && x <= 1 ? x * width : x)
    const ty = typeof y === 'function' ? y(width, height) : (y >= 0 && y <= 1 ? y * height : y)

    for (const node of nodes) {
      const dx = tx - node.x
      const dy = ty - node.y
      const dist = Math.hypot(dx, dy)
      if (dist < 20 || dist > radius) continue
      node.vx += (dx / dist) * strength
      node.vy += (dy / dist) * strength
    }
  }
}
