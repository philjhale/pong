const GAME_KEYS = new Set(['KeyW', 'KeyS', 'ArrowUp', 'ArrowDown', 'Enter']);
const keys = new Set();
window.addEventListener('keydown', e => { if (GAME_KEYS.has(e.code)) e.preventDefault(); keys.add(e.code); });
window.addEventListener('keyup', e => keys.delete(e.code));
export const isDown = code => keys.has(code);
