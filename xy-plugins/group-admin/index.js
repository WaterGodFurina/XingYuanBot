const NAPCAT_HTTP = 'http://127.0.0.1:3000';

// 调用 OneBot API 的封装
async function callApi(action, data) {
    try {
        console.log(`[群管插件] 调用 API: ${action}`, data);
        const res = await fetch(`${NAPCAT_HTTP}/${action}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        const result = await res.json();
        console.log(`[群管插件] API 返回:`, result);
        if (result.status !== 'ok') throw new Error(result.message || 'API调用失败');
        return result.data;
    } catch (err) {
        console.error(`[群管插件] 错误:`, err.message);
        throw err;
    }
}

export default async function handler({ msg, sendMsg, text, isGroup }) {
    // 1. 打印接收到的消息结构，方便我们调试
    console.log('[群管插件] 收到消息:', { text, isGroup, role: msg.role, sender: msg.sender });

    if (!isGroup) return; // 不在群里直接返回

    // 2. 极其宽松的指令匹配：只要包含“禁言”或“踢人”
    if (text.includes('禁言')) {
        await sendMsg(msg.group_id, '收到禁言指令，正在处理...', 'group');
        
        // 尝试从 text 中提取 QQ 号（兼容直接发QQ号或 @QQ）
        const qqMatch = text.match(/[1-9][0-9]{4,10}/);
        if (!qqMatch) {
            return await sendMsg(msg.group_id, '未检测到 QQ 号，格式如：禁言 12345678', 'group');
        }
        const targetQq = parseInt(qqMatch[0]);

        try {
            // 禁言 10 分钟 (600秒)
            await callApi('set_group_ban', {
                group_id: msg.group_id,
                user_id: targetQq,
                duration: 600
            });
            await sendMsg(msg.group_id, `✅ 成功禁言 ${targetQq} 10分钟`, 'group');
        } catch (e) {
            await sendMsg(msg.group_id, `❌ 禁言失败: ${e.message}`, 'group');
        }
        return;
    }

    if (text.includes('踢人')) {
        await sendMsg(msg.group_id, '收到踢人指令，正在处理...', 'group');
        
        const qqMatch = text.match(/[1-9][0-9]{4,10}/);
        if (!qqMatch) {
            return await sendMsg(msg.group_id, '未检测到 QQ 号，格式如：踢人 12345678', 'group');
        }
        const targetQq = parseInt(qqMatch[0]);

        try {
            await callApi('set_group_kick', {
                group_id: msg.group_id,
                user_id: targetQq,
                reject_add_request: false
            });
            await sendMsg(msg.group_id, `✅ 成功踢出 ${targetQq}`, 'group');
        } catch (e) {
            await sendMsg(msg.group_id, `❌ 踢人失败: ${e.message}`, 'group');
        }
        return;
    }
}
