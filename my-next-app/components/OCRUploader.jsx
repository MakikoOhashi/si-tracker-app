//my-next-app/components/OCRUploader.jsx

import React, { useState } from "react";
import { Card, DropZone, Text, Spinner } from "@shopify/polaris";
import Tesseract from "tesseract.js";

export default function OCRUploader() {
  const [file, setFile] = useState(null);
  const [ocrText, setOcrText] = useState("");
  const [loading, setLoading] = useState(false);

  // 画像アップロードハンドラー
  const handleDrop = (_dropFiles, acceptedFiles, _rejectedFiles) => {
    setFile(acceptedFiles[0]);
    setOcrText("");
  };

  // OCR実行
  const handleOcr = async () => {
    if (!file) return;
    setLoading(true);
    const { data } = await Tesseract.recognize(file, "jpn+eng", {
      logger: m => console.log(m), // 進捗確認用
    });
    setOcrText(data.text);
    setLoading(false);
  };

  return (
    <Card sectioned title="画像アップロード & OCR">
      <DropZone accept="image/*" onDrop={handleDrop}>
        {!file ? (
          <DropZone.FileUpload />
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
        </div>
      )}
    </Card>
  );
}