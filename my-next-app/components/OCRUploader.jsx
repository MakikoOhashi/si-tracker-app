//my-next-app/components/OCRUploader.jsx

import React, { useState, useEffect } from "react";
import { Card, DropZone, Text, Spinner, TextField, Button } from "@shopify/polaris";
import Tesseract from "tesseract.js";

export default function OCRUploader() {
  const [file, setFile] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null); // AIからのJSON
  const [form, setForm] = useState(null);        // 編集用

  // 画像アップロードハンドラー
  const handleDrop = (_dropFiles, acceptedFiles, _rejectedFiles) => {
    setFile(acceptedFiles[0]);
    setOcrText("");
    setAiResult(null);
    setForm(null);
  };

  // OCR実行
  const handleOcr = async () => {
    if (!file) return;
    setLoading(true);
    setAiResult(null);
    setForm(null);
    try {
      const { data } = await Tesseract.recognize(file, "jpn+eng", {
        logger: m => console.log(m), // 進捗確認用
      });
      setOcrText(data.text);
    } finally {
      setLoading(false);
    }
  };

    // AI整形ボタン押下時
  const handleAiParse = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ocrText }),
      });
      const data = await res.json();
      try {
        setAiResult(JSON.parse(data.result));
      } catch {
        setAiResult(data.result);
      }
    } finally {
      setAiLoading(false);
    }
  };
    // AI結果が来たらフォーム内容セット
    useEffect(() => {
      if (aiResult) setForm(aiResult);
    }, [aiResult]);
  
    // 保存ボタン（Supabase保存処理は別途実装）
    const handleSaveToSupabase = async () => {
      // ここでSupabaseにformを送信する処理を書く
      alert("保存処理を実装してください");
    };

  return (
    <Card sectioned title="画像アップロード & OCR">
      <DropZone accept="image/*" onDrop={handleDrop}>
        {!file ? (
          <div style={{ textAlign: "center", padding: 20, width: "100%" }}>
          <Text variant="bodyMd" as="span">
            ここに画像をドロップ、またはクリックして選択
          </Text>
        </div>
        ) : (
          <Text variant="bodyMd">{file.name}</Text>
        )}
      </DropZone>
      {file && (
        <div style={{ marginTop: 16 }}>
          <button onClick={handleOcr} disabled={loading}>
            OCR実行
          </button>
        </div>
      )}
      {loading && <Spinner />}
      {ocrText && (
        <div style={{ marginTop: 16 }}>
          <Text variant="headingMd">OCR結果</Text>
          <pre style={{ whiteSpace: "pre-wrap", background: "#f4f6f8", padding: 8 }}>{ocrText}</pre>
          <div style={{ marginTop: 16 }}>
            <Button onClick={handleAiParse} disabled={aiLoading}>AIで整形</Button>
            {aiLoading && <Spinner />}
          </div>
        </div>
      )}
    
    {/* // AI整形ボタンと結果表示 */}
    {form && (
        <div style={{ marginTop: 24 }}>
          <Text variant="headingMd">整形データの確認・編集</Text>
          <div style={{ marginTop: 16 }}>
            <TextField
              label="SI番号"
              value={form.si_number || ""}
              onChange={val => setForm(f => ({ ...f, si_number: val }))}
              autoComplete="off"
            />
            <TextField
              label="仕入先"
              value={form.supplier || ""}
              onChange={val => setForm(f => ({ ...f, supplier: val }))}
              autoComplete="off"
            />
            <TextField
              label="ETA"
              value={form.eta || ""}
              onChange={val => setForm(f => ({ ...f, eta: val }))}
              autoComplete="off"
            />
          </div>
          <div style={{ marginTop: 16 }}>
            <Text variant="bodyMd">商品リスト</Text>
            <div style={{ marginTop: 8 }}>
              {Array.isArray(form.items) && form.items.map((item, idx) => (
                <div key={idx} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                  <TextField
                    label="商品名"
                    value={item.name || ""}
                    onChange={val =>
                      setForm(f => {
                        const items = [...f.items];
                        items[idx] = { ...items[idx], name: val };
                        return { ...f, items };
                      })
                    }
                    autoComplete="off"
                  />
                  <TextField
                    label="数量"
                    value={item.quantity || ""}
                    onChange={val =>
                      setForm(f => {
                        const items = [...f.items];
                        items[idx] = { ...items[idx], quantity: val };
                        return { ...f, items };
                      })
                    }
                    autoComplete="off"
                    type="number"
                  />
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <Button primary onClick={handleSaveToSupabase}>
              保存
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}