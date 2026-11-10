import { useState } from 'react';

function PurchaseOrderDownloadPicker({ amendmentCount, onConfirm, onClose }) {
  const options = [
    { key: 'original', label: 'Original' },
    ...Array.from({ length: amendmentCount }, (_, index) => ({
      key: String(index + 1),
      label: `Amendment ${index + 1}${index + 1 === amendmentCount ? ' (latest)' : ''}`,
    })),
  ];
  const allKeys = options.map((option) => option.key);
  const [selected, setSelected] = useState(allKeys);

  const toggle = (key) =>
    setSelected((previous) => (previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key]));

  return (
    <div className="purchase order report download overlay no-print" onClick={onClose}>
      <div className="purchase order report download dialog" onClick={(event) => event.stopPropagation()}>
        <div className="purchase order report download title">Download PDF</div>

        <div className="purchase order report download quick">
          <button type="button" onClick={() => setSelected(allKeys)}>All</button>
          <button type="button" onClick={() => setSelected(['original'])}>Original only</button>
          <button type="button" onClick={() => setSelected([String(amendmentCount)])}>Latest amendment only</button>
        </div>

        <div className="purchase order report download list">
          {options.map((option) => (
            <label key={option.key} className="purchase order report download option">
              <input type="checkbox" checked={selected.includes(option.key)} onChange={() => toggle(option.key)} />
              {option.label}
            </label>
          ))}
        </div>

        <div className="purchase order report download actions">
          <button type="button" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="purchase order report download confirm"
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

export default PurchaseOrderDownloadPicker;