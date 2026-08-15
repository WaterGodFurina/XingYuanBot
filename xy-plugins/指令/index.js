import { generateHelpCard } from './card.js';
import { pathToFileURL } from 'url';

export default {
  name: '指令',
  // ✅ 统一加上前缀判断
  match: (text) => {
    const hasPrefix = text.startsWith('#') || text.startsWith('/');
    if (!hasPrefix) return false;
    
    return text.includes('帮助') || text.includes('状态') || text.includes('退出') || text.includes('权限') || text.includes('重启'));
  },
  
  handle: async ({ text, chatId, isGroup, senderName, role }) => {

    // ─── [ #权限 ] 指令 ──────────────────────────────────
    if (text.includes('权限')) {
      const roleMap = {
        master: '👑 大主人（最高权限）',
        owner: '🌟 小主人（主人权限）',
        admin:  '🛡️ 管理员',
        member: '👤 普通成员'
      };
      return `【${senderName}】的权限等级：${roleMap[role] || '未知'}`;
    }

    // ─── [ #帮助 ] 指令 ──────────────────────────────────
    if (text.includes('帮助')) {
      const cardBuffer = generateHelpCard();
      return { type: 'image', file: cardBuffer };
    }

    // ─── [ #状态 ] 指令 ──────────────────────────────────
    if (text.includes('状态')) {
      if (role === 'member') {
        return '❌ 权限不足：该指令仅限管理员及以上身份使用。';
      }
      const mem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
      const uptime = Math.floor(process.uptime());
      return `◆ 运行状态：正常\n◆ 内存占用：${mem} MB\n◆ 运行时间：${uptime} 秒`;
    }

    // ===== ( #重启 ) 指令 =====
    if (text.includes('重启')) {
        if (role !== 'master' && role !== 'owner') {
            return '❌ 权限不足：仅主人可执行重启操作。';
        }

        const { sendMsg } = await import('../../xy-bot/adapter.js');
        const { spawn } = await import('child_process');

        await sendMsg(chatId, '🔷 机器人正在重启，请稍候...', isGroup);

        // 1. 后台杀端口
        spawn('python', ['script.py'], {
            detached: true,
            stdio: 'ignore',
            shell: true
        }).unref();

        // 2. 弹窗启动新进程
        spawn('cmd.exe', ['/c', 'start', 'cmd', '/k', 'pnpm run app'], {
            detached: true,
            stdio: 'ignore',
            shell: true
        }).unref();

        // 3. 延迟2秒再退出，确保子进程已经启动
        setTimeout(() => {
            process.exit(0);
        }, 2000);

    // ─── [ #退出 ] 指令 ──────────────────────────────────
    if (text.includes('退出')) {
      if (role !== 'master' && role !== 'owner') {
        return '❌ 权限不足：仅主人可执行关闭操作。';
      }
      const { sendMsg } = await import('../../xy-bot/adapter.js');
      await sendMsg(chatId, '◆ 机器人已关闭。', isGroup);
      process.exit(0);
      return null;
    }

    return null;
  }
}
}
