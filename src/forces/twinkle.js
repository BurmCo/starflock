export function twinkle({ minBrightness = 0.5, variance = 0.5 } = {}) {
  return (nodes, { time }) => {
    for (const node of nodes) {
      node.brightness = minBrightness + variance * Math.sin(time * node.twinkleSpeed + node.phase)
    }
  }
}
