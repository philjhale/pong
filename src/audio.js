export class AudioManager {
  constructor() {
    this.hit = new Audio('assets/ping-pong-hit.mp3');
    this.score = new Audio('assets/pwlpl-applause-sound-effect-521104.mp3');
    this.hit.preload = 'auto';
    this.score.preload = 'auto';
  }

  playHit() {
    this.hit.currentTime = 0;
    this.hit.play().catch(() => {});
  }

  playScore() {
    this.score.currentTime = 0;
    this.score.play().catch(() => {});
  }
}
