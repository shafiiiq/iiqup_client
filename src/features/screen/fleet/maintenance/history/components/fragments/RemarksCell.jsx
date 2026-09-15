import { getServiceRemarksText } from '../../helper/maintenance.history.helper';

function RemarksCell({ item, remarkKey, expandedRemarks, onToggleRemark }) {
  const remarksText = getServiceRemarksText(item);
  if (!remarksText) return null;

  const isTruncatable = remarksText.length > 100;
  const isExpanded = expandedRemarks[remarkKey];

  return (
    <div className="equipment maintenance history remarks content">
      <div className={`equipment maintenance history remarks text${isExpanded ? ' expanded' : ''}`}>{remarksText}</div>
      {isTruncatable && (
        <button
          className="equipment maintenance history view more button no-print"
          onClick={(event) => { event.stopPropagation(); onToggleRemark(remarkKey); }}
        >
          {isExpanded ? 'View Less' : 'View More'}
        </button>
      )}
    </div>
  );
}

export default RemarksCell;