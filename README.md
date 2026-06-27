# Retro Pong

Two-player Pong in the browser. First to 7 points wins.

## How to Play

Press **Enter** on the start screen to go to the mode select menu. Use **Up/Down** to choose a mode, then **Enter** to start.

| Player | Move Up | Move Down |
|--------|---------|-----------|
| Left   | W       | S         |
| Right  | Arrow Up | Arrow Down |

Score a point by getting the ball past your opponent's paddle. First to **7 points** wins. Press **Enter** after a winner is declared to return to mode select.

## Game Modes

| Mode | Description |
|------|-------------|
| **Classic** | One ball. Ball speeds up with each paddle hit (max 14 px/frame). |
| **Two Ball** | Two balls in play simultaneously. Constant speed — no escalation. |

## Running Locally

```bash
npx serve . -l 8080
```

Then open [http://localhost:8080](http://localhost:8080).

## Running Tests

```bash
npm test
```
