import React from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { toDisplayLabel } from '../../helper/dashboard.format.helper';
import { DIRECTION_COLOR } from '../../constants/dashboard.constant';
import './DashboardPanels.css';

const TreemapCell = (props) => {
  const { x, y, width, height, name, fill } = props;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} style={{ fill, stroke: '#ffffff', strokeWidth: 2 }} />
      {width > 60 && height > 28 && (
        <text x={x + 10} y={y + 22} fill="#ffffff" fontSize={12} fontWeight={700}>{name}</text>
      )}
    </g>
  );
};

const DistributionTreemap = ({ counts, collections }) => {
  const data = collections
    .map((entry) => ({ name: toDisplayLabel(entry.label), size: counts[entry.key] || 0, fill: DIRECTION_COLOR[entry.direction] }))
    .filter((entry) => entry.size > 0);

  return (
    <div className="features screen dashboard panel-card panel-span-2">
      <div className="features screen dashboard panel-card-header">
        <h3>Volume Map</h3>
        <p>Every collection's share of activity this period, sized by volume</p>
      </div>

      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={320}>
          <Treemap data={data} dataKey="size" stroke="#ffffff" content={<TreemapCell />}>
            <Tooltip formatter={(value) => [`${value} records`, 'Count']} />
          </Treemap>
        </ResponsiveContainer>
      ) : (
        <div className="features screen dashboard panel-empty"><p>No data for this period</p></div>
      )}
    </div>
  );
};

export default DistributionTreemap;
