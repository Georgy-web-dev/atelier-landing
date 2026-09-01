export type Point = { x: number; y: number };

export type Brush = {
  width: number;
  colour: string;
  progress: number;
  alpha?: number;
  bristles?: number;
  seed?: number;
  wet?: number;
  taper?: (t: number) => number;
};

export const QUARTER = 0;
export const EIGHTH = 1;
export const HALF = 2;
export const REST = 3;

const NOISE = { step: 127.1, scale: 43758.5453 };

const SMOOTHSTEP_EDGE = 3;
const SMOOTHSTEP_SLOPE = 2;
const EASE_OUT_POWER = 3;
const BACK_CUBIC = 2.2;
const BACK_QUADRATIC = 1.4;

const TAPER = { bias: 0.72, softness: 0.5 };

const BRISTLE = {
  count: 22,
  alphaFloor: 0.16,
  alphaRange: 0.5,
  widthFloor: 0.7,
  widthRange: 1.4,
  wobble: 0.05,
  inkFloor: 0.18,
  dryRange: 0.42,
  dryFalloff: 0.6,
  drynessSeed: 3.7,
  wobbleSeed: 5.1,
  wobbleFrequency: 7,
  gapSeed: 11.3,
  gapFrequency: 26,
};

const WET = { passes: 3, alphaStep: 0.05, widthFloor: 0.5, widthStep: 0.28, vanish: 0.02 };

const NIB_FLOOR = 0.18;

const NOTE = {
  headRadiusX: 0.64,
  headRadiusY: 0.45,
  headTilt: -0.34,
  hollowWeight: 0.19,
  stemOffset: 0.5,
  stemTop: -3.3,
  stemWidth: 0.14,
  stemLength: 3.35,
  restWeight: 0.2,
};

const STAVE = { lines: 5, segments: 60, wobbleFrequency: 3.1, wobbleAmount: 0.28, weight: 1.1, dim: 0.5 };

const PLUCK = { segments: 90, glowAlpha: 0.18, glowWidth: 7, coreAlpha: 0.9, coreWidth: 1.5 };

const SEAL = {
  segments: 72,
  radiusFloor: 0.9,
  ragged: 0.14,
  raggedFrequency: 0.31,
  ringWidth: 0.09,
  ringRadius: 0.66,
  markSpread: 0.3,
  markRise: 0.34,
  markDrop: 0.28,
};

const PAPER = {
  speck: 11,
  fibres: 90,
  fibreFloor: 40,
  fibreRange: 220,
  fibreLean: 0.6,
  fibreInk: "rgba(214, 200, 255, 0.025)",
  opaque: 255,
};

const fract = (value: number) => value - Math.floor(value);

const hash = (value: number) => fract(Math.sin(value * NOISE.step) * NOISE.scale);

export const wave = (value: number) => {
  const cell = Math.floor(value);
  const offset = value - cell;
  const smoothed = offset * offset * (SMOOTHSTEP_EDGE - SMOOTHSTEP_SLOPE * offset);
  return hash(cell) * (1 - smoothed) + hash(cell + 1) * smoothed;
};

export const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));

export const ease = (t: number) => {
  const held = clamp(t);
  return held * held * (SMOOTHSTEP_EDGE - SMOOTHSTEP_SLOPE * held);
};

export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), EASE_OUT_POWER);

export const easeBack = (t: number) => {
  const held = clamp(t);
  return 1 + BACK_CUBIC * Math.pow(held - 1, 3) + BACK_QUADRATIC * Math.pow(held - 1, 2);
};

const cardinal = (a: number, b: number, c: number, d: number, t: number) => {
  const square = t * t;
  const cube = square * t;
  return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * square + (-a + 3 * b - 3 * c + d) * cube);
};

export function spine(controls: Point[], count: number): Point[] {
  const points: Point[] = [];
  const last = controls.length - 1;
  for (let i = 0; i < count; i++) {
    const at = (i / (count - 1)) * last;
    const segment = Math.min(last - 1, Math.floor(at));
    const within = at - segment;
    const before = controls[Math.max(0, segment - 1)];
    const start = controls[segment];
    const end = controls[Math.min(last, segment + 1)];
    const after = controls[Math.min(last, segment + 2)];
    points.push({
      x: cardinal(before.x, start.x, end.x, after.x, within),
      y: cardinal(before.y, start.y, end.y, after.y, within),
    });
  }
  return points;
}

function normalsOf(points: Point[]): Point[] {
  return points.map((_, i) => {
    const before = points[Math.max(0, i - 1)];
    const after = points[Math.min(points.length - 1, i + 1)];
    const dx = after.x - before.x;
    const dy = after.y - before.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: -dy / length, y: dx / length };
  });
}

const loaded = (t: number) => Math.pow(Math.sin(Math.PI * Math.pow(clamp(t), TAPER.bias)), TAPER.softness);

export function brush(ctx: CanvasRenderingContext2D, points: Point[], options: Brush) {
  const total = points.length;
  const drawn = Math.floor(total * clamp(options.progress));
  if (drawn < 2) return;

  const normals = normalsOf(points);
  const seed = options.seed ?? 0;
  const taper = options.taper ?? loaded;
  const alpha = options.alpha ?? 1;
  const count = options.bristles ?? BRISTLE.count;
  const body = options.wet ?? 0;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = options.colour;

  for (let pass = 0; pass < WET.passes && body > 0; pass++) {
    ctx.globalAlpha = alpha * body * WET.alphaStep * (WET.passes - pass);
    ctx.lineWidth = options.width * (WET.widthFloor + pass * WET.widthStep);
    ctx.beginPath();
    for (let i = 0; i < drawn; i++) {
      const along = i / (total - 1);
      if (i === 0) ctx.moveTo(points[i].x, points[i].y);
      else ctx.lineTo(points[i].x, points[i].y);
      if (taper(along) < WET.vanish) break;
    }
    ctx.stroke();
  }

  for (let bristle = 0; bristle < count; bristle++) {
    const across = count === 1 ? 0 : (bristle / (count - 1)) * 2 - 1;
    const dryness = wave(seed + bristle * BRISTLE.drynessSeed);
    ctx.globalAlpha = alpha * (BRISTLE.alphaFloor + BRISTLE.alphaRange * dryness);
    ctx.lineWidth = BRISTLE.widthFloor + dryness * BRISTLE.widthRange;

    let open = false;
    ctx.beginPath();
    for (let i = 0; i < drawn; i++) {
      const along = i / (total - 1);
      const half = (options.width * taper(along)) / 2;
      const wobble =
        (wave(seed + bristle * BRISTLE.wobbleSeed + along * BRISTLE.wobbleFrequency) - 0.5) *
        options.width *
        BRISTLE.wobble;
      const offset = across * half + wobble;
      const gap = wave(seed + bristle * BRISTLE.gapSeed + along * BRISTLE.gapFrequency);
      const threshold =
        BRISTLE.inkFloor + BRISTLE.dryRange * (1 - dryness) * Math.pow(along, BRISTLE.dryFalloff);

      if (gap <= threshold) {
        if (open) {
          ctx.stroke();
          ctx.beginPath();
          open = false;
        }
        continue;
      }

      const x = points[i].x + normals[i].x * offset;
      const y = points[i].y + normals[i].y * offset;
      if (open) ctx.lineTo(x, y);
      else ctx.moveTo(x, y);
      open = true;
    }
    if (open) ctx.stroke();
  }

  ctx.restore();
}

export function nib(
  ctx: CanvasRenderingContext2D,
  points: Point[],
  width: number,
  angle: number,
  colour: string,
  progress: number,
  alpha = 1,
) {
  const total = points.length;
  const drawn = Math.floor(total * clamp(progress));
  if (drawn < 3) return;

  const left: Point[] = [];
  const right: Point[] = [];
  const acrossX = Math.cos(angle + Math.PI / 2);
  const acrossY = Math.sin(angle + Math.PI / 2);

  for (let i = 0; i < drawn; i++) {
    const before = points[Math.max(0, i - 1)];
    const after = points[Math.min(total - 1, i + 1)];
    const heading = Math.atan2(after.y - before.y, after.x - before.x);
    const half = (width * (NIB_FLOOR + (1 - NIB_FLOOR) * Math.abs(Math.sin(heading - angle)))) / 2;
    left.push({ x: points[i].x + acrossX * half, y: points[i].y + acrossY * half });
    right.push({ x: points[i].x - acrossX * half, y: points[i].y - acrossY * half });
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.moveTo(left[0].x, left[0].y);
  for (const point of left) ctx.lineTo(point.x, point.y);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i].x, right[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function note(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  rotation: number,
  kind: number,
  colour: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(size, size);
  ctx.fillStyle = colour;
  ctx.strokeStyle = colour;

  if (kind === REST) {
    ctx.lineWidth = NOTE.restWeight;
    ctx.beginPath();
    ctx.moveTo(-0.4, -1.4);
    ctx.bezierCurveTo(0.5, -0.9, -0.5, -0.5, 0.35, 0.05);
    ctx.bezierCurveTo(-0.35, 0.35, -0.15, 1.0, 0.45, 1.3);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.rotate(NOTE.headTilt);
  ctx.beginPath();
  ctx.ellipse(0, 0, NOTE.headRadiusX, NOTE.headRadiusY, 0, 0, Math.PI * 2);
  if (kind === HALF) {
    ctx.lineWidth = NOTE.hollowWeight;
    ctx.stroke();
  } else {
    ctx.fill();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.rect(NOTE.stemOffset, NOTE.stemTop, NOTE.stemWidth, NOTE.stemLength);
  ctx.fill();

  if (kind === EIGHTH) {
    ctx.beginPath();
    ctx.moveTo(0.64, -3.3);
    ctx.bezierCurveTo(1.62, -2.95, 1.58, -1.95, 0.78, -1.3);
    ctx.bezierCurveTo(1.3, -2.1, 1.16, -2.72, 0.64, -2.9);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

export function stave(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  gap: number,
  colour: string,
  progress: number,
  alpha: number,
  seed: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = colour;
  ctx.lineWidth = STAVE.weight;
  ctx.globalAlpha = alpha * STAVE.dim;
  const reach = width * clamp(progress);
  const middle = (STAVE.lines - 1) / 2;

  for (let line = 0; line < STAVE.lines; line++) {
    ctx.beginPath();
    for (let i = 0; i <= STAVE.segments; i++) {
      const along = i / STAVE.segments;
      const px = x + reach * along;
      const py =
        y +
        (line - middle) * gap +
        Math.sin(along * STAVE.wobbleFrequency + seed + line * 0.2) * gap * STAVE.wobbleAmount;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function pluck(
  ctx: CanvasRenderingContext2D,
  y: number,
  width: number,
  amplitude: number,
  harmonic: number,
  phase: number,
  colour: string,
  alpha: number,
) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = colour;
  ctx.lineCap = "round";

  for (let pass = 0; pass < 2; pass++) {
    const glow = pass === 0;
    ctx.globalAlpha = alpha * (glow ? PLUCK.glowAlpha : PLUCK.coreAlpha);
    ctx.lineWidth = glow ? PLUCK.glowWidth : PLUCK.coreWidth;
    ctx.beginPath();
    for (let i = 0; i <= PLUCK.segments; i++) {
      const along = i / PLUCK.segments;
      const standing = Math.sin(Math.PI * harmonic * along) * Math.sin(Math.PI * along);
      const px = along * width;
      const py = y + standing * amplitude * Math.cos(phase);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
  ctx.restore();
}

export function seal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  colour: string,
  alpha: number,
  seed: number,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = colour;
  ctx.beginPath();
  for (let i = 0; i <= SEAL.segments; i++) {
    const angle = (i / SEAL.segments) * Math.PI * 2;
    const edge = radius * (SEAL.radiusFloor + SEAL.ragged * wave(seed + i * SEAL.raggedFrequency));
    const px = x + Math.cos(angle) * edge;
    const py = y + Math.sin(angle) * edge;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.globalCompositeOperation = "destination-out";
  ctx.lineWidth = radius * SEAL.ringWidth;
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  ctx.arc(x, y, radius * SEAL.ringRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - radius * SEAL.markSpread, y + radius * SEAL.markDrop);
  ctx.lineTo(x, y - radius * SEAL.markRise);
  ctx.lineTo(x + radius * SEAL.markSpread, y + radius * SEAL.markDrop);
  ctx.stroke();
  ctx.restore();
}

export function paper(width: number, height: number, ground: string) {
  const sheet = document.createElement("canvas");
  sheet.width = Math.max(1, Math.floor(width));
  sheet.height = Math.max(1, Math.floor(height));
  const ctx = sheet.getContext("2d");
  if (!ctx) return sheet;

  const red = parseInt(ground.slice(1, 3), 16);
  const green = parseInt(ground.slice(3, 5), 16);
  const blue = parseInt(ground.slice(5, 7), 16);

  const grain = ctx.createImageData(sheet.width, sheet.height);
  const pixels = grain.data;
  for (let i = 0; i < pixels.length; i += 4) {
    const speck = (Math.random() - 0.5) * PAPER.speck;
    pixels[i] = red + speck;
    pixels[i + 1] = green + speck;
    pixels[i + 2] = blue + speck;
    pixels[i + 3] = PAPER.opaque;
  }
  ctx.putImageData(grain, 0, 0);

  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = PAPER.fibreInk;
  ctx.lineWidth = 1;
  for (let fibre = 0; fibre < PAPER.fibres; fibre++) {
    const x = Math.random() * sheet.width;
    const y = Math.random() * sheet.height;
    const length = PAPER.fibreFloor + Math.random() * PAPER.fibreRange;
    const lean = (Math.random() - 0.5) * PAPER.fibreLean;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y + length * lean);
    ctx.stroke();
  }

  return sheet;
}
