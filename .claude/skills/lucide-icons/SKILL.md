---
name: lucide-icons
description: Find and insert Lucide icons, a consistent set of 2,100+ 24px stroke SVG icons, instead of hand-drawing SVG paths or using emoji. Use this whenever a UI needs an icon or symbol (tab bars, buttons, list rows, badges, empty states, banners, menus), when the user mentions ไอคอน, icon, symbol, สัญลักษณ์, replaces emoji with icons, or asks to make an interface look more consistent and professional.
---

# Lucide Icons

Lucide icons share one grid (24×24), one stroke style (round caps and joins, stroke `currentColor`) and one visual weight, so a screen built from them looks like one hand drew it. The icon data is bundled in `data/icons.json` (name, tags, categories, SVG inner elements, and old-name aliases), so lookup works offline with `python3 scripts/lucide.py`.

## Workflow

1. **Search by meaning, not by exact name.** `python3 scripts/lucide.py search trophy winner` ranks by name, tags and category. Try two or three synonyms before settling.
2. **Get the markup in the form you need.**
   - `show <name>` prints a complete `<svg>` (`--size`, `--stroke`, `--color`, `--class` options).
   - `paths <name>` prints only the inner elements, to paste inside your own `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ...>` wrapper.
   - `sprite <name...>` prints one hidden `<svg>` with a `<symbol id="i-name">` per icon. Put it once at the top of the page and reuse with `<svg class="ic"><use href="#i-house"/></svg>`. This suits a page that repeats icons.
3. **Inline it.** In sandboxed pages (Artifacts, PDFs rendered locally) external icon CDNs and image requests are blocked, so inline SVG or a sprite is the reliable choice.
4. **Style through CSS, not per icon.** One rule such as `.ic{width:22px;height:22px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}` keeps weight uniform, and `currentColor` makes icons follow light and dark themes for free.

## Rules worth keeping

- Pick one stroke width for the whole product (1.75 to 2 is typical) and one size per context (20 to 24 in lists and tab bars, 16 in chips, 28 or more in feature tiles).
- An icon-only button needs an accessible name (`aria-label`), and decorative icons next to text get `aria-hidden="true"`.
- Do not rely on an icon alone for status or meaning. Pair it with a label.
- Use one icon per concept across the app, for example always `users` for team and always `target` for goals.
- Lucide has no brand logos. For a company or product logo, use the real asset.
- Old names still resolve through aliases (`home` finds `house`), but write the current name in new code.

## Starting points for an agency-management app

| Concept | Icon |
|---|---|
| Home or overview | `house` |
| Follow-up tasks | `list-checks` |
| Customers or team | `users` |
| Growth or performance | `trending-up` |
| Campaign | `flag` |
| Goal or target | `target` |
| Learning | `graduation-cap`, `book-open-check` |
| Knowledge or tips | `lightbulb` |
| Event or meeting | `calendar` |
| Competition or reward | `trophy`, `award` |
| Quality or compliance | `shield-check` |
| Call a customer | `phone` |
| Notifications | `bell` |
| Add or new | `plus` |

## Commands

```
python3 scripts/lucide.py search <words...> [-n 15]
python3 scripts/lucide.py show house --size 24 --stroke 1.8
python3 scripts/lucide.py paths target
python3 scripts/lucide.py sprite house users flag --stroke 1.8
python3 scripts/lucide.py categories
python3 scripts/lucide.py category finance
```

## Source and license

Built from the Lucide repository (`icons/*.svg` and `icons/*.json`), ISC licensed. See `LICENSE-lucide`.
