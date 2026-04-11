/**
 * noise — organic drifting via 2D Value Noise
 *
 * scale:    frequency of the noise field — higher = finer detail (default 0.003)
 * strength: force magnitude applied per frame (default 0.0008)
 * speed:    how fast the noise field evolves over time (default 0.0005)
 *
 * Internally uses a grid-based Value Noise with bilinear interpolation.
 * The noise field shifts slowly over time, creating smooth, organic motion.
 */
export function noise({ scale = 0.003, strength = 0.0008, speed = 0.0005 } = {}) {
  // Reproducible pseudo-random values for the noise lattice
  const GRID = 256
  const table = new Float32Array(GRID * GRID * 2)
  for (let i = 0; i < table.length; i++) {
    // Simple LCG seeded by index for determinism
    const h = Math.sin(i * 127.1 + 311.7) * 43758.5453
    table[i] = h - Math.floor(h)
  }

  const latticeX = (ix, iy) => table[((ix & (GRID - 1)) + (iy & (GRID - 1)) * GRID) * 2]
  const latticeY = (ix, iy) => table[((ix & (GRID - 1)) + (iy & (GRID - 1)) * GRID) * 2 + 1]

  // Smoothstep for bilinear interpolation weight
  const smooth = (t) => t * t * (3 - 2 * t)

  const valueNoiseVec = (wx, wy) => {
    const ix = Math.floor(wx)
    const iy = Math.floor(wy)
    const fx = wx - ix
    const fy = wy - iy
    const ux = smooth(fx)
    const uy = smooth(fy)

    const x00 = latticeX(ix,     iy)
    const x10 = latticeX(ix + 1, iy)
    const x01 = latticeX(ix,     iy + 1)
    const x11 = latticeX(ix + 1, iy + 1)

    const y00 = latticeY(ix,     iy)
    const y10 = latticeY(ix + 1, iy)
    const y01 = latticeY(ix,     iy + 1)
    const y11 = latticeY(ix + 1, iy + 1)

    const nx = (x00 + (x10 - x00) * ux + (x01 - x00) * uy + (x11 - x10 - x01 + x00) * ux * uy) * 2 - 1
    const ny = (y00 + (y10 - y00) * ux + (y01 - y00) * uy + (y11 - y10 - y01 + y00) * ux * uy) * 2 - 1

    return { nx, ny }
  }

  return (nodes, { time }) => {
    const offset = time * speed

    for (const node of nodes) {
      const wx = node.x * scale + offset
      const wy = node.y * scale + offset

      const { nx, ny } = valueNoiseVec(wx, wy)

      node.vx += nx * strength
      node.vy += ny * strength
    }
  }
}
