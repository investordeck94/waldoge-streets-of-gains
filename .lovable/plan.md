

## Problem: Canvas rendering bug from double DPR scaling

The canvas context gets `ctx.scale(dpr, dpr)` applied **twice**:
1. First in the mount initialization effect (line 1089)
2. Again when the game loop starts (line 1130)

Since `canvas.width` is reset at line 1124 (which clears the context transform), the second `scale` call actually resets and re-applies correctly. However, there's a subtler issue: **`getContext("2d")` returns the same context object** — but setting `canvas.width` resets the transform matrix, so the second `scale` is fine.

The real value of the user's diagnostic pattern is as a **minimal test to confirm the canvas draws anything at all**. Here's the plan:

### Changes to `src/components/StreetBrawler.tsx`

1. **Add a diagnostic test draw in the mount effect** (lines 1078-1093): After the DPR setup, draw a visible red rectangle as a sanity check that the canvas context is working. This confirms rendering before the game loop starts.

2. **Ensure `clearRect` uses correct dimensions**: The current `clearRect(0, 0, CANVAS_W, CANVAS_H)` at line 1786 is correct with DPR scaling (since `ctx.scale` maps logical to physical), so no change needed there.

3. **Simplify the dual-initialization**: Remove the redundant DPR setup from the mount effect (lines 1078-1093) since the game loop effect (line 1115) already does the full setup. The mount effect was only drawing a dark background that gets immediately overwritten. This eliminates the double-init pattern entirely.

### Summary
- Remove the mount-only canvas init effect (lines 1078-1093) — it's redundant
- The game loop effect already handles full DPR setup + rendering
- Optionally add a brief diagnostic fill (red rect) at the start of the game loop to verify rendering, removable once confirmed

