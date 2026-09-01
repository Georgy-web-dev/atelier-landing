export type Row = { index: string; name: string; note: string };

export type Tool = "brush" | "notation" | "strings" | "sketch" | "signature" | "finale";

export type Chapter = {
  id: string;
  tool: Tool;
  ink: string;
  glow: string;
  label: string;
  kicker: string;
  title: string;
  lead: string;
  prompt?: string;
  rows?: Row[];
  mail?: string;
};

export const CHAPTERS: Chapter[] = [
  {
    id: "hero",
    tool: "brush",
    ink: "#7C5CFF",
    glow: "#C3B0FF",
    label: "Atelier",
    kicker: "The artist network",
    title: "Atelier",
    lead: "Everything an artist needs, in one place. Instrumentals, works, stages, people — and rights that actually transfer.",
    prompt: "Scroll, swipe or press",
  },
  {
    id: "works",
    tool: "notation",
    ink: "#D08663",
    glow: "#E8B187",
    label: "Works",
    kicker: "Works",
    title: "Find the material",
    lead: "Instrumentals to build on. Finished pieces to acquire. Or commission something that doesn't exist yet.",
    rows: [
      { index: "01", name: "Instrumentals", note: "Beats to build on" },
      { index: "02", name: "Songs", note: "Finished and ready" },
      { index: "03", name: "Sculptures", note: "One of one" },
      { index: "04", name: "Pictures", note: "Prints and originals" },
      { index: "05", name: "Commissions", note: "Made to your brief" },
    ],
  },
  {
    id: "stage",
    tool: "strings",
    ink: "#FFB25E",
    glow: "#FFD9A0",
    label: "Stage",
    kicker: "Stage",
    title: "Find the room",
    lead: "Venues browse you, check your dates and send an offer. You browse open slots and apply.",
    rows: [
      { index: "01", name: "They book you", note: "Your profile, your dates, a real offer" },
      { index: "02", name: "You find stages", note: "Open nights and festivals, filtered" },
      { index: "03", name: "Same escrow", note: "Contracts and payment, not a DM" },
    ],
  },
  {
    id: "people",
    tool: "sketch",
    ink: "#8FA8FF",
    glow: "#C7D4FF",
    label: "People",
    kicker: "People",
    title: "Find your people",
    lead: "A vocalist looking for a producer. A producer looking for a topliner.",
    rows: [
      { index: "01", name: "Who you need", note: "Producers, vocalists, players, crew" },
      { index: "02", name: "Who you are", note: "Works, credits, availability, rate" },
      { index: "03", name: "What you made", note: "Provable, and attached to you" },
    ],
  },
  {
    id: "rights",
    tool: "signature",
    ink: "#A9C8FF",
    glow: "#E4EEFF",
    label: "Rights",
    kicker: "Rights",
    title: "Own it outright",
    lead: "Not just a licence. Buy a work in full and stand as its credited creator.",
    rows: [
      { index: "01", name: "Agree", note: "Price and terms" },
      { index: "02", name: "Sign", note: "Assignment contract, both signatures" },
      { index: "03", name: "Escrow", note: "Funds held until files land" },
      { index: "04", name: "Paid", note: "Artist paid, buyer gets the signed deed" },
    ],
  },
  {
    id: "close",
    tool: "finale",
    ink: "#F2ECE0",
    glow: "#9B7CFF",
    label: "Contact",
    kicker: "Atelier",
    title: "The studio is opening",
    lead: "Artists, buyers and venues in one room. We're building it now.",
    mail: "hello@atelier.studio",
  },
];
