export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ text: '🔴 接口连通正常，请使用 POST 方法。' });
  }

  // 🛡️ 核心安全机制：从云端环境变量读取 Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ text: '🔴 服务器未配置 API Key。' });
  }

  const { contents, systemInstruction } = req.body;

  try {
    // 🚀 核心修复：使用 v1 正式版接口，并明确指定 -latest 后缀，确保 100% 命中模型
    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: contents,
        systemInstruction: systemInstruction
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
