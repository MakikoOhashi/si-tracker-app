// my-next-app/components/Modal.jsx
import React, { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  TextField,
  Select,
  Checkbox,
  InlineStack,
  BlockStack,
  Text
} from '@shopify/polaris';
import { supabase } from '../supabaseClient'; // ← supabaseクライアントをインポート


const modalStyle = {
  position: 'fixed',
  top: '0',
  right: '0',
  width: '400px',
  maxHeight: 'calc(100vh - 32px)',
  marginBottom: '16px',
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

const CustomModal = ({ shipment, onClose }) => {
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
    const { name, value, type, checked } = e.target;
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
      safeData.items = formData.items;

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
      // Modalコンポーネント内に追加・削除機能
    const handleFileDelete = async (type) => {
      const url = formData[`${type}_url`];
      if (!url) return;
      if (!window.confirm("本当に削除してよろしいですか？")) return;

      // ファイルパスを推測（si_number/type.拡張子 形式前提）
      const siNumber = formData.si_number;
      const matches = url.match(/\/([^/]+)\.([a-zA-Z0-9]+)$/);
      let filePath = "";
      if (matches) {
        filePath = `${siNumber}/${type}.${matches[2]}`;
      } else {
        alert("ファイルパスの特定に失敗しました");
        return;
      }

      const { error } = await supabase
        .storage
        .from('shipment-files')
        .remove([filePath]);

      if (error) {
        alert("削除に失敗しました");
        console.error(error);
        return;
      }
      // 新しいformDataを作る
      const newFormData = {
        ...formData,
        [`${type}_url`]: undefined,
      };

      
      setFormData(newFormData); // 画面も即更新

      alert("削除しました");

      // ここで新しいformDataでDB保存
      // Supabaseに存在しないカラムを除外
      const { invoiceFile, siFile, items, ...safeData } = newFormData;
      safeData.invoice_url = newFormData.invoice_url;
      safeData.pl_url = newFormData.pl_url;
      safeData.si_url = newFormData.si_url;
      safeData.other_url = newFormData.other_url;

      const { error: saveError } = await supabase
        .from('shipments')
        .upsert([safeData]);
      if (saveError) {
        alert('保存に失敗しました');
        console.error(saveError);
      } else {
        alert('保存しました！');
      }
    };

  return (
    <Modal
      open={!!shipment}
      onClose={onClose}
      title={`SI詳細: ${shipment?.si_number || ""}`}
      primaryAction={editMode
        ? { content: '💾 保存', onAction: handleSave }
        : { content: '✎ 編集', onAction: () => setEditMode(true) }
      }
      secondaryActions={[
        ...(editMode ? [{ content: 'キャンセル', onAction: () => setEditMode(false) }] : []),
        { content: '閉じる', onAction: onClose }
      ]}
    >

      {/*  編集モード */}
      <Modal.Section>
        {editMode ? (
          <BlockStack gap="400">
            {/* ステータス */}
            <Select
              label="ステータス"
              value={formData.status || ""}
              options={[
                { label: "SI発行済", value: "SI発行済" },
                { label: "船積スケジュール確定", value: "船積スケジュール確定" },
                { label: "船積中", value: "船積中" },
                { label: "輸入通関中", value: "輸入通関中" },
                { label: "倉庫着", value: "倉庫着" }
              ]}
              onChange={v => setFormData(prev => ({ ...prev, status: v }))}
            />
            {/* 輸送手段 */}
            <TextField
              label="輸送手段"
              value={formData.transport_type || ""}
              onChange={v => setFormData(prev => ({ ...prev, transport_type: v }))}
            />
            {/* ETD/ETA */}
            <TextField
              label="ETD"
              type="date"
              value={formData.etd || ""}
              onChange={v => setFormData(prev => ({ ...prev, etd: v }))}
            />
            <TextField
              label="ETA"
              type="date"
              value={formData.eta || ""}
              onChange={v => setFormData(prev => ({ ...prev, eta: v }))}
            />
            {/* 遅延 */}
            <Select
              label="遅延"
              value={String(formData.delayed ?? false)}
              options={[
                { label: "なし", value: "false" },
                { label: "あり", value: "true" }
              ]}
              onChange={v => setFormData(prev => ({ ...prev, delayed: v === "true" }))}
            />
            {/* 通関日・倉庫着日 */}
            <TextField
              label="通関日"
              type="date"
              value={formData.clearance_date || ""}
              onChange={v => setFormData(prev => ({ ...prev, clearance_date: v }))}
            />
            <TextField
              label="倉庫着日"
              type="date"
              value={formData.arrival_date || ""}
              onChange={v => setFormData(prev => ({ ...prev, arrival_date: v }))}
            />
            {/* 仕入れ先 */}
            <TextField
              label="仕入れ先"
              value={formData.supplier_name || ""}
              onChange={v => setFormData(prev => ({ ...prev, supplier_name: v }))}
            />
            {/* メモ */}
            <TextField
              label="メモ"
              multiline={3}
              value={formData.memo || ""}
              onChange={v => setFormData(prev => ({ ...prev, memo: v }))}
            />
            {/* アーカイブ */}
            <Checkbox
              label="アーカイブ"
              checked={!!formData.is_archived}
              onChange={v => setFormData(prev => ({ ...prev, is_archived: v }))}
            />
            {/* 積載商品リスト */}
            <Text as="h4" variant="headingSm">積載商品リスト</Text>
            {(formData.items || []).map((item, idx) => (
              <InlineStack key={idx} gap="200" align="center">
                <TextField
                  label="商品名"
                  value={item.name || ""}
                  onChange={v => {
                    const items = [...formData.items];
                    items[idx].name = v;
                    setFormData(prev => ({ ...prev, items }));
                  }}
                />
                <TextField
                  label="数量"
                  type="number"
                  value={String(item.quantity || "")}
                  onChange={v => {
                    const items = [...formData.items];
                    items[idx].quantity = Number(v);
                    setFormData(prev => ({ ...prev, items }));
                  }}
                  min={1}
                />
                <Button
                  size="slim"
                  destructive
                  onClick={() => {
                    const items = [...formData.items];
                    items.splice(idx, 1);
                    setFormData(prev => ({ ...prev, items }));
                  }}
                >
                  削除
                </Button>
              </InlineStack>
            ))}
            <Button
              size="slim"
              onClick={() =>
                setFormData(prev => ({
                  ...prev,
                  items: [...(prev.items || []), { name: "", quantity: 1 }]
                }))
              }
            >
              ＋商品追加
            </Button>
            {/* ファイルアップロード */}
            <Text as="h4" variant="headingSm">関連ファイル</Text>
            {FILE_TYPES.map(({ label, key }) => (
              <BlockStack key={key} gap="100">
                <Text>{label}:</Text>
                <input type="file" onChange={e => handleFileUpload(e, key)} />
                {formData[`${key}_url`] && (
                  <InlineStack gap="100">
                    <Button url={formData[`${key}_url`]} target="_blank" external>
                      📄 アップロード済み{label}を見る
                    </Button>
                    <Button size="slim" destructive onClick={() => handleFileDelete(key)}>
                      削除
                    </Button>
                  </InlineStack>
                )}
              </BlockStack>
            ))}
          </BlockStack>
        ) : (
          <BlockStack gap="300">
          <Text><b>ステータス:</b> {shipment.status}</Text>
          <Text><b>輸送手段:</b> {shipment.transport_type}</Text>
          <Text><b>ETD:</b> {shipment.etd}</Text>
          <Text><b>ETA:</b> {shipment.eta}</Text>
          <Text><b>遅延:</b> {shipment.delayed ? "あり" : "なし"}</Text>
          <Text><b>通関日:</b> {shipment.clearance_date || "未定"}</Text>
          <Text><b>倉庫着日:</b> {shipment.arrival_date || "未定"}</Text>
          <Text><b>仕入れ先:</b> {shipment.supplier_name}</Text>
          <Text><b>メモ:</b> {shipment.memo || "なし"}</Text>
          <Text><b>アーカイブ:</b> {shipment.is_archived ? "✅" : "❌"}</Text>
          <Text as="h4" variant="headingSm">積載商品リスト</Text>
          <ul>
            {(shipment.items || []).map((item, i) => (
              <li key={i}>{item.name}：{item.quantity}個</li>
            ))}
          </ul>
          <Text as="h4" variant="headingSm">関連ファイル</Text>
          <BlockStack gap="100">
            {shipment.invoice_url && (
              <Button url={shipment.invoice_url} target="_blank" external>
                Invoice ファイルを見る
              </Button>
            )}
            {shipment.pl_url && (
              <Button url={shipment.pl_url} target="_blank" external>
                PL ファイルを見る
              </Button>
            )}
            {shipment.si_url && (
              <Button url={shipment.si_url} target="_blank" external>
                SI ファイルを見る
              </Button>
            )}
            {shipment.other_url && (
              <Button url={shipment.other_url} target="_blank" external>
                その他ファイルを見る
              </Button>
            )}
          </BlockStack>
        </BlockStack>
      )}
        </Modal.Section>
      </Modal>
  );
};


export default CustomModal;
