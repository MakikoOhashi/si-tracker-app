// src/App.jsx
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from './supabaseClient';
import StatusCard from './components/StatusCard';
import StatusTable from './components/StatusTable';
import Modal from './components/Modal';



function App() {
  const [viewMode, setViewMode] = useState('card');
  const [selectedShipment, setSelectedShipment] = useState(null);
  const [shipments, setShipments] = useState([]);
  const [showProductStats, setShowProductStats] = useState(false);
  const [hoveredProduct, setHoveredProduct] = useState(null); // { name, x, y }
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const popupTimeout = useRef(null);
  const POPUP_WIDTH = 320;
  const POPUP_HEIGHT = 180;

  const handleProductMouseEnter = (e, name) => {
    if (popupTimeout.current) clearTimeout(popupTimeout.current);
    const rect = e.target.getBoundingClientRect();
    let x = rect.right + window.scrollX + 10;
    let y = rect.top + window.scrollY + 10;

    // 右端はみ出し防止
    if (x + POPUP_WIDTH > window.innerWidth) {
      x = window.innerWidth - POPUP_WIDTH - 10;
    }
    // 下端はみ出し防止
    if (y + POPUP_HEIGHT > window.innerHeight) {
      y = window.innerHeight - POPUP_HEIGHT - 10;
    }
    // 上端にもはみ出さないようにする
    if (y < 0) y = 10;

    setHoveredProduct(name);
    setPopupPos({ x, y });
  };

  
  const handleProductMouseLeave = () => {
        // すぐ消さず、200ms後に消す（ポップアップに入るチャンスを与える）
        popupTimeout.current = setTimeout(() => {
          setHoveredProduct(null);
        }, 200);
  };

  const handlePopupMouseEnter = () => {
    if (popupTimeout.current) clearTimeout(popupTimeout.current);
  };

  const handlePopupMouseLeave = () => {
    popupTimeout.current = setTimeout(() => {
      setHoveredProduct(null);
    }, 200);
  };

  const getProductStats = (shipments) => {
    const stats = {};
    shipments.forEach(s => {
      (s.items || []).forEach(item => {
        if (!item.name) return;
        stats[item.name] = (stats[item.name] || 0) + Number(item.quantity || 0);
      });
    });
    return Object.entries(stats).sort((a, b) => b[1] - a[1]);
  };

  // 🔽 fetchDataをuseEffect外にも定義
  const fetchData = async () => {
    const { data, error } = await supabase.from('shipments').select('*');
    if (error) {
      console.error('データ取得エラー:', error);
    } else {
      setShipments(data);
    }
  };


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

  // 🔽 モーダルを閉じる時（または保存完了時）にデータ再取得
  const handleModalClose = () => {
    setSelectedShipment(null);
    fetchData();
  };

  // ETAの早い順でソートして上位2件を抽出
  const upcomingShipments = shipments
    .slice()
    .sort((a, b) => new Date(a.eta) - new Date(b.eta))
    .slice(0, 2);
    
  return (
    <div className="p-10 bg-red-200 text-center" style={{ padding: '2rem', position: "relative" }}>
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
      onClick={() => setShowProductStats(show => !show)}
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
  {/* ←この下にトグルで統計表を追加 */}
  {showProductStats && (
    <div style={{ marginTop: 16, background: "#fff", border: "1px solid #ccc", borderRadius: 6, padding: 16, maxWidth: 480, marginLeft: "auto", marginRight: "auto", position: "relative" }}>
      <h3>商品別の入荷予定（全出荷分）</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #aaa", textAlign: "left", padding: "4px 8px" }}>商品名</th>
            <th style={{ borderBottom: "1px solid #aaa", textAlign: "right", padding: "4px 8px" }}>合計個数</th>
          </tr>
        </thead>
        <tbody>
          {getProductStats(shipments).map(([name, qty]) => (
            <tr key={name}>
              <td 
                style={{ padding: "4px 8px", cursor: "pointer", textDecoration: "none" }}
              >
              <span
                style={{ display: "inline", cursor: "pointer", textDecoration: "none", fontSize:"1.4rem" }}
                onMouseEnter={e => handleProductMouseEnter(e, name)}
                onMouseLeave={handleProductMouseLeave}
              >
                {name}
              </span><span style={{width:"8px"}}></span>
              </td>
              <td style={{ textAlign: "right", padding: "4px 8px" }}>{qty}</td>
            </tr>
          ))}
        </tbody>
      </table>
 {/* ...統計表のすぐ後ろにポップアップを絶対配置 */}
      { hoveredProduct && (
        <div
          style={{
            position: "fixed",
            top: popupPos.y,
            left: popupPos.x,
            background: "#fff",
            border: "1px solid #aaa",
            borderRadius: "6px",
            boxShadow: "0 2px 8px #aaa",
            padding: "12px",
            zIndex: 99999,
            minWidth: `${POPUP_WIDTH}px`,
            maxWidth: `${POPUP_WIDTH}px`,
            maxHeight: `${POPUP_HEIGHT}px`,
            overflowY: "auto",
            fontSize: "0.95em"
          }}
          onMouseEnter={handlePopupMouseEnter}
          onMouseLeave={handlePopupMouseLeave}
        >
          <b>「{hoveredProduct}」積載SI一覧</b>
          <table style={{ width: "100%", fontSize: "0.95em", marginTop: 8 }}>
            <thead>
              <tr>
                <th>SI番号</th>
                <th>商品名</th>
                <th>数量</th>
                <th>ステータス</th>
              </tr>
            </thead>
            <tbody>
              {shipments
                .filter(s => (s.items || []).some(item => item.name === hoveredProduct))
                .map(s => {
                  const item = (s.items || []).find(item => item.name === hoveredProduct);
                  return (
                    <tr key={s.si_number}>
                      <td>{s.si_number}</td>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>{s.status}</td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )}

</div>

     
      {/* モーダル表示 */}
      <Modal shipment={selectedShipment} onClose={() => setSelectedShipment(null)} />

    </div>
    
  );
  
}

export default App;
