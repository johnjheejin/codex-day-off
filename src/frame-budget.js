// Use observed refresh cadence and sustained work, not a phone model or width,
// to select frame rate. Resolution changes happen at most once per 1.5 seconds.
export class FrameBudget {
  constructor() {
    this.targetFps = 60;
    this.quality = 1;
    this.refreshHz = 60;
    this.cpuMs = 0;
    this.gpuMs = null;
    this.cadence = [];
    this.samples = [];
    this.lastTick = 0;
    this.windowStart = 0;
    this.healthyWindows = 0;
    this.slowWindows = 0;
  }

  reset(now) {
    this.cadence = [];
    this.samples = [];
    this.lastTick = 0;
    this.windowStart = now;
    this.healthyWindows = 0;
    this.slowWindows = 0;
  }

  tick(now) {
    const delta = now - this.lastTick;
    if (this.lastTick && delta > 3 && delta < 100) this.cadence.push(delta);
    this.lastTick = now;
    if (this.cadence.length > 240) this.cadence.shift();
  }

  record(now, cpuMs, gpuMs, intervalMs) {
    this.samples.push({ cpuMs, gpuMs, intervalMs });
    if (now - this.windowStart < 1500 || this.samples.length < 24) return false;
    const percentile = values => values.sort((a, b) => a - b)[Math.floor((values.length - 1) * .9)];
    this.cpuMs = percentile(this.samples.map(sample => sample.cpuMs));
    const gpuSamples = this.samples.map(sample => sample.gpuMs).filter(value => value !== null);
    this.gpuMs = gpuSamples.length ? percentile(gpuSamples) : null;
    if (this.cadence.length >= 30) {
      const sorted = [...this.cadence].sort((a, b) => a - b);
      const hz = 1000 / sorted[Math.floor(sorted.length * .2)];
      this.refreshHz = hz >= 110 ? 120 : hz >= 80 ? 90 : hz >= 50 ? 60 : 30;
    }
    const period = 1000 / this.targetFps;
    const cost = Math.max(this.cpuMs, this.gpuMs ?? 0);
    const late = this.samples.filter(sample => sample.intervalMs > period * 1.35).length / this.samples.length;
    const overloaded = cost > period * .6 || late > .2;
    const healthy = cost < period * .35 && late < .08;
    this.slowWindows = overloaded ? this.slowWindows + 1 : 0;
    this.healthyWindows = healthy ? this.healthyWindows + 1 : 0;
    const before = this.quality;
    const rates = [120, 90, 60, 45, 30].filter(fps => fps <= this.refreshHz && this.refreshHz % fps === 0);
    if (!rates.includes(this.targetFps)) {
      this.targetFps = rates.find(fps => fps <= this.targetFps) ?? 30;
      this.healthyWindows = 0;
    } else if (this.slowWindows >= 2) {
      if (this.quality > .6) this.quality = Math.max(.6, this.quality - .15);
      else this.targetFps = rates.find(fps => fps < this.targetFps) ?? 30;
      this.slowWindows = 0;
      this.healthyWindows = 0;
    } else if (this.healthyWindows >= 3) {
      const next = [...rates].reverse().find(fps => fps > this.targetFps);
      if (next && cost < (1000 / next) * .35) this.targetFps = next;
      else if (this.quality < 1) this.quality = Math.min(1, this.quality + .1);
      this.healthyWindows = 0;
    }
    this.windowStart = now;
    this.samples = [];
    return this.quality !== before;
  }
}

export function boundedDpr(width, height, deviceDpr, touch, quality = 1) {
  const budget = touch ? 1500000 : 3200000;
  // No minimum DPR: even an 8K viewport must obey the absolute pixel budget.
  return Math.min(deviceDpr || 1, touch ? 2 : 1.5, Math.sqrt(budget / Math.max(1, width * height))) * quality;
}
