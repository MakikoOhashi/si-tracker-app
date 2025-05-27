import { generateGeminiContent } from "../../lib/geminiClient";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }
  const { text } = req.body;
  if (!text) {
    res.status(400).json({ error: "Missing text" });
    return;
  }
  try {
    const aiText = await generateGeminiContent(text);
    res.status(200).json({ result: aiText });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || String(e) });
  }
}