// src/components/Modal.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // ← supabaseクライアントをインポート

const modalStyle = {
  position: 'fixed',
  top: '0',
  right: '0',
  width: '400px',
  height: '100%',
  backgroundColor: 'white',
  boxShadow: '-2px 0 5px rgba(0,0,0,0.3)',
  padding: '1rem',
  overflowY: 'auto',
  zIndex: 1000,
};

const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0,0,0,0.3)',
  zIndex: 999,
};

const FILE_TYPES = [
  { label: 'インボイスファイル', key: 'invoice' },
  { label: 'PLファイル', key: 'pl' },
  { label: 'SIファイル', key: 'si' },
  { label: 'その他ファイル', key: 'other' },
];

const Modal = ({ shipment, onClose }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(shipment);
  const [fileUrl, setFileUrl] = useState(''); // ファイルURLを保存するステート
  // input valueのcontrolled/uncontrolled対策
  const getValue = (v) => v ?? "";

  useEffect(() => {
    if (shipment) {
      setFormData(shipment);  // shipmentが来てから初期化
      if (shipment.invoice_file_path) { // 例えばinvoice_file_pathに保存パスがあれば
        // Supabase Storageの公開URLを生成
        const url = supabase
          .storage
          .from('shipment-files')
          .getPublicUrl(shipment.invoice_file_path).publicURL;
        setFileUrl(url);
      } else {
        setFileUrl('');
      }
    }
  }, [shipment]);

  if (!shipment || !formData) return null;  // 安全確認

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSave = async () => {
    console.log('保存するデータ:', formData);

      // Supabaseに存在しないカラムを除外
  const { invoiceFile, siFile, items, ...safeData } = formData;

          // safeData に URL を明示的に追加
      safeData.invoice_url = formData.invoice_url;
      safeData.pl_url = formData.pl_url;
      safeData.si_url = formData.si_url;
      safeData.other_url = formData.other_url;

    const { data, error } = await supabase
      .from('shipments')
      .upsert([safeData]); // SI NumberをPKにしていれば更新になる

    if (error) {
      alert('保存に失敗しました');
      console.error(error);
    } else {
      alert('保存しました！');
      setEditMode(false);
      console.log('保存データ:', data);
    }
  };

  // ここに handleFileUpload 関数を追加します！
  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const fileExt = file.name.split('.').pop();
    const filePath = `${formData.si_number}/${type}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('shipment-files')
      .upload(filePath, file, { upsert: true });
    if (uploadError) {
      alert(`${type.toUpperCase()} アップロード失敗: ${uploadError.message}`);
      console.error(uploadError);
      return;
    }
    const { data: { publicUrl } } = supabase.storage
      .from('shipment-files')
      .getPublicUrl(filePath);

       // formDataに反映（即画面反映）
    setFormData((prev) => ({
      ...prev,
      [`${type}_url`]: publicUrl,
    }));
    alert(`${type.toUpperCase()} アップロード完了！`);
  };

  return (
    <>
      <div style={overlayStyle} onClick={onClose}></div>
      <div style={modalStyle}>
        <button onClick={onClose} style={{ float: 'right' }}>×</button>
        <h2>SI詳細: {shipment.si_number}</h2>

        {editMode ? (
          <>
            <label>ステータス:
              <input name="status" value={formData.status} onChange={handleChange} />
            </label>
            <br />
            <label>輸送手段:
              <input name="transport_type" value={formData.transport_type} onChange={handleChange} />
            </label>
            <br />
            <label>ETD:
              <input name="etd" type="date" value={formData.etd} onChange={handleChange} />
            </label>
            <br />
            <label>ETA:
              <input name="eta" type="date" value={formData.eta} onChange={handleChange} />
            </label>
            <br />
            <label>遅延:
              <select name="delayed" value={formData.delayed} onChange={handleChange}>
                <option value={true}>あり</option>
                <option value={false}>なし</option>
              </select>
            </label>
            <br />
            <label>通関日:
              <input name="clearance_date" type="date" value={formData.clearance_date || ''} onChange={handleChange} />
            </label>
            <br />
            <label>倉庫着日:
              <input name="arrival_date" type="date" value={formData.arrival_date || ''} onChange={handleChange} />
            </label>
            <br />
            <label>仕入れ先:
              <input name="supplier_name" value={formData.supplier_name} onChange={handleChange} />
            </label>
            <br />
            <label>メモ:
              <textarea name="memo" value={formData.memo || ''} onChange={handleChange} />
            </label>
            <br />
            <label>アーカイブ:
              <input
                type="checkbox"
                name="is_archived"
                checked={formData.is_archived || false}
                onChange={(e) =>
                setFormData((prev) => ({
                ...prev,
                is_archived: e.target.checked,
                }))
                }
              />
            </label>
            <br />

            {/* ファイルアップロード共通化 */}
            {FILE_TYPES.map(({ label, key }) => (
                          <div key={key}>
                            <label>{label}:
                              <input
                                type="file"
                                onChange={(e) => handleFileUpload(e, key)}
                              />
                            </label>
                            {formData[`${key}_url`] && (
                              <p>
                                <a href={formData[`${key}_url`]} target="_blank" rel="noopener noreferrer">
                                  📄 アップロード済み{label}を見る
                                </a>
                              </p>
                            )}
                          </div>
                        ))}        

            <br />
            <button onClick={handleSave}>💾 保存</button>
            <button onClick={() => setEditMode(false)}>キャンセル</button>
          </>
        ) : (
          <>
            <p><strong>ステータス:</strong> {shipment.status}</p>
            <p><strong>輸送手段:</strong> {shipment.transportType}</p>
            <p><strong>ETD:</strong> {shipment.etd}</p>
            <p><strong>ETA:</strong> {shipment.eta}</p>
            <p><strong>遅延:</strong> {shipment.delayed ? 'あり' : 'なし'}</p>
            <p><strong>通関日:</strong> {shipment.clearance_date || '未定'}</p>
            <p><strong>倉庫着日:</strong> {shipment.arrival_date || '未定'}</p>
            <p><strong>仕入れ先:</strong> {shipment.supplier_name}</p>
            <p><strong>メモ:</strong> {shipment.memo || 'なし'}</p>
            <p><strong>アーカイブ:</strong> {shipment.is_archived ? '✅' : '❌'}</p>
      
            {/* ファイルリンク表示エリア */}
            <div>
              {shipment.invoice_url && (
                <p>
                  📄 <a href={shipment.invoice_url} target="_blank" rel="noopener noreferrer">
                    Invoice ファイルを見る
                  </a>
                </p>
              )}
              {shipment.pl_url && (
                <p>
                  📄 <a href={shipment.pl_url} target="_blank" rel="noopener noreferrer">
                    PL ファイルを見る
                  </a>
                  
                </p>
              )}
              {shipment.si_url && (
                <p>
                  📄 <a href={shipment.si_url} target="_blank" rel="noopener noreferrer">
                    SI ファイルを見る
                  </a>
                </p>
              )}
              {shipment.other_url && (
                <p>
                  📄 <a href={shipment.other_url} target="_blank" rel="noopener noreferrer">
                    その他ファイルを見る
                  </a>
                </p>
              )}
            </div>

                <button onClick={() => setEditMode(true)}>✎ 編集</button>
          </>
        )}
      </div>
    </>
  );
};


export default Modal;
