import { createCanvas } from 'canvas';

export function generateHelpCard() {
  const W = 520;
  const H = 400;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = '#1e1e2f';
  ctx.fillRect(0, 0, W, H);

  // 标题
  ctx.fillStyle = '#e0e0ff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✨ 星缘机器人 · 指令帮助 ✨', W / 2, 50);

  // 分隔线
  ctx.strokeStyle = '#444466';
  ctx.beginPath();
  ctx.moveTo(30, 70);
  ctx.lineTo(W - 30, 70);
  ctx.stroke();

  // 基础指令标题
  ctx.fillStyle = '#a0d0ff';
  ctx.font = 'bold 18px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('📖 基础指令（所有人可用）', 30, 100);

  // 基础指令内容
  ctx.fillStyle = '#c0c0e0';
  ctx.font = '16px sans-serif';
  const lines = [
    '#帮助  ·················  查看本帮助信息',
    '#权限  ·················  查询自己的权限等级',
  ];
  lines.forEach((line, i) => {
    ctx.fillText(line, 40, 130 + i * 28);
  });

  // 主人指令标题
  ctx.fillStyle = '#ffd0a0';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('👑 主人指令（仅主人可用）', 30, 210);

  // 主人指令内容
  ctx.fillStyle = '#c0c0e0';
  ctx.font = '16px sans-serif';
  const ownerLines = [
    '#状态  ·················  查看机器人运行状态',
    '#退出  ·················  关闭机器人',
  ];
  ownerLines.forEach((line, i) => {
    ctx.fillText(line, 40, 240 + i * 28);
  });

  // 底部提示
  ctx.fillStyle = '#808080';
  ctx.font = '14px sans-serif';
  ctx.fillText('💡 更多功能正在开发中，敬请期待~', 30, H - 30);

  return { type: 'image', file: canvas.toBuffer('image/png') };
}
