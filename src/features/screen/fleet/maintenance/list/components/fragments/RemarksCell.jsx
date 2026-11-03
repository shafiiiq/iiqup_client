import { getServiceRemarksText } from '../../helper/maintenance.list.helper';

function RemarksCell({ item, remarkKey, expandedRemarks, onToggleRemark }) {
  const remarksText = getServiceRemarksText(item);
  if (!remarksText) return null;

  const isTruncatable = remarksText.length > 100;
  const isExpanded = expandedRemarks[remarkKey];

  return (
    <div className="fleet maintenance list remarks content">
      <div className={`fleet maintenance list remarks text${isExpanded ? ' expanded' : ''}`}>{remarksText}</div>
      {isTruncatable && (
        <button
          className="fleet maintenance list view more button no-print"
          onClick={(event) => { event.stopPropagation(); onToggleRemark(remarkKey); }}
        >
          {isExpanded ? 'View Less' : 'View More'}
        </button>
      )}
    </div>
  );
}

export default RemarksCell;