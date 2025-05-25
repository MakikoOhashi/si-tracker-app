# SI Tracker App

「SI番号」単位で輸入商品の現在地や納期ステータスを管理するアプリです。

## 🧾 概要

輸入業務で扱う「スイッチインボイス/Shiping Instruction番号（SI番号）」をキーに、以下の情報を一元管理します：

- 出荷日
- 到着予定日
- 船名
- 現在地（例：通関中、保税倉庫など）
- 遅延ステータス

## 💡 背景

現場での納期管理はメール・Excel・口頭のやり取りに依存しており、情報の抜け漏れ・確認工数が大きな課題です。  
本アプリはそれらを軽減し、輸入プロセスを視覚的に・正確に把握できることを目的としています。

## 🛠 技術スタック

- React + Vite
- 状態管理：未定（今後検討）
- データ：一旦モック（将来的にAPI連携予定）

## 🔧 開発予定機能

- SIステータス表示カード（第一ステップ）
- SI一覧テーブル
- 遅延フィルター・アラート
- Excel/CSVエクスポート
- ユーザーごとの管理画面（将来）

## 📝 今後の構想

- Shopifyアプリとしての統合
- 日本の中小企業の輸入業務DX化への応用

## 📦 Database Schema (ER Diagram)

### shipments table

| Column Name      | Type     | Description                |
|------------------|----------|----------------------------|
| `si_number`      | text     | Primary key, SI identifier |
| `status`         | text     | Shipping status            |
| `transport_type` | text     | Shipping method (air/sea)  |
| `etd`            | date     | Estimated Time of Departure |
| `eta`            | date     | Estimated Time of Arrival  |
| `delayed`        | boolean  | Indicates delay (true/false) |
| `clearance_date` | date     | Customs clearance date     |
| `arrival_date`   | date     | Arrival at warehouse       |
| `supplier_name`  | text     | Supplier's name            |
| `memo`           | text     | Free memo field            |

### 🔧 Notes

- `si_number` is the unique identifier for each shipment and serves as the primary key.
- Future enhancement: consider linking to `invoices` or `users` for more advanced tracking.


## 今後の拡張構想（Planned Features）

- **AI OCR連携によるドキュメント自動解析**
  - 書類（SI/INV等）の画像やPDFをアップロードすると、Tesseract.jsやGoogle Vision APIでOCR変換
  - 抽出テキストをOpenAI等のLLM（大規模言語モデル）で解析し、内容を自動JSON構造化
  - これにより手入力工数を削減、データの自動整形・自動登録を実現
  - Shopify等の他システムとのAPI連携も容易に

> ※現在はPoC用デモページを実装済み。今後の正式統合を計画中です。

### 今後チャレンジしたい技術構想

現状のアプリは貿易書類管理の業務効率化に特化していますが、  
今後はAI OCRと連携し、書類内容の自動データ化・Shopify APIへの自動連携など、  
より高度な自動化にも挑戦したいと考えています。

- 書類画像からの自動データ抽出（OCR＋AI）
- 構造化データ（JSON）としてDB/Shopifyに連携
- AI活用による入力ミス撲滅と業務効率化の最大化

> まずは安定稼働を優先し、順次拡張予定です。

実装イメージ
書類画像アップロード（SI/INV等）
OCRでテキスト抽出（バックエンドまたはEdge Functionで）
AI（GPT等）で「これはどの項目？」「どの値？」を判別し、JSON化
JSONをSupabase等に保存
画面に自動で内容反映・編集も可能に

「AIで書類からデータを自動抽出→Shopify管理画面や受注システムと連携」
「物流書類/請求書の内容を自動でShopifyのOrder/Customer/Inventory APIに登録」
「手作業ゼロ・作業時間大幅短縮・ヒューマンエラー撲滅」

フロント：React/Next.js
OCR：Google Vision API, Tesseract.js, Supabase Edge Function（OCR連携も可能）
AI処理：OpenAI API (gpt-4o等), Claude, Gemini（テキスト→JSON構造化）
バックエンド保存：Supabase
Shopify API連携：REST/GraphQL API


＜AI/LLM活用事例＞
OCR（例：Google Vision API, Tesseract.js, Supabase Edge Functionsなど）で画像→テキスト
テキストをAI（例：OpenAI GPT, Claude, Geminiなど）に渡して、内容をパース＆JSON生成
JSONデータとしてSupabase等に保存→フロントで活用
「AI x SaaS x Shopify x 自動化」 
