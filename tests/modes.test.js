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
