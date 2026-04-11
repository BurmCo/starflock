/**
 * wind — applies a constant directional force to all nodes
 *
 * angle:    direction in radians (0 = right, Math.PI/2 = down)
 * strength: base force magnitude (default 0.0005)
 * gust:     amplitude of sinusoidal strength variation over time (default 0)
 *           when > 0, produces a gusting effect — actual strength oscillates
 *           between (strength - gust) and (strength + gust)
 */
export function wind({ angle = 0, strength = 0.0005, gust = 0 } = {}) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)

  return (nodes, { time }) => {
    const currentStrength = gust > 0
      ? strength + gust * Math.sin(time * 0.001)
      : strength

    const fx = cos * currentStrength
    const fy = sin * currentStrength

    for (const node of nodes) {
      node.vx += fx
      node.vy += fy
    }
  }
}
