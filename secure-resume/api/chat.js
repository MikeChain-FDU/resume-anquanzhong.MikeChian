export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ text: '🔴 接口连通正常，请使用 POST 方法。' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ text: '🔴 服务器未配置 API Key。' });
  }

  const { contents, systemInstruction } = req.body;

  try {
    // 💡 提取前端的人设文本
    const systemPromptText = systemInstruction?.parts?.[0]?.text || "你是候选人的AI分身。";
    
    // 🧠 核心稳定机制：将人设作为对话的第一轮，彻底抛弃容易报错的 systemInstruction 结构
    const robustContents = [
      { role: "user", parts: [{ text: systemPromptText }] },
      { role: "model", parts: [{ text: "明白，我已经准备好作为算法科学家的数字分身，解答任何关于简历和底层逻辑的问题。" }] },
      ...contents
    ];

    // 🚀 核心修复：完全对齐 2026 年最新的 Google API Quickstart 官方标准，使用最新模型
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: robustContents 
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
