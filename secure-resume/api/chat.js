export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ text: '🔴 接口连通正常，请使用 POST 方法。' });
  }

  // 1. 获取你的中转 API Key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(200).json({ text: '🔴 服务器未配置 API Key。' });
  }

  const { contents, systemInstruction } = req.body;

  try {
    // 2. 提取系统提示词 (System Prompt)
    const systemPromptText = systemInstruction?.parts?.[0]?.text || "你是候选人的AI分身。";

    // 3. 核心转换：将前端传来的 Gemini 格式，翻译成中转 API 需要的 OpenAI 格式
    const messages = [
      { role: "system", content: systemPromptText } // 注入人设
    ];

    if (contents && Array.isArray(contents)) {
      contents.forEach(msg => {
        // OpenAI 的角色是 user 和 assistant，需要转换
        const role = msg.role === "model" ? "assistant" : "user";
        const text = msg.parts?.[0]?.text || "";
        if (text) {
          messages.push({ role: role, content: text });
        }
      });
    }

    // 4. 使用指南中提供的中转 API 地址 (必须加上 /chat/completions)
    const url = "https://new.lemonapi.site/v1/chat/completions";

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // OpenAI 标准的鉴权方式：Bearer Token
        'Authorization': `Bearer ${apiKey}` 
      },
      body: JSON.stringify({
        // 严格按照指南，带上 [L] 前缀的模型名
        model: "[L]gemini-3-flash-preview", 
        messages: messages,
        stream: false // 严格按照指南：关闭流式输出
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
        return res.status(200).json({ text: `🔴 中转接口报错: ${data.error?.message || '未知错误'}` });
    }

    // 5. 按照 OpenAI 的格式解析返回的文字
    const aiText = data.choices?.[0]?.message?.content;
    res.status(200).json({ text: aiText || '🔴 模型未返回文字。' });

  } catch (error) {
    res.status(200).json({ text: `🔴 服务器内部运行崩溃: ${error.message}` });
  }
}
