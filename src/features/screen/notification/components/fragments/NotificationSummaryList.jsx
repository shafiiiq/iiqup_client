import { useMemo } from 'react';
import { DEFAULT_CATEGORY_ICON, NOTIFICATION_TAB_ICONS, NOTIFICATION_VIEW_MODES } from '../../constants/notification.tabs';
import { formatNotificationTime } from '../../utils/notification.time.format';
import NotificationAvatar from './NotificationAvatar';
import NotificationEmptyState from './NotificationEmptyState';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';

const buildCategoryRows = (categories) =>
  categories.map((summary) => ({
    id: summary.tab.id,
    title: summary.tab.label,
    tabId: summary.tab.id,
    pendingCount: summary.pendingCount,
    event: summary.latestEvent,
    iconName: NOTIFICATION_TAB_ICONS[summary.tab.id] ?? DEFAULT_CATEGORY_ICON,
    person: null,
    categoryTab: summary.tab.tab === 'category' ? summary.tab : null,
  }));

const buildPersonRows = (people) =>
  people.map((summary) => ({
    id: summary.person.uniqueCode,
    title: summary.person.name,
    tabId: 'all',
    pendingCount: summary.pendingCount,
    event: summary.latestEvent,
    iconName: null,
    person: summary.person,
    categoryTab: null,
  }));

const NotificationSummaryList = ({ mode, categories, people, isLoading, onOpenEvent, onOpenCategoryInfo }) => {
  const rows = useMemo(
    () => (mode === NOTIFICATION_VIEW_MODES.CATEGORY ? buildCategoryRows(categories) : buildPersonRows(people)),
    [mode, categories, people]
  );

  if (rows.length === 0) return <NotificationEmptyState isLoading={isLoading} />;

  return (
    <div className="features screen notification summary-list">
      {rows.map((row) => {
        const { event } = row;
        const eventPrefix = mode === NOTIFICATION_VIEW_MODES.CATEGORY && event ? `${event.actor?.name ?? 'System'}: ` : '';
        return (
          <button
            key={row.id}
            type="button"
            className="features screen notification card summary"
            disabled={!event}
            onClick={() => event && onOpenEvent(event, row.tabId)}
          >
            {row.person ? (
              <NotificationAvatar profilePicPath={row.person.profilePicPath} />
            ) : (
              <span className="features screen notification avatar fallback">
                {renderComponentIcon(row.iconName, 22, 'currentColor')}
              </span>
            )}
            <div className="features screen notification card-content">
              <div className="features screen notification card-header">
                <span className="features screen notification actor-name">{row.title}</span>
                {row.pendingCount > 0 && <span className="features screen notification unread-dot" />}
                {row.categoryTab && (
                  <span
                    role="button"
                    tabIndex={0}
                    className="features screen notification category-info-button"
                    onClick={(clickEvent) => {
                      clickEvent.stopPropagation();
                      onOpenCategoryInfo(row.categoryTab);
                    }}
                  >
                    {renderComponentIcon('IconlyCategory', 18, 'currentColor')}
                  </span>
                )}
              </div>
              <p className="features screen notification message">
                {event ? `${eventPrefix}${event.text}` : 'No activity yet'}
              </p>
              {event && (
                <div className="features screen notification card-footer">
                  <span className="features screen notification time">{formatNotificationTime(event.at)}</span>
                  {row.pendingCount > 1 && (
                    <span className="features screen notification more-text">+{row.pendingCount - 1} more</span>
                  )}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
};

export default NotificationSummaryList;