# Pong Game Modes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a mode-selection menu and a Two Ball game mode, with a config+hook architecture that lets future modes be added without touching core game logic.

**Architecture:** Mode configs are plain objects in `src/modes.js` (data params + optional hooks). `Game` replaces `this.ball` with `this.balls[]`, adds a `MENU` state between `START` and `PLAYING`, and delegates per-ball and per-score behaviour to the active mode's hooks. `renderer.js` gains `drawMenuScreen`.

**Tech Stack:** Vanilla JS (ES modules), Canvas 2D API, Vitest + jsdom

## Global Constraints

- Win condition for all modes: first to 7 (`WINNING_SCORE` constant, already defined in `src/constants.js`)
- No new runtime dependencies
- All existing tests must stay green after each task

---

### Task 1: Create `src/modes.js` and tests

**Files:**
- Create: `src/modes.js`
- Create: `tests/modes.test.js`

**Interfaces:**
- Produces: `MODES` (ordered array of mode config objects), `DEFAULT_MODE` (= `MODES[0]`)
- Mode config shape: `{ id: string, label: string, ballCount: number, speedProgression: boolean, onScore?(game, side, ball): void, onBallUpdate?(ball, tick): void, onBallDraw?(ball, ctx): void, onPaddleHit?(ball): void }`
- All hook fields are optional — omit to use default game behaviour

- [ ] **Step 1: Write `tests/modes.test.js`**

```js
import { describe, it, expect, vi } from 'vitest';
import { MODES, DEFAULT_MODE } from '../src/modes.js';

describe('MODES', () => {
  it('exports at least two modes', () => {
    expect(MODES.length).toBeGreaterThanOrEqual(2);
  });

  it('every mode has required fields with correct types', () => {
    for (const mode of MODES) {
      expect(typeof mode.id).toBe('string');
      expect(typeof mode.label).toBe('string');
      expect(typeof mode.ballCount).toBe('number');
      expect(mode.ballCount).toBeGreaterThanOrEqual(1);
      expect(typeof mode.speedProgression).toBe('boolean');
    }
  });

  it('CLASSIC has ballCount 1 and speedProgression true', () => {
    const m = MODES.find(m => m.id === 'CLASSIC');
    expect(m.ballCount).toBe(1);
    expect(m.speedProgression).toBe(true);
  });

  it('TWO_BALL has ballCount 2 and speedProgression false', () => {
    const m = MODES.find(m => m.id === 'TWO_BALL');
    expect(m.ballCount).toBe(2);
    expect(m.speedProgression).toBe(false);
  });

  it('TWO_BALL has onScore hook', () => {
    const m = MODES.find(m => m.id === 'TWO_BALL');
    expect(typeof m.onScore).toBe('function');
  });

  it('DEFAULT_MODE is CLASSIC', () => {
    expect(DEFAULT_MODE.id).toBe('CLASSIC');
  });
});

describe('TWO_BALL onScore hook', () => {
  it('resets all balls', () => {
    const twoBall = MODES.find(m => m.id === 'TWO_BALL');
    const ball0 = { reset: vi.fn() };
    const ball1 = { reset: vi.fn() };
    twoBall.onScore({ balls: [ball0, ball1] }, 'right', ball0);
    expect(ball0.reset).toHaveBeenCalled();
    expect(ball1.reset).toHaveBeenCalled();
  });

  it('resets ball 0 going right and ball 1 going left', () => {
    const twoBall = MODES.find(m => m.id === 'TWO_BALL');
    const ball0 = { reset: vi.fn() };
    const ball1 = { reset: vi.fn() };
    twoBall.onScore({ balls: [ball0, ball1] }, 'right', ball0);
    expect(ball0.reset).toHaveBeenCalledWith(1);
    expect(ball1.reset).toHaveBeenCalledWith(-1);
  });
});
```

- [ ] **Step 2: Run tests — verify they fail**

```bash
cd /Users/phil.hale/Code/pong && npx vitest run tests/modes.test.js
```

Expected: FAIL — `Cannot find module '../src/modes.js'`

- [ ] **Step 3: Implement `src/modes.js`**

```js
export const MODES = [
  {
    id: 'CLASSIC',
    label: 'Classic',
    ballCount: 1,
    speedProgression: true,
  },
  {
    id: 'TWO_BALL',
    label: 'Two Ball',
    ballCount: 2,
    speedProgression: false,
    onScore(game) {
      game.balls.forEach((ball, i) => ball.reset(i === 0 ? 1 : -1));
    },
  },
];

export const DEFAULT_MODE = MODES[0];
```

- [ ] **Step 4: Run modes tests — verify all pass**

```bash
npx vitest run tests/modes.test.js
```

Expected: all PASS

- [ ] **Step 5: Run full suite — verify no regressions**

```bash
npx vitest run
```

Expected: all existing tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/modes.js tests/modes.test.js
git commit -m "feat: add mode config system with Classic and Two Ball modes"
```

---

### Task 2: Refactor `game.js` — balls array, mode integration, MENU state and navigation

**Files:**
- Modify: `src/game.js`
- Modify: `src/renderer.js` (stub only — full impl in Task 3)
- Modify: `tests/game.test.js`

**Interfaces:**
- Consumes: `MODES` from `src/modes.js`; `drawMenuScreen` from `src/renderer.js`
- Produces:
  - `STATE` gains `MENU: 'MENU'`
  - `game.balls[]` replaces `game.ball`
  - `game.mode` — active mode config object
  - `game.selectedIndex` — index into `MODES`, persists across matches
  - `game.tick` — integer frame counter, increments each PLAYING frame
  - `game._handleScore(side: 'left'|'right', ball: Ball): void`
  - `game._beginGame()` — sets `this.mode` from `MODES[this.selectedIndex]` before resetting

- [ ] **Step 1: Add a stub for `drawMenuScreen` in `src/renderer.js`**

Append to the bottom of `src/renderer.js`:

```js
export function drawMenuScreen(_ctx, _modes, _selectedIndex) {}
```

This prevents an import error while the full implementation is pending (Task 3).

- [ ] **Step 2: Replace `tests/game.test.js` with the updated version**

All `game.ball` references become `game.balls[0]`. New tests cover `_handleScore`, MENU navigation, and state transitions.

```js
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Game, STATE } from '../src/game.js';
import { WINNING_SCORE } from '../src/constants.js';
import { MODES } from '../src/modes.js';
import { isDown } from '../src/input.js';

vi.mock('../src/input.js', () => ({ isDown: vi.fn().mockReturnValue(false) }));
vi.mock('../src/audio.js', () => ({
  HIT_POOL_SIZE: 4,
  AudioManager: vi.fn().mockImplementation(() => ({
    playHit: vi.fn(),
    playScore: vi.fn(),
  })),
}));

function mockCanvas() {
  const ctx = {
    fillStyle: '', strokeStyle: '', lineWidth: 0, font: '', textAlign: '',
    fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    stroke: vi.fn(), fillText: vi.fn(), save: vi.fn(), restore: vi.fn(),
    setLineDash: vi.fn(), arc: vi.fn(), fill: vi.fn(), roundRect: vi.fn(),
  };
  return { getContext: () => ctx };
}

describe('Game', () => {
  let game;

  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    isDown.mockReturnValue(false);
    game = new Game(mockCanvas());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts in START state', () => {
    expect(game.state).toBe(STATE.START);
  });

  it('initial scores are 0', () => {
    expect(game.scoreLeft).toBe(0);
    expect(game.scoreRight).toBe(0);
  });

  it('_beginGame transitions to PLAYING', () => {
    game._beginGame();
    expect(game.state).toBe(STATE.PLAYING);
  });

  it('_beginGame resets scores to 0', () => {
    game.scoreLeft = 5;
    game.scoreRight = 3;
    game._beginGame();
    expect(game.scoreLeft).toBe(0);
    expect(game.scoreRight).toBe(0);
  });

  it('_beginGame resets winner to null', () => {
    game.winner = 1;
    game._beginGame();
    expect(game.winner).toBeNull();
  });

  describe('in PLAYING state', () => {
    beforeEach(() => {
      game._beginGame();
      vi.spyOn(game.balls[0], 'update').mockImplementation(() => {});
      vi.spyOn(game.balls[0], 'collidePaddle').mockReturnValue(false);
    });

    it('right player scores when ball exits left', () => {
      vi.spyOn(game.balls[0], 'isOutLeft').mockReturnValue(true);
      vi.spyOn(game.balls[0], 'isOutRight').mockReturnValue(false);
      vi.spyOn(game.balls[0], 'reset').mockImplementation(() => {});
      game._update();
      expect(game.scoreRight).toBe(1);
    });

    it('left player scores when ball exits right', () => {
      vi.spyOn(game.balls[0], 'isOutLeft').mockReturnValue(false);
      vi.spyOn(game.balls[0], 'isOutRight').mockReturnValue(true);
      vi.spyOn(game.balls[0], 'reset').mockImplementation(() => {});
      game._update();
      expect(game.scoreLeft).toBe(1);
    });

    it('transitions to WINNER (player 2) when right reaches WINNING_SCORE', () => {
      game.scoreRight = WINNING_SCORE - 1;
      vi.spyOn(game.balls[0], 'isOutLeft').mockReturnValue(true);
      vi.spyOn(game.balls[0], 'isOutRight').mockReturnValue(false);
      const resetSpy = vi.spyOn(game.balls[0], 'reset');
      game._update();
      expect(game.state).toBe(STATE.WINNER);
      expect(game.winner).toBe(2);
      expect(resetSpy).not.toHaveBeenCalled();
    });

    it('transitions to WINNER (player 1) when left reaches WINNING_SCORE', () => {
      game.scoreLeft = WINNING_SCORE - 1;
      vi.spyOn(game.balls[0], 'isOutLeft').mockReturnValue(false);
      vi.spyOn(game.balls[0], 'isOutRight').mockReturnValue(true);
      const resetSpy = vi.spyOn(game.balls[0], 'reset');
      game._update();
      expect(game.state).toBe(STATE.WINNER);
      expect(game.winner).toBe(1);
      expect(resetSpy).not.toHaveBeenCalled();
    });
  });

  describe('_handleScore', () => {
    beforeEach(() => {
      game._beginGame();
    });

    it('increments scoreRight when side is right', () => {
      vi.spyOn(game.balls[0], 'reset').mockImplementation(() => {});
      game._handleScore('right', game.balls[0]);
      expect(game.scoreRight).toBe(1);
    });

    it('increments scoreLeft when side is left', () => {
      vi.spyOn(game.balls[0], 'reset').mockImplementation(() => {});
      game._handleScore('left', game.balls[0]);
      expect(game.scoreLeft).toBe(1);
    });

    it('resets ball leftward (-1) when right player scores in Classic', () => {
      const resetSpy = vi.spyOn(game.balls[0], 'reset').mockImplementation(() => {});
      game._handleScore('right', game.balls[0]);
      expect(resetSpy).toHaveBeenCalledWith(-1);
    });

    it('resets ball rightward (1) when left player scores in Classic', () => {
      const resetSpy = vi.spyOn(game.balls[0], 'reset').mockImplementation(() => {});
      game._handleScore('left', game.balls[0]);
      expect(resetSpy).toHaveBeenCalledWith(1);
    });

    it('sets WINNER state and winner=2 when right reaches WINNING_SCORE', () => {
      game.scoreRight = WINNING_SCORE - 1;
      game._handleScore('right', game.balls[0]);
      expect(game.state).toBe(STATE.WINNER);
      expect(game.winner).toBe(2);
    });

    it('sets WINNER state and winner=1 when left reaches WINNING_SCORE', () => {
      game.scoreLeft = WINNING_SCORE - 1;
      game._handleScore('left', game.balls[0]);
      expect(game.state).toBe(STATE.WINNER);
      expect(game.winner).toBe(1);
    });

    it('does not reset ball when WINNER is reached', () => {
      game.scoreRight = WINNING_SCORE - 1;
      const resetSpy = vi.spyOn(game.balls[0], 'reset');
      game._handleScore('right', game.balls[0]);
      expect(resetSpy).not.toHaveBeenCalled();
    });
  });

  describe('MENU state navigation', () => {
    beforeEach(() => {
      game.state = STATE.MENU;
      game.selectedIndex = 0;
      game.enterWasDown = false;
      game.upWasDown = false;
      game.downWasDown = false;
    });

    it('ArrowDown increments selectedIndex', () => {
      isDown.mockImplementation(key => key === 'ArrowDown');
      game._update();
      expect(game.selectedIndex).toBe(1);
    });

    it('ArrowDown wraps from last index back to 0', () => {
      game.selectedIndex = MODES.length - 1;
      isDown.mockImplementation(key => key === 'ArrowDown');
      game._update();
      expect(game.selectedIndex).toBe(0);
    });

    it('ArrowUp decrements selectedIndex with wrap to last', () => {
      game.selectedIndex = 0;
      isDown.mockImplementation(key => key === 'ArrowUp');
      game._update();
      expect(game.selectedIndex).toBe(MODES.length - 1);
    });

    it('Enter starts PLAYING with the selected mode', () => {
      game.selectedIndex = 1;
      isDown.mockImplementation(key => key === 'Enter');
      game._update();
      expect(game.state).toBe(STATE.PLAYING);
      expect(game.mode.id).toBe(MODES[1].id);
    });
  });

  it('Enter in START transitions to MENU', () => {
    game.state = STATE.START;
    game.enterWasDown = false;
    isDown.mockImplementation(key => key === 'Enter');
    game._update();
    expect(game.state).toBe(STATE.MENU);
  });

  it('Enter in WINNER transitions to MENU', () => {
    game.state = STATE.WINNER;
    game.winner = 1;
    game.enterWasDown = false;
    isDown.mockImplementation(key => key === 'Enter');
    game._update();
    expect(game.state).toBe(STATE.MENU);
  });

  it('stop() calls cancelAnimationFrame with the correct RAF id', () => {
    game.start();
    game.stop();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  });

  it('double start() does not spawn second loop', () => {
    game.start();
    game.start();
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it('stop() then start() re-enables the loop', () => {
    game.start();
    game.stop();
    game.start();
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 3: Run tests — verify new tests fail**

```bash
npx vitest run tests/game.test.js
```

Expected: FAIL — `game.balls` undefined, `STATE.MENU` undefined, MODES import errors

- [ ] **Step 4: Replace `src/game.js` with the updated implementation**

```js
import { CANVAS_W, PADDLE_MARGIN, PADDLE_W, WINNING_SCORE, BALL_INITIAL_SPEED } from './constants.js';
import { isDown } from './input.js';
import { Paddle } from './paddle.js';
import { Ball } from './ball.js';
import { AudioManager } from './audio.js';
import { MODES } from './modes.js';
import { drawBackground, drawCenterLine, drawScores, drawStartScreen, drawMenuScreen, drawWinnerScreen } from './renderer.js';

export const STATE = Object.freeze({ START: 'START', MENU: 'MENU', PLAYING: 'PLAYING', WINNER: 'WINNER' });

export class Game {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d');
    this.state = STATE.START;
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.winner = null;
    this.enterWasDown = false;
    this.upWasDown = false;
    this.downWasDown = false;
    this._rafId = null;
    this.audio = new AudioManager();
    this.selectedIndex = 0;
    this.mode = MODES[0];
    this.tick = 0;
    this._initEntities();
  }

  _initEntities() {
    this.paddleLeft = new Paddle(PADDLE_MARGIN);
    this.paddleRight = new Paddle(CANVAS_W - PADDLE_MARGIN - PADDLE_W);
    this.balls = Array.from({ length: this.mode.ballCount }, (_, i) => {
      const ball = new Ball();
      ball.reset(i === 0 ? 1 : -1);
      return ball;
    });
  }

  start() {
    if (this._rafId) return;
    const loop = () => {
      this._update();
      this._draw();
      this._rafId = requestAnimationFrame(loop);
    };
    this._rafId = requestAnimationFrame(loop);
  }

  stop() {
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
  }

  _update() {
    const enterDown = isDown('Enter');
    const enterJustPressed = enterDown && !this.enterWasDown;
    this.enterWasDown = enterDown;

    const upDown = isDown('ArrowUp');
    const upJustPressed = upDown && !this.upWasDown;
    this.upWasDown = upDown;

    const downDown = isDown('ArrowDown');
    const downJustPressed = downDown && !this.downWasDown;
    this.downWasDown = downDown;

    if (this.state === STATE.START) {
      if (enterJustPressed) this.state = STATE.MENU;
      return;
    }

    if (this.state === STATE.MENU) {
      if (upJustPressed) this.selectedIndex = (this.selectedIndex - 1 + MODES.length) % MODES.length;
      if (downJustPressed) this.selectedIndex = (this.selectedIndex + 1) % MODES.length;
      if (enterJustPressed) this._beginGame();
      return;
    }

    if (this.state === STATE.WINNER) {
      if (enterJustPressed) this.state = STATE.MENU;
      return;
    }

    if (isDown('KeyW')) this.paddleLeft.moveUp();
    if (isDown('KeyS')) this.paddleLeft.moveDown();
    if (isDown('ArrowUp')) this.paddleRight.moveUp();
    if (isDown('ArrowDown')) this.paddleRight.moveDown();

    this.tick++;

    for (const ball of this.balls) {
      if (this.mode.onBallUpdate) {
        this.mode.onBallUpdate(ball, this.tick);
      } else {
        ball.update();
      }

      const hitLeft = ball.collidePaddle(this.paddleLeft);
      const hitRight = !hitLeft && ball.collidePaddle(this.paddleRight);
      if (hitLeft || hitRight) {
        this.audio.playHit();
        if (!this.mode.speedProgression) {
          const mag = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
          ball.speed = BALL_INITIAL_SPEED;
          ball.vx = (ball.vx / mag) * BALL_INITIAL_SPEED;
          ball.vy = (ball.vy / mag) * BALL_INITIAL_SPEED;
        }
        this.mode.onPaddleHit?.(ball);
      }

      if (ball.isOutLeft()) this._handleScore('right', ball);
      else if (ball.isOutRight()) this._handleScore('left', ball);
    }
  }

  _handleScore(side, ball) {
    if (side === 'right') this.scoreRight++;
    else this.scoreLeft++;

    this.audio.playScore();

    if (this.scoreRight >= WINNING_SCORE) {
      this.state = STATE.WINNER;
      this.winner = 2;
      return;
    }
    if (this.scoreLeft >= WINNING_SCORE) {
      this.state = STATE.WINNER;
      this.winner = 1;
      return;
    }

    if (this.mode.onScore) {
      this.mode.onScore(this, side, ball);
    } else {
      ball.reset(side === 'right' ? -1 : 1);
    }
  }

  _draw() {
    const ctx = this.ctx;
    if (this.state === STATE.START) { drawStartScreen(ctx); return; }
    if (this.state === STATE.MENU) { drawMenuScreen(ctx, MODES, this.selectedIndex); return; }
    if (this.state === STATE.WINNER) { drawWinnerScreen(ctx, this.winner); return; }
    drawBackground(ctx);
    drawCenterLine(ctx);
    drawScores(ctx, this.scoreLeft, this.scoreRight);
    this.paddleLeft.draw(ctx);
    this.paddleRight.draw(ctx);
    for (const ball of this.balls) {
      if (this.mode.onBallDraw) {
        this.mode.onBallDraw(ball, ctx);
      } else {
        ball.draw(ctx);
      }
    }
  }

  _beginGame() {
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.winner = null;
    this.tick = 0;
    this.mode = MODES[this.selectedIndex];
    this._initEntities();
    this.state = STATE.PLAYING;
  }
}
```

- [ ] **Step 5: Run game tests — verify all pass**

```bash
npx vitest run tests/game.test.js
```

Expected: all PASS

- [ ] **Step 6: Run full suite — verify no regressions**

```bash
npx vitest run
```

Expected: all PASS

- [ ] **Step 7: Commit**

```bash
git add src/game.js src/renderer.js tests/game.test.js
git commit -m "feat: refactor game to support mode configs, balls array, and MENU state"
```

---

### Task 3: Implement `drawMenuScreen` in `renderer.js`

**Files:**
- Modify: `src/renderer.js` (replace stub from Task 2)
- Modify: `tests/renderer.test.js`

**Interfaces:**
- Consumes: `modes` array (each with `.label: string`), `selectedIndex: number`
- Produces: `drawMenuScreen(ctx, modes, selectedIndex): void` — fully renders the mode selection screen

- [ ] **Step 1: Add `drawMenuScreen` tests to `tests/renderer.test.js`**

Add `drawMenuScreen` to the existing import at the top of the file:

```js
import {
  drawBackground,
  drawCenterLine,
  drawScores,
  drawStartScreen,
  drawWinnerScreen,
  drawMenuScreen,
} from '../src/renderer.js';
```

Then add at the bottom of the file (inside the existing `describe('renderer', ...)` block or as a sibling):

```js
describe('drawMenuScreen', () => {
  it('renders all mode labels', () => {
    const ctx = mockCtx();
    const modes = [{ label: 'Classic' }, { label: 'Two Ball' }];
    drawMenuScreen(ctx, modes, 0);
    const texts = ctx.fillText.mock.calls.map(c => String(c[0]));
    expect(texts.some(t => t.includes('Classic'))).toBe(true);
    expect(texts.some(t => t.includes('Two Ball'))).toBe(true);
  });

  it('prefixes selected entry with >', () => {
    const ctx = mockCtx();
    const modes = [{ label: 'Classic' }, { label: 'Two Ball' }];
    drawMenuScreen(ctx, modes, 1);
    const texts = ctx.fillText.mock.calls.map(c => String(c[0]));
    expect(texts.some(t => t.startsWith('> Two Ball'))).toBe(true);
    expect(texts.some(t => t === 'Classic')).toBe(true);
  });

  it('calls save and restore (no state leak)', () => {
    const ctx = mockCtx();
    drawMenuScreen(ctx, [{ label: 'Classic' }], 0);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('runs without throwing', () => {
    expect(() => drawMenuScreen(mockCtx(), [{ label: 'Classic' }, { label: 'Two Ball' }], 0)).not.toThrow();
  });
});
```

- [ ] **Step 2: Run renderer tests — verify drawMenuScreen tests fail**

```bash
npx vitest run tests/renderer.test.js
```

Expected: the four new `drawMenuScreen` tests FAIL (stub renders nothing)

- [ ] **Step 3: Replace the stub in `src/renderer.js` with the full implementation**

Remove `export function drawMenuScreen(_ctx, _modes, _selectedIndex) {}` and add:

```js
export function drawMenuScreen(ctx, modes, selectedIndex) {
  ctx.save();
  drawBackground(ctx);
  drawCenterLine(ctx);

  ctx.textAlign = 'center';
  ctx.fillStyle = COLOR_FG;
  ctx.font = '24px "Press Start 2P"';
  ctx.fillText('SELECT MODE', CANVAS_W / 2, CANVAS_H / 2 - 100);

  modes.forEach((mode, i) => {
    ctx.font = '16px "Press Start 2P"';
    if (i === selectedIndex) {
      ctx.fillStyle = COLOR_LINE;
      ctx.fillText(`> ${mode.label}`, CANVAS_W / 2, CANVAS_H / 2 - 20 + i * 50);
    } else {
      ctx.fillStyle = COLOR_FG;
      ctx.fillText(mode.label, CANVAS_W / 2, CANVAS_H / 2 - 20 + i * 50);
    }
  });

  ctx.font = '11px "Press Start 2P"';
  ctx.fillStyle = COLOR_FG;
  ctx.fillText('PRESS ENTER TO START', CANVAS_W / 2, CANVAS_H - 60);

  ctx.restore();
}
```

- [ ] **Step 4: Run renderer tests — verify all pass**

```bash
npx vitest run tests/renderer.test.js
```

Expected: all PASS

- [ ] **Step 5: Run full suite — verify no regressions**

```bash
npx vitest run
```

Expected: all PASS

- [ ] **Step 6: Commit**

```bash
git add src/renderer.js tests/renderer.test.js
git commit -m "feat: implement drawMenuScreen for mode selection UI"
```
