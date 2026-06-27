# Retro Pong — Design Document

## Overview

Two-player browser Pong with an old-school retro aesthetic. No AI opponent — both players share a keyboard. First to 7 points wins.

---

## Visual Style

| Element | Detail |
|---|---|
| Background | Dark navy `#0d0d2b` |
| Paddles & ball | White `#ffffff` |
| Center divider | Yellow dashed line `#ffd700` |
| Font | Press Start 2P (Google Fonts) — pixel-style |
| Canvas | Fixed 800 × 600 px, centered on a black page |

Paddles have slightly rounded corners. The center line is a vertical dashed yellow stripe, mimicking classic arcade Pong cabinets.

---

## Controls

| Player | Paddle | Move Up | Move Down |
|---|---|---|---|
| Player 1 | Left | `W` | `S` |
| Player 2 | Right | `↑` | `↓` |

Both players hold keys to move. No mouse support.

---

## Game States

```
START ──(Enter)──► PLAYING ──(score reaches 7)──► WINNER ──(Enter)──► PLAYING
```

### Start Screen
- Title: **RETRO PONG**
- Prompt: *PRESS ENTER TO START*
- Controls reminder shown for each player

### Playing
- Live gameplay — ball, paddles, scores all active

### Winner Screen
- Displays: *PLAYER X WINS!*
- Prompt: *PRESS ENTER TO PLAY AGAIN*
- Pressing Enter resets all scores and entities, returns to Playing

---

## Ball Mechanics

**Spawn:** Ball starts at canvas center, launched toward the player who just lost the point (or Player 2 on game start). Launch angle is slightly randomised (±22.5°) to keep rallies unpredictable.

**Wall bounce:** Ball bounces off top and bottom walls. Left and right edges are scoring zones — no wall there.

**Speed escalation:** Each time the ball hits a paddle, its speed increases by 0.3 px/frame. Speed is capped at 14 px/frame to prevent tunnelling. Rally counter resets when a point is scored.

| Property | Value |
|---|---|
| Starting speed | 4 px/frame |
| Speed increase per hit | +0.3 px/frame |
| Max speed | 14 px/frame |
| Ball radius | 8 px |

**Paddle deflection:** Where the ball strikes the paddle affects its vertical exit angle. A hit near the paddle's edge produces a steeper angle; a hit near the centre produces a flatter one.

---

## Scoring

- Ball exits left edge → Player 2 scores
- Ball exits right edge → Player 1 scores
- First to **7 points** wins
- Scores displayed in pixel font at top of canvas, one per side

---

## Sound

| Event | Sound |
|---|---|
| Ball hits paddle | `ping-pong-hit.mp3` |
| Point scored | `pwlpl-applause-sound-effect-521104.mp3` |

Audio uses the browser `<audio>` API. `currentTime` is reset to 0 before each play so rapid events don't get swallowed.

---

## Paddle Specs

| Property | Value |
|---|---|
| Width | 12 px |
| Height | 80 px |
| Corner radius | 4 px |
| Speed | 5 px/frame |
| Left paddle x | 20 px from left edge |
| Right paddle x | 20 px from right edge |

Paddles clamp at the top and bottom canvas edges and cannot leave the play area.
