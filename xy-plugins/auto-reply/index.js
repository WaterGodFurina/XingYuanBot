export default async function handler({ msg, sendMsg, text, isGroup }) {
  const type = isGroup ? 'group' : 'private';

  if (text.includes('你好') || text.includes('在吗') || text.includes('hello')) {
    const replies = [
      "你好呀！有什么我可以帮你的吗？😊",
      "我在的，随时待命！",
      "嘿嘿，想我啦？"
    ];
    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    await sendMsg(msg.user_id, randomReply, type);
  }
}
