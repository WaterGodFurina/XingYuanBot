import fetch from 'node-fetch';

const API = 'http://127.0.0.1:3002';

export default {
  name: '群管',

  match: (text) => {
    if (!text) return false;
    const hasPrefix = text.startsWith('#') || text.startsWith('＃');
    if (!hasPrefix) return false;
    const cmd = text.replace(/^[#＃]/, '').trim();
    return /^(踢|禁言|解禁)\s*@?\d+/.test(cmd);
  },

  handle: async ({ text, chatId, isGroup, role }) => {
    if (!isGroup) return '❌ 该指令仅限群聊使用。';

    const allowedRoles = ['master', 'owner', 'admin'];
    if (!allowedRoles.includes(role)) {
      return '❌ 权限不足，仅管理员及以上可使用。';
    }

    const cmd = text.replace(/^[#＃]/, '').trim();

    // === 踢人 ===
    const kickMatch = cmd.match(/^踢(人)?\s*@?(\d+)/);
    if (kickMatch) {
      const targetQQ = kickMatch[2];
      try {
        const res = await fetch(`${API}/set_group_kick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group_id: chatId,
            user_id: targetQQ,
            reject_add_request: false,
          }),
        });
        const result = await res.json();
        if (result.status === 'ok') {
          return `✅ 已成功踢出 @${targetQQ}`;
        } else {
          return `❌ 踢人失败：${result.msg || result.message}`;
        }
      } catch (err) {
        return `❌ 请求失败：${err.message}`;
      }
    }

    // === 禁言 ===
    const banMatch = cmd.match(/^禁言\s*@?(\d+)(?:\s+(\d+))?/);
    if (banMatch) {
      const targetQQ = banMatch[1];
      const duration = banMatch[2] ? parseInt(banMatch[2]) : 600; // 默认禁言10分钟
      try {
        const res = await fetch(`${API}/set_group_ban`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group_id: chatId,
            user_id: targetQQ,
            duration: duration,
          }),
        });
        const result = await res.json();
        if (result.status === 'ok') {
          return `✅ 已成功禁言 @${targetQQ} ${duration}秒`;
        } else {
          return `❌ 禁言失败：${result.msg || result.message}`;
        }
      } catch (err) {
        return `❌ 请求失败：${err.message}`;
      }
    }

    // === 解禁 ===
    const unbanMatch = cmd.match(/^解禁\s*@?(\d+)/);
    if (unbanMatch) {
      const targetQQ = unbanMatch[1];
      try {
        const res = await fetch(`${API}/set_group_ban`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group_id: chatId,
            user_id: targetQQ,
            duration: 0,
          }),
        });
        const result = await res.json();
        if (result.status === 'ok') {
          return `✅ 已成功解除 @${targetQQ} 的禁言`;
        } else {
          return `❌ 解禁失败：${result.msg || result.message}`;
        }
      } catch (err) {
        return `❌ 请求失败：${err.message}`;
      }
    }

    return '❓ 用法：\n#踢@QQ号\n#禁言@QQ号 时长(秒，默认600)\n#解禁@QQ号';
  },
};
