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
  const [hoveredProduct, setHoveredProduct] = useState(null); // { name, x, y }
  const [popupPos, setPopupPos] = useState({ x: 0, y: 0 });
  const [productStatsSort, setProductStatsSort] = useState('name-asc'); // 'name-asc' or 'name-desc'
  const [detailViewMode, setDetailViewMode] = useState('product'); // 'product', 'status', 'search'
  const [siQuery, setSiQuery] = useState('');

  const popupTimeout = useRef(null);
  const POPUP_WIDTH = 320;
  const POPUP_HEIGHT = 180;
  const statusOrder = ["SI発行済", "船積スケジュール確定", "船積中", "輸入通関中", "倉庫着"];

  // SI番号で検索用（前方一致・上位10件）
  const filteredShipments = shipments
  .filter(s =>
    !siQuery || (s.si_number && s.si_number.startsWith(siQuery))
  )
  .slice(0, 10);
  // ステータスごとグループ化関数
  const getStatusStats = (shipments) => {
    const stats = {};
    shipments.forEach(s => {
      const status = s.status || "未設定";
      if (!stats[status]) stats[status] = [];
      stats[status].push(s);
    });
    return stats;
  };

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

  const getProductStats = (shipments, sort = 'name-asc') => {
    const stats = {};
    shipments.forEach(s => {
      (s.items || []).forEach(item => {
        if (!item.name) return;
        stats[item.name] = (stats[item.name] || 0) + Number(item.quantity || 0);
      });
    });
   // 数字→アルファベット→その他
    const naturalSort = (a, b, order) => {
      // 1. 数字から始まるものを最優先
      const aIsNum = /^\d/.test(a);
      const bIsNum = /^\d/.test(b);
      if (aIsNum && !bIsNum) return order === 'asc' ? -1 : 1;
      if (!aIsNum && bIsNum) return order === 'asc' ? 1 : -1;
      if (aIsNum && bIsNum) {
        // どちらも数字で始まる場合、数値として比較
        const aNum = parseInt(a.match(/^\d+/)[0], 10);
        const bNum = parseInt(b.match(/^\d+/)[0], 10);
        if (aNum !== bNum) return order === 'asc' ? aNum - bNum : bNum - aNum;
        // 数字部分が同じ場合は文字列比較
        return order === 'asc' ? a.localeCompare(b, "ja") : b.localeCompare(a, "ja");
      }
      // 2. アルファベットで始まるものを次に
      const aIsAlpha = /^[a-zA-Z]/.test(a);
      const bIsAlpha = /^[a-zA-Z]/.test(b);
      if (aIsAlpha && !bIsAlpha) return order === 'asc' ? -1 : 1;
      if (!aIsAlpha && bIsAlpha) return order === 'asc' ? 1 : -1;
      // 3. その他はlocaleCompare
      return order === 'asc'
        ? a.localeCompare(b, "ja")
        : b.localeCompare(a, "ja");
    };

    return Object.entries(stats).sort((a, b) =>
      naturalSort(a[0], b[0], sort === 'name-asc' ? 'asc' : 'desc')
    );
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
      

{/* 詳細表示　　セクション */}
<div style={{ marginTop: '3rem' }}>
  <h2>詳細表示セクション（例：クリックで情報表示）</h2>

  <div className="flex justify-center gap-4 mt-4">
    <button
      onClick={() => setDetailViewMode('search')}
      className={`bg-blue-500 text-white px-4 py-2 rounded ${detailViewMode === 'search' ? '' : 'opacity-70'}`}
    >
      SI番号で検索
    </button>
    <button
      onClick={() => setDetailViewMode('product')}
      className="bg-green-500 text-white px-4 py-2 rounded"
    >
      商品別の入荷予定
    </button>
    <button
      onClick={() => setDetailViewMode('status')}
      className={`bg-purple-500 text-white px-4 py-2 rounded ${detailViewMode === 'status' ? '' : 'opacity-70'}`}
    >
      ステータスごとのチャート
    </button>
  </div>
  {/* ←この下にトグルで統計表を追加 */}
  
    <div style={{ 
      marginTop: 16, 
      background: "#fff", 
      border: "1px solid #ccc", 
      borderRadius: 6, 
      padding: 16, 
      maxWidth: 480, 
      marginLeft: "auto", 
      marginRight: "auto", 
      position: "relative" 
    }}>
       {/* 商品別 */}
       {detailViewMode === 'product' && (
      <>
      <h3>商品別の入荷予定（全出荷分）</h3>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ borderBottom: "1px solid #aaa", textAlign: "left", padding: "4px 8px" }}>
              商品名
              <button
              style={{ marginLeft: 6, fontSize: "1rem", border: "none", background: "none", cursor: "pointer", verticalAlign: "middle" }}
              title={productStatsSort === 'name-asc' ? "1→9→A→Z→あ...昇順で表示中。クリックでZ→A順。" : "（降順）で表示中。クリックで昇順。"}
              onClick={() =>
                setProductStatsSort(sort =>
                  sort === 'name-asc' ? 'name-desc' : 'name-asc'
                )
              }
              >
              {productStatsSort === 'name-asc' ? '▲' : '▼'}
              </button>
              </th>
            <th style={{ borderBottom: "1px solid #aaa", textAlign: "right", padding: "4px 8px" }}>合計個数</th>
          </tr>
        </thead>
        <tbody>
          {getProductStats(shipments, productStatsSort).map(([name, qty]) => (
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
      {/* POPUP */}
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
                .sort((a, b) => {
                  // まずstatus順
                  const statusDiff = statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status);
                  if (statusDiff !== 0) return statusDiff;
                  // 同じstatusならETA順
                  return new Date(a.eta) - new Date(b.eta);
                })
                .map(s => {
                  const item = (s.items || []).find(item => item.name === hoveredProduct);
                  return (
                    <tr key={s.si_number}>
                      <td
                        style={{ cursor: 'pointer', color: '#0074d9', textDecoration: 'underline' }}
                        onClick={() => setSelectedShipment(s)}
                        title="このSIを開く"
                      >{s.si_number}</td>
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
    </>
    )}

     {/* ステータスごとのチャート */}
     {detailViewMode === 'status' && (
    <>
    <h3>ステータスごとの入荷予定</h3>
            {statusOrder.map(status => (
              <div key={status} style={{ marginBottom: 16 }}>
                <h4 style={{ marginBottom: 4 }}>{status}</h4>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th>SI番号</th>
                      <th>商品名</th>
                      <th>数量</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(getStatusStats(shipments)[status] || []).map(s =>
                      (s.items || []).map(item => (
                        <tr key={s.si_number + item.name}>
                          <td
                            style={{ cursor: "pointer", color: "#0074d9", textDecoration: "underline" }}
                            onClick={() => setSelectedShipment(s)}
                            title="このSIを開く"
                          >
                            {s.si_number}
                          </td>
                          <td>{item.name}</td>
                          <td style={{ textAlign: "right" }}>{item.quantity}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            ))}
          </>
        )}



        {/* SI番号で検索 */}
        {detailViewMode === 'search' && (
            <>
              <h3>SI番号で検索（前方一致・上位10件）</h3>
              <input
                type="text"
                placeholder="SI番号を入力"
                value={siQuery}
                onChange={e => setSiQuery(e.target.value)}
                style={{ padding: 8, borderRadius: 4, border: '1px solid #ccc', minWidth: 180, marginBottom: 12 }}
              />
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
                <thead>
                  <tr>
                    <th>SI番号</th>
                    <th>ETA</th>
                    <th>仕入れ先</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShipments.map(s => (
                    <tr key={s.si_number}>
                      <td>
                        <a
                          href="#"
                          style={{ color: '#0074d9', textDecoration: 'underline', cursor: 'pointer' }}
                          onClick={e => {
                            e.preventDefault();
                            setSelectedShipment(s);
                          }}
                        >
                          {s.si_number}
                        </a>
                      </td>
                      <td>{s.eta}</td>
                      <td>{s.supplier_name}</td>
                    </tr>
                  ))}
                  {siQuery && filteredShipments.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: '#888' }}>
                        該当するSIがありません
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
            )}
    </div>
  

</div>

     
      {/* モーダル表示 */}
      <Modal shipment={selectedShipment} onClose={handleModalClose} />

    </div>
    
  );
  
}

export default App;
