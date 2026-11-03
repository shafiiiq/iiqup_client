import './Notification.css';
import './NotificationComposer.css';
import './NotificationOverlay.css';
import './NotificationExtras.css';

import Tabs from '@/shared/components/widgets/tabs/Tabs';

import { NOTIFICATION_VIEW_MODES } from '../constants/notification.tabs';
import { useNotificationScreen } from '../hooks/useNotificationScreen';
import NotificationCard from './fragments/NotificationCard';
import NotificationCategorySheet from './fragments/NotificationCategorySheet';
import NotificationComposerPanel from './fragments/NotificationComposerPanel';
import NotificationEmptyState from './fragments/NotificationEmptyState';
import NotificationFeatureLinkViewer from './fragments/NotificationFeatureLinkViewer';
import NotificationListFooter from './fragments/NotificationListFooter';
import NotificationMentionNavigator from './fragments/NotificationMentionNavigator';
import NotificationNewMessageButton from './fragments/NotificationNewMessageButton';
import NotificationSectionLabel from './fragments/NotificationSectionLabel';
import NotificationSummaryList from './fragments/NotificationSummaryList';
import NotificationToolbar from './fragments/NotificationToolbar';
import NotificationUnreadPill from './fragments/NotificationUnreadPill';

const Notification = () => {
  const screen = useNotificationScreen();
  const { feed, composer, mentions, replies, reactions, readTracking, search, outgoing, unreadAbove } = screen;
  const isNotificationMode = screen.viewMode === NOTIFICATION_VIEW_MODES.NOTIFICATION;

  const renderRow = (row) => {
    if (row.rowKind === 'label') return <NotificationSectionLabel key={row.id} label={row.label} />;
    return (
      <NotificationCard
        key={row.id}
        item={row.item}
        isHighlighted={screen.highlightedNotificationId === row.item._id}
        threadView={replies.buildThreadView(row.item._id)}
        showCategory={screen.selectedTab.tab !== 'category'}
        onActionPress={screen.handleActionPress}
        onToggleLike={reactions.toggleNotificationLike}
        onToggleThread={replies.toggleThread}
        onViewed={readTracking.queueRead}
        onPressCategory={screen.openItemCategory}
        onPressFeatureLink={screen.openFeatureLink}
        onRetryOutgoing={(target) => outgoing.retry(target._id)}
        onDiscardOutgoing={(target) => outgoing.discard(target._id)}
      />
    );
  };

  return (
    <div className="features screen notification root">
      <Tabs
        items={screen.tabItems}
        activePath={[screen.selectedTab.id]}
        onSelect={screen.handleTabSelect}
        title="Notifications"
        maxHeight="calc(100vh - 230px)"
      />

      <div className="features screen notification center">
        <NotificationToolbar
          viewMode={screen.viewMode}
          unreadCount={screen.unreadCount}
          mentionCount={screen.mentionCount}
          onChangeViewMode={screen.setViewMode}
          onMarkAllRead={screen.markAllRead}
          onPressMentions={mentions.openFirst}
        />

        {isNotificationMode ? (
          <div className="features screen notification feed">
            {screen.rows.map(renderRow)}
            {screen.rows.length === 0 && (
              <NotificationEmptyState isLoading={feed.isInitialLoading || search.isSearching} />
            )}
            <NotificationListFooter
              sentinelRef={screen.sentinelRef}
              isLoadingMore={feed.isLoadingMore}
              hasMoreItems={!screen.isSearchActive && feed.hasMore}
              hasRows={screen.rows.length > 0}
              onLoadMore={feed.loadMore}
            />
          </div>
        ) : (
          <NotificationSummaryList
            mode={NOTIFICATION_VIEW_MODES.CATEGORY}
            categories={screen.summaries.categories}
            people={[]}
            isLoading={screen.summaries.isCategoriesLoading}
            onOpenEvent={screen.openSummaryEvent}
            onOpenCategoryInfo={screen.openCategoryInfo}
          />
        )}
      </div>

      <aside className="features screen notification person-panel">
        <NotificationSectionLabel label="People" />
        <NotificationSummaryList
          mode={NOTIFICATION_VIEW_MODES.PERSON}
          categories={[]}
          people={screen.summaries.people}
          isLoading={screen.summaries.isPeopleLoading}
          onOpenEvent={screen.openSummaryEvent}
        />
      </aside>

      {isNotificationMode && (
        <>
          <NotificationUnreadPill
            count={unreadAbove.unreadAboveCount}
            direction="top"
            onPress={unreadAbove.scrollToTop}
          />
          <NotificationUnreadPill
            count={unreadAbove.unreadBelowCount}
            direction="bottom"
            onPress={unreadAbove.scrollToNextUnreadBelow}
          />
        </>
      )}

      <NotificationMentionNavigator
        isVisible={isNotificationMode && mentions.isNavigating && mentions.targetCount > 1}
        canGoPrevious={mentions.canGoPrevious}
        canGoNext={mentions.canGoNext}
        onPrevious={mentions.goToPrevious}
        onNext={mentions.goToNext}
      />

      <NotificationNewMessageButton onClick={composer.open} hasDraft={composer.hasDraft} />

      <NotificationComposerPanel composer={composer} />

      <NotificationCategorySheet target={screen.categoryTarget} onClose={screen.closeCategoryInfo} />

      <NotificationFeatureLinkViewer link={screen.featureLink} onClose={screen.closeFeatureLink} />
    </div>
  );
};

export default Notification;