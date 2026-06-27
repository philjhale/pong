import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioManager, HIT_POOL_SIZE } from '../src/audio.js';

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

    const AudioMock = vi.fn();
    for (const node of hitNodes) AudioMock.mockReturnValueOnce(node);
    AudioMock.mockReturnValueOnce(scoreNode);

    vi.stubGlobal('Audio', AudioMock);
    mgr = new AudioManager();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('constructs without throwing', () => {
    expect(mgr).toBeDefined();
  });

  it('playHit resets currentTime to 0 and calls play()', () => {
    hitNodes[0].currentTime = 5;
    mgr.playHit();
    expect(hitNodes[0].currentTime).toBe(0);
    expect(hitNodes[0].play).toHaveBeenCalled();
  });

  it('playHit round-robins through pool nodes', () => {
    for (let i = 0; i < HIT_POOL_SIZE; i++) mgr.playHit();
    hitNodes.forEach(n => expect(n.play).toHaveBeenCalledOnce());
  });

  it('playHit swallows NotAllowedError silently (no console.warn)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const err = Object.assign(new Error('autoplay blocked'), { name: 'NotAllowedError' });
    hitNodes[0].play.mockRejectedValue(err);
    mgr.playHit();
    await new Promise(r => setTimeout(r, 0));
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('playHit logs non-NotAllowedError via console.warn', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const err = new Error('decode error');
    hitNodes[0].play.mockRejectedValue(err);
    mgr.playHit();
    await new Promise(r => setTimeout(r, 0));
    expect(warnSpy).toHaveBeenCalledOnce();
  });

  it('playScore resets currentTime to 0 and calls play()', () => {
    scoreNode.currentTime = 9;
    mgr.playScore();
    expect(scoreNode.currentTime).toBe(0);
    expect(scoreNode.play).toHaveBeenCalled();
  });

  it('playScore swallows NotAllowedError silently (no console.warn)', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const err = Object.assign(new Error('autoplay blocked'), { name: 'NotAllowedError' });
    scoreNode.play.mockRejectedValue(err);
    mgr.playScore();
    await new Promise(r => setTimeout(r, 0));
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('playScore logs non-NotAllowedError via console.warn', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    scoreNode.play.mockRejectedValue(new Error('decode error'));
    mgr.playScore();
    await new Promise(r => setTimeout(r, 0));
    expect(warnSpy).toHaveBeenCalledOnce();
  });
});
