// src/App.jsx
import { useState } from 'react';
import StatusCard from './components/StatusCard';
import StatusTable from './components/StatusTable';

function App() {
  const [viewMode, setViewMode] = useState('card');

  const shipments = [
    { siNumber: '12345', status: '出荷済', eta: '5月20日'},
    { siNumber: '67890', status: '通関中', eta: '5月23日'},

  ]
  return (
    <div style={{ padding: '2rem' }}>
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
        <div style={{ display:'flex', gap:'1rem', flexWrap:'wrap'}}>
          {shipments.map((s) => (
            <StatusCard key={s.siNumber} {...s} />
          ))}
        </div>  
       ):(
        <StatusTable shipments={shipments} />
       )}

      
    </div>
  );
}

export default App;
