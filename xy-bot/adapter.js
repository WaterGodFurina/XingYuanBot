import { WebSocketServer } from 'ws';
import { loadPlugins } from './plugin-loader.js';
import { getRole } from '../xy-config/config/permissions.js'; // ✅ 引入权限函数
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
        // 【优化】只提取核心信息打印，过滤掉无用的元数据
        if (msg.post_type === 'message') {
            // 1. 提取基础信息
            const senderId = msg.sender?.user_id || msg.user_id;
            const nickname = msg.sender?.card || msg.sender?.nickname || '未知用户';
            const groupId = msg.group_id;
            
            // 2. 简单处理一下消息内容（防止内容太长刷屏）
            // 这里我们只取原始消息的前50个字符作为预览
            let contentPreview = JSON.stringify(msg.message).substring(0, 50); 

            console.log(`[收到消息] 群:${groupId} | 用户:${nickname}(${senderId}) | 内容预览: ${contentPreview}...`);
        }

        if (msg.post_type !== 'message') return;

        const isGroup = msg.message_type === 'group';
        const chatId = isGroup ? msg.group_id : msg.user_id;
        const senderName = msg.sender?.card || msg.sender?.nickname || '未知';
        const senderQQ = String(msg.user_id); // ✅ 提取发送者QQ号

       // 提取文本
       let text = "";
       if (Array.isArray(msg.message)) {
       for (const seg of msg.message) {
        
        if (seg.type === 'text') {
          text += seg.data.text.trim();
        } else if (seg.type === 'at') {
          const atId = seg.data.qq || seg.data.id || seg.data.user_id || seg.data.target;
          text += `@${atId}`;
        }
      }
    }

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
export async function sendMsg(chatId, reply, isGroup) {
  if (!wsClient) return;

  let messageSegs = [];

  // 识别是图片还是文本
  if (reply && typeof reply === 'object') {
    // 图片格式：写临时文件后用本地路径发送（适配 LLOneBot）
    const tempDir = path.join(__dirname, '../temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    const fileName = `img_${Date.now()}.png`;
    const filePath = path.join(tempDir, fileName);

    const buffer = Buffer.from(reply.file.file);
    fs.writeFileSync(filePath, buffer);

    messageSegs.push({
      type: 'image',
      data: {
        file: filePath
      }
    });
  } else {
    // 文本格式
    messageSegs.push({
      type: 'text',
      data: {
        text: String(reply)
      }
    });
  }

  const payload = {
    action: 'send_msg',
    params: {
      message_type: isGroup ? 'group' : 'private',
      [isGroup ? 'group_id' : 'user_id']: chatId,
      message: messageSegs
    }
  };

  wsClient.send(JSON.stringify(payload));
  
  // 终端日志
  console.log(`[机器人 -> ${isGroup ? '群' : '私聊'} ${chatId}]: ${reply.type === 'image' ? '[图片]' : reply}`);
}
