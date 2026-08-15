import { WebSocketServer } from 'ws';
import { loadPlugins } from './plugin-loader.js';
import { getRole } from '../xy-config/config/permissions.js'; // ✅ 引入权限函数

const WS_PORT = 3001;
let plugins = [];
let wsClient = null;

export async function connectOneBot() {
  plugins = await loadPlugins();

  const wss = new WebSocketServer({ port: WS_PORT });
  console.log(`◆ 机器人服务端已启动，监听端口 ${WS_PORT}...\n`);

  wss.on('connection', (ws) => {
    console.log('◆ NapCat 已连接！');
    wsClient = ws;

    ws.on('message', async (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.post_type !== 'message') return;

        const isGroup = msg.message_type === 'group';
        const chatId = isGroup ? msg.group_id : msg.user_id;
        const senderName = msg.sender?.nickname || '未知';
        const senderQQ = String(msg.user_id); // ✅ 提取发送者QQ号

        // 提取文本
        let text = '';
        if (Array.isArray(msg.message)) {
          for (const seg of msg.message) {
            if (seg.type === 'text') {
              text += seg.data.text.trim();
            }
          }
        }

        if (!text) return;

        // ✅ 获取发送者的权限等级 (master / owner / admin / member)
        const role = getRole(senderQQ);

        // 遍历插件并匹配
        for (const { name, handler } of plugins) {
          if (typeof handler.match === 'function' && handler.match(text)) {
            // ✅ 将 senderQQ 和 role 一起传给插件
            const reply = await handler.handle({ 
              text, 
              chatId, 
              isGroup, 
              senderName, 
              senderQQ, 
              role 
            });
            
            if (reply) {
              await sendMsg(chatId, reply, isGroup);
            }
            break;
          }
        }
      } catch (e) {
        console.error('❌ 消息处理出错:', e);
      }
    });
  });
}

// 发送消息给 NapCat（使用 OneBot V11 标准格式）
export async function sendMsg(chatId, text, isGroup) {
  if (!wsClient) return;

  const payload = {
    action: 'send_msg',
    params: {
      message_type: isGroup ? 'group' : 'private',
      [isGroup ? 'group_id' : 'user_id']: chatId,
      message: [
        { type: 'text', data: { text: String(text) } }
      ]
    }
  };

  wsClient.send(JSON.stringify(payload));
  console.log(`[机器人 ➔ ${isGroup ? '群' : '私聊'} ${chatId}]: ${text}`);
}
