import { describe, it, expect, beforeEach } from 'vitest';
import { Ball } from '../src/ball.js';
import { Paddle } from '../src/paddle.js';
import { CANVAS_W, CANVAS_H, BALL_RADIUS, BALL_INITIAL_SPEED, BALL_MAX_SPEED, PADDLE_MARGIN } from '../src/constants.js';

describe('Ball', () => {
  let ball;

  beforeEach(() => {
    ball = new Ball();
    // fix state for deterministic tests
    ball.x = CANVAS_W / 2;
    ball.y = CANVAS_H / 2;
    ball.vx = BALL_INITIAL_SPEED;
    ball.vy = 0;
    ball.speed = BALL_INITIAL_SPEED;
    ball.rallyHits = 0;
  });

  it('advances position by velocity on update', () => {
    ball.update();
    expect(ball.x).toBeCloseTo(CANVAS_W / 2 + BALL_INITIAL_SPEED);
    expect(ball.y).toBeCloseTo(CANVAS_H / 2);
  });

  it('bounces off top wall — vy flips to positive', () => {
    ball.y = BALL_RADIUS;
    ball.vy = -3;
    ball.update();
    expect(ball.vy).toBeGreaterThan(0);
  });

  it('bounces off bottom wall — vy flips to negative', () => {
    ball.y = CANVAS_H - BALL_RADIUS;
    ball.vy = 3;
    ball.update();
    expect(ball.vy).toBeLessThan(0);
  });

  it('isOutLeft when ball passes left edge', () => {
    ball.x = -BALL_RADIUS - 1;
    expect(ball.isOutLeft()).toBe(true);
  });

  it('isOutRight when ball passes right edge', () => {
    ball.x = CANVAS_W + BALL_RADIUS + 1;
    expect(ball.isOutRight()).toBe(true);
  });

  it('reset places ball at center', () => {
    ball.x = 0;
    ball.y = 0;
    ball.reset(1);
    expect(ball.x).toBe(CANVAS_W / 2);
    expect(ball.y).toBe(CANVAS_H / 2);
  });

  it('reset with direction=1 launches ball rightward', () => {
    ball.reset(1);
    expect(ball.vx).toBeGreaterThan(0);
  });

  it('reset with direction=-1 launches ball leftward', () => {
    ball.reset(-1);
    expect(ball.vx).toBeLessThan(0);
  });

  describe('collidePaddle', () => {
    let paddle;

    beforeEach(() => {
      paddle = new Paddle(PADDLE_MARGIN);
      paddle.y = CANVAS_H / 2 - 40;
      // position ball just overlapping right edge of paddle, moving left
      ball.x = paddle.right() + BALL_RADIUS - 1;
      ball.y = paddle.centerY();
      ball.vx = -BALL_INITIAL_SPEED;
    });

    it('returns true on hit', () => {
      expect(ball.collidePaddle(paddle)).toBe(true);
    });

    it('reflects vx to positive (away from left paddle)', () => {
      ball.collidePaddle(paddle);
      expect(ball.vx).toBeGreaterThan(0);
    });

    it('increases speed after hit', () => {
      const before = ball.speed;
      ball.collidePaddle(paddle);
      expect(ball.speed).toBeGreaterThan(before);
    });

    it('increments rallyHits', () => {
      ball.collidePaddle(paddle);
      expect(ball.rallyHits).toBe(1);
    });

    it('returns false when ball is not overlapping', () => {
      ball.x = paddle.right() + BALL_RADIUS + 10;
      expect(ball.collidePaddle(paddle)).toBe(false);
    });

    it('caps speed at BALL_MAX_SPEED', () => {
      ball.rallyHits = 100;
      ball.speed = 13.9;
      ball.vx = -BALL_INITIAL_SPEED;
      ball.collidePaddle(paddle);
      expect(ball.speed).toBeLessThanOrEqual(BALL_MAX_SPEED);
    });

    it('velocity magnitude equals speed after hit (normalization invariant)', () => {
      ball.collidePaddle(paddle);
      const mag = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      expect(mag).toBeCloseTo(ball.speed, 10);
    });

    it('|vy| >= 0.2 * speed after center hit (min-vy guard)', () => {
      ball.collidePaddle(paddle); // vy=0 → hitPos=0 → guard fires
      expect(Math.abs(ball.vy)).toBeGreaterThanOrEqual(ball.speed * 0.2 - 0.0001);
    });
  });
});
