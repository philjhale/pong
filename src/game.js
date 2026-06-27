import { CANVAS_W, PADDLE_MARGIN, PADDLE_W, WINNING_SCORE } from './constants.js';
import { isDown } from './input.js';
import { Paddle } from './paddle.js';
import { Ball } from './ball.js';
import { AudioManager } from './audio.js';
import { drawBackground, drawCenterLine, drawScores, drawStartScreen, drawWinnerScreen } from './renderer.js';

export const STATE = Object.freeze({ START: 'START', PLAYING: 'PLAYING', WINNER: 'WINNER' });

export class Game {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d');
    this.state = STATE.START;
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.winner = null;
    this.enterWasDown = false;
    this._rafId = null;
    this.audio = new AudioManager();
    this._initEntities();
  }

  _initEntities() {
    this.paddleLeft = new Paddle(PADDLE_MARGIN);
    this.paddleRight = new Paddle(CANVAS_W - PADDLE_MARGIN - PADDLE_W);
    this.ball = new Ball();
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

    if (this.state !== STATE.PLAYING) {
      if (enterJustPressed) this._beginGame();
      return;
    }

    if (isDown('KeyW')) this.paddleLeft.moveUp();
    if (isDown('KeyS')) this.paddleLeft.moveDown();
    if (isDown('ArrowUp')) this.paddleRight.moveUp();
    if (isDown('ArrowDown')) this.paddleRight.moveDown();

    this.ball.update();

    if (this.ball.collidePaddle(this.paddleLeft) || this.ball.collidePaddle(this.paddleRight)) {
      this.audio.playHit();
    }

    if (this.ball.isOutLeft()) {
      this.scoreRight++;
      this.audio.playScore();
      if (this.scoreRight >= WINNING_SCORE) {
        this.state = STATE.WINNER;
        this.winner = 2;
      } else {
        this.ball.reset(-1);
      }
    } else if (this.ball.isOutRight()) {
      this.scoreLeft++;
      this.audio.playScore();
      if (this.scoreLeft >= WINNING_SCORE) {
        this.state = STATE.WINNER;
        this.winner = 1;
      } else {
        this.ball.reset(1);
      }
    }
  }

  _draw() {
    const ctx = this.ctx;
    if (this.state === STATE.START) { drawStartScreen(ctx); return; }
    if (this.state === STATE.WINNER) { drawWinnerScreen(ctx, this.winner); return; }
    drawBackground(ctx);
    drawCenterLine(ctx);
    drawScores(ctx, this.scoreLeft, this.scoreRight);
    this.paddleLeft.draw(ctx);
    this.paddleRight.draw(ctx);
    this.ball.draw(ctx);
  }

  _beginGame() {
    this.scoreLeft = 0;
    this.scoreRight = 0;
    this.winner = null;
    this._initEntities();
    this.state = STATE.PLAYING;
  }
}
