# Atelier — landing page

Six full-screen chapters driven by wheel, swipe and keys. Each transition is
performed by a different artist tool, drawn on canvas.

| chapter | tool | gesture |
| --- | --- | --- |
| Atelier | loaded brush | strokes sweep across, staggered, painting on |
| Works | musical notation | a stave draws in, notes land, then burst and scatter |
| Stage | plucked strings | strings pull taut, release, decay under light shafts |
| People | pencil hatching | nodes connect, cross-hatch clusters grow at each |
| Rights | calligraphy nib | a signature writes itself, a wax seal stamps |
| Contact | all three | brush, notes and hatching converge |

A brush stroke is drawn as many individual bristles offset across a shared
spine, each with its own dryness, wobble and ink gaps, so it breaks up the way
a real dry brush does. The nib uses the calligraphy model — width follows the
angle between stroke direction and pen angle — so downstrokes are thick and
cross-strokes hairline.

Canvas 2D only. No WebGL, no 3D dependency.

## Running it

```
npm install
npm run dev
```

## Notes

Thickness scales off the short viewport side and the artwork is confined to a
top band in portrait, so the mobile-first layout holds. A scrim painted behind
the text column guarantees contrast whatever the artwork is doing. A frame-time
watchdog drops resolution and detail once, on sustained slow frames.

`prefers-reduced-motion` falls back to a plain scrolling document, as does a
browser without a 2D canvas context.
