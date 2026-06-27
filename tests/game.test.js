import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Game, STATE } from '../src/game.js';
import { WINNING_SCORE } from '../src/constants.js';

vi.mock('../src/input.js', () => ({ isDown: vi.fn().mockReturnValue(false) }));
vi.mock('../src/audio.js', () => ({
  HIT_POOL_SIZE: 4,
  AudioManager: vi.fn().mockImplementation(() => ({
    playHit: vi.fn(),
    playScore: vi.fn(),
  })),
}));

function mockCanvas() {
  const ctx = {
    fillStyle: '', strokeStyle: '', lineWidth: 0, font: '', textAlign: '',
    fillRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(),
    stroke: vi.fn(), fillText: vi.fn(), save: vi.fn(), restore: vi.fn(),
    setLineDash: vi.fn(), arc: vi.fn(), fill: vi.fn(), roundRect: vi.fn(),
  };
  return { getContext: () => ctx };
}

describe('Game', () => {
  let game;

  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', vi.fn().mockReturnValue(1));
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    game = new Game(mockCanvas());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts in START state', () => {
    expect(game.state).toBe(STATE.START);
  });

  it('initial scores are 0', () => {
    expect(game.scoreLeft).toBe(0);
    expect(game.scoreRight).toBe(0);
  });

  it('_beginGame transitions to PLAYING', () => {
    game._beginGame();
    expect(game.state).toBe(STATE.PLAYING);
  });

  it('_beginGame resets scores to 0', () => {
    game.scoreLeft = 5;
    game.scoreRight = 3;
    game._beginGame();
    expect(game.scoreLeft).toBe(0);
    expect(game.scoreRight).toBe(0);
  });

  it('_beginGame resets winner to null', () => {
    game.winner = 1;
    game._beginGame();
    expect(game.winner).toBeNull();
  });

  describe('in PLAYING state', () => {
    beforeEach(() => {
      game._beginGame();
      vi.spyOn(game.ball, 'update').mockImplementation(() => {});
      vi.spyOn(game.ball, 'collidePaddle').mockReturnValue(false);
    });

    it('right player scores when ball exits left', () => {
      vi.spyOn(game.ball, 'isOutLeft').mockReturnValue(true);
      vi.spyOn(game.ball, 'isOutRight').mockReturnValue(false);
      vi.spyOn(game.ball, 'reset').mockImplementation(() => {});
      game._update();
      expect(game.scoreRight).toBe(1);
    });

    it('left player scores when ball exits right', () => {
      vi.spyOn(game.ball, 'isOutLeft').mockReturnValue(false);
      vi.spyOn(game.ball, 'isOutRight').mockReturnValue(true);
      vi.spyOn(game.ball, 'reset').mockImplementation(() => {});
      game._update();
      expect(game.scoreLeft).toBe(1);
    });

    it('transitions to WINNER (player 2) when right reaches WINNING_SCORE', () => {
      game.scoreRight = WINNING_SCORE - 1;
      vi.spyOn(game.ball, 'isOutLeft').mockReturnValue(true);
      vi.spyOn(game.ball, 'isOutRight').mockReturnValue(false);
      const resetSpy = vi.spyOn(game.ball, 'reset');
      game._update();
      expect(game.state).toBe(STATE.WINNER);
      expect(game.winner).toBe(2);
      expect(resetSpy).not.toHaveBeenCalled();
    });

    it('transitions to WINNER (player 1) when left reaches WINNING_SCORE', () => {
      game.scoreLeft = WINNING_SCORE - 1;
      vi.spyOn(game.ball, 'isOutLeft').mockReturnValue(false);
      vi.spyOn(game.ball, 'isOutRight').mockReturnValue(true);
      const resetSpy = vi.spyOn(game.ball, 'reset');
      game._update();
      expect(game.state).toBe(STATE.WINNER);
      expect(game.winner).toBe(1);
      expect(resetSpy).not.toHaveBeenCalled();
    });
  });

  it('stop() calls cancelAnimationFrame with the correct RAF id', () => {
    game.start();
    game.stop();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  });

  it('double start() does not spawn second loop', () => {
    game.start();
    game.start();
    expect(requestAnimationFrame).toHaveBeenCalledTimes(1);
  });

  it('stop() then start() re-enables the loop', () => {
    game.start();
    game.stop();
    game.start();
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
  });
});
