import { useState } from 'react';

import RichField from '@/shared/components/widgets/input/RichField';
import QuotationHeaderLabel from '../../../shared/components/QuotationHeaderLabel';

function QuotationHeaderLabelEditor({ label, onChange }) {
  const [editing, setEditing] = useState(false);

  const startEditing = (event) => {
    if (event.metaKey || event.ctrlKey) return;
    setEditing(true);
  };

  if (!editing) {
    return (
      <div className="features screen quotation form header-label-display" onClick={startEditing}>
        {label ? <QuotationHeaderLabel label={label} /> : <span className="features screen quotation form header-label-placeholder">Column name</span>}
      </div>
    );
  }

  return (
    <RichField
      autoFocus
      className="features screen quotation form table-input header-input"
      value={label}
      onChange={onChange}
      onBlur={() => setEditing(false)}
      placeholder="Column name"
    />
  );
}

export default QuotationHeaderLabelEditor;