# AGENTS.md

## Run

```bash
npx serve .
# open http://localhost:3000
```

No build step, no bundler, no dependencies. Open `index.html` directly or serve the root.

## Architecture

- Single-file game: all logic in `game.js` (ES6+, `'use strict'`)
- HTML5 Canvas 2D, 800x600 fixed resolution
- Toroidal wrapping (edges wrap via `wrap()` util)
- Game loop: `requestAnimationFrame` with delta-time capped at 50ms
- Classes: `Ship`, `Bullet`, `Asteroid`, `Particle` — all in `game.js`
- State machine: `'playing' | 'dead' | 'gameover'`

## Conventions

- No tests, no linter, no type checker — verify changes by running the game in a browser
- Spanish UI text (HUD, overlays)
- Collision detection is circle-based (`dist()` + radius)
- Asteroid sizes: 1=small, 2=medium, 3=large; split into two smaller on hit
