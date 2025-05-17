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
