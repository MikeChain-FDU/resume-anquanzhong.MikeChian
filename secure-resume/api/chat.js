export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ text: '🔴 接口连通正常，请使用 POST 方法。' });
  }

  // 从云端环境变量读取 Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ text: '🔴 服务器未配置 API Key。' });
  }

  // 接收前端传来的对话数据和人设
  const { contents, systemInstruction } = req.body;

  try {
    // 🚀 核心修复：提取前端的人设文本，彻底抛弃不稳定的 systemInstruction 字段
    const systemPromptText = systemInstruction?.parts?.[0]?.text || "你是候选人的AI分身。";
    
    // 🧠 记忆注入：将人设强行作为对话的第一轮，这招 100% 兼容所有大模型接口
    const robustContents = [
      { role: "user", parts: [{ text: systemPromptText }] },
      { role: "model", parts: [{ text: "明白，我已经准备好作为算法科学家的数字分身，解答任何关于简历和底层逻辑的问题。" }] },
      ...contents
    ];

    // 依然使用最稳定的 v1 接口
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: robustContents // 💡 这里现在只传标准的 contents 数组！
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
        return res.status(200).json({ text: `🔴 Google 接口报错: ${data.error?.message || '未知错误'}` });
    }

    const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    res.status(200).json({ text: aiText || '🔴 模型未返回文字。' });

  } catch (error) {
    res.status(200).json({ text: `🔴 服务器内部运行崩溃: ${error.message}` });
  }
}
