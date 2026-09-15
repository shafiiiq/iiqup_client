import React, { useRef } from 'react';

const CellInputField = ({ label, value = '', onChange, cellCount = 6, error }) => {
  const cellRefs = useRef([]);
  const paddedValue = value.padEnd(cellCount, '');

  const focusCell = (index) => cellRefs.current[index]?.focus();

  const handleChange = (index, raw) => {
    const nextChar = raw.slice(-1).toUpperCase();
    if (nextChar && !/^[A-Z0-9]$/.test(nextChar)) return;
    const next = paddedValue.substring(0, index) + nextChar + paddedValue.substring(index + 1);
    onChange(next.trimEnd());
    if (nextChar && index < cellCount - 1) focusCell(index + 1);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const next = paddedValue.substring(0, index) + '' + paddedValue.substring(index + 1);
      onChange(next.trimEnd());
      if (index > 0) focusCell(index - 1);
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusCell(index - 1);
    } else if (event.key === 'ArrowRight' && index < cellCount - 1) {
      event.preventDefault();
      focusCell(index + 1);
    }
  };

  const handlePaste = (event) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const next = pasted.substring(0, cellCount);
    onChange(next);
    focusCell(Math.min(next.length, cellCount - 1));
  };

  return (
    <div className="shared widget modal input-section">
      {label && <p className="shared widget modal message input-label">{label}</p>}
      <div className="shared widget modal cell-input-group">
        {Array.from({ length: cellCount }).map((_, index) => (
          <input
            key={index}
            ref={(el) => (cellRefs.current[index] = el)}
            type="text"
            className="shared widget modal cell-input"
            value={paddedValue[index] || ''}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={index === 0 ? handlePaste : undefined}
            maxLength={1}
            autoFocus={index === 0}
          />
        ))}
      </div>
      {error && <div className="shared widget modal input-error">{error}</div>}
    </div>
  );
};

export default CellInputField;
