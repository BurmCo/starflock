/**
 * ring — places nodes evenly on a circle
 *
 * count:  number of nodes (default 48)
 * radius: relative to Math.min(width, height), 0..1 (default 0.38)
 * cx:     horizontal center, relative to width, 0..1 (default 0.5)
 * cy:     vertical center, relative to height, 0..1 (default 0.5)
 */
export function ring({ count = 48, radius = 0.38, cx = 0.5, cy = 0.5 } = {}) {
  return (width, height) => {
    const r = radius * Math.min(width, height)
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2
      return {
        x: cx * width  + Math.cos(angle) * r,
        y: cy * height + Math.sin(angle) * r,
      }
    })
  }
}
