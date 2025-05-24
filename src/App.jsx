// src/App.jsx
import React, { useEffect, useState, useRef } from 'react';
import { Page, Card, Button, ButtonGroup, DataTable, TextField, Tabs, Banner, InlineStack, BlockStack, TextContainer, Text } from '@shopify/polaris';
import CustomModal from './components/Modal';
import { supabase } from './supabaseClient';
import StatusCard from './components/StatusCard';
import StatusTable from './components/StatusTable';



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
    !siQuery ||
    (s.si_number && s.si_number.toLowerCase().startsWith(siQuery.toLowerCase())) 
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
    
  // Polaris用タブ
  const tabs = [
    { id: 'search', content: 'SI番号で検索' },
    { id: 'product', content: '商品別の入荷予定' },
    { id: 'status', content: 'ステータスごとのチャート' },
  ];
  const selectedTab = tabs.findIndex(tab => tab.id === detailViewMode);




  
  return (
    <Page title="入荷ステータス一覧">

      {/* 表示切り替えボタン */}
       <Card sectioned>
        <ButtonGroup>
          <Button primary={viewMode === 'card'} onClick={() => setViewMode('card')}>カード表示</Button>
          <Button primary={viewMode === 'table'} onClick={() => setViewMode('table')}>テーブル表示</Button>
        </ButtonGroup>
      </Card>

      {/* 表示形式に応じて切り替え */}
      <Card sectioned>
      {viewMode === 'card' ? (
        <InlineStack gap="loose">
          {shipments.map((s) => (
             <StatusCard
             key={s.si_number}
             {...s}
             onSelectShipment={() => setSelectedShipment(s)} // 追加
           />
          ))}
        </InlineStack>
      ) : (
        <StatusTable 
        shipments={shipments} 
        onSelectShipment={(shipment) => setSelectedShipment(shipment)}
        />
      )}
      </Card>

      {/* ETAが近い上位2件のリスト表示 */}
      
        <Card title="近日入荷予定の出荷" sectioned>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {upcomingShipments.map((s) => (
            <li key={s.si_number} style={{ cursor: 'pointer', marginBottom: '0.5rem' }}>
            <span onClick={() => setSelectedShipment(s)}>
              {s.si_number} - <strong>ETA:</strong> {s.eta}
            </span>
            </li>
          ))}
        </ul>
        </Card>
      
      

{/* 詳細表示　　セクション */}
<Card sectioned>
  <Text as="h2" variant="headingLg">詳細表示セクション（例：クリックで情報表示）</Text>

  <ButtonGroup>
    <Button primary={detailViewMode === 'search'}
      onClick={() => setDetailViewMode('search')}
    >
      SI番号で検索
    </Button>
    <Button primary={detailViewMode === 'product'}
      onClick={() => setDetailViewMode('product')}
    >
      商品別の入荷予定
    </Button>
    <Button primary={detailViewMode === 'status'}
      onClick={() => setDetailViewMode('status')}
    >
      ステータスごとのチャート
    </Button>
  </ButtonGroup>
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
      <Text as="h3" variant="headingMd">商品別の入荷予定（全出荷分）</Text>
      <div style={{ marginBottom: 12 }}>        
        <Button
          onClick={() =>
            setProductStatsSort(sort =>
              sort === 'name-asc' ? 'name-desc' : 'name-asc'
            )
          }
          size="slim"
          plain
        >
          {productStatsSort === 'name-asc' ? '▲ 商品名順' : '▼ 商品名順'}
        </Button>
      </div>
        <DataTable
        columnContentTypes={['text', 'numeric']}
        headings={['商品名', '合計個数']}
        rows={getProductStats(shipments, productStatsSort).map(([name, qty]) => [
          <span
            style={{ display: "inline", cursor: "pointer", textDecoration: "none", fontSize: "1.4rem" }}
            onMouseEnter={e => handleProductMouseEnter(e, name)}
            onMouseLeave={handleProductMouseLeave}
          >
            {name}
          </span>,
          qty
        ])}
      />
     
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
          <DataTable
            columnContentTypes={['text', 'text', 'numeric', 'text']}
            headings={['SI番号', '商品名', '数量', 'ステータス']}
            rows={
              shipments
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
                  return [
                    <span
                      style={{ cursor: 'pointer', color: '#0074d9', textDecoration: 'underline' }}
                      onClick={() => setSelectedShipment(s)}
                      title="このSIを開く"
                    >
                      {s.si_number}
                    </span>,
                    item.name,
                    item.quantity,
                    s.status
                  ];
                })
            }
          />
        </div>
      )}
    </>
    )}

     {/* ステータスごとのチャート */}
     {detailViewMode === 'status' && (
    <>
    <Text as="h3" variant="headingMd">ステータスごとの入荷予定</Text>
      {statusOrder.map(status => {
        const rows = (getStatusStats(shipments)[status] || []).flatMap(s =>
          (s.items || []).map(item => [
            <span
              style={{ cursor: "pointer", color: "#0074d9", textDecoration: "underline" }}
              onClick={() => setSelectedShipment(s)}
              title="このSIを開く"
            >
              {s.si_number}
            </span>,
            item.name,
            item.quantity
          ])
        );
        return (
          <div key={status} style={{ marginBottom: 16 }}>
            <Text as="h4" variant="headingMd">{status}</Text>
            <DataTable
              columnContentTypes={['text', 'text', 'numeric']}
              headings={['SI番号', '商品名', '数量']}
              rows={rows}
            />
          </div>
        );
        })}
          </>
        )}



        {/* SI番号で検索 */}
        {detailViewMode === 'search' && (
            <>
              <Text as="h3" variant="headingMd">SI番号で検索（前方一致・上位10件）</Text>
              <TextField
                label="SI番号"
                value={siQuery}
                onChange={setSiQuery}
                autoComplete="off"
                placeholder="SI番号を入力"
                clearButton
                onClearButtonClick={() => setSiQuery('')}
              />
              <DataTable
                columnContentTypes={['text', 'text', 'text']}
                headings={['SI番号', 'ETA', '仕入れ先']}
                rows={filteredShipments.map(s => [
                  <span
                    style={{ color: '#0074d9', textDecoration: 'underline', cursor: 'pointer' }}
                    onClick={() => setSelectedShipment(s)}
                    title="このSIを開く"
                  >
                    {s.si_number}
                  </span>,
                  s.eta,
                  s.supplier_name
                ])}
              />
              {siQuery && filteredShipments.length === 0 && (
                <Banner status="info">該当するSIがありません</Banner>
              )}
            </>
            )}
    </div>
  

</Card>

     
      {/* モーダル表示 */}
      <CustomModal
        shipment={selectedShipment}
        onClose={handleModalClose}
      />
    </Page>
  );
}

export default App;
