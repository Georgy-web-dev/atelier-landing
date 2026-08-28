import gsap from "gsap";
import Observer from "gsap/Observer";
import SplitText from "gsap/SplitText";
import { INK, createStudio } from "./scenes";

gsap.registerPlugin(Observer, SplitText);

const LABELS = ["Atelier", "Works", "Stage", "People", "Rights", "Contact"];
const GESTURE = 45;
const COOLDOWN = 110;
const SPAN = 1.7;
const COVER = 0.74;

const clampIndex = (index: number) => Math.max(0, Math.min(index, LABELS.length - 1));

const isGame = document.documentElement.classList.contains("mode-game");
const screens = Array.from(document.querySelectorAll<HTMLElement>(".screen"));
const ticks = Array.from(document.querySelectorAll<HTMLElement>(".spine__tick"));
const canvas = document.querySelector<HTMLCanvasElement>(".studio");
const veil = document.querySelector<HTMLElement>(".veil");
const marker = document.querySelector<HTMLElement>(".marker");

let current = 0;
let busy = false;
let queued = 0;
let settledAt = 0;
let accumulated = 0;
let accumulatedAt = 0;

function entrance(screen: HTMLElement) {
  const timeline = gsap.timeline();
  const kicker = screen.querySelector<HTMLElement>("[data-kick]");
  const title = screen.querySelector<HTMLElement>("[data-title]");
  const words = title?.querySelectorAll(".word") ?? [];
  const leads = screen.querySelectorAll("[data-lead]");
  const rows = screen.querySelectorAll("[data-panel] li, [data-panel] a");

  if (kicker) {
    timeline
      .fromTo(kicker, { opacity: 0 }, { opacity: 1, duration: 0.45, ease: "power2.out" }, 0)
      .fromTo(kicker, { "--rule": 0 }, { "--rule": 1, duration: 0.6, ease: "power3.out" }, 0);
  }

  if (words.length) {
    timeline.fromTo(
      words,
      { opacity: 0, yPercent: 105 },
      { opacity: 1, yPercent: 0, duration: 0.85, stagger: 0.07, ease: "expo.out" },
      0.06,
    );
  }

  if (leads.length) {
    timeline.fromTo(
      leads,
      { opacity: 0, y: 22 },
      { opacity: 1, y: 0, duration: 0.6, stagger: 0.08, ease: "power2.out" },
      0.3,
    );
  }

  if (rows.length) {
    timeline.fromTo(
      rows,
      { opacity: 0, x: -26 },
      { opacity: 1, x: 0, duration: 0.55, stagger: 0.06, ease: "power3.out" },
      0.42,
    );
  }

  return timeline;
}

function start() {
  if (!isGame || !canvas || !veil) return;

  const lowPower = window.innerWidth < 768 || navigator.hardwareConcurrency <= 4;
  const studio = createStudio(canvas, lowPower);
  if (!studio) {
    document.documentElement.className = "mode-flow";
    return;
  }

  const state = { gesture: 0 };
  const pointer = { x: 0, y: 0 };

  const fit = () => studio.resize(window.innerWidth, window.innerHeight);
  fit();
  window.addEventListener("resize", fit);

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
    veil.style.background = INK[next];

    gsap
      .timeline({
        onComplete: () => {
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
          duration: SPAN,
          ease: "none",
          onUpdate: () => studio.setGesture(from, next, state.gesture),
        },
        0,
      )
      .to(veil, { opacity: 0.62, duration: 0.42, ease: "power2.in" }, COVER - 0.42)
      .addLabel("covered", COVER)
      .add(() => {
        screens[from].classList.remove("is-active");
        screens[next].classList.add("is-active");
        if (marker) marker.innerHTML = `<i>0${next + 1}</i> / 06 · <span>${LABELS[next]}</span>`;
        entrance(screens[next]);
      }, "covered")
      .to(veil, { opacity: 0, duration: 0.58, ease: "power2.out" }, "covered+=0.06");
  };

  const step = (direction: number) => goTo(current + direction);

  window.addEventListener(
    "wheel",
    (event) => {
      const now = performance.now();
      if (now - settledAt < COOLDOWN && !busy) return;
      if (now - accumulatedAt > 220) accumulated = 0;
      accumulatedAt = now;
      accumulated += event.deltaY;
      if (Math.abs(accumulated) < GESTURE) return;
      const direction = accumulated > 0 ? 1 : -1;
      accumulated = 0;
      step(direction);
    },
    { passive: true },
  );

  window.addEventListener("pointermove", (event) => {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = (event.clientY / window.innerHeight) * 2 - 1;
  });

  Observer.create({
    target: window,
    type: "touch",
    tolerance: 22,
    dragMinimum: 10,
    preventDefault: true,
    onUp: () => step(1),
    onDown: () => step(-1),
  });

  window.addEventListener("keydown", (event) => {
    if (["ArrowDown", "PageDown", " "].includes(event.key)) { event.preventDefault(); step(1); }
    if (["ArrowUp", "PageUp"].includes(event.key)) { event.preventDefault(); step(-1); }
    if (event.key === "Home") goTo(0);
    if (event.key === "End") goTo(screens.length - 1);
  });

  document.querySelectorAll<HTMLElement>("[data-go]").forEach((element) => {
    element.addEventListener("click", () => goTo(Number(element.dataset.go)));
  });

  let budget = 0;
  gsap.ticker.fps(60);
  gsap.ticker.add((_time, delta) => {
    if (delta < 120) budget = Math.max(0, budget + (delta > 26 ? 1 : -1));
    if (budget > 70 && studio.degrade()) budget = 0;
    studio.setPointer(pointer.x, pointer.y);
    studio.frame(Math.min(delta, 50) / 1000);
  });

  document.fonts.ready.then(() => {
    document.querySelectorAll<HTMLElement>("[data-title]").forEach((title) => {
      new SplitText(title, { type: "words", wordsClass: "word" });
    });
    entrance(screens[0]);
  });
}

start();
