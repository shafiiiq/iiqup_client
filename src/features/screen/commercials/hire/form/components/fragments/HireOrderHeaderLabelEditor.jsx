import { useState } from 'react';

import RichField from '@/shared/components/widgets/input/RichField';
import QuotationHeaderLabel from '@/features/screen/commercials/quotation/shared/components/QuotationHeaderLabel';

function HireOrderHeaderLabelEditor({ label, onChange }) {
  const [editing, setEditing] = useState(false);

  const startEditing = (event) => {
    if (event.metaKey || event.ctrlKey) return;
    setEditing(true);
  };

  if (!editing) {
    return (
      <div className="features screen hire order header-label-display" onClick={startEditing}>
        {label ? <QuotationHeaderLabel label={label} /> : <span className="features screen hire order header-label-placeholder">Column name</span>}
      </div>
    );
  }

  return (
    <RichField
      autoFocus
      multiline
      className="features screen hire order table-input header-input"
      value={label}
      onChange={onChange}
      onBlur={() => setEditing(false)}
      placeholder="Column name"
    />
  );
}

export default HireOrderHeaderLabelEditor;