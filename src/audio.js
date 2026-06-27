const HIT_POOL_SIZE = 4;

export class AudioManager {
  constructor() {
    this._hitPool = Array.from({ length: HIT_POOL_SIZE }, () => new Audio('assets/ping-pong-hit.mp3'));
    this._hitIdx = 0;
    this.score = new Audio('assets/pwlpl-applause-sound-effect-521104.mp3');
    this._hitPool.forEach(n => { n.preload = 'auto'; });
    this.score.preload = 'auto';
  }

  playHit() {
    const node = this._hitPool[this._hitIdx];
    this._hitIdx = (this._hitIdx + 1) % HIT_POOL_SIZE;
    node.currentTime = 0;
    node.play().catch(e => { if (e.name !== 'NotAllowedError') console.warn('Audio error:', e); });
  }

  playScore() {
    this.score.currentTime = 0;
    this.score.play().catch(e => { if (e.name !== 'NotAllowedError') console.warn('Audio error:', e); });
  }
}
