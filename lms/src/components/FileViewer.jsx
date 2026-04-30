import { X, Download } from 'lucide-react';

const SERVER = 'http://localhost:5000';

export default function FileViewer({ file, onClose }) {
  if (!file) return null;

  // Resolve the actual URL — prefer server url, fall back to legacy dataUrl
  const src = file.url ? `${SERVER}${file.url}` : (file.dataUrl || '');

  const isImage  = file.type?.startsWith('image/');
  const isPdf    = file.type === 'application/pdf';
  const isText   = file.type?.startsWith('text/');
  const isOffice = file.type?.includes('word') || file.type?.includes('excel') ||
                   file.type?.includes('spreadsheet') || file.type?.includes('powerpoint') ||
                   file.type?.includes('presentation') || file.name?.match(/\.(docx?|xlsx?|pptx?)$/i);

  const fmt = (b) => {
    if (!b) return '';
    if (b < 1024) return b + ' B';
    if (b < 1024 * 1024) return (b / 1024).toFixed(1) + ' KB';
    return (b / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const fileIcon = isOffice
    ? (file.type?.includes('excel') || file.type?.includes('spreadsheet') || file.name?.match(/\.xlsx?$/i) ? '📊'
      : file.type?.includes('powerpoint') || file.name?.match(/\.pptx?$/i) ? '📋' : '📝')
    : '📄';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,.88)',
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn .15s ease',
    }}>
      {/* Header */}
      <div style={{
        height: 56, background: '#0f172a', display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 10, flexShrink: 0,
        borderBottom: '1px solid rgba(255,255,255,.1)',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {file.name}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 1 }}>
            {fmt(file.size)} · {file.type || 'Unknown type'}
          </div>
        </div>
        {src && (
          <a href={src} download={file.name} target="_blank" rel="noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 7,
            background: 'rgba(255,255,255,.1)', color: '#fff',
            textDecoration: 'none', fontSize: 13, fontWeight: 500,
            border: '1px solid rgba(255,255,255,.15)',
          }}>
            <Download size={14} /> Download
          </a>
        )}
        <button onClick={onClose} style={{
          background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)',
          borderRadius: 7, cursor: 'pointer', color: '#fff',
          padding: 8, display: 'flex', alignItems: 'center',
        }}>
          <X size={18} />
        </button>
      </div>

      {/* Viewer body */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: isImage ? 20 : 0 }}>

        {!src && (
          <div style={{ textAlign: 'center', color: '#fff', padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>File not available</div>
            <div style={{ fontSize: 13, opacity: .6, marginTop: 8 }}>The file data could not be loaded.</div>
          </div>
        )}

        {/* Images */}
        {src && isImage && (
          <img src={src} alt={file.name} style={{
            maxWidth: '100%', maxHeight: '100%',
            objectFit: 'contain', borderRadius: 8,
            boxShadow: '0 8px 40px rgba(0,0,0,.6)',
          }} />
        )}

        {/* PDF */}
        {src && isPdf && (
          <iframe src={src} title={file.name}
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
        )}

        {/* Plain text */}
        {src && isText && (
          <iframe src={src} title={file.name}
            style={{ width: '100%', height: '100%', border: 'none', background: '#fff' }} />
        )}

        {/* Office files */}
        {src && isOffice && (
          <div style={{ textAlign: 'center', color: '#fff', padding: 40 }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>{fileIcon}</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{file.name}</div>
            <div style={{ fontSize: 13, opacity: .6, marginBottom: 32, maxWidth: 400, margin: '0 auto 32px' }}>
              Word, Excel and PowerPoint files cannot be previewed in the browser. Download to open in Office.
            </div>
            <a href={src} download={file.name} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 9,
              background: '#6366f1', color: '#fff',
              textDecoration: 'none', fontSize: 14, fontWeight: 600,
            }}>
              <Download size={16} /> Download File
            </a>
          </div>
        )}

        {/* Unknown types */}
        {src && !isImage && !isPdf && !isText && !isOffice && (
          <div style={{ textAlign: 'center', color: '#fff', padding: 40 }}>
            <div style={{ fontSize: 72, marginBottom: 20 }}>📄</div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{file.name}</div>
            <div style={{ fontSize: 13, opacity: .6, marginBottom: 32 }}>
              This file type ({file.type || 'unknown'}) cannot be previewed in the browser.
            </div>
            <a href={src} download={file.name} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '12px 24px', borderRadius: 9,
              background: '#6366f1', color: '#fff',
              textDecoration: 'none', fontSize: 14, fontWeight: 600,
            }}>
              <Download size={16} /> Download to Open
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
