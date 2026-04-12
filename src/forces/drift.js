export function drift({ maxSpeed = 0.08, minSpeed = 0.015 } = {}) {
  return (nodes) => {
    for (const node of nodes) {
      const spd = Math.hypot(node.vx, node.vy)
      if (spd > maxSpeed) {
        node.vx = (node.vx / spd) * maxSpeed
        node.vy = (node.vy / spd) * maxSpeed
      } else if (spd < minSpeed) {
        const angle = spd > 0 ? Math.atan2(node.vy, node.vx) : Math.random() * Math.PI * 2
        node.vx = Math.cos(angle) * minSpeed
        node.vy = Math.sin(angle) * minSpeed
      }
    }
  }
}
