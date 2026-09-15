import React from 'react';
import { toDisplayLabel } from '../../helper/dashboard.format.helper';
import './DashboardPanels.css';

const SKIP_FIELDS = new Set(['_id', '__v', '_collection', '_label', 'createdAt', 'updatedAt']);
const SKIP_LABEL_WORDS = ['id', 'code', 'unique'];

const isSkippedLabel = (key) => SKIP_LABEL_WORDS.some((word) => key.toLowerCase().includes(word));

const isDateValue = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value);

const formatCellDate = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.getDate();
  const month = date.toLocaleString('default', { month: 'long' });
  const year = String(date.getFullYear()).slice(2);
  return `${day} ${month} ${year}`;
};

const formatCellValue = (value) => {
  if (value === null || value === undefined) return '—';
  if (isDateValue(String(value))) return formatCellDate(value);
  if (typeof value === 'object') return JSON.stringify(value).slice(0, 40);
  if (typeof value === 'string' && value.length > 60) return `${value.slice(0, 60)}...`;
  return String(value);
};

const deriveColumns = (docs) => {
  if (!docs?.length) return [];
  return Object.keys(docs[0])
    .filter((key) => !SKIP_FIELDS.has(key) && !isSkippedLabel(key))
    .slice(0, 7);
};

const DataTablePanel = ({ title, subtitle, docs }) => {
  const columns = deriveColumns(docs);

  return (
    <div className="features screen dashboard panel-card">
      <div className="features screen dashboard panel-card-header">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>

      {docs?.length > 0 ? (
        <div className="features screen dashboard panel-table-wrap">
          <table className="features screen dashboard panel-table">
            <thead>
              <tr>{columns.map((column) => <th key={column}>{toDisplayLabel(column)}</th>)}</tr>
            </thead>
            <tbody>
              {docs.map((item, index) => (
                <tr key={item._id || index}>
                  {columns.map((column) => <td key={column}>{formatCellValue(item[column])}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="features screen dashboard panel-empty"><p>No records to show</p></div>
      )}
    </div>
  );
};

export default DataTablePanel;
