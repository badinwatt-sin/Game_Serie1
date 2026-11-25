---
name: radix-colors
description: Pick, adjust, audit and generate accessible UI color palettes with the Radix Colors 12-step scales (light, dark and alpha variants). Use this whenever the user wants to change, tune, fix or review colors, themes, dark mode, contrast, backgrounds, borders, text colors or status colors (success, warning, error), or mentions สี, โทนสี, ปรับสี, ธีม, dark mode, contrast, even when they never say "Radix".
---

# Radix Colors

Radix Colors is a color system where every scale has 12 steps, and each step has a fixed job. Because the jobs are fixed, you can swap a hue without re-checking contrast from scratch, and dark mode comes from a hand-tuned dark scale, not from inverting the light one.

The data is bundled in `data/colors.json` (light, `<name>Dark`, alpha `<name>A`, display-p3 `<name>P3`, plus `blackA` and `whiteA`). Everything runs offline with `python3 scripts/radix.py`.

## What each step is for

| Step | Use |
|---|---|
| 1 | App background |
| 2 | Subtle background (cards, sidebars) |
| 3 | UI element background (resting) |
| 4 | UI element background (hover) |
| 5 | UI element background (active or selected) |
| 6 | Subtle borders and separators |
| 7 | UI element border, focus rings |
| 8 | Hovered UI element border |
| 9 | Solid background (buttons, badges, the "pure" hue) |
| 10 | Hovered solid background |
| 11 | Low-contrast text |
| 12 | High-contrast text |

Text on step 9 is white for most hues. The bright scales (`sky`, `mint`, `lime`, `yellow`, `amber`) need dark text on step 9 instead.

## Workflow

1. **Name the roles first.** Brand/accent, neutral, and the semantic colors (success, warning, danger, info). Pick one scale per role.
2. **Match an existing color.** `python3 scripts/radix.py nearest '#3558EE'` lists the closest Radix steps. Use it when a brand color already exists, then decide whether to adopt the Radix step or keep the brand color as step 9 and derive the rest from the closest scale.
3. **Pair a tinted gray with the accent.** Radix pairs `slate` with iris, indigo, blue, sky and cyan; `mauve` with tomato through violet; `sage` with teal, jade, mint and green; `olive` with grass and lime; `sand` with yellow, amber, orange and brown. A tinted neutral keeps surfaces from looking dull next to a saturated accent.
4. **Emit tokens.** `python3 scripts/radix.py css indigo slate red green amber` prints CSS custom properties (`--indigo-1` … `--indigo-12`). Default output follows the Artifact theme contract: light on `:root`, dark under `prefers-color-scheme` guarded by `:root:not([data-theme="light"])`, and again under `:root[data-theme="dark"]`. Add `--simple` for `.light` and `.dark` classes instead.
5. **Alias roles, not hues.** In the page, define `--accent: var(--indigo-9)`, `--text: var(--slate-12)` and so on, and style components with the role tokens. Changing the brand later then edits one line.
6. **Check contrast.** `python3 scripts/radix.py audit indigo` tests the standard pairs in light and dark. `python3 scripts/radix.py contrast '#ffffff' '#00008F'` tests any pair. Normal text needs 4.5:1, large text and UI parts 3:1.

## Rules worth keeping

- Do not use a hue's step 9 for body text. Use step 11 or 12.
- Use step 6 to 8 for borders, not step 9. A solid-colored border reads as shouting.
- Selected or active state: step 5 background, step 11 text.
- Do not fake dark mode with `filter: invert()` or by reversing step numbers. Use the `Dark` scales.
- Status color alone must not carry meaning: pair it with an icon or a word.
- Alpha scales (`blueA3`) are for overlays on unknown backgrounds. On a known surface, prefer the solid step.

## Commands

```
python3 scripts/radix.py list
python3 scripts/radix.py show indigo            # add --dark for the dark scale
python3 scripts/radix.py css indigo slate       # add --simple for class-based output
python3 scripts/radix.py contrast '#fff' '#00008F'
python3 scripts/radix.py nearest '#3558EE'
python3 scripts/radix.py audit indigo
```

`show blueP3` prints the display-p3 version of a scale; dark p3 is `blueDarkP3`.

## Source and license

Extracted from the Radix Colors repository (`src/light.ts`, `src/dark.ts`, `src/blackA.ts`, `src/whiteA.ts`), MIT licensed. See `LICENSE-radix-colors`.
