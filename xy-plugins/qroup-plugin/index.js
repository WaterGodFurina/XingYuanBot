import fetch from 'node-fetch';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { getRole } from '../../xy-config/config/permissions.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MENU_PATH = path.resolve(__dirname, '../指令/menu.json');
const API = 'http://127.0.0.1:3002';

const myCommands = [
  { cmd: '#踢@成员', desc: '将指定成员踢出群聊' },
  { cmd: '#禁言@成员QQ号 秒', desc: '禁言指定成员，默认600秒' },
  { cmd: '#解禁@QQ号', desc: '解除指定成员的禁言' },
];

function injectHelp() {
  if (!fs.existsSync(MENU_PATH)) {
    console.log('[群管] 找不到 menu.json，跳过帮助注册');
    return;
  }
  try {
    let menu = JSON.parse(fs.readFileSync(MENU_PATH, 'utf-8'));
    const existingCmds = Object.values(menu.commands || {}).map(v => v.cmd);
    const alreadyInjected = myCommands.every(c => existingCmds.includes(c.cmd));

    if (alreadyInjected) {
      console.log('[群管] 指令已存在，跳过引入');
      return;
    }

    let maxId = 0;
    for (const key of Object.keys(menu.commands || {})) {
      const num = parseInt(key);
      if (!isNaN(num) && maxId < num) maxId = num;
    }

    const myIds = [];
    for (const item of myCommands) {
      maxId++;
      if (!menu.commands) menu.commands = {};
      menu.commands[maxId] = { cmd: item.cmd, desc: item.desc };
      myIds.push(maxId);
    }

    if (!menu.categories) menu.categories = [];
    menu.categories.push({
      name: '群管',
      description: '群管理（管理员及以上可用）',
      color: '#459c5f',
      items: myIds
    });

    menu.version = (menu.version || 0) + 1;
    fs.writeFileSync(MENU_PATH, JSON.stringify(menu, null, 4), 'utf-8');
    console.log('[群管] 帮助信息已注册到 menu.json，版本已升至:', menu.version);
  } catch (e) {
    console.error('[群管] 读取 menu.json 失败:', e.message);
  }
}

injectHelp();

function parseText(text) {
  let textStr = '';
  if (Array.isArray(text)) {
    textStr = text.map(item => item?.data?.text ? item.data.text : '').join('');
  } else if (typeof text === 'object' && text != null && text.text !== undefined) {
    textStr = text.text;
  } else if (typeof text === 'string') {
    textStr = text;
  } else {
    textStr = String(text || '');
  }
  return textStr;
}

export default {
  name: '群管',
  description: '匹配规则：消息包含 #踢/#禁言/#解禁 且后面有 @ 符号触发',
  match: (text) => {
    if (!text) return false;
    let textStr = parseText(text);
    textStr = textStr.trim();
    if (!textStr) return false;

    const hasPrefix = textStr.startsWith('#');
    if (!hasPrefix) return false;

    const cmd = textStr.replace(/^#s#|#/g, '').trim();
    return cmd.startsWith('踢') || cmd.startsWith('禁言') || cmd.startsWith('解禁');
  },

  handle: async function({ text, chatId, isGroup, senderName, senderQQ, role }) {
    if (!text) return false;

    let textStr = parseText(text);
    textStr = textStr.trim();
    if (!textStr) return false;

    const hasPrefix = textStr.startsWith('#');
    if (!hasPrefix) return false;

    const cmd = textStr.replace(/^#s#|#/g, '').trim();

    // 提取目标QQ号
    let targetQQ = null;

    if (Array.isArray(text)) {
      const atItem = text.find(item => item?.type === 'at');
      if (atItem && atItem.data && atItem.data.qq) {
        targetQQ = String(atItem.data.qq);
      }
    }

    if (!targetQQ) {
        // 提取 @ 后面的非空白字符串（如 "芙芙" 或 "3758575163600"）
        const match = textStr.match(/@([^\s]+)/);
        if (match) {
            const keyword = match[1];
            try {
                const memberRes = await fetch(`${API}/get_group_member_list?group_id=${chatId}`);
                const memberData = await memberRes.json();
                const members = memberData?.data || [];

                // 遍历寻找最匹配的群成员
                const found = members.find(m => {
                    const uid = String(m.user_id);
                    // 1. 如果输入的是QQ号粘包（如 "3758575163600" 包含 "3758575163"）
                    if (keyword.startsWith(uid)) return true;
                    // 2. 如果输入的是昵称/群名片
                    if ((m.nickname && keyword.includes(m.nickname)) || 
                        (m.card && keyword.includes(m.card))) return true;
                    return false;
                });

                if (found) {
                    targetQQ = String(found.user_id);
                    // 关键：如果是粘包，把QQ号从关键字里切掉，剩下的部分（如 "600"）留给后面的时长解析
                    if (keyword.startsWith(targetQQ) && keyword.length > targetQQ.length) {
                        // 将多余的数字还给 textStr，让后面的时长正则能重新匹配到
                        const remaining = keyword.slice(targetQQ.length);
                        textStr = textStr.replace(keyword, targetQQ + ' ' + remaining);
                    }
                }
            } catch (e) {
                console.error('匹配群成员失败:', e);
            }
        }
    }

    // 检查群权限
    let isGroupAdmin = false;
    try {
      const res = await fetch(`${API}/get_group_member_info?group_id=${chatId}&user_id=${senderQQ}`);
      const data = await res.json();
      const rawRole = data?.data?.role;
      if (rawRole === 'owner' || rawRole === 'admin') {
        isGroupAdmin = true;
      }
    } catch (e) {
      // 忽略
    }

    const configAdmin = ['master', 'owner', 'admin'];
    let hasPermission = isGroupAdmin || configAdmin.includes(role);

    if (!hasPermission && typeof getRole === 'function') {
      const userRole = getRole(senderQQ);
      if (configAdmin.includes(userRole)) hasPermission = true;
    }

    if (!hasPermission) {
      return '❌ 权限不足：此命令仅限群主、管理员或配置文件中的主人使用。';
    }

    // 踢人
    if (cmd.startsWith('踢')) {
      try {
        const res = await fetch(`${API}/set_group_kick`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group_id: Number(chatId),
            user_id: Number(targetQQ),
            reject_add_request: false
          })
        });
        const result = await res.json();
        if (result.status === 'ok') {
          return `✅ 已成功踢出 ${targetQQ}`;
        } else {
          return `❌ 踢人失败：${result.msg || result.message}`;
        }
      } catch (err) {
        return `❌ 请求失败：${err.message}`;
      }
    }

    // 禁言
    if (cmd.startsWith('禁言')) {
      let duration = 600;

      // 精确做法：从 cmd 中移除 targetQQ，剩下的数字才是时长
      let cmdClean = cmd;
      if (targetQQ) {
        cmdClean = cmd.replace(targetQQ, '');
      }

      const durationMatch = cmdClean.match(/(\d+)/);
      if (durationMatch) {
        duration = parseInt(durationMatch[1]) * 600;
      }

      try {
        console.log('[调试] 准备禁言，参数为:', { chatId, targetQQ, duration });
        const res = await fetch(`${API}/set_group_ban`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group_id: Number(chatId),
            user_id: Number(targetQQ),
            duration: duration
          })
        });
        const result = await res.json();
        if (result.status === 'ok') {
          return `✅ 已禁言 @${targetQQ} ${duration}秒`;
        } else {
          return `❌ 禁言失败：${result.msg || result.message}`;
        }
      } catch (err) {
        return `❌ 请求失败：${err.message}`;
      }
    }

    // 解禁
    if (cmd.startsWith('解禁')) {
      try {
        const res = await fetch(`${API}/set_group_ban`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            group_id: Number(chatId),
            user_id: Number(targetQQ),
            duration: 0
          })
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

    return '⚠️ 用法：\n#踢@成员\n#禁言@成员 时长\n#解禁@成员';
  }
};
