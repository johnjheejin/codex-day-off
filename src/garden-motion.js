const TAU = Math.PI * 2;
const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

// Sample the visible focus in screen-relative units. Exponential smoothing uses
// elapsed time, so a 120 Hz screen does not create different kinds of flowers.
export class GestureTrace {
  constructor() { this.reset(0, 0); }
  reset(x, y) {
    this.x = x; this.y = y;
    this.heading = 0; this.previousHeading = null;
    this.speed = 0; this.curve = 0; this.rest = 0;
  }
  sample(x, y, dt, width, height) {
    if (!(dt > 0)) return;
    const dx = x - this.x, dy = y - this.y;
    this.x = x; this.y = y;
    const speed = Math.hypot(dx, dy) / dt * 1000 / Math.max(240, Math.min(width, height));
    const blend = 1 - Math.exp(-dt / 240);
    this.speed += (clamp(speed / .9, 0, 1) - this.speed) * blend;
    let curve = 0;
    if (speed > .018) {
      const heading = Math.atan2(dy, dx);
      if (this.previousHeading !== null) {
        const turn = Math.atan2(Math.sin(heading - this.previousHeading), Math.cos(heading - this.previousHeading));
        curve = clamp(turn / dt * 1000 / 4, -1, 1);
      }
      this.previousHeading = this.heading = heading;
      this.rest = Math.max(0, this.rest - dt / 280);
    } else {
      this.previousHeading = null;
      this.rest = Math.min(1, this.rest + dt / 900);
    }
    this.curve += (curve - this.curve) * blend;
  }
  flower() {
    return {
      petals: 8 - Math.round(Math.abs(this.curve) * 3),
      size: 21 + this.rest * 3 - this.speed * 2,
      rotation: -this.heading,
      stretch: 1 + this.speed * .5,
      fullness: .84 + this.rest * .22 - Math.abs(this.curve) * .08,
      curl: this.curve
    };
  }
}

export class BloomResponse {
  constructor(limit = 6) {
    this.limit = limit;
    this.nearest = [];
    this.active = new Set();
  }
  reset() {
    for (const bloom of this.active) bloom.leanX = bloom.leanY = 0;
    this.active.clear();
    this.nearest.length = 0;
  }
  update(blooms, player, dt, { enabled = true, reducedMotion = false, radius = 155, position = bloom => bloom } = {}) {
    if (reducedMotion) { this.reset(); return; }
    const nearest = this.nearest;
    nearest.length = 0;
    if (enabled) {
      const radius2 = radius * radius;
      // Keep a bounded sorted list; do not sort or allocate a copy of the garden.
      for (const bloom of blooms) {
        const point = position(bloom);
        const d2 = (point.x - player.x) ** 2 + (point.y - player.y) ** 2;
        if (d2 >= radius2) continue;
        let at = 0;
        while (at < nearest.length && nearest[at].distance <= d2) at++;
        if (at < this.limit) {
          nearest.splice(at, 0, { bloom, distance: d2 });
          if (nearest.length > this.limit) nearest.pop();
        }
      }
    }
    for (const { bloom } of nearest) this.active.add(bloom);
    const blend = 1 - Math.exp(-dt / 190);
    for (const bloom of this.active) {
      const item = nearest.find(candidate => candidate.bloom === bloom);
      const proximity = item ? (1 - Math.sqrt(item.distance) / radius) ** 2 : 0;
      const point = position(bloom);
      const x = clamp((player.x - point.x) / radius, -1, 1) * proximity * 1.9;
      const y = clamp((player.y - point.y) / radius, -1, 1) * proximity * 1.9;
      bloom.leanX = (bloom.leanX ?? 0) + (x - (bloom.leanX ?? 0)) * blend;
      bloom.leanY = (bloom.leanY ?? 0) + (y - (bloom.leanY ?? 0)) * blend;
      if (!item && Math.hypot(bloom.leanX, bloom.leanY) < .001) {
        bloom.leanX = bloom.leanY = 0;
        this.active.delete(bloom);
      }
    }
  }
}

const geometryCache = new Map();
export function flowerVertices(petals, contours, steps = 48) {
  const key = `${petals}/${contours}/${steps}`;
  if (geometryCache.has(key)) return geometryCache.get(key);
  const vertices = [];
  for (let petal = 0; petal < petals; petal++) {
    const angle = petal * TAU / petals;
    for (let contour = 0; contour < contours; contour++) {
      const layer = contour / contours;
      const point = t => {
        const reach = (1 - Math.cos(t)) * (1 - layer * .36);
        const side = Math.sin(t) * Math.sin(t / 2) * (.48 - layer * .16);
        const lift = Math.sin(t / 2) ** 2 * (.5 + layer * .9) + Math.sin(t) * .16;
        return [reach * Math.cos(angle) - side * Math.sin(angle),
          reach * Math.sin(angle) + side * Math.cos(angle), lift];
      };
      for (let step = 0; step < steps; step++) {
        vertices.push(...point(step / steps * TAU), ...point((step + 1) / steps * TAU));
      }
    }
  }
  const result = new Float32Array(vertices);
  geometryCache.set(key, result);
  return result;
}

export function bloomPose(bloom, index, now, reducedMotion = false, finished = false) {
  const age = reducedMotion || finished ? 1 : clamp((now - bloom.born) / 1000, 0, 1);
  const open = 1 - (1 - age) ** 3;
  const time = reducedMotion ? 0 : Math.max(0, now - bloom.born) * .001;
  const leanX = reducedMotion ? 0 : bloom.leanX ?? 0;
  const leanY = reducedMotion ? 0 : bloom.leanY ?? 0;
  const size = bloom.size * 1.35 * Math.max(.001, open);
  return {
    age, open,
    sx: size * (bloom.stretch ?? 1), sy: size * (bloom.fullness ?? 1), sz: size * (1 + Math.abs(bloom.curl ?? 0) * .65),
    rx: .38 + Math.sin(index * 2.4) * .25 + (bloom.curl ?? 0) * .55 + leanY,
    ry: Math.sin(time * .12 + index) * .2 + leanX,
    rz: bloom.rotation + (reducedMotion ? 0 : Math.sin(time * .2) * .1)
  };
}

// Canvas uses the same shared curves and XYZ pose as WebGL, including in PNGs.
// Only the small matrix changes per frame; trigonometry is never done per vertex.
export function paintBloom(ctx, bloom, index, now, { reducedMotion = false, finished = false, mobile = false, light = false, view = null } = {}) {
  const pose = bloomPose(bloom, index, now, reducedMotion, finished);
  const { sx, sy, sz, rx, ry, rz, open } = pose;
  const a = Math.cos(rx), b = Math.sin(rx), c = Math.cos(ry), d = Math.sin(ry), e = Math.cos(rz), f = Math.sin(rz);
  let xx = c * e * sx, xy = -c * f * sy, xz = d * sz;
  let yx = (a * f + b * e * d) * sx, yy = (a * e - b * f * d) * sy, yz = -b * c * sz;
  if (view) {
    const zx = (b * f - a * e * d) * sx, zy = (b * e + a * f * d) * sy, zz = a * c * sz;
    const nextX = [(view.xx * xx + view.xy * yx + view.xz * zx) * view.scale,
      (view.xx * xy + view.xy * yy + view.xz * zy) * view.scale,
      (view.xx * xz + view.xy * yz + view.xz * zz) * view.scale];
    yx = (view.yx * xx + view.yy * yx + view.yz * zx) * view.scale;
    yy = (view.yx * xy + view.yy * yy + view.yz * zy) * view.scale;
    yz = (view.yx * xz + view.yy * yz + view.yz * zz) * view.scale;
    [xx, xy, xz] = nextX;
  }
  const vertices = flowerVertices(bloom.petals, mobile ? 2 : 3);
  const travel = reducedMotion || finished ? 1 : 1 - (1 - clamp((now - bloom.born) / 900, 0, 1)) ** 3;
  ctx.save();
  if (view) ctx.translate(bloom.screen.x, bloom.screen.y);
  else ctx.translate((bloom.fromX ?? bloom.x) + (bloom.x - (bloom.fromX ?? bloom.x)) * travel,
    (bloom.fromY ?? bloom.y) + (bloom.y - (bloom.fromY ?? bloom.y)) * travel);
  ctx.globalAlpha = (light ? .65 : .72) * open;
  ctx.strokeStyle = bloom.color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < vertices.length; i += 3) {
    const x = vertices[i], y = vertices[i + 1], z = vertices[i + 2];
    const px = xx * x + xy * y + xz * z;
    const py = -(yx * x + yy * y + yz * z);
    if (i % 6 === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.globalAlpha = .8;
  ctx.fillStyle = bloom.color;
  ctx.beginPath(); ctx.arc(0, 0, 2.5 * open * (view?.scale ?? 1), 0, TAU); ctx.fill();
  ctx.restore();
}
