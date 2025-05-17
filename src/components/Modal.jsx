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

const Modal = ({ shipment, onClose }) => {
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(shipment);
  const [fileUrl, setFileUrl] = useState(''); // ファイルURLを保存するステート


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
      [name]: value,
    }));
  };

  const handleSave = async () => {
    console.log('保存するデータ:', formData);

      // Supabaseに存在しないカラムを除外
  const { invoiceFile, siFile, items, ...safeData } = formData;

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
            <label>インボイスファイル:
              <input
                type="file"
                onChange={async (e) => {
                  const file = e.target.files[0];
                  if (!file) return;

                  const fileExt = file.name.split('.').pop();
                  const filePath = `${formData.si_number}/invoice.${fileExt}`;

                  const { error: uploadError } = await supabase.storage
                    .from('shipment-files')
                    .upload(filePath, file, { upsert: true });

                  if (uploadError) {
                    alert('アップロード失敗');
                    console.error(uploadError);
                    return;
                  }

                  const { data: { publicUrl } } = supabase.storage
                    .from('shipment-files')
                    .getPublicUrl(filePath);

                  setFormData((prev) => ({
                    ...prev,
                    invoice_url: publicUrl,
                  }));

                  alert('アップロード完了！');
                }}
              />
            </label>
            <br />
            <label>PLファイル:
            <input
              type="file"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const fileExt = file.name.split('.').pop();
                const filePath = `${formData.si_number}/pl.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                  .from('shipment-files')
                  .upload(filePath, file, { upsert: true });

                if (uploadError) {
                  alert('PLアップロード失敗');
                  console.error(uploadError);
                  return;
                }

                const { data: { publicUrl } } = supabase.storage
                  .from('shipment-files')
                  .getPublicUrl(filePath);

                setFormData((prev) => ({
                  ...prev,
                  pl_url: publicUrl,
                }));

                alert('PLアップロード完了！');
              }}
            />
          </label>
          {formData.pl_url && (
            <p><a href={formData.pl_url} target="_blank" rel="noopener noreferrer">📄 PLファイルを見る</a></p>
          )}

          <br />

          <label>SIファイル:
            <input
              type="file"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const fileExt = file.name.split('.').pop();
                const filePath = `${formData.si_number}/si.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                  .from('shipment-files')
                  .upload(filePath, file, { upsert: true });

                if (uploadError) {
                  alert('SIアップロード失敗');
                  console.error(uploadError);
                  return;
                }

                const { data: { publicUrl } } = supabase.storage
                  .from('shipment-files')
                  .getPublicUrl(filePath);

                setFormData((prev) => ({
                  ...prev,
                  si_url: publicUrl,
                }));

                alert('SIアップロード完了！');
              }}
            />
          </label>
          {formData.si_url && (
            <p><a href={formData.si_url} target="_blank" rel="noopener noreferrer">📄 SIファイルを見る</a></p>
          )}

          <br />

          <label>その他ファイル:
            <input
              type="file"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const fileExt = file.name.split('.').pop();
                const filePath = `${formData.si_number}/other.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                  .from('shipment-files')
                  .upload(filePath, file, { upsert: true });

                if (uploadError) {
                  alert('その他ファイルアップロード失敗');
                  console.error(uploadError);
                  return;
                }

                const { data: { publicUrl } } = supabase.storage
                  .from('shipment-files')
                  .getPublicUrl(filePath);

                setFormData((prev) => ({
                  ...prev,
                  other_url: publicUrl,
                }));

                alert('その他ファイルアップロード完了！');
              }}
            />
          </label>
          {formData.other_url && (
            <p><a href={formData.other_url} target="_blank" rel="noopener noreferrer">📄 その他ファイルを見る</a></p>
          )}


            {formData.invoice_url && (
              <p><a href={formData.invoice_url} target="_blank" rel="noopener noreferrer">📄 アップロード済みファイルを見る</a></p>
            )}
            <br />
           

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
            {shipment.invoice_url && (
            <p>
              <a href={shipment.invoice_url} target="_blank" rel="noopener noreferrer">
                📎 添付ファイルを見る
              </a>
            </p>
            )}
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
