// src/components/StatusCard.jsx
function StatusCard({ siNumber, status, eta }) {
    return (
      <div style={{
        border: '1px solid #ddd',
        padding: '1rem',
        margin: '1rem 0',
        borderRadius: '8px',
        backgroundColor: '#f9f9f9',
        fontFamily: 'sans-serif'
      }}>
        <strong>SI番号：</strong>#{siNumber}<br />
        <strong>ステータス：</strong>{status}<br />
        <strong>到着予定日：</strong>{eta}
      </div>
    );
  }
  
  export default StatusCard;
  