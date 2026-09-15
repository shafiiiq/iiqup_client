import './Table.css';
import Skeleton from '../loader/skeleton/Skeleton';

function TableSkeleton({ columns = 4, rows = 6, showHeader = true }) {
  const columnSlots = Array.from({ length: columns });
  const rowSlots = Array.from({ length: rows });

  return (
    <div className="shared widget table table-container">
      <table className="shared widget table table-root">
        {showHeader && (
          <thead>
            <tr>
              {columnSlots.map((_, index) => (
                <th key={index}>
                  <Skeleton width="60%" height="12px" />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {rowSlots.map((_, rowIndex) => (
            <tr key={rowIndex} className="shared widget table table-skeleton-row">
              {columnSlots.map((_, colIndex) => (
                <td key={colIndex}>
                  <Skeleton height="14px" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default TableSkeleton;