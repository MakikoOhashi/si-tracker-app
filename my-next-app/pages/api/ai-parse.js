//pages/api/ai-parse.js

import { generateGeminiContent } from "../../lib/geminiClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  const { text, fields } = req.body;
  if (!text) {
    res.status(400).json({ error: "Missing text" });
    return;
  }
    // 未入力項目だけリストアップ
    const missing = Object.entries(fields).filter(([_, v]) => !v).map(([k]) => k);

    if(missing.length === 0) {
      res.status(200).json({ result: JSON.stringify({}) });
      return;
    }
  
    // AIへのプロンプト設計
    const prompt = `
  次の請求書テキストから、以下の項目（未入力）を推測し、日本語で返してください。
  不足項目: ${missing.join(", ")}
  
  既に判明している項目:
  ${Object.entries(fields).filter(([_, v]) => v).map(([k,v]) => `- ${k}: ${v}`).join("\n")}
  
  請求書原文:
  ${text}
  
  返答は、以下のようなJSON形式で、未入力項目のみ返してください。
  例: {"si_number": "INV12345", "eta": "2024-05-01"}
  `;
  
    try {
      const aiText = await generateGeminiContent(prompt);
      res.status(200).json({ result: aiText });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: e.message || String(e) });
    }
  }