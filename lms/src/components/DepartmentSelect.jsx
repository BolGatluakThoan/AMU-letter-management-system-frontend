import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { departments as defaultDepts } from '../data/mockData';

const STORAGE_KEY = 'lms-custom-departments';

function loadCustom() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
}
function saveCustom(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

/**
 * Props:
 *   value      – current selected department string
 *   onChange   – (value: string) => void
 *   required   – bool
 *   placeholder – string
 */
export default function DepartmentSelect({ value, onChange, required, placeholder = 'Select department' }) {
  const [custom, setCustom] = useState(loadCustom);
  const [adding, setAdding] = useState(false);
  const [newDept, setNewDept] = useState('');
  const [err, setErr] = useState('');

  const all = [...defaultDepts, ...custom];

  const handleAdd = () => {
    const trimmed = newDept.trim();
    if (!trimmed) { setErr('Name cannot be empty.'); return; }
    if (all.map(d => d.toLowerCase()).includes(trimmed.toLowerCase())) {
      setErr('Department already exists.'); return;
    }
    const updated = [...custom, trimmed];
    setCustom(updated);
    saveCustom(updated);
    onChange(trimmed);
    setAdding(false);
    setNewDept('');
    setErr('');
  };

  const handleRemoveCustom = (dept) => {
    const updated = custom.filter(d => d !== dept);
    setCustom(updated);
    saveCustom(updated);
    if (value === dept) onChange('');
  };

  return (
    <div>
      {!adding ? (
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            className="form-control"
            required={required}
            value={value}
            onChange={e => {
              if (e.target.value === '__add__') { setAdding(true); }
              else onChange(e.target.value);
            }}
            style={{ flex: 1 }}
          >
            <option value="">{placeholder}</option>
            {defaultDepts.map(d => <option key={d} value={d}>{d}</option>)}
            {custom.length > 0 && (
              <>
                <option disabled>── Custom ──</option>
                {custom.map(d => <option key={d} value={d}>{d}</option>)}
              </>
            )}
            <option value="__add__">＋ Add new department...</option>
          </select>
          {custom.includes(value) && (
            <button type="button" title="Remove this custom department"
              onClick={() => handleRemoveCustom(value)}
              style={{ background: 'none', border: '1.5px solid #ef4444', borderRadius: 6, cursor: 'pointer', color: '#ef4444', padding: '0 8px', flexShrink: 0 }}>
              <X size={14} />
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-control"
              autoFocus
              placeholder="Enter new department name"
              value={newDept}
              onChange={e => { setNewDept(e.target.value); setErr(''); }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } if (e.key === 'Escape') { setAdding(false); setNewDept(''); setErr(''); } }}
              style={{ flex: 1 }}
            />
            <button type="button" className="btn btn-primary btn-sm" onClick={handleAdd} style={{ flexShrink: 0 }}>
              <Plus size={14} /> Add
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { setAdding(false); setNewDept(''); setErr(''); }} style={{ flexShrink: 0 }}>
              Cancel
            </button>
          </div>
          {err && <div style={{ fontSize: 11, color: '#ef4444' }}>{err}</div>}
          <div style={{ fontSize: 11, color: 'var(--text-faint)' }}>
            Press Enter to add · Esc to cancel · Custom departments are saved for future use
          </div>
        </div>
      )}
    </div>
  );
}
