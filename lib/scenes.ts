import {
  EIGHTH,
  QUARTER,
  brush,
  clamp,
  ease,
  easeBack,
  nib,
  note,
  paper,
  pluck,
  seal,
  spine,
  stave,
  wave,
  type Point,
} from "./ink";
import { CHAPTERS, type Tool } from "./chapters";

const GROUND = "#0E0B1A";

export const MOBILE_WIDTH = 768;

const PORTRAIT_BAND = 0.64;
const ENERGY_SHAPE = 0.7;
const HANDOVER_WINDOW = 0.45;
const HANDOVER_FADE = 0.6;
const SHEET_TOLERANCE = 160;

const QUALITY = {
  detail: 1,
  lowDetail: 0.7,
  degradedDetail: 0.55,
  density: 1.5,
  lowDensity: 1.25,
  degradedDensity: 1,
};

const WASH = {
  core: "24",
  mid: "0E",
  midStop: 0.45,
  radius: 0.75,
  landscapeX: 0.72,
  landscapeY: 0.46,
  portraitX: 0.5,
  portraitY: 0.3,
};

const SCRIM = {
  landscapeReach: 0.66,
  portraitReach: 0.22,
  near: "rgba(11, 9, 21, 0.9)",
  mid: "rgba(11, 9, 21, 0.55)",
  far: "rgba(11, 9, 21, 0)",
  midStop: 0.5,
};

const BRUSHWORK = {
  strokesWide: 4,
  strokesNarrow: 3,
  overreach: 0.16,
  spread: 0.16,
  sway: 0.012,
  swaySpeed: 0.35,
  entryHeight: 0.74,
  firstBendX: 0.3,
  firstBendY: 0.42,
  firstBendLift: 0.11,
  secondBendX: 0.68,
  secondBendY: 0.6,
  secondBendLift: 0.13,
  exitX: 1.16,
  exitY: 0.22,
  points: 130,
  widthBase: 0.13,
  widthVary: 0.055,
  stagger: 0.07,
  paintWindow: 0.52,
  idleAlpha: 0.22,
  liveAlpha: 0.78,
  bristles: 26,
  wet: 0.7,
  seedBase: 40,
  seedStep: 17,
};

const NOTATION = {
  line: 0.47,
  gapRatio: 0.05,
  gapCap: 30,
  staveStart: 0.06,
  staveWidth: 1.12,
  staveWindow: 0.42,
  staveSeed: 3.2,
  staveIdle: 0.16,
  staveLive: 0.55,
  count: 16,
  burstStart: 0.46,
  appearStart: 0.06,
  appearSpread: 0.28,
  appearWindow: 0.3,
  flyBase: 0.3,
  flyVary: 0.7,
  scatter: 3.6,
  steps: 6,
  stepCentre: 3,
  sizeBase: 0.55,
  sizeVary: 0.35,
  popFloor: 0.4,
  popRange: 0.6,
  spin: 5.5,
  idleAlpha: 0.18,
  liveAlpha: 0.82,
  burstFade: 0.7,
  seedStep: 5.3,
  driftCount: 5,
  driftSeed: 90,
  driftSeedStep: 8,
  driftSpan: 1.2,
  driftBase: 7,
  driftVary: 9,
  driftSize: 0.5,
  driftAlpha: 0.16,
  driftSpin: 0.4,
  driftSpinSpeed: 0.5,
};

const STRINGS = {
  count: 6,
  releaseAt: 0.42,
  shafts: 3,
  shaftSeedStep: 6.7,
  shaftLean: 0.4,
  shaftLeft: 0.15,
  shaftRange: 0.7,
  shaftSway: 0.02,
  shaftSwaySpeed: 0.3,
  shaftWidth: 0.05,
  shaftFlare: 0.19,
  shaftIdle: 0.035,
  shaftLive: 0.09,
  top: 0.16,
  spread: 0.68,
  idleAmplitude: 0.005,
  idleSpeed: 1.1,
  idleSpeedStep: 0.2,
  amplitude: 0.13,
  decay: 3.8,
  oscBase: 14,
  oscStep: 6,
  harmonics: 3,
  idleAlpha: 0.2,
  liveAlpha: 0.7,
};

const SKETCH = {
  nodesWide: 9,
  nodesNarrow: 7,
  seedStep: 9.4,
  left: 0.08,
  spanX: 0.84,
  top: 0.14,
  spanY: 0.72,
  driftX: 0.008,
  driftY: 0.01,
  driftSpeedX: 0.4,
  driftSpeedY: 0.33,
  linkRange: 0.36,
  linkStart: 0.05,
  linkStagger: 0.05,
  linkCycle: 7,
  linkWindow: 0.4,
  linkIdle: 0.1,
  linkLive: 0.45,
  hatches: 7,
  growStart: 0.12,
  growStagger: 0.045,
  growWindow: 0.42,
  sizeBase: 0.055,
  sizeVary: 0.06,
  hatchSpread: 1.6,
  hatchWidth: 0.16,
  hatchPoints: 26,
  hatchBristles: 4,
  hatchIdle: 0.12,
  hatchLive: 0.6,
};

const SIGNATURE = {
  base: 0.5,
  startX: 0.02,
  step: 0.105,
  nodes: 9,
  riseFrequency: 1.9,
  riseAmount: 0.11,
  dipFrequency: 0.6,
  dipAmount: 0.05,
  points: 180,
  writeWindow: 0.62,
  nibWidth: 0.05,
  nibAngle: -0.7,
  idleAlpha: 0.22,
  liveAlpha: 0.75,
  flourishLeft: 0.04,
  flourishMid: 0.4,
  flourishRight: 0.86,
  flourishDrop: 0.14,
  flourishDip: 0.2,
  flourishRise: 0.1,
  flourishPoints: 90,
  flourishStart: 0.3,
  flourishWindow: 0.4,
  flourishWidth: 0.02,
  flourishIdle: 0.14,
  flourishLive: 0.5,
  stampStart: 0.5,
  stampWindow: 0.22,
  sealX: 0.82,
  sealY: 0.2,
  sealRadius: 0.09,
  sealOvershoot: 0.5,
  sealSeed: 12.5,
  sealIdle: 0.25,
  sealLive: 0.65,
  shockStart: 0.56,
  shockWindow: 0.3,
  shockGrowth: 3.4,
  shockAlpha: 0.5,
  shockWidth: 3,
};

const FINALE = { brushFade: 0.75, notesFade: 0.85, sketchFade: 0.5 };

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
  const strokes = beat.width < MOBILE_WIDTH ? BRUSHWORK.strokesNarrow : BRUSHWORK.strokesWide;

  for (let i = 0; i < strokes; i++) {
    const seed = BRUSHWORK.seedBase + i * BRUSHWORK.seedStep;
    const lift = (i - (strokes - 1) / 2) * beat.height * BRUSHWORK.spread;
    const sway = Math.sin(beat.clock * BRUSHWORK.swaySpeed + i) * beat.height * BRUSHWORK.sway;
    const path = spine(
      [
        { x: -reach * BRUSHWORK.overreach, y: beat.height * BRUSHWORK.entryHeight + lift + sway },
        {
          x: beat.width * BRUSHWORK.firstBendX,
          y: beat.height * BRUSHWORK.firstBendY + lift + wave(seed) * beat.height * BRUSHWORK.firstBendLift,
        },
        {
          x: beat.width * BRUSHWORK.secondBendX,
          y: beat.height * BRUSHWORK.secondBendY + lift - wave(seed + 3) * beat.height * BRUSHWORK.secondBendLift,
        },
        { x: beat.width * BRUSHWORK.exitX, y: beat.height * BRUSHWORK.exitY + lift - sway },
      ],
      Math.round(BRUSHWORK.points * beat.detail),
    );

    brush(ctx, path, {
      width: beat.unit * (BRUSHWORK.widthBase + BRUSHWORK.widthVary * wave(seed + 9)),
      colour: i % 2 ? glow : ink,
      progress: ease((beat.phase - i * BRUSHWORK.stagger) / BRUSHWORK.paintWindow),
      alpha: beat.fade * (BRUSHWORK.idleAlpha + BRUSHWORK.liveAlpha * beat.energy),
      bristles: Math.round(BRUSHWORK.bristles * beat.detail),
      seed,
      wet: BRUSHWORK.wet,
    });
  }
};

const notes: Painter = (ctx, beat, ink, glow) => {
  const line = beat.height * NOTATION.line;
  const gap = Math.min(beat.unit * NOTATION.gapRatio, NOTATION.gapCap);

  stave(
    ctx,
    -beat.width * NOTATION.staveStart,
    line,
    beat.width * NOTATION.staveWidth,
    gap,
    ink,
    ease(beat.phase / NOTATION.staveWindow),
    beat.fade * (NOTATION.staveIdle + NOTATION.staveLive * beat.energy),
    NOTATION.staveSeed,
  );

  const count = Math.round(NOTATION.count * beat.detail);
  const burst = ease((beat.phase - NOTATION.burstStart) / (1 - NOTATION.burstStart));

  for (let i = 0; i < count; i++) {
    const along = count === 1 ? 0 : i / (count - 1);
    const appear = ease(
      (beat.phase - NOTATION.appearStart - along * NOTATION.appearSpread) / NOTATION.appearWindow,
    );
    if (appear <= 0) continue;

    const seed = i * NOTATION.seedStep;
    const angle = (wave(seed) - 0.5) * NOTATION.scatter;
    const fly = burst * beat.unit * (NOTATION.flyBase + wave(seed + 2) * NOTATION.flyVary);
    const step = Math.round(wave(seed + 7) * NOTATION.steps) - NOTATION.stepCentre;
    const size =
      gap *
      (NOTATION.sizeBase + wave(seed + 11) * NOTATION.sizeVary) *
      (NOTATION.popFloor + NOTATION.popRange * easeBack(appear));

    note(
      ctx,
      beat.width * (0.02 + along * 0.97) + Math.cos(angle) * fly,
      line + step * gap * 0.5 - Math.sin(angle) * fly,
      size,
      burst * (wave(seed + 4) - 0.5) * NOTATION.spin,
      Math.round(wave(seed + 13) * 3.4),
      i % 3 === 0 ? glow : ink,
      beat.fade * (NOTATION.idleAlpha + NOTATION.liveAlpha * beat.energy) * appear * (1 - burst * NOTATION.burstFade),
    );
  }

  for (let i = 0; i < NOTATION.driftCount; i++) {
    const seed = NOTATION.driftSeed + i * NOTATION.driftSeedStep;
    const span = beat.height * NOTATION.driftSpan;
    const risen =
      (beat.clock * (NOTATION.driftBase + wave(seed) * NOTATION.driftVary) + wave(seed + 1) * span) % span;
    note(
      ctx,
      beat.width * (0.08 + wave(seed + 2) * 0.86),
      beat.height * 1.05 - risen,
      gap * NOTATION.driftSize,
      Math.sin(beat.clock * NOTATION.driftSpinSpeed + i) * NOTATION.driftSpin,
      i % 2 ? EIGHTH : QUARTER,
      glow,
      beat.fade * NOTATION.driftAlpha,
    );
  }
};

const strings: Painter = (ctx, beat, ink, glow) => {
  const settle = clamp((beat.phase - STRINGS.releaseAt) / (1 - STRINGS.releaseAt));
  const pull = ease(beat.phase / STRINGS.releaseAt);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < STRINGS.shafts; i++) {
    const seed = i * STRINGS.shaftSeedStep;
    const lean = (wave(seed) - 0.5) * beat.width * STRINGS.shaftLean;
    const x =
      beat.width * (STRINGS.shaftLeft + wave(seed + 1) * STRINGS.shaftRange) +
      Math.sin(beat.clock * STRINGS.shaftSwaySpeed + i) * beat.width * STRINGS.shaftSway;
    const shaft = ctx.createLinearGradient(x, 0, x + lean, beat.height);
    shaft.addColorStop(0, glow);
    shaft.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = beat.fade * (STRINGS.shaftIdle + STRINGS.shaftLive * beat.energy);
    ctx.fillStyle = shaft;
    ctx.beginPath();
    ctx.moveTo(x - beat.width * STRINGS.shaftWidth, 0);
    ctx.lineTo(x + beat.width * STRINGS.shaftWidth, 0);
    ctx.lineTo(x + lean + beat.width * STRINGS.shaftFlare, beat.height);
    ctx.lineTo(x + lean - beat.width * STRINGS.shaftFlare, beat.height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  for (let i = 0; i < STRINGS.count; i++) {
    const y = beat.height * (STRINGS.top + (i / (STRINGS.count - 1)) * STRINGS.spread);
    const shimmer =
      Math.sin(beat.clock * (STRINGS.idleSpeed + i * STRINGS.idleSpeedStep) + i) * beat.unit * STRINGS.idleAmplitude;
    const amplitude =
      beat.unit * STRINGS.amplitude * beat.energy * (settle > 0 ? Math.exp(-settle * STRINGS.decay) : pull) +
      shimmer;

    pluck(
      ctx,
      y,
      beat.width,
      amplitude,
      1 + (i % STRINGS.harmonics),
      settle * (STRINGS.oscBase + i * STRINGS.oscStep),
      i % 2 ? glow : ink,
      beat.fade * (STRINGS.idleAlpha + STRINGS.liveAlpha * beat.energy),
    );
  }
};

const sketch: Painter = (ctx, beat, ink, glow) => {
  const count = beat.width < MOBILE_WIDTH ? SKETCH.nodesNarrow : SKETCH.nodesWide;
  const nodes: Point[] = [];

  for (let i = 0; i < count; i++) {
    const seed = i * SKETCH.seedStep;
    nodes.push({
      x:
        beat.width * (SKETCH.left + wave(seed) * SKETCH.spanX) +
        Math.sin(beat.clock * SKETCH.driftSpeedX + i) * beat.width * SKETCH.driftX,
      y:
        beat.height * (SKETCH.top + wave(seed + 1) * SKETCH.spanY) +
        Math.cos(beat.clock * SKETCH.driftSpeedY + i) * beat.height * SKETCH.driftY,
    });
  }

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = ink;
  ctx.lineWidth = 1;
  let link = 0;
  for (let a = 0; a < count; a++) {
    for (let b = a + 1; b < count; b++) {
      const apart = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
      if (apart > beat.width * SKETCH.linkRange) continue;
      const drawn = ease(
        (beat.phase - SKETCH.linkStart - (link % SKETCH.linkCycle) * SKETCH.linkStagger) / SKETCH.linkWindow,
      );
      link++;
      if (drawn <= 0) continue;
      ctx.globalAlpha = beat.fade * (SKETCH.linkIdle + SKETCH.linkLive * beat.energy);
      ctx.beginPath();
      ctx.moveTo(nodes[a].x, nodes[a].y);
      ctx.lineTo(nodes[a].x + (nodes[b].x - nodes[a].x) * drawn, nodes[a].y + (nodes[b].y - nodes[a].y) * drawn);
      ctx.stroke();
    }
  }
  ctx.restore();

  const hatches = Math.round(SKETCH.hatches * beat.detail);
  for (let i = 0; i < count; i++) {
    const seed = i * SKETCH.seedStep;
    const grown = ease((beat.phase - SKETCH.growStart - i * SKETCH.growStagger) / SKETCH.growWindow);
    if (grown <= 0) continue;

    const size = beat.unit * (SKETCH.sizeBase + wave(seed + 4) * SKETCH.sizeVary);
    const lean = wave(seed + 5) * Math.PI;
    const alongX = Math.cos(lean);
    const alongY = Math.sin(lean);

    for (let h = 0; h < hatches; h++) {
      const across = (h / hatches - 0.5) * size * SKETCH.hatchSpread;
      const path = spine(
        [
          { x: nodes[i].x + alongX * across - alongY * size, y: nodes[i].y + alongY * across + alongX * size },
          { x: nodes[i].x + alongX * across, y: nodes[i].y + alongY * across },
          { x: nodes[i].x + alongX * across + alongY * size, y: nodes[i].y + alongY * across - alongX * size },
        ],
        Math.round(SKETCH.hatchPoints * beat.detail),
      );
      brush(ctx, path, {
        width: size * SKETCH.hatchWidth,
        colour: h % 2 ? glow : ink,
        progress: grown,
        alpha: beat.fade * (SKETCH.hatchIdle + SKETCH.hatchLive * beat.energy),
        bristles: SKETCH.hatchBristles,
        seed: seed + h,
      });
    }
  }
};

const signature: Painter = (ctx, beat, ink, glow) => {
  const base = beat.height * SIGNATURE.base;
  const step = beat.width * SIGNATURE.step;
  const controls: Point[] = [];

  for (let i = 0; i <= SIGNATURE.nodes; i++) {
    controls.push({
      x: beat.width * SIGNATURE.startX + i * step,
      y:
        base +
        Math.sin(i * SIGNATURE.riseFrequency) * beat.height * SIGNATURE.riseAmount -
        Math.sin(i * SIGNATURE.dipFrequency) * beat.height * SIGNATURE.dipAmount,
    });
  }

  nib(
    ctx,
    spine(controls, Math.round(SIGNATURE.points * beat.detail)),
    beat.unit * SIGNATURE.nibWidth,
    SIGNATURE.nibAngle,
    ink,
    ease(beat.phase / SIGNATURE.writeWindow),
    beat.fade * (SIGNATURE.idleAlpha + SIGNATURE.liveAlpha * beat.energy),
  );

  nib(
    ctx,
    spine(
      [
        { x: beat.width * SIGNATURE.flourishLeft, y: base + beat.height * SIGNATURE.flourishDrop },
        { x: beat.width * SIGNATURE.flourishMid, y: base + beat.height * SIGNATURE.flourishDip },
        { x: beat.width * SIGNATURE.flourishRight, y: base + beat.height * SIGNATURE.flourishRise },
      ],
      Math.round(SIGNATURE.flourishPoints * beat.detail),
    ),
    beat.unit * SIGNATURE.flourishWidth,
    SIGNATURE.nibAngle,
    glow,
    ease((beat.phase - SIGNATURE.flourishStart) / SIGNATURE.flourishWindow),
    beat.fade * (SIGNATURE.flourishIdle + SIGNATURE.flourishLive * beat.energy),
  );

  const stamp = ease((beat.phase - SIGNATURE.stampStart) / SIGNATURE.stampWindow);
  if (stamp <= 0) return;

  const radius = beat.unit * SIGNATURE.sealRadius * (1 + SIGNATURE.sealOvershoot * (1 - easeBack(stamp)));
  const x = beat.width * SIGNATURE.sealX;
  const y = base + beat.height * SIGNATURE.sealY;

  seal(
    ctx,
    x,
    y,
    radius,
    glow,
    beat.fade * (SIGNATURE.sealIdle + SIGNATURE.sealLive * beat.energy) * stamp,
    SIGNATURE.sealSeed,
  );

  const shock = clamp((beat.phase - SIGNATURE.shockStart) / SIGNATURE.shockWindow);
  if (shock <= 0 || shock >= 1) return;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = beat.fade * (1 - shock) * SIGNATURE.shockAlpha;
  ctx.strokeStyle = glow;
  ctx.lineWidth = SIGNATURE.shockWidth * (1 - shock);
  ctx.beginPath();
  ctx.arc(x, y, radius * (1 + shock * SIGNATURE.shockGrowth), 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
};

const finale: Painter = (ctx, beat, ink, glow) => {
  brushes(ctx, { ...beat, fade: beat.fade * FINALE.brushFade }, ink, glow);
  notes(ctx, { ...beat, fade: beat.fade * FINALE.notesFade }, glow, ink);
  sketch(ctx, { ...beat, fade: beat.fade * FINALE.sketchFade }, ink, glow);
};

const TOOLS: Record<Tool, Painter> = {
  brush: brushes,
  notation: notes,
  strings,
  sketch,
  signature,
  finale,
};

const painterFor = (index: number) => TOOLS[CHAPTERS[index].tool];

export function createStudio(canvas: HTMLCanvasElement, lowPower: boolean) {
  const ctx = canvas.getContext("2d", { alpha: false });
  if (!ctx) return null;

  let detail = lowPower ? QUALITY.lowDetail : QUALITY.detail;
  let density = Math.min(window.devicePixelRatio, lowPower ? QUALITY.lowDensity : QUALITY.density);
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

    if (canvas.width !== sheetWidth || Math.abs(canvas.height - sheetHeight) > SHEET_TOLERANCE) {
      sheetHeight = Math.max(canvas.height, sheetHeight);
      sheetWidth = canvas.width;
      sheet = paper(sheetWidth, sheetHeight, GROUND);
    }

    const portrait = width < MOBILE_WIDTH;
    const cx = width * (portrait ? WASH.portraitX : WASH.landscapeX);
    const cy = height * (portrait ? WASH.portraitY : WASH.landscapeY);

    wash = CHAPTERS.map((chapter) => {
      const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(width, height) * WASH.radius);
      gradient.addColorStop(0, `${chapter.ink}${WASH.core}`);
      gradient.addColorStop(WASH.midStop, `${chapter.glow}${WASH.mid}`);
      gradient.addColorStop(1, "#00000000");
      return gradient;
    });

    scrim = portrait
      ? ctx.createLinearGradient(0, height, 0, height * SCRIM.portraitReach)
      : ctx.createLinearGradient(0, 0, width * SCRIM.landscapeReach, 0);
    scrim.addColorStop(0, SCRIM.near);
    scrim.addColorStop(SCRIM.midStop, SCRIM.mid);
    scrim.addColorStop(1, SCRIM.far);
  };

  const beatFor = (fade: number, active: number): Beat => {
    const band = width < MOBILE_WIDTH ? height * PORTRAIT_BAND : height;
    return {
      width,
      height: band,
      unit: Math.min(width, band),
      detail,
      clock,
      phase: active === to ? phase : 1,
      energy: active === to ? Math.pow(Math.sin(Math.PI * clamp(phase)), ENERGY_SHAPE) : 0,
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
      if (detail <= QUALITY.degradedDetail) return false;
      detail = QUALITY.degradedDetail;
      density = QUALITY.degradedDensity;
      measure();
      return true;
    },
    frame: (delta: number, drift: number) => {
      clock += delta;
      pointer.x += (target.x - pointer.x) * drift;
      pointer.y += (target.y - pointer.y) * drift;

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

      const leaving = from === to ? 0 : clamp(1 - phase / HANDOVER_WINDOW);
      if (leaving > 0) {
        painterFor(from)(ctx, beatFor(leaving * HANDOVER_FADE, from), CHAPTERS[from].ink, CHAPTERS[from].glow);
      }
      painterFor(to)(ctx, beatFor(1, to), CHAPTERS[to].ink, CHAPTERS[to].glow);

      if (!scrim) return;
      ctx.setTransform(density, 0, 0, density, 0, 0);
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = scrim;
      ctx.fillRect(0, 0, width, height);
    },
  };
}
