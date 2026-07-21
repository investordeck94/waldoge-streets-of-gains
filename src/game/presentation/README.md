# Presentation (`@/game/presentation`)

The rendering layer. Today this is a single React component driving a 2D
canvas; tomorrow it may also be a `@react-three/fiber` scene, a Three.js
scene, or a Babylon.js scene. Multiple renderers may coexist behind a
feature flag.

## Rules

1. **May import from `@/game/engine` and `@/game/logic`.**
2. **MUST NOT own gameplay logic.** Damage numbers, AI decisions,
   progression, save/load, and physics live in Logic and Engine. This
   layer only *displays* the world and forwards input.
3. **May own frame-loop plumbing** (requestAnimationFrame, DPR handling,
   canvas resizing) and React lifecycle glue.
4. **Audio and particles are Presentation concerns.** They subscribe to
   events emitted by the Logic layer.

## Current layout

- `src/components/StreetBrawler.tsx` — the live 2D renderer + the current
  authoritative game loop. It is being incrementally slimmed as Logic
  systems are extracted, but the rAF loop stays here until we have a
  compelling reason to move it (per the phased plan, we do not).

## Planned layout (future phases)

```text
src/game/presentation/
  render2d/    — canvas draw functions (drawStickFigure, drawBoss, ...)
  render3d/    — @react-three/fiber scene mirroring the same actor types
  loop/        — the shared rAF driver (once safely extractable)
```

Both `render2d/` and `render3d/` will consume the same `Actor`,
`Projectile`, `PowerUp`, and `Platform` types from `@/game/engine`. The
Logic layer will not change when the renderer changes.

## Renderer-swap readiness

See `docs/3D_MIGRATION_AUDIT.md` for the current audit and next steps.
