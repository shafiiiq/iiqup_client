import React from 'react';

const SKIP_FIELDS = new Set([
  '_id', '__v', '_collection', '_label', 'source', 'content',
  'createdAt', 'updatedAt', 'id',
]);

const SKIP_LABEL_WORDS = ['id', 'code', 'unique'];

const isSkippedLabel = (key) => {
  const lower = key.toLowerCase();
  return SKIP_LABEL_WORDS.some(w => lower.includes(w));
};

const isDateValue = (value) => {
  if (typeof value !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{4}-\d{2}-\d{2}T/.test(value);
};

const formatDate = (value) => {
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const day   = d.getDate();
    const month = d.toLocaleString('default', { month: 'long' });
    const year  = String(d.getFullYear()).slice(2);
    return `${day} ${month} ${year}`;
  } catch {
    return value;
  }
};

const getColumns = (docs) => {
  if (!docs?.length) return [];
  return Object.keys(docs[0])
    .filter((k) => !SKIP_FIELDS.has(k) && !isSkippedLabel(k))
    .slice(0, 8);
};

const toLabel = (key) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim();

const formatCell = (value) => {
  if (value === null || value === undefined) return '—';
  if (isDateValue(String(value))) return formatDate(value);
  if (typeof value === 'object') return JSON.stringify(value).substring(0, 40);
  if (typeof value === 'string' && value.length > 60) return value.substring(0, 60) + '...';
  return String(value);
};

const DynamicTable = ({ title, subtitle, docs, cardClass = 'dashboard-equipment-card' }) => {
  if (!docs?.length) return null;
  const columns = getColumns(docs);

  return (
    <div className={cardClass}>
      <div className="table-header">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <div className="maintenance-table-container">
        <table className="maintenance-table">
          <thead>
            <tr>
              {columns.map((col) => <th key={col}>{toLabel(col)}</th>)}
            </tr>
          </thead>
          <tbody>
            {docs.slice(0, 100).map((item, i) => (
              <tr key={item._id || i}>
                {columns.map((col) => (
                  <td key={col}>
                    {formatCell(item[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const DataTable = ({ currentData }) => {
  if (!currentData) return null;

  const SKIP_KEYS = new Set(['counts', 'total', '_id', '__v', '_counts', '_total']);

  const tables = Object.entries(currentData)
    .filter(([key, value]) => !SKIP_KEYS.has(key) && Array.isArray(value) && value.length > 0);

  if (!tables.length) return null;

  return (
    <div className="chart-card-container data-tables" style={{ flexWrap: 'wrap' }}>
      {tables.map(([key, docs]) => (
        <DynamicTable
          key={key}
          title={toLabel(key)}
          subtitle={`${docs.length} records`}
          docs={[...docs].reverse()}
        />
      ))}
    </div>
  );
};

export default DataTable;