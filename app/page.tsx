"use client";

import { useEffect } from "react";
import { CHAPTERS } from "../lib/chapters";
import { startMotion } from "../lib/motion";

const pad = (value: number) => String(value).padStart(2, "0");

export default function Page() {
  useEffect(() => startMotion(), []);

  return (
    <>
      <canvas className="studio" aria-hidden="true" />
      <div className="veil" aria-hidden="true" />

      <header className="hud">
        <button className="logo" data-go="0">
          Atelier
        </button>
        <span className="hud__tag">Early access</span>
      </header>

      <nav className="spine" aria-label="Chapters">
        {CHAPTERS.map((chapter, index) => (
          <button
            key={chapter.id}
            className={index === 0 ? "spine__tick is-on" : "spine__tick"}
            data-go={index}
            aria-label={chapter.label}
          />
        ))}
      </nav>

      <p className="marker" aria-hidden="true">
        <i data-marker-index>01</i> / {pad(CHAPTERS.length)} · <span data-marker-label>{CHAPTERS[0].label}</span>
      </p>

      <main className="screens">
        {CHAPTERS.map((chapter, index) => (
          <section
            key={chapter.id}
            className={index === 0 ? "screen is-active" : "screen"}
            data-screen={chapter.id}
          >
            <div className="safe">
              <p className="kicker" data-kick>
                {chapter.kicker}
              </p>
              {index === 0 ? (
                <h1 className="title" data-title>
                  {chapter.title}
                </h1>
              ) : (
                <h2 className="title" data-title>
                  {chapter.title}
                </h2>
              )}
              <p className="lead" data-lead>
                {chapter.lead}
              </p>

              {chapter.prompt && (
                <p className="prompt" data-lead>
                  {chapter.prompt} <b>↓</b>
                </p>
              )}

              {chapter.rows && (
                <ul className="index" data-panel>
                  {chapter.rows.map((row) => (
                    <li key={row.index}>
                      <i>{row.index}</i>
                      <b>{row.name}</b>
                      <span>{row.note}</span>
                    </li>
                  ))}
                </ul>
              )}

              {chapter.mail && (
                <p data-panel>
                  <a className="mail" href={`mailto:${chapter.mail}`}>
                    {chapter.mail}
                  </a>
                </p>
              )}
            </div>
          </section>
        ))}
      </main>
    </>
  );
}
