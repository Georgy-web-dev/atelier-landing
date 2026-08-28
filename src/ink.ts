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

const fract = (value: number) => value - Math.floor(value);

const hash = (value: number) => fract(Math.sin(value * 127.1) * 43758.5453);

export const wave = (value: number) => {
  const cell = Math.floor(value);
  const f = value - cell;
  const u = f * f * (3 - 2 * f);
  return hash(cell) * (1 - u) + hash(cell + 1) * u;
};

export const clamp = (value: number, low = 0, high = 1) => Math.min(high, Math.max(low, value));

export const ease = (t: number) => {
  const c = clamp(t);
  return c * c * (3 - 2 * c);
};

export const easeOut = (t: number) => 1 - Math.pow(1 - clamp(t), 3);

export const easeBack = (t: number) => {
  const c = clamp(t);
  return 1 + 2.2 * Math.pow(c - 1, 3) + 1.4 * Math.pow(c - 1, 2);
};

const cardinal = (a: number, b: number, c: number, d: number, t: number) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (2 * b + (c - a) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
};

export function spine(controls: Point[], count: number): Point[] {
  const points: Point[] = [];
  const last = controls.length - 1;
  for (let i = 0; i < count; i++) {
    const at = (i / (count - 1)) * last;
    const k = Math.min(last - 1, Math.floor(at));
    const f = at - k;
    const a = controls[Math.max(0, k - 1)];
    const b = controls[k];
    const c = controls[Math.min(last, k + 1)];
    const d = controls[Math.min(last, k + 2)];
    points.push({ x: cardinal(a.x, b.x, c.x, d.x, f), y: cardinal(a.y, b.y, c.y, d.y, f) });
  }
  return points;
}

function normalsOf(points: Point[]): Point[] {
  return points.map((_, i) => {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const length = Math.hypot(dx, dy) || 1;
    return { x: -dy / length, y: dx / length };
  });
}

const loaded = (t: number) => Math.pow(Math.sin(Math.PI * Math.pow(clamp(t), 0.72)), 0.5);

export function brush(ctx: CanvasRenderingContext2D, points: Point[], options: Brush) {
  const total = points.length;
  const drawn = Math.floor(total * clamp(options.progress));
  if (drawn < 2) return;

  const normals = normalsOf(points);
  const seed = options.seed ?? 0;
  const taper = options.taper ?? loaded;
  const alpha = options.alpha ?? 1;
  const count = options.bristles ?? 22;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = options.colour;

  const body = options.wet ?? 0;
  for (let pass = 0; pass < 3 && body > 0; pass++) {
    ctx.globalAlpha = alpha * body * 0.05 * (3 - pass);
    ctx.lineWidth = options.width * (0.5 + pass * 0.28);
    ctx.beginPath();
    for (let i = 0; i < drawn; i++) {
      const t = i / (total - 1);
      const shrink = taper(t);
      const x = points[i].x;
      const y = points[i].y;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
      if (shrink < 0.02) break;
    }
    ctx.stroke();
  }

  for (let b = 0; b < count; b++) {
    const across = count === 1 ? 0 : (b / (count - 1)) * 2 - 1;
    const dryness = wave(seed + b * 3.7);
    ctx.globalAlpha = alpha * (0.16 + 0.5 * dryness);
    ctx.lineWidth = 0.7 + dryness * 1.4;

    let open = false;
    ctx.beginPath();
    for (let i = 0; i < drawn; i++) {
      const t = i / (total - 1);
      const half = (options.width * taper(t)) / 2;
      const wobble = (wave(seed + b * 5.1 + t * 7) - 0.5) * options.width * 0.05;
      const offset = across * half + wobble;
      const gap = wave(seed + b * 11.3 + t * 26);
      const inked = gap > 0.18 + 0.42 * (1 - dryness) * Math.pow(t, 0.6);

      if (!inked) {
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
  for (let i = 0; i < drawn; i++) {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(total - 1, i + 1)];
    const heading = Math.atan2(b.y - a.y, b.x - a.x);
    const half = (width * (0.18 + 0.82 * Math.abs(Math.sin(heading - angle)))) / 2;
    const nx = Math.cos(angle + Math.PI / 2);
    const ny = Math.sin(angle + Math.PI / 2);
    left.push({ x: points[i].x + nx * half, y: points[i].y + ny * half });
    right.push({ x: points[i].x - nx * half, y: points[i].y - ny * half });
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

  if (kind === 3) {
    ctx.lineWidth = 0.2;
    ctx.beginPath();
    ctx.moveTo(-0.4, -1.4);
    ctx.bezierCurveTo(0.5, -0.9, -0.5, -0.5, 0.35, 0.05);
    ctx.bezierCurveTo(-0.35, 0.35, -0.15, 1.0, 0.45, 1.3);
    ctx.stroke();
    ctx.restore();
    return;
  }

  ctx.save();
  ctx.rotate(-0.34);
  ctx.beginPath();
  ctx.ellipse(0, 0, 0.64, 0.45, 0, 0, Math.PI * 2);
  if (kind === 2) {
    ctx.lineWidth = 0.19;
    ctx.stroke();
  } else {
    ctx.fill();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.rect(0.5, -3.3, 0.14, 3.35);
  ctx.fill();

  if (kind === 1) {
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
  ctx.lineWidth = 1.1;
  const reach = width * clamp(progress);
  for (let line = 0; line < 5; line++) {
    ctx.globalAlpha = alpha * 0.5;
    ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const t = i / 60;
      const px = x + reach * t;
      const py = y + (line - 2) * gap + Math.sin(t * 3.1 + seed + line * 0.2) * gap * 0.28;
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
    ctx.globalAlpha = alpha * (pass === 0 ? 0.18 : 0.9);
    ctx.lineWidth = pass === 0 ? 7 : 1.5;
    ctx.beginPath();
    for (let i = 0; i <= 90; i++) {
      const t = i / 90;
      const shape = Math.sin(Math.PI * harmonic * t) * Math.sin(Math.PI * t);
      const px = t * width;
      const py = y + shape * amplitude * Math.cos(phase);
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
  for (let i = 0; i <= 72; i++) {
    const angle = (i / 72) * Math.PI * 2;
    const ragged = radius * (0.9 + 0.14 * wave(seed + i * 0.31));
    const px = x + Math.cos(angle) * ragged;
    const py = y + Math.sin(angle) * ragged;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();

  ctx.globalCompositeOperation = "destination-out";
  ctx.lineWidth = radius * 0.09;
  ctx.strokeStyle = "#000";
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.66, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - radius * 0.3, y + radius * 0.28);
  ctx.lineTo(x, y - radius * 0.34);
  ctx.lineTo(x + radius * 0.3, y + radius * 0.28);
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
    const speck = (Math.random() - 0.5) * 11;
    pixels[i] = red + speck;
    pixels[i + 1] = green + speck;
    pixels[i + 2] = blue + speck;
    pixels[i + 3] = 255;
  }
  ctx.putImageData(grain, 0, 0);

  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(214, 200, 255, 0.025)";
  ctx.lineWidth = 1;
  for (let fibre = 0; fibre < 90; fibre++) {
    const y = Math.random() * sheet.height;
    const x = Math.random() * sheet.width;
    const length = 40 + Math.random() * 220;
    const lean = (Math.random() - 0.5) * 0.6;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y + length * lean);
    ctx.stroke();
  }

  return sheet;
}
