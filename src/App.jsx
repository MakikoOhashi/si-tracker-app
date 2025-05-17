// src/App.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import StatusCard from './components/StatusCard';
import StatusTable from './components/StatusTable';
import Modal from './components/Modal';



function App() {
  const [viewMode, setViewMode] = useState('card');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [shipments, setShipments] = useState([]);

  // ETAの早い順でソートして上位2件を抽出
  const upcomingShipments = shipments
    .slice() // 元データを変更しないためのコピー
    .sort((a, b) => new Date(a.eta) - new Date(b.eta))
    .slice(0, 2);

// 🔽 useEffectはここで書く
useEffect(() => {
  const fetchData = async () => {
    const { data, error } = await supabase.from('shipments').select('*');
    if (error) {
      console.error('データ取得エラー:', error);
    } else {
      setShipments(data);
    }
  };

  fetchData();
}, []); // ← 初回マウント時だけ実行

    
  return (
    <div className="p-10 bg-red-200 text-center" style={{ padding: '2rem' }}>
      <h1>入荷ステータス一覧</h1>

      {/* 表示切り替えボタン */}
      <div style={{ marginBottom: '1rem' }}>
        <button onClick={() => setViewMode('card')} style={{ marginRight: '1rem' }}>
          カード表示
        </button>
        <button onClick={() => setViewMode('table')}>テーブル表示</button>
      </div>

      {/* 表示形式に応じて切り替え */}
      {viewMode === 'card' ? (
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          {shipments.map((s) => (
             <StatusCard
             key={s.si_number}
             {...s}
             onSelectShipment={() => setSelectedShipment(s)} // 追加
           />
          ))}
        </div>
      ) : (
        <StatusTable 
        shipments={shipments} 
        onSelectShipment={(shipment) => setSelectedShipment(shipment)}
        />
      )}

      {/* ETAが近い上位2件のリスト表示 */}
      <div style={{ marginTop: '2rem' }}>
        <h2>近日入荷予定の出荷</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {upcomingShipments.map((s) => (
            <li key={s.si_number} style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
            <span onClick={() => setSelectedShipment(s)}>
              {s.si_number} - <strong>ETA:</strong> {s.eta}
            </span>
            </li>
          ))}
        </ul>
      </div>
      

{/* ここから新UIセクションを追加 */}
<div style={{ marginTop: '3rem' }}>
  <h2>詳細表示セクション（例：クリックで情報表示）</h2>

  <div className="flex justify-center gap-4 mt-4">
    <button
      onClick={() => setSelectedShipment(shipments[0])}
      className="bg-blue-500 text-white px-4 py-2 rounded"
    >
      SI番号をクリック（モーダル想定）
    </button>
    <button
      onClick={() => alert('商品情報をソート表示')}
      className="bg-green-500 text-white px-4 py-2 rounded"
    >
      商品別の入荷予定
    </button>
    <button
      onClick={() => alert('ETAで船積み情報表示')}
      className="bg-purple-500 text-white px-4 py-2 rounded"
    >
      ETAをクリック（ETD・遅延など）
    </button>
  </div>
</div>
     
      {/* モーダル表示 */}
      <Modal shipment={selectedShipment} onClose={() => setSelectedShipment(null)} />

    </div>
    
  );
  
}

export default App;
