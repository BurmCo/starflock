/**
 * Built-in node shape renderers.
 * Each function signature: (ctx, x, y, r) => void
 * ctx is already set up (fillStyle, globalAlpha) — just draw and fill/stroke.
 */

export const circle = (ctx, x, y, r) => {
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
}

export const diamond = (ctx, x, y, r) => {
  ctx.beginPath()
  ctx.moveTo(x, y - r)
  ctx.lineTo(x + r, y)
  ctx.lineTo(x, y + r)
  ctx.lineTo(x - r, y)
  ctx.closePath()
  ctx.fill()
}

export const star = (ctx, x, y, r, points = 5) => {
  const inner = r * 0.45
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const angle = (i * Math.PI) / points - Math.PI / 2
    const radius = i % 2 === 0 ? r : inner
    const px = x + Math.cos(angle) * radius
    const py = y + Math.sin(angle) * radius
    i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fill()
}

export const cross = (ctx, x, y, r) => {
  const t = r * 0.35
  ctx.beginPath()
  ctx.rect(x - t, y - r, t * 2, r * 2)
  ctx.rect(x - r, y - t, r * 2, t * 2)
  ctx.fill()
}

export const ring = (ctx, x, y, r) => {
  ctx.save()
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.lineWidth = r * 0.5
  ctx.strokeStyle = ctx.fillStyle
  ctx.stroke()
  ctx.restore()
}

/** Resolve a shape option to a render function */
export function resolveShape(shape) {
  if (typeof shape === 'function') return shape
  const map = { circle, diamond, star, cross, ring }
  return map[shape] ?? circle
}
