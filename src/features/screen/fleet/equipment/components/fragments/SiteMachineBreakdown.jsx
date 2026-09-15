import { useSiteMachineBreakdown } from '../../hooks/useSiteMachineBreakdown';

function SiteMachineBreakdown({ site }) {
  const { breakdown, isLoading } = useSiteMachineBreakdown(site);

  if (isLoading || !breakdown || breakdown.machineList.length === 0) return null;

  return (
    <div className="fleet equipment site-machine-breakdown">
      <div className="fleet equipment site-machine-breakdown-header">
        <span className="fleet equipment site-machine-breakdown-title">Equipment Breakdown — {site}</span>
        <span className="fleet equipment site-machine-breakdown-total">{breakdown.totalEquipment} total</span>
      </div>
      <div className="fleet equipment site-machine-breakdown-list">
        {breakdown.machineList.map((entry, index) => (
          <div
            key={entry.machine}
            className={`fleet equipment site-machine-breakdown-item ${index === 0 ? 'top' : ''}`}
          >
            <span className="fleet equipment site-machine-breakdown-name">{entry.machine}</span>
            <span className="fleet equipment site-machine-breakdown-count">{entry.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SiteMachineBreakdown;