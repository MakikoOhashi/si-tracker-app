const shipments = [
  {
    si_number: '12345',
    status: '出荷済',                 // ステータス
    transportType: 'BOAT',                  // 輸送手段（AIR/BOAT/COURIER）
    etd: '2025-05-10',               // 出港日
    eta: '2025-05-20',               // 到着予定日
    delayed: false,                  // 遅延有無
    clearance_date: '2025-05-21',     // 通関日
    arrival_date: '2025-05-22',       // 倉庫着日
    supplier_name: '上海〇〇貿易有限公司',  // 仕入れ先名
    memo: '5月GWの影響あり',        // 備考欄
    invoiceFile: '12345_invoice.pdf',// INV/PLファイル名（仮）
    siFile: '12345_si.pdf',          // SIファイル名（仮）
    items: [
      {
        sku: 'SKU123',              // 品番
        color: 'BLACK',             // 色番
        name: '商品A',              // 商品名（任意）
        quantity: 100
      },
      {
        sku: 'SKU456',
        color: 'RED',
        name: '商品B',
        quantity: 500
      }
    ]
  },
  {
    si_number: '67890',
    status: '通関中',
    transportType: 'AIR',
    etd: '2025-05-12',
    eta: '2025-05-23',
    delayed: true,
    clearance_date: null,
    arrival_date: null,
    supplier_name: '韓国△△株式会社',
    memo: '',
    invoiceFile: '67890_invoice.pdf',
    siFile: '67890_si.pdf',
    items: [
      {
        sku: 'SKU789',
        color: 'BLUE',
        name: '商品C',
        quantity: 300
      }
    ]
  }
];

export default shipments;
