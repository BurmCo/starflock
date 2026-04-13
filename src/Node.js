export class Node {
  constructor({ x, y, r, vx, vy, color, phase, twinkleSpeed }) {
    this.x = x
    this.y = y
    this.r = r
    this.vx = vx
    this.vy = vy
    this.color = color
    this.phase = phase
    this.twinkleSpeed = twinkleSpeed
    this.brightness = 1
    this._index = 0
  }
}
