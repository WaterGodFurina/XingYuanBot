import { createCanvas } from 'canvas';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_PATH = join(__dirname, 'menu.json');
const TEMP_DIR  = resolve(__dirname, '../../temp');
const IMG_PATH  = join(TEMP_DIR, 'help_card.png');
const VER_PATH  = join(TEMP_DIR, 'version.txt');

export async function generateHelpCard() {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }

  const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  const { version, title, footer, commands, categories } = data;

  let oldVer = 0;
  if (fs.existsSync(VER_PATH)) {
    oldVer = parseInt(fs.readFileSync(VER_PATH, 'utf-8').trim()) || 0;
  }

  // 版本没变且图片存在，直接返回缓存
  if (version === oldVer && fs.existsSync(IMG_PATH)) {
    console.log('[Card] 版本未变化，使用缓存图片');
    return IMG_PATH;
  }

  console.log('[Card] 检测到数据变化，正在重新生成帮助卡片...');

  // 创建画布
  const canvas = createCanvas(800, 600);
  const ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, 800, 600);

  // 标题
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText(title || '星缘机器人 · 帮助', 30, 50);

  let y = 100;
  // 遍历分类
  for (const cat of categories) {
    ctx.fillStyle = cat.color || '#a0d0ff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(cat.name, 30, y);
    y += 40;

    ctx.font = '20px sans-serif';
    ctx.fillStyle = '#e0e0e0';
    for (const id of cat.items) {
      const item = commands[id];
      if (item) {
        ctx.fillText(`${item.cmd} ${item.desc}`, 50, y);
        y += 32;
      }
    }
    y += 20;
  }

  // 底部文字
  ctx.fillStyle = '#888888';
  ctx.font = '16px sans-serif';
  ctx.fillText(footer || '', 30, 570);

  // 保存为图片
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync(IMG_PATH, buffer);

  // 写入版本号
  fs.writeFileSync(VER_PATH, String(version));

  console.log('[Card] 生成完毕，已保存到 temp/');
  return IMG_PATH;
}
