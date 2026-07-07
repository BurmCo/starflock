const MAX_DEPTH = 12

export class QuadTree {
  constructor(x, y, w, h, capacity = 8, _depth = 0) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.capacity = capacity
    this.points = []
    this.divided = false
    this._depth = _depth
  }

  insert(point) {
    if (!this._contains(point.x, point.y)) return false
    if (!this.divided) {
      if (this.points.length < this.capacity || this._depth >= MAX_DEPTH) {
        this.points.push(point)
        return true
      }
      this._subdivide()
    }
    if (
      this._ne.insert(point) ||
      this._nw.insert(point) ||
      this._se.insert(point) ||
      this._sw.insert(point)
    ) return true
    // float-precision edge case: no child accepted the point — keep it here
    // rather than lose it from the index
    this.points.push(point)
    return true
  }

  queryRadius(cx, cy, r, result = []) {
    if (!this._intersectsCircle(cx, cy, r)) return result
    for (const p of this.points) {
      if (Math.hypot(p.x - cx, p.y - cy) <= r) result.push(p)
    }
    if (this.divided) {
      this._ne.queryRadius(cx, cy, r, result)
      this._nw.queryRadius(cx, cy, r, result)
      this._se.queryRadius(cx, cy, r, result)
      this._sw.queryRadius(cx, cy, r, result)
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
    const d = this._depth + 1
    this._ne = new QuadTree(this.x + hw, this.y, hw, hh, this.capacity, d)
    this._nw = new QuadTree(this.x, this.y, hw, hh, this.capacity, d)
    this._se = new QuadTree(this.x + hw, this.y + hh, hw, hh, this.capacity, d)
    this._sw = new QuadTree(this.x, this.y + hh, hw, hh, this.capacity, d)
    this.divided = true
    const kept = []
    for (const p of this.points) {
      const ok = this._ne.insert(p) || this._nw.insert(p) || this._se.insert(p) || this._sw.insert(p)
      if (!ok) kept.push(p)
    }
    this.points = kept
  }
}
