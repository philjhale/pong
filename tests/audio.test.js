import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioManager } from '../src/audio.js';

const HIT_POOL_SIZE = 4;

function makeAudioNode() {
  return {
    currentTime: 0,
    preload: '',
    play: vi.fn().mockResolvedValue(undefined),
  };
}

describe('AudioManager', () => {
  let mgr;
  let hitNodes;
  let scoreNode;

  beforeEach(() => {
    hitNodes = Array.from({ length: HIT_POOL_SIZE }, makeAudioNode);
    scoreNode = makeAudioNode();

    const AudioMock = vi.fn()
      .mockReturnValueOnce(hitNodes[0])
      .mockReturnValueOnce(hitNodes[1])
      .mockReturnValueOnce(hitNodes[2])
      .mockReturnValueOnce(hitNodes[3])
      .mockReturnValueOnce(scoreNode);

    vi.stubGlobal('Audio', AudioMock);
    mgr = new AudioManager();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('constructs without throwing', () => {
    expect(mgr).toBeDefined();
  });

  it('playHit resets currentTime and calls play() on pool node', () => {
    mgr.playHit();
    expect(hitNodes[0].currentTime).toBe(0);
    expect(hitNodes[0].play).toHaveBeenCalled();
  });

  it('playHit round-robins through pool nodes', () => {
    for (let i = 0; i < HIT_POOL_SIZE; i++) mgr.playHit();
    hitNodes.forEach(n => expect(n.play).toHaveBeenCalledOnce());
  });

  it('playHit swallows NotAllowedError silently', async () => {
    const err = Object.assign(new Error('autoplay blocked'), { name: 'NotAllowedError' });
    hitNodes[0].play.mockRejectedValue(err);
    mgr.playHit();
    await new Promise(r => setTimeout(r, 0)); // flush microtask
    // no unhandled rejection means the catch ran correctly
  });

  it('playScore resets currentTime to 0 and calls play()', () => {
    mgr.playScore();
    expect(scoreNode.currentTime).toBe(0);
    expect(scoreNode.play).toHaveBeenCalled();
  });

  it('playScore swallows NotAllowedError silently', async () => {
    const err = Object.assign(new Error('autoplay blocked'), { name: 'NotAllowedError' });
    scoreNode.play.mockRejectedValue(err);
    mgr.playScore();
    await new Promise(r => setTimeout(r, 0));
  });
});
