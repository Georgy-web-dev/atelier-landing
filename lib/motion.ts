import gsap from "gsap";
import Observer from "gsap/Observer";
import SplitText from "gsap/SplitText";
import { CHAPTERS } from "./chapters";
import { MOBILE_WIDTH, createStudio } from "./scenes";

const WHEEL_THRESHOLD = 45;
const WHEEL_RESET_MS = 220;
const INPUT_COOLDOWN_MS = 110;
const TRANSITION_SECONDS = 1.7;
const COVER_AT_SECONDS = 0.74;
const VEIL_PEAK = 0.62;
const VEIL_RISE_SECONDS = 0.42;
const VEIL_FALL_SECONDS = 0.58;
const VEIL_FALL_DELAY = 0.06;
const SWIPE_TOLERANCE = 44;
const SWIPE_MIN_DRAG = 20;
const TARGET_FPS = 60;
const SLOW_FRAME_MS = 26;
const STALLED_FRAME_MS = 120;
const SLOW_FRAME_BUDGET = 70;
const MAX_FRAME_MS = 50;
const LOW_POWER_CORES = 4;
const RESIZE_SETTLE_MS = 140;
const POINTER_DRIFT = 0.06;
const MILLISECONDS = 1000;

const ENTRANCE = {
  kickerFade: 0.45,
  ruleDraw: 0.6,
  wordRise: 0.85,
  wordStagger: 0.07,
  wordOffset: 105,
  wordsAt: 0.06,
  leadRise: 0.6,
  leadStagger: 0.08,
  leadShift: 22,
  leadsAt: 0.3,
  rowRise: 0.55,
  rowStagger: 0.06,
  rowShift: 26,
  rowsAt: 0.42,
};

const FORWARD_KEYS = ["ArrowDown", "PageDown", " "];
const BACKWARD_KEYS = ["ArrowUp", "PageUp"];

const pad = (value: number) => String(value).padStart(2, "0");

function entrance(screen: HTMLElement) {
  const timeline = gsap.timeline();
  const kicker = screen.querySelector<HTMLElement>("[data-kick]");
  const words = screen.querySelectorAll("[data-title] .word");
  const leads = screen.querySelectorAll("[data-lead]");
  const rows = screen.querySelectorAll("[data-panel] li, [data-panel] a");

  if (kicker) {
    timeline
      .fromTo(kicker, { opacity: 0 }, { opacity: 1, duration: ENTRANCE.kickerFade, ease: "power2.out" }, 0)
      .fromTo(kicker, { "--rule": 0 }, { "--rule": 1, duration: ENTRANCE.ruleDraw, ease: "power3.out" }, 0);
  }

  if (words.length) {
    timeline.fromTo(
      words,
      { opacity: 0, yPercent: ENTRANCE.wordOffset },
      {
        opacity: 1,
        yPercent: 0,
        duration: ENTRANCE.wordRise,
        stagger: ENTRANCE.wordStagger,
        ease: "expo.out",
      },
      ENTRANCE.wordsAt,
    );
  }

  if (leads.length) {
    timeline.fromTo(
      leads,
      { opacity: 0, y: ENTRANCE.leadShift },
      { opacity: 1, y: 0, duration: ENTRANCE.leadRise, stagger: ENTRANCE.leadStagger, ease: "power2.out" },
      ENTRANCE.leadsAt,
    );
  }

  if (rows.length) {
    timeline.fromTo(
      rows,
      { opacity: 0, x: -ENTRANCE.rowShift },
      { opacity: 1, x: 0, duration: ENTRANCE.rowRise, stagger: ENTRANCE.rowStagger, ease: "power3.out" },
      ENTRANCE.rowsAt,
    );
  }

  return timeline;
}

export function startMotion(): () => void {
  if (!document.documentElement.classList.contains("mode-game")) return () => {};

  gsap.registerPlugin(Observer, SplitText);

  const canvas = document.querySelector<HTMLCanvasElement>(".studio");
  const veil = document.querySelector<HTMLElement>(".veil");
  const markerIndex = document.querySelector<HTMLElement>("[data-marker-index]");
  const markerLabel = document.querySelector<HTMLElement>("[data-marker-label]");
  const announce = document.querySelector<HTMLElement>("[data-announce]");
  const screens = Array.from(document.querySelectorAll<HTMLElement>(".screen"));
  const ticks = Array.from(document.querySelectorAll<HTMLElement>(".spine__tick"));
  if (!canvas || !veil || !screens.length) return () => {};

  const lowPower = window.innerWidth < MOBILE_WIDTH || navigator.hardwareConcurrency <= LOW_POWER_CORES;
  const studio = createStudio(canvas, lowPower);
  if (!studio) {
    document.documentElement.className = "mode-flow";
    return () => {};
  }

  const state = { gesture: 0 };
  const pointer = { x: 0, y: 0 };
  const timelines = new Set<gsap.core.Timeline>();

  let live = true;
  let current = 0;
  let busy = false;
  let queued = 0;
  let settledAt = 0;
  let accumulated = 0;
  let accumulatedAt = 0;
  let budget = 0;

  const clampIndex = (index: number) => Math.max(0, Math.min(index, screens.length - 1));

  const fit = () => studio.resize(window.innerWidth, window.innerHeight);
  fit();

  let resizeTimer = 0;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(fit, RESIZE_SETTLE_MS);
  };

  const goTo = (next: number) => {
    if (busy) {
      queued = clampIndex(next) - current;
      return;
    }
    if (next === current || next < 0 || next >= screens.length) return;

    busy = true;
    const from = current;
    current = next;
    ticks.forEach((tick, index) => tick.classList.toggle("is-on", index === next));
    veil.style.background = CHAPTERS[next].ink;

    const timeline = gsap
      .timeline({
        onComplete: () => {
          timelines.delete(timeline);
          studio.settle(next);
          busy = false;
          settledAt = performance.now();
          if (queued) {
            const pending = queued;
            queued = 0;
            goTo(current + pending);
          }
        },
      })
      .fromTo(
        state,
        { gesture: 0 },
        {
          gesture: 1,
          duration: TRANSITION_SECONDS,
          ease: "none",
          onUpdate: () => studio.setGesture(from, next, state.gesture),
        },
        0,
      )
      .to(
        veil,
        { opacity: VEIL_PEAK, duration: VEIL_RISE_SECONDS, ease: "power2.in" },
        COVER_AT_SECONDS - VEIL_RISE_SECONDS,
      )
      .addLabel("covered", COVER_AT_SECONDS)
      .add(() => {
        screens[from].classList.remove("is-active");
        screens[next].classList.add("is-active");
        if (markerIndex) markerIndex.textContent = pad(next + 1);
        if (markerLabel) markerLabel.textContent = CHAPTERS[next].label;
        if (announce) announce.textContent = `${CHAPTERS[next].label}. ${CHAPTERS[next].title}.`;
        timelines.add(entrance(screens[next]));
      }, "covered")
      .to(veil, { opacity: 0, duration: VEIL_FALL_SECONDS, ease: "power2.out" }, `covered+=${VEIL_FALL_DELAY}`);

    timelines.add(timeline);
  };

  const step = (direction: number) => goTo(current + direction);

  const onWheel = (event: WheelEvent) => {
    const now = performance.now();
    if (busy || now - settledAt < INPUT_COOLDOWN_MS) {
      accumulated = 0;
      accumulatedAt = now;
      return;
    }
    if (now - accumulatedAt > WHEEL_RESET_MS) accumulated = 0;
    accumulatedAt = now;
    accumulated += event.deltaY;
    if (Math.abs(accumulated) < WHEEL_THRESHOLD) return;
    const direction = accumulated > 0 ? 1 : -1;
    accumulated = 0;
    step(direction);
  };

  const onPointerMove = (event: PointerEvent) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (FORWARD_KEYS.includes(event.key)) {
      event.preventDefault();
      step(1);
    }
    if (BACKWARD_KEYS.includes(event.key)) {
      event.preventDefault();
      step(-1);
    }
    if (event.key === "Home") goTo(0);
    if (event.key === "End") goTo(screens.length - 1);
  };

  const jumps = Array.from(document.querySelectorAll<HTMLElement>("[data-go]"));
  const onJump = (event: Event) => {
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    goTo(Number(target.dataset.go));
  };

  const render = (_time: number, delta: number) => {
    if (delta < STALLED_FRAME_MS) budget = Math.max(0, budget + (delta > SLOW_FRAME_MS ? 1 : -1));
    if (budget > SLOW_FRAME_BUDGET && studio.degrade()) budget = 0;
    studio.setPointer(pointer.x, pointer.y);
    studio.frame(Math.min(delta, MAX_FRAME_MS) / MILLISECONDS, POINTER_DRIFT);
  };

  window.addEventListener("resize", onResize);
  window.addEventListener("wheel", onWheel, { passive: true });
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("keydown", onKeyDown);
  jumps.forEach((jump) => jump.addEventListener("click", onJump));

  const observer = Observer.create({
    target: window,
    type: "touch",
    tolerance: SWIPE_TOLERANCE,
    dragMinimum: SWIPE_MIN_DRAG,
    preventDefault: false,
    onUp: () => step(1),
    onDown: () => step(-1),
  });

  gsap.ticker.fps(TARGET_FPS);
  gsap.ticker.add(render);

  const splits: SplitText[] = [];
  document.fonts.ready.then(() => {
    if (!live) return;
    document.querySelectorAll<HTMLElement>("[data-title]").forEach((title) => {
      splits.push(new SplitText(title, { type: "words", wordsClass: "word" }));
    });
    timelines.add(entrance(screens[0]));
  });

  return () => {
    live = false;
    window.clearTimeout(resizeTimer);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("keydown", onKeyDown);
    jumps.forEach((jump) => jump.removeEventListener("click", onJump));
    observer.kill();
    gsap.ticker.remove(render);
    timelines.forEach((timeline) => timeline.kill());
    timelines.clear();
    splits.forEach((split) => split.revert());
  };
}
