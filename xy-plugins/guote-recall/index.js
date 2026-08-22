export default {
  name: "引用撤回",
  description: "回复消息 + 发送 #撤回",

  match: function (text, msg) {
    let txt = "";
    if (typeof text === "string") txt = text;
    else if (Array.isArray(text)) {
      for (let s of text) {
        if (s && s.type === "text") txt += (s.data && s.data.text ? s.data.text : "");
      }
    }
    return /#?撤回/.test(txt.toLowerCase());
  },

  handle: async function (msg, matchResult) {
    console.log(`[撤回] handle 开始, msg.text: ${msg.text}`);

    let text = msg.text || "";
    let m = text.match(/\[引用ID:(\d+)\]/);
    if (!m) {
      console.log(`[撤回] 未找到引用ID`);
      return;
    }
    let refId = m[1];
    console.log(`[撤回] 目标消息ID: ${refId}`);

    try {
      const response = await fetch(`http://127.0.0.1:3000/delete_msg`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message_id: parseInt(refId) })
      });
      const result = await response.json();
      if (result.status === "ok" || result.retcode === 0) {
        console.log(`[撤回] 撤回成功 ✅`);
      } else {
        console.log(`[撤回] 撤回失败:`, result);
      }
    } catch (error) {
      console.log(`[撤回] 异常:`, error.message);
    }
  }
}
