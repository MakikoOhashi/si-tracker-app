//my-next-app/components/OCRUploader.jsx

import React, { useState, useEffect } from "react";
import { Card, DropZone, Text, Spinner, TextField, Button, Banner } from "@shopify/polaris";
import Tesseract from "tesseract.js";


export default function OCRUploader() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrTextEdited, setOcrTextEdited] = useState(""); // 編集可能なOCRテキスト
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState(null); // AIからのJSON
  const [fields, setFields] = useState({
    si_number: "",
    supplier: "",
    eta: "",
    amount: ""
  });
  const [error, setError] = useState("");



  // PDFをCanvas画像化→OCR
  const pdfToImageAndOcr = async (pdfFile) => {
    try {
      // PDFをFormDataでAPIに送る
      const formData = new FormData();
      formData.append("file", pdfFile);
      const res = await fetch("/api/pdf2image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.url) throw new Error("画像変換失敗");
  
      // 画像URLをプレビュー用にセット
      setImageUrl(data.url);
  
      // OCR
      const { data: ocrResult } = await Tesseract.recognize(
        window.location.origin + data.url,
        "jpn+eng"
      );
      return ocrResult.text;
    } catch (e) {
      setError("PDFの読み込みまたはOCRに失敗しました");
      return "";
    }
  };

  // 画像ファイル→OCR
  const imageToOcr = async (imgFile) => {
    setImageUrl(URL.createObjectURL(imgFile));
    const { data } = await Tesseract.recognize(imgFile, "jpn+eng");
    return data.text;
  };

  // 画像アップロードハンドラー
  const handleDrop = (_dropFiles, acceptedFiles, _rejectedFiles) => {
    const uploadedFile = acceptedFiles[0];
    setFile(uploadedFile);
    //setImageUrl(URL.createObjectURL(uploadedFile));
    setOcrText("");
    setOcrTextEdited("");
    setFields({ si_number: "", supplier: "", eta: "", amount: "" });
    setError("");
    setImageUrl("");
  };

  // OCR実行
  const handleOcr = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      let text = "";
      if (file.type === "application/pdf" || file.name?.toLowerCase().endsWith(".pdf")) {
        text = await pdfToImageAndOcr(file);
      } else if (file.type.startsWith("image/")) {
        text = await imageToOcr(file);
      } else {
        setError("対応していないファイル形式です（画像またはPDFのみ）");
      }
      setOcrText(text);
      setOcrTextEdited(text);
      setFields(extractFields(text));
    } finally {
      setLoading(false);
    }
  };

    // 正規表現で仮抽出
  function extractFields(text) {
    return {
      si_number: text.match(/(?:INV(?:OICE)?(?:\s*(?:NO\.?|#|:|：))?|INVOICE NO\.?)[\s:：#-]*([A-Z0-9\-]+)/i)?.[1] ?? "",
      supplier: text.match(/SUPPLIER[:： ]*([^\n]+)/i)?.[1] ?? "",
      eta: text.match(/ETA[:： ]*([\d\-\/]+)/i)?.[1] ?? "",
      amount: text.match(/AMOUNT[:： ]*([\d,\.]+)/i)?.[1] ?? "",
    };
  }

   // フォーム編集
  const handleFieldChange = (key, val) => setFields(f => ({ ...f, [key]: val }));

   // AI補助（未入力項目のみAIで補完）
  const handleAiAssist = async () => {
    setAiLoading(true);
    try {
      const res = await fetch("/api/ai-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: ocrTextEdited,
          fields, // 現在の入力値（未入力の補完をAIに依頼）
        }),
      });
      const { result } = await res.json();
      let aiFields = {};
      try { aiFields = JSON.parse(result); } catch { aiFields = {}; }
      setFields(f => ({
        ...f,
        ...Object.fromEntries(Object.entries(aiFields).filter(([k, v]) => !f[k] && v))
      }));
    } finally {
      setAiLoading(false);
    }
  };
   
 
    // 保存ボタン（Supabase保存処理は別途実装）
    const handleSaveToSupabase = async () => {
      // ここでSupabaseにformを送信する処理を書く
      alert("保存処理を実装してください\n\n" + JSON.stringify(form, null, 2));
    };

  return (
    <Card sectioned title="画像アップロード & OCR">
      {error && <Banner status="critical">{error}</Banner>}
      <DropZone accept="image/*,application/pdf" onDrop={handleDrop}>
        {!file ? (
          <div style={{ textAlign: "center", paddingInlineStartadding: 20, width: "100%" }}>
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
      

      {/* 画像＋OCRテキスト横並び */}
      {imageUrl && (ocrText || loading) && (
        <div style={{ display: "flex", gap: 32, marginTop: 32, alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* 画像プレビュー */}
          <div style={{ minWidth: 280, maxWidth: 400 }}>
            <Text variant="headingMd">アップロード画像</Text>
            <img
              src={imageUrl}
              alt="uploaded"
              style={{
                width: "100%",
                border: "1px solid #eee",
                borderRadius: 4,
                marginTop: 8,
                maxHeight: 400,
                objectFit: "contain"
              }}
            />
          </div>
          {/* OCR編集テキストエリア＋FORM */}
          <div style={{ flex: 1, minWidth: 320 }}>
            <Text variant="headingMd">OCR認識テキスト（編集可）</Text>
            <TextField
              multiline={10}
              value={ocrTextEdited}
              onChange={setOcrTextEdited}
              autoComplete="off"
              placeholder="ここにOCR認識結果が表示されます"
              style={{ fontFamily: "monospace", marginTop: 8, minHeight: 180 }}
            />
            {/* フォーム項目 */}
            <div style={{ marginTop: 16 }}>
              <TextField label="SI番号" value={fields.si_number} onChange={val => handleFieldChange("si_number", val)} autoComplete="off" />
              <TextField label="仕入先" value={fields.supplier} onChange={val => handleFieldChange("supplier", val)} autoComplete="off" />
              <TextField label="ETA" value={fields.eta} onChange={val => handleFieldChange("eta", val)} autoComplete="off" />
              <TextField label="AMOUNT" value={fields.amount} onChange={val => handleFieldChange("amount", val)} autoComplete="off" />
            </div>
            {/* AI補助ボタン */}
            <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
              <Button onClick={handleAiAssist} disabled={aiLoading}>AIで未入力項目を補完</Button>
              {aiLoading && <Spinner />}
              <Button primary onClick={handleSaveToSupabase} disabled={!fields.si_number && !fields.supplier && !fields.eta && !fields.amount}>この内容で登録</Button>
            </div>
          </div>
        </div>
      )}

    </Card>
  );
}