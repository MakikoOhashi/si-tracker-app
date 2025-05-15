// src/components/Modal.jsx
function Modal({ shipment, onClose }) {
  if (!shipment) return null;

  const overlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(0,0,0,0.3)',
    zIndex: 999,
  };

  const modalStyle = {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '400px',
    height: '100%',
    backgroundColor: 'white',
    boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.2)',
    padding: '1.5rem',
    zIndex: 1000,
    overflowY: 'auto',
  };

  const closeButtonStyle = {
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose}></div>
      <div style={modalStyle}>
        <button onClick={onClose} style={closeButtonStyle}>×</button>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>出荷詳細</h2>
        <p><strong>SI番号:</strong> {shipment.siNumber}</p>
        <p><strong>Status:</strong> {shipment.status || '不明'}</p>
        <p><strong>ETA:</strong> {shipment.eta}</p>
        <p><strong>ETD:</strong> {shipment.etd}</p>
        <p><strong>遅延:</strong> {shipment.delayed ? 'あり' : 'なし'}</p>

        <div style={{ marginTop: '1rem' }}>
          <h3>商品情報</h3>
          <ul>
            {shipment.items?.map((item, index) => (
              <li key={index}>
                {item.name}：{item.quantity}個
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

export default Modal;
