import { useEffect, useRef } from 'react';

function InlineRenameInput({ initialValue, suffix, onCommit, onCancel }) {
  const inputRef = useRef(null);
  const hasFinishedRef = useRef(false);

  useEffect(() => {
    inputRef.current.focus();
    inputRef.current.select();
  }, []);

  const finishRename = (value) => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    if (value === null) onCancel();
    else onCommit(value);
  };

  const stopEventPropagation = (event) => event.stopPropagation();

  return (
    <div
      className="doc-details-inline-rename"
      onClick={stopEventPropagation}
      onDoubleClick={stopEventPropagation}
      onContextMenu={stopEventPropagation}
      onMouseDown={stopEventPropagation}
    >
      <input
        ref={inputRef}
        type="text"
        defaultValue={initialValue}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === 'Enter') finishRename(event.currentTarget.value);
          if (event.key === 'Escape') finishRename(null);
        }}
        onBlur={(event) => finishRename(event.currentTarget.value)}
      />
      {suffix && <span className="doc-details-inline-rename-suffix">{suffix}</span>}
    </div>
  );
}

export default InlineRenameInput;