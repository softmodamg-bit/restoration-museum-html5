# AGENTS.md

## Required preflight

Before modifying any code in this repository, read `ARCHITECTURE.md` from beginning to end and follow its architecture rules and change checklist.

## Project mission

Build a bright, casual, touch-friendly HTML5 game in which players restore artworks with material-appropriate methods and grow a small museum.
The playable loop is: choose artwork → inspect/test → restore → document → exhibit → earn visitors and income → upgrade.

## Repository map

- `index.html`: app structure and screens
- `styles.css`: all visual design and responsive rules
- `js/game.js`: content data, state, restoration interactions, museum management, SVG artwork rendering
- `docs/GAME_DESIGN.md`: product and content direction
- `docs/CODEX_BRIEF.md`: staged implementation roadmap
- `docs/QA_REPORT.md`: last verified test state

## Required commands

Run before reporting completion:

```bash
node --check js/game.js
python -m http.server 8080
```

Then test the game in a browser at desktop and mobile widths.

## Non-negotiable behavior

- Keep the project deployable as static files.
- Preserve mouse and touch pointer-event support.
- Preserve localStorage save compatibility. If the save shape changes, add migration logic.
- Do not add a production dependency without explaining why a native solution is insufficient.
- Do not expose real-world chemical recipes, concentrations, or hazardous restoration instructions.
- Keep the conservation theme centered on inspection, testing, stabilization, minimal intervention, and documentation.
- Do not make every artwork use an identical mechanic when adding major content; prioritize material-specific interactions.

## Visual direction

- Rounded silhouettes, soft gradients, large highlights, warm drop shadows, toy-like 2.5D volume.
- Palette: cream, coral, peach, mint, sky blue, soft gold.
- Avoid dark horror-like storage rooms, photorealistic grime, tiny dense text, or flat unshaded icons.
- Maintain readable contrast and `prefers-reduced-motion` support.

## Code expectations

- Use descriptive names and small functions.
- Escape or control any future user-generated text before injecting it into HTML.
- Keep content data separate from interaction logic when refactoring.
- Avoid per-frame loops when event-driven pointer interactions are sufficient.
- No silent failures: surface save or content errors in development logs.

## Completion report

After each task, report:

1. What changed
2. Files changed
3. Tests actually run and results
4. Known limitations
5. One highest-value next step
