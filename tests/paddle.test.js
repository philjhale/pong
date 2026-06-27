import { describe, it, expect, beforeEach } from 'vitest';
import { Paddle } from '../src/paddle.js';
import { CANVAS_H, PADDLE_H, PADDLE_W, PADDLE_SPEED } from '../src/constants.js';

describe('Paddle', () => {
  let paddle;

  beforeEach(() => {
    paddle = new Paddle(20);
  });

  it('starts vertically centered', () => {
    expect(paddle.y).toBe(CANVAS_H / 2 - PADDLE_H / 2);
  });

  it('exposes correct bounds', () => {
    expect(paddle.left()).toBe(20);
    expect(paddle.right()).toBe(20 + PADDLE_W);
    expect(paddle.top()).toBe(paddle.y);
    expect(paddle.bottom()).toBe(paddle.y + PADDLE_H);
    expect(paddle.centerY()).toBe(paddle.y + PADDLE_H / 2);
  });

  it('moveUp decreases y by PADDLE_SPEED', () => {
    const before = paddle.y;
    paddle.moveUp();
    expect(paddle.y).toBe(before - PADDLE_SPEED);
  });

  it('moveDown increases y by PADDLE_SPEED', () => {
    const before = paddle.y;
    paddle.moveDown();
    expect(paddle.y).toBe(before + PADDLE_SPEED);
  });

  it('clamps at top edge (y cannot go below 0)', () => {
    paddle.y = 2;
    paddle.moveUp();
    expect(paddle.y).toBe(0);
  });

  it('clamps at bottom edge', () => {
    paddle.y = CANVAS_H - PADDLE_H - 2;
    paddle.moveDown();
    expect(paddle.y).toBe(CANVAS_H - PADDLE_H);
  });
});
