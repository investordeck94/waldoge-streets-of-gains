# Phase 10 Proposal — AABB Helper Adoption (Audit Only)

Status: **PROPOSAL. No source files modified.**

Scope: assess adoption of `aabbOverlap`, `horizontalDistance`,
`withinHorizontalRange` (`src/game/core/aabb.ts`) in `src/components/StreetBrawler.tsx`.

---

## 1. Coordinate-convention mismatch (governing finding)

`src/game/core/aabb.ts` operates on `AABB { x, y, width, height }` where `x`/`y`
are the **top-left corner**:

```ts
horizontalDistance(a, b) = |(a.x + a.width/2) - (b.x + b.width/2)|
withinHorizontalRange(a, b, r) = horizontalDistance(a, b) <= r
aabbOverlap(a, b) = a.x < b.x+b.width && a.x+a.width > b.x && (same on y)
```

`StreetBrawler.tsx` runtime actors (`p`, `e`, `obj`, `proj`, `pu`, `wp`) store
**`x` = horizontal centre, `y` = feet/ground line**, and carry **no `width` /
`height` fields at all** on the runtime objects used by the checks below.

Consequences that apply to every call site:

- Feeding a runtime actor to a helper requires constructing an adapter object
  (`{ x: a.x - w/2, y: ..., width: w, height: h }`) — that is a **per-frame
  allocation** inside the hot loop, violating the standing zero-allocation
  guarantee.
- Widths/heights do not exist; they would have to be **invented**, which is a
  behaviour change, not a refactor.
- Every runtime range test uses **strict `<`**; `withinHorizontalRange` uses
  **`<=`**. Boundary-equal cases (`|dx| === range`) flip from *miss* to *hit*.
- Runtime checks are **radius/band** tests (independent `|dx| < R` and
  `|dy| < R2` with *different* thresholds), not rectangle-overlap tests.
  `aabbOverlap` is a conjunction over two intervals derived from a single
  box — mathematically a different predicate.

---

## 2. Complete call-site inventory

All locations are `src/components/StreetBrawler.tsx`. Line numbers as of this audit.

| # | Lines | Existing open-coded logic | Candidate helper | Verdict |
|---|-------|---------------------------|------------------|---------|
| 1 | 3622–3626 | player melee vs enemy: `dx = e.x - p.x`; groundpound: `Math.abs(dx) < range && Math.abs(e.y - p.y) < 60`; else `dx * p.facing > 0 && Math.abs(dx) < range && Math.abs(e.y-p.y) < 50` | `withinHorizontalRange` | **DO NOT SWAP** |
| 2 | 3741–3745 | player melee vs breakable object, same shape, `objRange`, y-bands 60/50 | `withinHorizontalRange` | **DO NOT SWAP** |
| 3 | 3806–3807 | enemy AI approach: `dx = p.x - e.x; dist = Math.abs(dx)` then several `dist < N` branches | `horizontalDistance` | **DO NOT SWAP** |
| 4 | 3871–3874 | enemy attack test: `edx * e.facing > 0 && Math.abs(edx) < range && Math.abs(p.y-e.y) < 60/70` | `withinHorizontalRange` | **DO NOT SWAP** |
| 5 | 3915–3916 | boss AI distance: `dist = Math.abs(p.x - e.x)` driving phase/state selection | `horizontalDistance` | **DO NOT SWAP** |
| 6 | 3934–3935 | boss attack test: `edx * e.facing > 0 && Math.abs(edx) < range && Math.abs(p.y-e.y) < 50` | `withinHorizontalRange` | **DO NOT SWAP** |
| 7 | 3968–3970 | shuriken vs enemy: `edx < 40 && edy <= 50` (note the **mixed** `<` / `<=`) | `aabbOverlap` | **DO NOT SWAP** |
| 8 | 3999–4001 | boss projectile vs player: `dx < 25 && dy < 35` | `aabbOverlap` | **DO NOT SWAP** |
| 9 | 4045–4047 | power-up pickup: `dx < 30 && dy < 40` | `aabbOverlap` | **DO NOT SWAP** |
| 10 | 4089–4091 | weapon pickup: `dx < 35 && dy < 40` | `aabbOverlap` | **DO NOT SWAP** |
| 11 | 3527 / 3545 | platform landing/leave: `p.x + halfW > plat.x && p.x - halfW < plat.x + plat.w` (and its negation with `<=` / `>=`) | `aabbOverlap` (x axis) | **REQUIRES REVIEW** |

### Per-site analysis (applies uniformly to sites 1–10)

- **Boundary conditions.** Runtime uses strict `<` everywhere except site 7's
  `edy <= 50`. `withinHorizontalRange` is `<=`. Adoption changes the exact-equal
  frame from miss to hit. Because positions are floats produced by integrating
  gravity/velocity, exact equality is rare but **reachable** (integer spawn
  offsets, clamped ground values, stationary actors on `GROUND_Y`). Parity
  therefore cannot be *proven*, only estimated — failing the standing
  strict-parity requirement.
- **Evaluation order / short-circuit.** Sites 1, 2, 4, 6 evaluate the cheap
  facing test `dx * facing > 0` **first**, short-circuiting the `Math.abs`
  work. Any helper call evaluates its arguments eagerly and would either
  reorder the conjunction or duplicate the delta computation.
- **Allocations.** Every helper takes `AABB` objects. Runtime actors are not
  AABBs, so each of these hot-loop sites (executed per enemy, per projectile,
  per pickup, per frame) would allocate one or two adapter literals. This is a
  direct regression against the Phase 3/4 zero-allocation guarantee.
- **Gameplay/collision.** Any of the above shifts hit windows — melee reach,
  projectile hits, pickup radii — i.e. real combat behaviour.
- **Rendering / camera / execution order.** No rendering or camera code is in
  scope; no draw site or `camX` computation is touched by these helpers.
  Execution order would change only via the short-circuit issue above.
- **Strictly parity-safe?** No, for all of sites 1–10.

### Site 11 detail (the only genuine edge-based test)

`p.x + halfW > plat.x && p.x - halfW < plat.x + plat.w` is exactly the x-axis
half of `aabbOverlap` with non-touching semantics, so the x comparison operators
match (`<` / `>`). It is nonetheless classified **REQUIRES REVIEW** because:

- `aabbOverlap` also tests the y interval; platforms use a separate
  `prevY`-crossing test (from Phase 4) rather than a y overlap. Using
  `aabbOverlap` would require synthesising a y interval and would change
  jump-through behaviour.
- The paired "leave" test at 3545 uses `<=` / `>=` (the strict negation), which
  a single helper call cannot express without inverting the returned boolean —
  a readability change with no architectural gain.
- Adapter objects would allocate inside the per-platform loop.

---

## 3. Classification summary

- **SAFE TO SWAP:** none.
- **REQUIRES REVIEW:** site 11 (platform x-overlap), only if an allocation-free,
  1D, edge-based helper exists.
- **DO NOT SWAP:** sites 1–10.

---

## 4. Recommended Phase 10 implementation scope

**Zero source changes.** Recommended scope:

1. Record the deferral and the coordinate-convention gap in
   `docs/3D_MIGRATION_AUDIT.md` (mirroring the Phase 9 `computeCameraX` entry).
2. Note the unblock criteria for a future phase:
   - centre-origin, scalar helpers that take numbers rather than `AABB`
     objects (e.g. `withinRadius(ax, bx, r)` with strict `<`), so no adapter
     objects are allocated; **and**
   - an explicit decision on `<` vs `<=` boundary semantics; **and**
   - runtime actors gaining authoritative `width`/`height` (the natural moment
     is the Phase 10+ `gameRef` decomposition), at which point true
     `aabbOverlap` adoption becomes provable.
3. Recommended next deterministic extraction instead: **enemy/boss AI
   distance-and-phase selection tables** (pure data) or **combo multiplier
   math** (`1 + Math.min(hitCount * 0.15, 2)`, repeated at 4 sites, pure,
   allocation-free, boundary-identical) — the latter is the only strictly
   parity-provable candidate currently visible.
