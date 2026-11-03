import { useState } from 'react';

function QuotationDownloadPicker({ amendmentCount, onConfirm, onClose }) {
  const options = [
    { key: 'original', label: 'Original' },
    ...Array.from({ length: amendmentCount }, (_, i) => ({
      key: String(i + 1),
      label: `Amendment ${i + 1}${i + 1 === amendmentCount ? ' (latest)' : ''}`,
    })),
  ];
  const allKeys = options.map((o) => o.key);
  const [selected, setSelected] = useState(allKeys);

  const toggle = (key) =>
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <div className="features screen quotation report download-overlay" onClick={onClose}>
      <div className="features screen quotation report download-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="features screen quotation report download-title">Download PDF</div>

        <div className="features screen quotation report download-quick">
          <button type="button" onClick={() => setSelected(allKeys)}>All</button>
          <button type="button" onClick={() => setSelected(['original'])}>Original only</button>
          <button type="button" onClick={() => setSelected([String(amendmentCount)])}>Latest amendment only</button>
        </div>

        <div className="features screen quotation report download-list">
          {options.map((option) => (
            <label key={option.key} className="features screen quotation report download-option">
              <input type="checkbox" checked={selected.includes(option.key)} onChange={() => toggle(option.key)} />
              {option.label}
            </label>
          ))}
        </div>

        <div className="features screen quotation report download-actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="features screen quotation report download-confirm"
            disabled={!selected.length}
            onClick={() => onConfirm(selected)}
          >
            Download
          </button>
        </div>
      </div>
    </div>
  );
}

export default QuotationDownloadPicker;