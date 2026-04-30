import { useRef, useState } from 'react';
import { Upload, X, Printer, Loader } from 'lucide-react';
import { api } from '../lib/api';

const MAX_TOTAL_MB = 25;

function fmt(b) {
  if (!b) return '';
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
  return (b / (1024 * 1024)).toFixed(1) + ' MB';
}

function getIcon(type, name) {
  if (!type) return '📄';
  if (type.startsWith('image/')) return '🖼️';
  if (type === 'application/pdf') return '📕';
  if (type.includes('word') || /\.docx?$/i.test(name)) return '📝';
  if (type.includes('excel') || type.includes('spreadsheet') || /\.xlsx?$/i.test(name)) return '📊';
  if (type.includes('powerpoint') || /\.pptx?$/i.test(name)) return '📋';
  if (type.includes('zip') || type.includes('rar')) return '🗜️';
  return '📄';
}

function totalSize(files) {
  return files.reduce((sum, f) => sum + (f.size || 0), 0);
}

/**
 * Props:
 *   value      – array of file objects { name, size, type, url, filename }
 *   onChange   – (newArray) => void
 *   onPreview  – (fileObj) => void
 *   maxMB      – optional override (default 25)
 */
export default function FileUploadZone({ value = [], onChange, onPreview, maxMB = MAX_TOTAL_MB }) {
  const maxBytes = maxMB * 1024 * 1024;
  const ref = useRef();
  const [drag, setDrag] = useState(false);
  const [err, setErr] = useState('');
  const [uploading, setUploading] = useState(false);

  const processFiles = async (fileList) => {
    setErr('');
    const incoming = Array.from(fileList);
    const currentBytes = totalSize(value);
    const newBytes = incoming.reduce((s, f) => s + f.size, 0);

    if (currentBytes + newBytes > maxBytes) {
      setErr(`Total size would exceed ${maxMB} MB limit.`);
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      incoming.forEach(f => formData.append('files', f));
      const uploaded = await api.uploadFiles(formData);
      onChange([...value, ...uploaded]);
    } catch (e) {
      setErr('Upload failed: ' + (e.message || 'Unknown error'));
    } finally {
      setUploading(false);
    }
  };

  const remove = (idx) => {
    setErr('');
    onChange(value.filter((_, i) => i !== idx));
  };

  const handlePrint = (file) => {
    const src = file.url ? `http://localhost:5000${file.url}` : file.dataUrl;
    if (!src) return;
    const win = window.open('', '_blank');
    if (!win) return;
    if (file.type?.startsWith('image/')) {
      win.document.write(`<html><body style="margin:0"><img src="${src}" style="max-width:100%" onload="window.print();window.close()"/></body></html>`);
    } else {
      win.document.write(`<html><body style="margin:0"><iframe src="${src}" style="width:100%;height:100vh;border:none" onload="window.print();window.close()"></iframe></body></html>`);
    }
    win.document.close();
  };

  const used = totalSize(value);
  const pct = Math.min(100, (used / maxBytes) * 100);
  const barColor = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#6366f1';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Drop zone */}
      <div
        onClick={() => !uploading && ref.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); if (e.dataTransfer.files.length) processFiles(e.dataTransfer.files); }}
        style={{
          border: '2px dashed ' + (drag ? '#6366f1' : 'var(--border)'),
          borderRadius: 10, padding: '22px 20px', textAlign: 'center',
          cursor: uploading ? 'wait' : 'pointer',
          background: drag ? 'rgba(99,102,241,.06)' : 'var(--surface-2)',
          transition: 'all .15s',
          opacity: uploading ? 0.7 : 1,
        }}
      >
        {uploading
          ? <><Loader size={22} style={{ margin: '0 auto 8px', color: '#6366f1', display: 'block', animation: 'spin 1s linear infinite' }} /><div style={{ fontSize: 13, fontWeight: 600 }}>Uploading...</div></>
          : <><Upload size={22} style={{ margin: '0 auto 8px', color: drag ? '#6366f1' : 'var(--text-faint)', display: 'block' }} />
            <div style={{ fontSize: 13, fontWeight: 600 }}>{drag ? 'Drop files here' : 'Click to upload or drag & drop'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 4 }}>Any file type · Multiple files allowed · Max {maxMB} MB total</div>
          </>
        }
        <input
          ref={ref} type="file" accept="*/*" multiple style={{ display: 'none' }}
          onChange={(e) => { if (e.target.files.length) processFiles(e.target.files); e.target.value = ''; }}
        />
      </div>

      {/* Error */}
      {err && <div style={{ fontSize: 12, color: '#ef4444' }}>{err}</div>}

      {/* Size bar */}
      {value.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-faint)', marginBottom: 4 }}>
            <span>{value.length} file{value.length > 1 ? 's' : ''}</span>
            <span>{fmt(used)} / {maxMB} MB</span>
          </div>
          <div style={{ height: 4, borderRadius: 99, background: 'var(--border)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: pct + '%', background: barColor, borderRadius: 99, transition: 'width .3s' }} />
          </div>
        </div>
      )}

      {/* File list */}
      {value.map((file, idx) => (
        <div key={idx} style={{
          display: 'flex', alignItems: 'center', gap: 10,
          border: '1.5px solid var(--border)', borderRadius: 10,
          padding: '10px 14px', background: 'var(--surface-2)',
        }}>
          <div style={{ fontSize: 22, flexShrink: 0 }}>{getIcon(file.type, file.name)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>{fmt(file.size)}</div>
          </div>
          {onPreview && (
            <button type="button" onClick={() => onPreview(file)}
              style={{ fontSize: 12, color: '#6366f1', fontWeight: 600, background: 'none', border: '1px solid #6366f1', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Preview
            </button>
          )}
          <button type="button" onClick={() => handlePrint(file)} title="Print"
            style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px', display: 'flex', alignItems: 'center' }}>
            <Printer size={14} />
          </button>
          <button type="button" onClick={() => remove(idx)} title="Remove"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, display: 'flex', alignItems: 'center' }}>
            <X size={15} />
          </button>
        </div>
      ))}
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
