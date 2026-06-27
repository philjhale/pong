export const MODES = [
  {
    id: 'CLASSIC',
    label: 'Classic',
    ballCount: 1,
    speedProgression: true,
  },
  {
    id: 'TWO_BALL',
    label: 'Two Ball',
    ballCount: 2,
    speedProgression: false,
    onScore(game) {
      // fixed directions: ball 0 right, ball 1 left — symmetric reset regardless of which side scored
      game.balls.forEach((ball, i) => ball.reset(i === 0 ? 1 : -1));
    },
  },
];

export const DEFAULT_MODE = MODES[0];
