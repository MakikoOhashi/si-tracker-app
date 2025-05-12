// src/App.jsx
import StatusCard from './components/StatusCard';

function App() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>入荷ステータス一覧</h1>
      <StatusCard siNumber="12345" status="出荷済" eta="5月20日" />
      <StatusCard siNumber="67890" status="通関中" eta="5月23日" />
    </div>
  );
}

export default App;
