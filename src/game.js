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
          ball.rallyHits = 0;
        }
        this.mode.onPaddleHit?.(ball);
      }

      if (ball.isOutLeft()) this._handleScore('right', ball);
      else if (ball.isOutRight()) this._handleScore('left', ball);
    }
  }

  _handleScore(side, ball) {
    if (this.state !== STATE.PLAYING) return; // guard: both balls can exit in the same frame
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
