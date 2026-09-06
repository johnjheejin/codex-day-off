import { BloomResponse } from './garden-motion.js';

const clamp = (value, low, high) => Math.max(low, Math.min(high, value));

// One YXZ world rotation, shared with the Three.js group and Canvas projection.
export function skyTransform(width, height, pitch = 0, yaw = 0, framing = 1) {
  const a = Math.cos(pitch), b = Math.sin(pitch), c = Math.cos(yaw), d = Math.sin(yaw);
  const fitted = Math.max(.5, Math.min((width - 16) / width, (height - 96) / height, 1));
  const scale = 1 + (fitted - 1) * framing;
  return { width, height, pitch, yaw, scale, centerY: height / 2 - 16 * framing,
    xx: c, xy: d * b, xz: d * a, yx: 0, yy: a, yz: -b, zx: -d, zy: c * b, zz: c * a };
}

export function projectSkyPoint(point, view) {
  if (!view) return point;
  const x = point.x - view.width / 2, y = view.height / 2 - point.y, z = point.depth ?? 0;
  return { x: view.width / 2 + (view.xx * x + view.xy * y + view.xz * z) * view.scale,
    y: view.centerY - (view.yx * x + view.yy * y + view.yz * z) * view.scale };
}

export class SkyView {
  constructor({ mobile = false, reducedMotion = false } = {}) {
    this.mobile = mobile;
    this.reducedMotion = reducedMotion;
    this.response = new BloomResponse(mobile ? 4 : 6);
    this.open = false;
    this.blooms = [];
    this.links = [];
    this.pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    this.mode = 'touch';
    this.reset();
  }
  enter(blooms, links) {
    this.leave();
    const copies = new Map(blooms.map(bloom => [bloom, { ...bloom, source: bloom, leanX: 0, leanY: 0 }]));
    this.blooms = [...copies.values()];
    this.links = links.map(link => ({ from: copies.get(link.from), to: copies.get(link.to) }));
    this.open = true;
    this.mode = 'touch';
    this.reset();
  }
  leave() {
    this.response.reset();
    this.open = false;
    this.blooms = [];
    this.links = [];
    this.pointerUntil = 0;
    this.dirty = false;
  }
  reset() {
    this.revealing = false;
    this.framing = 1;
    this.pitch = this.yaw = 0;
    this.pointerUntil = 0;
    this.response.reset();
    this.dirty = true;
  }
  reveal() {
    this.reset();
    if (this.reducedMotion) return;
    this.revealing = true;
    this.revealElapsed = 0;
    this.framing = 0;
  }
  move(x, y, now) {
    if (this.reducedMotion || this.mode !== 'touch') return;
    this.pointer.x = this.pointer.tx = x;
    this.pointer.y = this.pointer.ty = y;
    this.pointerUntil = now + 140;
    this.dirty = true;
  }
  turn(dx, dy, width, height) {
    this.yaw = (this.yaw + dx / Math.max(240, width) * 3.8) % (Math.PI * 2);
    this.pitch = clamp(this.pitch + dy / Math.max(320, height) * 2.8, -1.1, 1.1);
    this.pointerUntil = 0;
    this.dirty = true;
  }
  layout(width, height) {
    this.transform = skyTransform(width, height, this.pitch, this.yaw, this.framing);
    this.blooms.forEach((bloom, index) => {
      bloom.x = bloom.source.x; bloom.y = bloom.source.y;
      bloom.depth = Math.sin(index * 2.4) * Math.min(width, height) * .09;
      bloom.screen = projectSkyPoint(bloom, this.transform);
    });
    return this.transform;
  }
  update(now, dt, width, height) {
    if (this.revealing) {
      this.revealElapsed += dt;
      const t = Math.min(1, this.revealElapsed / 2800);
      const arc = Math.sin(Math.PI * t) ** 2;
      this.yaw = .62 * arc;
      this.pitch = -.2 * arc;
      const fit = Math.min(1, t * 3);
      this.framing = fit * fit * (3 - 2 * fit);
      if (t === 1) this.reset();
    }
    this.layout(width, height);
    this.response.update(this.blooms, this.pointer, dt, {
      enabled: now < this.pointerUntil && this.mode === 'touch', reducedMotion: this.reducedMotion,
      radius: Math.min(170, width * .36), position: bloom => bloom.screen
    });
    this.dirty = false;
  }
  needsFrame(now) { return this.open && (this.revealing || this.dirty || now < this.pointerUntil || this.response.active.size > 0); }
  suspend() { this.pointerUntil = 0; this.response.reset(); this.dirty = true; }
}
