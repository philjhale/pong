import { describe, it, expect, vi } from 'vitest';
import {
  drawBackground,
  drawCenterLine,
  drawScores,
  drawStartScreen,
  drawWinnerScreen,
  drawMenuScreen,
} from '../src/renderer.js';

function mockCtx() {
  return {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 0,
    font: '',
    textAlign: '',
    fillRect: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    fillText: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    setLineDash: vi.fn(),
  };
}

describe('renderer', () => {
  it('drawBackground runs without throwing', () => {
    expect(() => drawBackground(mockCtx())).not.toThrow();
  });

  it('drawCenterLine runs without throwing', () => {
    expect(() => drawCenterLine(mockCtx())).not.toThrow();
  });

  it('drawScores runs without throwing', () => {
    expect(() => drawScores(mockCtx(), 3, 5)).not.toThrow();
  });

  it('drawScores calls save and restore (no state leak)', () => {
    const ctx = mockCtx();
    drawScores(ctx, 0, 0);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('drawStartScreen runs without throwing', () => {
    expect(() => drawStartScreen(mockCtx())).not.toThrow();
  });

  it('drawStartScreen calls save and restore (no state leak)', () => {
    const ctx = mockCtx();
    drawStartScreen(ctx);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });

  it('drawWinnerScreen runs without throwing for player 1', () => {
    expect(() => drawWinnerScreen(mockCtx(), 1)).not.toThrow();
  });

  it('drawWinnerScreen runs without throwing for player 2', () => {
    expect(() => drawWinnerScreen(mockCtx(), 2)).not.toThrow();
  });

  it('drawWinnerScreen calls save and restore (no state leak)', () => {
    const ctx = mockCtx();
    drawWinnerScreen(ctx, 1);
    expect(ctx.save).toHaveBeenCalled();
    expect(ctx.restore).toHaveBeenCalled();
  });
});

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
