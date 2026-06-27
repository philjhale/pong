import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Game, STATE } from '../src/game.js';
import { WINNING_SCORE, BALL_INITIAL_SPEED } from '../src/constants.js';
import { MODES } from '../src/modes.js';
import { isDown } from '../src/input.js';

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
    isDown.mockReturnValue(false);
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
      vi.spyOn(game.balls[0], 'update').mockImplementation(() => {});
      vi.spyOn(game.balls[0], 'collidePaddle').mockReturnValue(false);
    });

    it('right player scores when ball exits left', () => {
      vi.spyOn(game.balls[0], 'isOutLeft').mockReturnValue(true);
      vi.spyOn(game.balls[0], 'isOutRight').mockReturnValue(false);
      vi.spyOn(game.balls[0], 'reset').mockImplementation(() => {});
      game._update();
      expect(game.scoreRight).toBe(1);
    });

    it('left player scores when ball exits right', () => {
      vi.spyOn(game.balls[0], 'isOutLeft').mockReturnValue(false);
      vi.spyOn(game.balls[0], 'isOutRight').mockReturnValue(true);
      vi.spyOn(game.balls[0], 'reset').mockImplementation(() => {});
      game._update();
      expect(game.scoreLeft).toBe(1);
    });

    it('transitions to WINNER (player 2) when right reaches WINNING_SCORE', () => {
      game.scoreRight = WINNING_SCORE - 1;
      vi.spyOn(game.balls[0], 'isOutLeft').mockReturnValue(true);
      vi.spyOn(game.balls[0], 'isOutRight').mockReturnValue(false);
      const resetSpy = vi.spyOn(game.balls[0], 'reset');
      game._update();
      expect(game.state).toBe(STATE.WINNER);
      expect(game.winner).toBe(2);
      expect(resetSpy).not.toHaveBeenCalled();
    });

    it('transitions to WINNER (player 1) when left reaches WINNING_SCORE', () => {
      game.scoreLeft = WINNING_SCORE - 1;
      vi.spyOn(game.balls[0], 'isOutLeft').mockReturnValue(false);
      vi.spyOn(game.balls[0], 'isOutRight').mockReturnValue(true);
      const resetSpy = vi.spyOn(game.balls[0], 'reset');
      game._update();
      expect(game.state).toBe(STATE.WINNER);
      expect(game.winner).toBe(1);
      expect(resetSpy).not.toHaveBeenCalled();
    });

    it('clamps ball speed to BALL_INITIAL_SPEED after paddle hit in non-progression mode', () => {
      // Switch to Two Ball mode (speedProgression: false)
      game.selectedIndex = 1;
      game._beginGame();
      const ball = game.balls[0];
      // Force a paddle hit
      vi.spyOn(ball, 'isOutLeft').mockReturnValue(false);
      vi.spyOn(ball, 'isOutRight').mockReturnValue(false);
      vi.spyOn(ball, 'collidePaddle').mockReturnValue(true);
      vi.spyOn(ball, 'update').mockImplementation(() => {});
      // Give the ball elevated speed/velocity as if collidePaddle accelerated it
      ball.vx = 10;
      ball.vy = 0;
      ball.speed = 10;
      ball.rallyHits = 5;
      game._update();
      expect(ball.speed).toBe(BALL_INITIAL_SPEED);
      expect(Math.hypot(ball.vx, ball.vy)).toBeCloseTo(BALL_INITIAL_SPEED, 5);
      expect(ball.rallyHits).toBe(0);
    });
  });

  describe('_handleScore', () => {
    beforeEach(() => {
      game._beginGame();
    });

    it('increments scoreRight when side is right', () => {
      vi.spyOn(game.balls[0], 'reset').mockImplementation(() => {});
      game._handleScore('right', game.balls[0]);
      expect(game.scoreRight).toBe(1);
    });

    it('increments scoreLeft when side is left', () => {
      vi.spyOn(game.balls[0], 'reset').mockImplementation(() => {});
      game._handleScore('left', game.balls[0]);
      expect(game.scoreLeft).toBe(1);
    });

    it('resets ball leftward (-1) when right player scores in Classic', () => {
      const resetSpy = vi.spyOn(game.balls[0], 'reset').mockImplementation(() => {});
      game._handleScore('right', game.balls[0]);
      expect(resetSpy).toHaveBeenCalledWith(-1);
    });

    it('resets ball rightward (1) when left player scores in Classic', () => {
      const resetSpy = vi.spyOn(game.balls[0], 'reset').mockImplementation(() => {});
      game._handleScore('left', game.balls[0]);
      expect(resetSpy).toHaveBeenCalledWith(1);
    });

    it('sets WINNER state and winner=2 when right reaches WINNING_SCORE', () => {
      game.scoreRight = WINNING_SCORE - 1;
      game._handleScore('right', game.balls[0]);
      expect(game.state).toBe(STATE.WINNER);
      expect(game.winner).toBe(2);
    });

    it('sets WINNER state and winner=1 when left reaches WINNING_SCORE', () => {
      game.scoreLeft = WINNING_SCORE - 1;
      game._handleScore('left', game.balls[0]);
      expect(game.state).toBe(STATE.WINNER);
      expect(game.winner).toBe(1);
    });

    it('does not reset ball when WINNER is reached', () => {
      game.scoreRight = WINNING_SCORE - 1;
      const resetSpy = vi.spyOn(game.balls[0], 'reset');
      game._handleScore('right', game.balls[0]);
      expect(resetSpy).not.toHaveBeenCalled();
    });

    it('calls mode.onScore hook instead of ball.reset when hook is defined', () => {
      const onScore = vi.fn();
      game.mode = { ...game.mode, onScore };
      const resetSpy = vi.spyOn(game.balls[0], 'reset');
      game._handleScore('right', game.balls[0]);
      expect(onScore).toHaveBeenCalledWith(game, 'right', game.balls[0]);
      expect(resetSpy).not.toHaveBeenCalled();
    });

    it('ignores second call in same frame if state is already WINNER', () => {
      game.scoreRight = WINNING_SCORE - 1;
      game._handleScore('right', game.balls[0]);
      expect(game.state).toBe(STATE.WINNER);
      game._handleScore('right', game.balls[0]); // second ball exits same frame
      expect(game.scoreRight).toBe(WINNING_SCORE); // not inflated
    });
  });

  describe('MENU state navigation', () => {
    beforeEach(() => {
      game.state = STATE.MENU;
      game.selectedIndex = 0;
      game.enterWasDown = false;
      game.upWasDown = false;
      game.downWasDown = false;
    });

    it('ArrowDown increments selectedIndex', () => {
      isDown.mockImplementation(key => key === 'ArrowDown');
      game._update();
      expect(game.selectedIndex).toBe(1);
    });

    it('ArrowDown wraps from last index back to 0', () => {
      game.selectedIndex = MODES.length - 1;
      isDown.mockImplementation(key => key === 'ArrowDown');
      game._update();
      expect(game.selectedIndex).toBe(0);
    });

    it('ArrowUp decrements selectedIndex with wrap to last', () => {
      game.selectedIndex = 0;
      isDown.mockImplementation(key => key === 'ArrowUp');
      game._update();
      expect(game.selectedIndex).toBe(MODES.length - 1);
    });

    it('Enter starts PLAYING with the selected mode', () => {
      game.selectedIndex = 1;
      isDown.mockImplementation(key => key === 'Enter');
      game._update();
      expect(game.state).toBe(STATE.PLAYING);
      expect(game.mode.id).toBe(MODES[1].id);
    });
  });

  it('Enter in START transitions to MENU', () => {
    game.state = STATE.START;
    game.enterWasDown = false;
    isDown.mockImplementation(key => key === 'Enter');
    game._update();
    expect(game.state).toBe(STATE.MENU);
  });

  it('Enter in WINNER transitions to MENU', () => {
    game.state = STATE.WINNER;
    game.winner = 1;
    game.enterWasDown = false;
    isDown.mockImplementation(key => key === 'Enter');
    game._update();
    expect(game.state).toBe(STATE.MENU);
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
