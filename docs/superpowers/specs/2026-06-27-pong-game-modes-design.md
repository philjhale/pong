# Pong Game Modes Design

**Date:** 2026-06-27

## Overview

Add a mode selection menu and a new Two Ball game mode to the existing Pong game. The system must be extensible so future modes with varied rules can be added without modifying core game logic.

## Modes

### Classic
Current game behavior, unchanged. One ball, speed increases with rally hits, first to 7 wins.

### Two Ball
Two balls on screen simultaneously. No speed progression — balls maintain constant speed throughout. When either ball exits the screen a point is scored and both balls reset to center. One ball launches left, one launches right on each reset.

## Mode Config System

All modes are defined as config objects in `src/modes.js`. Each config carries data params and optional behavior hooks.

**Data params:**
- `id` — unique string key
- `label` — display name shown in menu
- `ballCount` — number of balls to spawn
- `speedProgression` — whether rally hits increase ball speed

**Optional behavior hooks** (omit to use default game behavior):
- `onScore(game, side, ball)` — called when a ball exits; default resets that ball
- `onBallUpdate(ball, tick)` — called per ball per frame
- `onBallDraw(ball, ctx)` — called when rendering each ball
- `onPaddleHit(ball, paddle)` — called after a paddle collision

New modes are added as new entries in `modes.js`. For behavior beyond what params cover, hooks handle it — no changes to `game.js` required.

## Game State & Menu Flow

```
START → MENU → PLAYING → WINNER → MENU
```

- **START:** existing splash screen, Enter advances to MENU
- **MENU:** mode selection list, Up/Down to navigate, Enter to start
- **PLAYING → WINNER:** unchanged
- **WINNER → MENU:** Enter returns to menu (not START), so players can switch modes between matches

Selected mode index persists across matches so the last-played mode stays highlighted.

## Menu UI

A centered list of mode labels. The selected entry is visually highlighted. A prompt at the bottom indicates Enter to start.

## Extensibility

Future modes with varied rules (e.g. ghost ball, chaos spawns) add a config entry with the appropriate hooks. Core `Game` logic remains generic. Hooks that need a time reference can use `tick` (frame counter incremented each update).
