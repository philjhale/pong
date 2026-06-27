import { describe, it, expect } from 'vitest';
import { isDown } from '../src/input.js';

describe('isDown', () => {
  it('returns false for a key that has never been pressed', () => {
    expect(isDown('Space')).toBe(false);
  });

  it('returns true while a key is held down', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW' }));
    expect(isDown('KeyW')).toBe(true);
  });

  it('returns false after a key is released', () => {
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyS' }));
    window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyS' }));
    expect(isDown('KeyS')).toBe(false);
  });
});
