import { brush, clamp, ease, easeBack, nib, note, paper, pluck, seal, spine, stave, wave, type Point } from "./ink";

export const INK = ["#7C5CFF", "#D08663", "#FFB25E", "#8FA8FF", "#A9C8FF", "#F2ECE0"];

const GLOW = ["#C3B0FF", "#E8B187", "#FFD9A0", "#C7D4FF", "#E4EEFF", "#9B7CFF"];
const GROUND = "#0E0B1A";

type Beat = {
  width: number;
  height: number;
  unit: number;
  detail: number;
  clock: number;
  phase: number;
  energy: number;
  fade: number;
};

type Painter = (ctx: CanvasRenderingContext2D, beat: Beat, ink: string, glow: string) => void;

const brushes: Painter = (ctx, beat, ink, glow) => {
  const reach = Math.hypot(beat.width, beat.height);
  const strokes = beat.width < 768 ? 3 : 4;
  for (let i = 0; i < strokes; i++) {
    const seed = 40 + i * 17;
    const lift = (i - (strokes - 1) / 2) * beat.height * 0.16;
    const sway = Math.sin(beat.clock * 0.35 + i) * beat.height * 0.012;
    const path = spine(
      [
        { x: -reach * 0.16, y: beat.height * 0.74 + lift + sway },
        { x: beat.width * 0.3, y: beat.height * 0.42 + lift + wave(seed) * beat.height * 0.11 },
        { x: beat.width * 0.68, y: beat.height * 0.6 + lift - wave(seed + 3) * beat.height * 0.13 },
        { x: beat.width * 1.16, y: beat.height * 0.22 + lift - sway },
      ],
      Math.round(130 * beat.detail),
    );
    brush(ctx, path, {
      width: beat.unit * (0.13 + 0.055 * wave(seed + 9)),
      colour: i % 2 ? glow : ink,
      progress: ease((beat.phase - i * 0.07) / 0.52),
      alpha: beat.fade * (0.22 + 0.78 * beat.energy),
      bristles: Math.round(26 * beat.detail),
      seed,
      wet: 0.7,
    });
  }
};

const notes: Painter = (ctx, beat, ink, glow) => {
  const line = beat.height * 0.47;
  const gap = Math.min(beat.unit * 0.05, 30);

  stave(
    ctx,
    -beat.width * 0.06,
    line,
    beat.width * 1.12,
    gap,
    ink,
    ease(beat.phase / 0.42),
    beat.fade * (0.16 + 0.55 * beat.energy),
    3.2,
  );

  const count = Math.round(16 * beat.detail);
  const burst = ease((beat.phase - 0.46) / 0.54);
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : i / (count - 1);
    const appear = ease((beat.phase - 0.06 - t * 0.28) / 0.3);
    if (appear <= 0) continue;
    const seed = i * 5.3;
    const angle = (wave(seed) - 0.5) * 3.6;
    const fly = burst * beat.unit * (0.3 + wave(seed + 2) * 0.7);
    const step = Math.round(wave(seed + 7) * 6) - 3;
    const size = gap * (0.55 + wave(seed + 11) * 0.35) * (0.4 + 0.6 * easeBack(appear));
    note(
      ctx,
      beat.width * (0.02 + t * 0.97) + Math.cos(angle) * fly,
      line + step * gap * 0.5 - Math.sin(angle) * fly,
      size,
      burst * (wave(seed + 4) - 0.5) * 5.5,
      Math.round(wave(seed + 13) * 3.4),
      i % 3 === 0 ? glow : ink,
      beat.fade * (0.18 + 0.82 * beat.energy) * appear * (1 - burst * 0.7),
    );
  }

  for (let i = 0; i < 5; i++) {
    const seed = 90 + i * 8;
    const span = beat.height * 1.2;
    const drift = (beat.clock * (7 + wave(seed) * 9) + wave(seed + 1) * span) % span;
    note(
      ctx,
      beat.width * (0.08 + wave(seed + 2) * 0.86),
      beat.height * 1.05 - drift,
      gap * 0.5,
      Math.sin(beat.clock * 0.5 + i) * 0.4,
      i % 2,
      glow,
      beat.fade * 0.16,
    );
  }
};

const strings: Painter = (ctx, beat, ink, glow) => {
  const count = 6;
  const settle = clamp((beat.phase - 0.42) / 0.58);
  const pull = ease(beat.phase / 0.42);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i++) {
    const seed = i * 6.7;
    const lean = (wave(seed) - 0.5) * beat.width * 0.4;
    const x = beat.width * (0.15 + wave(seed + 1) * 0.7) + Math.sin(beat.clock * 0.3 + i) * beat.width * 0.02;
    const shaft = ctx.createLinearGradient(x, 0, x + lean, beat.height);
    shaft.addColorStop(0, glow);
    shaft.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = beat.fade * (0.035 + 0.09 * beat.energy);
    ctx.fillStyle = shaft;
    ctx.beginPath();
    ctx.moveTo(x - beat.width * 0.05, 0);
    ctx.lineTo(x + beat.width * 0.05, 0);
    ctx.lineTo(x + lean + beat.width * 0.19, beat.height);
    ctx.lineTo(x + lean - beat.width * 0.19, beat.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  for (let i = 0; i < count; i++) {
    const y = beat.height * (0.16 + (i / (count - 1)) * 0.68);
    const idle = Math.sin(beat.clock * (1.1 + i * 0.2) + i) * beat.unit * 0.005;
    const amplitude =
      beat.unit * 0.13 * beat.energy * (settle > 0 ? Math.exp(-settle * 3.8) : pull) + idle;
    pluck(
      ctx,
      y,
      beat.width,
      amplitude,
      1 + (i % 3),
      settle * (14 + i * 6),
      i % 2 ? glow : ink,
      beat.fade * (0.2 + 0.7 * beat.energy),
    );
  }
};

const sketch: Painter = (ctx, beat, ink, glow) => {
  const count = beat.width < 768 ? 7 : 9;
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const seed = i * 9.4;
    points.push({
      x: beat.width * (0.08 + wave(seed) * 0.84) + Math.sin(beat.clock * 0.4 + i) * beat.width * 0.008,
      y: beat.height * (0.14 + wave(seed + 1) * 0.72) + Math.cos(beat.clock * 0.33 + i) * beat.height * 0.01,
    });
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1;
  let link = 0;
  for (let a = 0; a < count; a++) {
    for (let b = a + 1; b < count; b++) {
      const far = Math.hypot(points[a].x - points[b].x, points[a].y - points[b].y);
      if (far > beat.width * 0.36) continue;
      const drawn = ease((beat.phase - 0.05 - (link % 7) * 0.05) / 0.4);
      link++;
      if (drawn <= 0) continue;
      ctx.globalAlpha = beat.fade * (0.1 + 0.45 * beat.energy);
      ctx.beginPath();
      ctx.moveTo(points[a].x, points[a].y);
      ctx.lineTo(points[a].x + (points[b].x - points[a].x) * drawn, points[a].y + (points[b].y - points[a].y) * drawn);
      ctx.stroke();
    }
  }
  ctx.restore();

  const hatches = Math.round(7 * beat.detail);
  for (let i = 0; i < count; i++) {
    const seed = i * 9.4;
    const grown = ease((beat.phase - 0.12 - i * 0.045) / 0.42);
    if (grown <= 0) continue;
    const size = beat.unit * (0.055 + wave(seed + 4) * 0.06);
    const lean = wave(seed + 5) * Math.PI;
    for (let h = 0; h < hatches; h++) {
      const across = (h / hatches - 0.5) * size * 1.6;
      const path = spine(
        [
          { x: points[i].x + Math.cos(lean) * across - Math.sin(lean) * size, y: points[i].y + Math.sin(lean) * across + Math.cos(lean) * size },
          { x: points[i].x + Math.cos(lean) * across, y: points[i].y + Math.sin(lean) * across },
          { x: points[i].x + Math.cos(lean) * across + Math.sin(lean) * size, y: points[i].y + Math.sin(lean) * across - Math.cos(lean) * size },
        ],
        Math.round(26 * beat.detail),
      );
      brush(ctx, path, {
        width: size * 0.16,
        colour: h % 2 ? glow : ink,
        progress: grown,
        alpha: beat.fade * (0.12 + 0.6 * beat.energy),
        bristles: 4,
        seed: seed + h,
      });
    }
  }
};

const signature: Painter = (ctx, beat, ink, glow) => {
  const base = beat.height * 0.5;
  const step = beat.width * 0.105;
  const controls: Point[] = [];
  for (let i = 0; i <= 9; i++) {
    controls.push({
      x: beat.width * 0.02 + i * step,
      y: base + Math.sin(i * 1.9) * beat.height * 0.11 - Math.sin(i * 0.6) * beat.height * 0.05,
    });
  }
  const path = spine(controls, Math.round(180 * beat.detail));
  const written = ease(beat.phase / 0.62);

  nib(ctx, path, beat.unit * 0.05, -0.7, ink, written, beat.fade * (0.22 + 0.75 * beat.energy));

  const flourish = spine(
    [
      { x: beat.width * 0.04, y: base + beat.height * 0.14 },
      { x: beat.width * 0.4, y: base + beat.height * 0.2 },
      { x: beat.width * 0.86, y: base + beat.height * 0.1 },
    ],
    Math.round(90 * beat.detail),
  );
  nib(ctx, flourish, beat.unit * 0.02, -0.7, glow, ease((beat.phase - 0.3) / 0.4), beat.fade * (0.14 + 0.5 * beat.energy));

  const stamp = ease((beat.phase - 0.5) / 0.22);
  if (stamp > 0) {
    const radius = beat.unit * 0.09 * (1 + 0.5 * (1 - easeBack(stamp)));
    const x = beat.width * 0.82;
    const y = base + beat.height * 0.2;
    seal(ctx, x, y, radius, glow, beat.fade * (0.25 + 0.65 * beat.energy) * stamp, 12.5);

    const shock = clamp((beat.phase - 0.56) / 0.3);
    if (shock > 0 && shock < 1) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = beat.fade * (1 - shock) * 0.5;
      ctx.strokeStyle = glow;
      ctx.lineWidth = 3 * (1 - shock);
      ctx.beginPath();
      ctx.arc(x, y, radius * (1 + shock * 3.4), 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
};

const finale: Painter = (ctx, beat, ink, glow) => {
  brushes(ctx, { ...beat, fade: beat.fade * 0.75 }, ink, glow);
  notes(ctx, { ...beat, fade: beat.fade * 0.85 }, glow, ink);
  sketch(ctx, { ...beat, fade: beat.fade * 0.5 }, ink, glow);
};

const PAINTERS: Painter[] = [brushes, notes, strings, sketch, signature, finale];

export function createStudio(canvas: HTMLCanvasElement, lowPower: boolean) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;

  let detail = lowPower ? 0.7 : 1;
  let density = Math.min(window.devicePixelRatio, lowPower ? 1.25 : 1.5);
  let width = 1;
  let height = 1;
  let sheet = paper(1, 1, GROUND);
  let sheetWidth = 0;
  let sheetHeight = 0;
  let wash: CanvasGradient[] = [];
  let scrim: CanvasGradient | null = null;
  let clock = 0;
  let from = 0;
  let to = 0;
  let phase = 1;

  const pointer = { x: 0, y: 0 };
  const target = { x: 0, y: 0 };

  const measure = () => {
    canvas.width = Math.max(1, Math.round(width * density));
    canvas.height = Math.max(1, Math.round(height * density));
    if (canvas.width !== sheetWidth || Math.abs(canvas.height - sheetHeight) > 160) {
      sheet = paper(canvas.width, Math.max(canvas.height, sheetHeight), GROUND);
      sheetWidth = canvas.width;
      sheetHeight = Math.max(canvas.height, sheetHeight);
    }
    const cx = width * (width < 768 ? 0.5 : 0.72);
    const cy = height * (width < 768 ? 0.3 : 0.46);
    wash = INK.map((colour, index) => {
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(width, height) * 0.75);
      gradient.addColorStop(0, `${colour}24`);
      gradient.addColorStop(0.45, `${GLOW[index]}0E`);
      gradient.addColorStop(1, "#00000000");
      return gradient;
    });

    scrim =
      width < 768
        ? ctx.createLinearGradient(0, height, 0, height * 0.22)
        : ctx.createLinearGradient(0, 0, width * 0.66, 0);
    scrim.addColorStop(0, "rgba(11, 9, 21, 0.9)");
    scrim.addColorStop(0.5, "rgba(11, 9, 21, 0.55)");
    scrim.addColorStop(1, "rgba(11, 9, 21, 0)");
  };

  const beatFor = (fade: number, active: number): Beat => {
    const band = width < 768 ? height * 0.64 : height;
    return {
      width,
      height: band,
      unit: Math.min(width, band),
      detail,
      clock,
      phase: active === to ? phase : 1,
      energy: active === to ? Math.pow(Math.sin(Math.PI * clamp(phase)), 0.7) : 0,
      fade,
    };
  };

  return {
    resize: (nextWidth: number, nextHeight: number) => {
      width = nextWidth;
      height = nextHeight;
      measure();
    },
    setGesture: (nextFrom: number, nextTo: number, progress: number) => {
      from = nextFrom;
      to = nextTo;
      phase = progress;
    },
    settle: (index: number) => {
      from = index;
      to = index;
      phase = 1;
    },
    setPointer: (x: number, y: number) => {
      target.x = x;
      target.y = y;
    },
    degrade: () => {
      if (detail <= 0.55) return false;
      detail = 0.55;
      density = 1;
      measure();
      return true;
    },
    frame: (delta: number) => {
      clock += delta;
      pointer.x += (target.x - pointer.x) * 0.06;
      pointer.y += (target.y - pointer.y) * 0.06;

      ctx.setTransform(density, 0, 0, density, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.drawImage(sheet, 0, 0, width, height);

      const blend = from === to ? 1 : ease(phase);
      if (blend < 1) {
        ctx.globalAlpha = 1 - blend;
        ctx.fillStyle = wash[from];
        ctx.fillRect(0, 0, width, height);
      }
      ctx.globalAlpha = blend;
      ctx.fillStyle = wash[to];
      ctx.fillRect(0, 0, width, height);
      ctx.globalAlpha = 1;

      ctx.translate(pointer.x * width * 0.012, pointer.y * height * 0.012);

      const leaving = from === to ? 0 : clamp(1 - phase / 0.45);
      if (leaving > 0) PAINTERS[from](ctx, beatFor(leaving * 0.6, from), INK[from], GLOW[from]);
      PAINTERS[to](ctx, beatFor(1, to), INK[to], GLOW[to]);

      if (scrim) {
        ctx.setTransform(density, 0, 0, density, 0, 0);
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
        ctx.fillStyle = scrim;
        ctx.fillRect(0, 0, width, height);
      }
    },
  };
}
