import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AudioManager } from '../src/audio.js';

function makeAudioNode() {
  const node = {
    currentTime: 0,
    preload: '',
    play: vi.fn().mockResolvedValue(undefined),
    cloneNode: vi.fn(),
  };
  node.cloneNode.mockReturnValue({ play: vi.fn().mockResolvedValue(undefined) });
  return node;
}

describe('AudioManager', () => {
  let mgr;
  let hitNode;
  let scoreNode;

  beforeEach(() => {
    hitNode = makeAudioNode();
    scoreNode = makeAudioNode();
    let callCount = 0;
    vi.stubGlobal('Audio', vi.fn(() => {
      callCount++;
      return callCount === 1 ? hitNode : scoreNode;
    }));
    mgr = new AudioManager();
  });

  it('constructs without throwing', () => {
    expect(mgr).toBeDefined();
  });

  it('playHit clones the node and calls play()', () => {
    mgr.playHit();
    expect(hitNode.cloneNode).toHaveBeenCalled();
    const clone = hitNode.cloneNode.mock.results[0].value;
    expect(clone.play).toHaveBeenCalled();
  });

  it('playHit swallows rejected play promise', async () => {
    hitNode.cloneNode.mockReturnValue({
      play: vi.fn().mockRejectedValue(new Error('autoplay blocked')),
    });
    await expect(async () => mgr.playHit()).not.toThrow();
  });

  it('playScore resets currentTime to 0 and calls play()', () => {
    mgr.playScore();
    expect(scoreNode.currentTime).toBe(0);
    expect(scoreNode.play).toHaveBeenCalled();
  });

  it('playScore swallows rejected play promise', async () => {
    scoreNode.play.mockRejectedValue(new Error('autoplay blocked'));
    await expect(async () => mgr.playScore()).not.toThrow();
  });
});
