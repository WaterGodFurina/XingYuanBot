export default async function handler({ msg, sendMsg, text, isGroup }) {
  if (!isGroup) return; // 仅在群聊生效

  if (text.includes('群号') || text.includes('群ID') || text.includes('群信息')) {
    await sendMsg(msg.user_id, `📌 当前群号：${msg.group_id}`, 'group');
  } 
  else if (text.includes('我的QQ')) {
    await sendMsg(msg.user_id, `🎫 你的QQ号是：${msg.user_id}`, 'group');
  }
}
