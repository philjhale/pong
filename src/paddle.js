import { CANVAS_H, PADDLE_W, PADDLE_H, PADDLE_RADIUS, PADDLE_SPEED } from './constants.js';

export class Paddle {
  constructor(x) {
    this.x = x;
    this.y = CANVAS_H / 2 - PADDLE_H / 2;
    this.width = PADDLE_W;
    this.height = PADDLE_H;
  }

  moveUp() {
    this.y = Math.max(0, this.y - PADDLE_SPEED);
  }

  moveDown() {
    this.y = Math.min(CANVAS_H - PADDLE_H, this.y + PADDLE_SPEED);
  }

  top() { return this.y; }
  bottom() { return this.y + this.height; }
  left() { return this.x; }
  right() { return this.x + this.width; }
  centerY() { return this.y + this.height / 2; }

  draw(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, PADDLE_RADIUS);
    ctx.fill();
  }
}
