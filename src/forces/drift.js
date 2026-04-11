export function drift({ maxSpeed = 0.08 } = {}) {
  return (nodes) => {
    for (const node of nodes) {
      const spd = Math.hypot(node.vx, node.vy)
      if (spd > maxSpeed) {
        node.vx = (node.vx / spd) * maxSpeed
        node.vy = (node.vy / spd) * maxSpeed
      }
    }
  }
}
