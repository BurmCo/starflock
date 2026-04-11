export class QuadTree {
  constructor(x, y, w, h, capacity = 8) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.capacity = capacity
    this.points = []
    this.divided = false
  }

  insert(point) {
    if (!this._contains(point.x, point.y)) return false
    if (this.points.length < this.capacity && !this.divided) {
      this.points.push(point)
      return true
    }
    if (!this.divided) this._subdivide()
    return (
      this._ne.insert(point) ||
      this._nw.insert(point) ||
      this._se.insert(point) ||
      this._sw.insert(point)
    )
  }

  queryRadius(cx, cy, r, result = []) {
    if (!this._intersectsCircle(cx, cy, r)) return result
    if (this.divided) {
      this._ne.queryRadius(cx, cy, r, result)
      this._nw.queryRadius(cx, cy, r, result)
      this._se.queryRadius(cx, cy, r, result)
      this._sw.queryRadius(cx, cy, r, result)
    } else {
      for (const p of this.points) {
        if (Math.hypot(p.x - cx, p.y - cy) <= r) result.push(p)
      }
    }
    return result
  }

  _contains(px, py) {
    return px >= this.x && px < this.x + this.w && py >= this.y && py < this.y + this.h
  }

  _intersectsCircle(cx, cy, r) {
    const nearX = Math.max(this.x, Math.min(cx, this.x + this.w))
    const nearY = Math.max(this.y, Math.min(cy, this.y + this.h))
    return Math.hypot(cx - nearX, cy - nearY) <= r
  }

  _subdivide() {
    const hw = this.w / 2
    const hh = this.h / 2
    this._ne = new QuadTree(this.x + hw, this.y, hw, hh, this.capacity)
    this._nw = new QuadTree(this.x, this.y, hw, hh, this.capacity)
    this._se = new QuadTree(this.x + hw, this.y + hh, hw, hh, this.capacity)
    this._sw = new QuadTree(this.x, this.y + hh, hw, hh, this.capacity)
    this.divided = true
    for (const p of this.points) {
      this._ne.insert(p) || this._nw.insert(p) || this._se.insert(p) || this._sw.insert(p)
    }
    this.points = []
  }
}
