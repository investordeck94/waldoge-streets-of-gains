

# Plan: Add WALDOGE Mascot Image & Fix Build Errors

## Summary

This plan addresses two things:
1. **Fix build errors** that are preventing the app from working
2. **Add the custom WALDOGE mascot illustration** as the hero image

---

## What's Breaking Right Now

### Issue 1: Missing `framer-motion` Package
The code uses animations from `framer-motion` but this package isn't installed. It's used in 6 components:
- Index.tsx (page transitions)
- LandingPage.tsx (hero animations)
- Header.tsx (logo and tab animations)
- ChatTab.tsx (message bubbles)
- RaidTab.tsx (generated content)
- MemeTab.tsx (results list)
- NFTTab.tsx (minting states)

### Issue 2: CSS Import Order
The Google Fonts `@import` statement is placed after Tailwind directives, but CSS requires `@import` to come first.

---

## The Fix

### Step 1: Install framer-motion
Add `framer-motion` to the project dependencies.

### Step 2: Fix CSS Import Order
Move the Google Fonts import to the top of the CSS file, before the Tailwind directives.

### Step 3: Add the WALDOGE Mascot Image
Copy your uploaded mascot illustration to the project and use it in:

1. **Landing Page Hero** - Replace the emoji placeholder with the actual mascot image
2. **Chat Empty State** - Show the mascot when starting a new conversation  
3. **Header Logo** - Small mascot icon next to "WALDOGE AI"

The mascot will have a subtle floating animation to match the cosmic theme.

---

## Files to Change

| File | Change |
|------|--------|
| `package.json` | Add framer-motion dependency |
| `src/index.css` | Move @import to top of file |
| `src/assets/waldoge-mascot.png` | Add the mascot image |
| `src/components/LandingPage.tsx` | Replace emoji with mascot image |
| `src/components/ChatTab.tsx` | Use mascot in empty state |
| `src/components/Header.tsx` | Small mascot in logo area |

---

## Technical Details

```text
Before (broken CSS):
+---------------------------+
| @tailwind base;           |
| @tailwind components;     |
| @tailwind utilities;      |
| @import url(...fonts...); | <-- Error here
+---------------------------+

After (fixed CSS):
+---------------------------+
| @import url(...fonts...); | <-- Moved to top
| @tailwind base;           |
| @tailwind components;     |
| @tailwind utilities;      |
+---------------------------+
```

The mascot image will be imported as an ES6 module from `src/assets/` for proper bundling and optimization. The floating animation will use the existing `float` keyframe animation already defined in your CSS.

