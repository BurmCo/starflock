export function dampen({ factor = 0.99 } = {}) {
  return (nodes) => {
    for (const node of nodes) {
      node.vx *= factor
      node.vy *= factor
    }
  }
}
