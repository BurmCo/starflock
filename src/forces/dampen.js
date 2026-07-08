export function dampen({ factor = 0.99 } = {}) {
  return (nodes, { dt = 1 } = {}) => {
    // exponential decay is the frame-rate-independent form of per-frame damping
    const f = dt === 1 ? factor : Math.pow(factor, dt)
    for (const node of nodes) {
      node.vx *= f
      node.vy *= f
    }
  }
}
