import React from 'react';

const ActivityTimeline = ({
  title = "Recent Fleet Activities",
  subtitle = "Latest updates and changes in your fleet",
  data,
  currentData,
  formatDateTime,
  getActivityContent,
  COLORS,
  markerColor,
  isHalf
}) => {
  const timelineData = data || currentData?.updates;

  if (!timelineData?.length) return null;

  return (
    <div className={`activity-card  ${isHalf ? 'rec-stock-item' : ''}`}>
      <div className="activity-header">
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <div className="activity-timeline">
        {timelineData.slice(0, 40).reverse().map((item, index) => {
          const datetime = formatDateTime(item.date || item.createdAt);
          return (
            <div key={item._id || index} className="timeline-item">
              <div
                className="timeline-marker"
                style={{
                  backgroundColor: markerColor || COLORS.chartColors[index % COLORS.chartColors.length]
                }}
              ></div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-type">
                    {item.content ? item.content.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Stock Movement'}
                  </span>
                  <span className="timeline-datetime">
                    {datetime.date} at {datetime.time}
                  </span>
                </div>
                {item.description ? (
                  <div
                    className="timeline-description"
                    dangerouslySetInnerHTML={{ __html: item.description }}
                  />
                ) : (
                  <div
                    className="timeline-description"
                    dangerouslySetInnerHTML={{ __html: getActivityContent(item) }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityTimeline;