import { SERIAL_COLUMN_WIDTH_PX } from '../helper/quotation.column.width.helper';

function QuotationColumnGroup({ columns }) {
  return (
    <colgroup>
      <col style={{ width: `${SERIAL_COLUMN_WIDTH_PX}px` }} />
      {columns.map((column) => (
        <col key={column.id} style={column.width ? { width: `${column.width}%` } : undefined} />
      ))}
    </colgroup>
  );
}

export default QuotationColumnGroup;