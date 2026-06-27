import { CANVAS_W, CANVAS_H, COLOR_BG, COLOR_FG, COLOR_LINE } from './constants.js';

export function drawBackground(ctx) {
  ctx.fillStyle = COLOR_BG;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
}

export function drawCenterLine(ctx) {
  ctx.save();
  ctx.strokeStyle = COLOR_LINE;
  ctx.lineWidth = 4;
  ctx.setLineDash([20, 15]);
  ctx.beginPath();
  ctx.moveTo(CANVAS_W / 2, 0);
  ctx.lineTo(CANVAS_W / 2, CANVAS_H);
  ctx.stroke();
  ctx.restore();
}

export function drawScores(ctx, scoreLeft, scoreRight) {
  ctx.save();
  ctx.fillStyle = COLOR_FG;
  ctx.font = '48px "Press Start 2P"';
  ctx.textAlign = 'center';
  ctx.fillText(String(scoreLeft), CANVAS_W / 4, 80);
  ctx.fillText(String(scoreRight), (CANVAS_W * 3) / 4, 80);
  ctx.restore();
}

export function drawStartScreen(ctx) {
  ctx.save();
  drawBackground(ctx);
  drawCenterLine(ctx);
  ctx.fillStyle = COLOR_FG;
  ctx.textAlign = 'center';
  ctx.font = '40px "Press Start 2P"';
  ctx.fillText('RETRO PONG', CANVAS_W / 2, CANVAS_H / 2 - 60);
  ctx.font = '14px "Press Start 2P"';
  ctx.fillText('PRESS ENTER TO START', CANVAS_W / 2, CANVAS_H / 2 + 20);
  ctx.font = '11px "Press Start 2P"';
  ctx.fillStyle = COLOR_LINE;
  ctx.fillText('W / S', CANVAS_W / 4, CANVAS_H / 2 + 70);
  ctx.fillText('UP / DOWN', (CANVAS_W * 3) / 4, CANVAS_H / 2 + 70);
  ctx.restore();
}

export function drawWinnerScreen(ctx, winner) {
  ctx.save();
  drawBackground(ctx);
  drawCenterLine(ctx);
  ctx.fillStyle = COLOR_FG;
  ctx.textAlign = 'center';
  ctx.font = '32px "Press Start 2P"';
  ctx.fillText(`PLAYER ${winner} WINS!`, CANVAS_W / 2, CANVAS_H / 2 - 40);
  ctx.font = '14px "Press Start 2P"';
  ctx.fillText('PRESS ENTER FOR MODE SELECT', CANVAS_W / 2, CANVAS_H / 2 + 30);
  ctx.restore();
}

export function drawMenuScreen(ctx, modes, selectedIndex) {
  ctx.save();
  drawBackground(ctx);
  drawCenterLine(ctx);

  ctx.textAlign = 'center';
  ctx.fillStyle = COLOR_FG;
  ctx.font = '24px "Press Start 2P"';
  ctx.fillText('SELECT MODE', CANVAS_W / 2, CANVAS_H / 2 - 100);

  modes.forEach((mode, i) => {
    ctx.font = '16px "Press Start 2P"';
    if (i === selectedIndex) {
      ctx.fillStyle = COLOR_LINE;
      ctx.fillText(`> ${mode.label}`, CANVAS_W / 2, CANVAS_H / 2 - 20 + i * 50);
    } else {
      ctx.fillStyle = COLOR_FG;
      ctx.fillText(mode.label, CANVAS_W / 2, CANVAS_H / 2 - 20 + i * 50);
    }
  });

  ctx.font = '11px "Press Start 2P"';
  ctx.fillStyle = COLOR_FG;
  ctx.fillText('PRESS ENTER TO START', CANVAS_W / 2, CANVAS_H - 60);

  ctx.restore();
}
