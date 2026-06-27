import { CANVAS_W, CANVAS_H, BALL_RADIUS, BALL_INITIAL_SPEED, BALL_SPEED_INCREMENT, BALL_MAX_SPEED } from './constants.js';

export class Ball {
  constructor() {
    this.reset(1);
  }

  reset(direction) {
    this.x = CANVAS_W / 2;
    this.y = CANVAS_H / 2;
    const angle = (Math.random() * Math.PI / 4) - Math.PI / 8;
    this.speed = BALL_INITIAL_SPEED;
    this.vx = direction * this.speed * Math.cos(angle);
    this.vy = this.speed * Math.sin(angle);
    this.rallyHits = 0;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.y - BALL_RADIUS <= 0) {
      this.y = BALL_RADIUS;
      this.vy = Math.abs(this.vy);
    } else if (this.y + BALL_RADIUS >= CANVAS_H) {
      this.y = CANVAS_H - BALL_RADIUS;
      this.vy = -Math.abs(this.vy);
    }
  }

  collidePaddle(paddle) {
    const overlapping =
      this.x - BALL_RADIUS < paddle.right() &&
      this.x + BALL_RADIUS > paddle.left() &&
      this.y - BALL_RADIUS < paddle.bottom() &&
      this.y + BALL_RADIUS > paddle.top();

    if (!overlapping) return false;

    this.vx = -this.vx;
    if (this.vx > 0) this.x = paddle.right() + BALL_RADIUS;
    else this.x = paddle.left() - BALL_RADIUS;

    const hitPos = (this.y - paddle.centerY()) / (paddle.height / 2);
    this.rallyHits++;
    this.speed = Math.min(BALL_MAX_SPEED, BALL_INITIAL_SPEED + this.rallyHits * BALL_SPEED_INCREMENT);

    this.vy = hitPos * this.speed * 0.75;

    const magnitude = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    this.vx = (this.vx / magnitude) * this.speed;
    this.vy = (this.vy / magnitude) * this.speed;

    const minVy = this.speed * 0.2;
    if (Math.abs(this.vy) < minVy) {
      this.vy = minVy * Math.sign(this.vy || 1);
      this.vx = Math.sign(this.vx) * Math.sqrt(this.speed * this.speed - minVy * minVy);
    }

    return true;
  }

  isOutLeft() { return this.x + BALL_RADIUS < 0; }
  isOutRight() { return this.x - BALL_RADIUS > CANVAS_W; }

  draw(ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.x, this.y, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}
