import { useEffect, useRef, useState } from 'react';
import { REPLY_FOCUS_DELAY_MS, REPLY_REVEAL_DELAY_MS } from '../../constants/notification.reply';
import { describeReply } from '../../utils/notification.reply.describe';
import { renderComponentIcon } from '@/shared/components/icons/icon.render';
import ComposerAttachmentStrip from './ComposerAttachmentStrip';
import ComposerFullTextModal from './ComposerFullTextModal';
import NotificationActiveChip from './NotificationActiveChip';
import NotificationAttachSheet from './NotificationAttachSheet';
import NotificationFeatureDocumentPicker from './NotificationFeatureDocumentPicker';
import NotificationFeatureLinkChips from './NotificationFeatureLinkChips';
import NotificationReplyItem from './NotificationReplyItem';
import NotificationSuggestionList from './NotificationSuggestionList';
import ReplyComposerBar from './ReplyComposerBar';

const NotificationReplyThread = ({ view }) => {
  const composerRef = useRef(null);
  const replyInputRef = useRef(null);
  const [isAttachSheetOpen, setIsAttachSheetOpen] = useState(false);
  const [isFullTextOpen, setIsFullTextOpen] = useState(false);
  const { draft } = view;
  const hasContent =
    view.activeDistribution !== null ||
    draft.text.trim().length > 0 ||
    draft.attachments.length > 0 ||
    view.featureLinks.length > 0;
  const isSending = draft.isSubmitting || view.isSubmittingDistribution;
  const replyTargetId = view.replyTarget?._id ?? null;

  useEffect(() => {
    if (!view.highlightedReplyId) return;
    document
      .querySelector(`[data-reply-id="${view.highlightedReplyId}"]`)
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [view.highlightedReplyId]);

  useEffect(() => {
    if (!replyTargetId) return undefined;
    const focusTimerId = setTimeout(() => replyInputRef.current?.focus(), REPLY_FOCUS_DELAY_MS);
    const revealTimerId = setTimeout(
      () => composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
      REPLY_REVEAL_DELAY_MS
    );
    return () => {
      clearTimeout(focusTimerId);
      clearTimeout(revealTimerId);
    };
  }, [replyTargetId]);

  return (
    <div className="features screen notification thread">
      {view.replies.map((reply) => (
        <NotificationReplyItem
          key={reply._id}
          reply={reply}
          isHighlighted={reply._id === view.highlightedReplyId}
          view={view}
        />
      ))}

      {view.isLoadingReplies && <span className="features screen notification time">Loading...</span>}
      {view.hasMoreReplies && !view.isLoadingReplies && (
        <button
          type="button"
          className={`features screen notification text-button ${view.remainingUnseen > 0 ? 'attention' : ''}`.trim()}
          onClick={view.onLoadMoreReplies}
        >
          View more
          {view.remainingReplies - view.remainingUnseen > 0
            ? ` (${view.remainingReplies - view.remainingUnseen})`
            : ''}
          {view.remainingUnseen > 0 ? ` ${view.remainingUnseen} new` : ''}
        </button>
      )}

      <NotificationSuggestionList
        suggestions={view.mentionSuggestions}
        getKey={(candidate) => candidate.uniqueCode}
        renderLabel={(candidate) => `${candidate.name}${candidate.designation ? ` · ${candidate.designation}` : ''}`}
        onSelect={view.onSelectMention}
      />

      <NotificationSuggestionList
        suggestions={view.featureSuggestions}
        getKey={(featureOption) => featureOption.key}
        renderLabel={(featureOption) => `${featureOption.label} · #${featureOption.key}`}
        onSelect={view.onSelectFeature}
      />

      <NotificationSuggestionList
        suggestions={view.distributionSuggestions}
        getKey={(distributionOption) => distributionOption.key}
        renderLabel={(distributionOption) => `${distributionOption.label} · //${distributionOption.key}`}
        onSelect={view.onSelectDistribution}
      />

      <NotificationSuggestionList
        suggestions={view.distributionFieldSuggestions}
        getKey={(suggestion) => suggestion.value}
        renderLabel={(suggestion) => suggestion.label}
        onSelect={view.onSelectDistributionFieldSuggestion}
      />

      {view.activeDistribution && (
        <NotificationActiveChip label={view.activeDistribution.label} onClear={view.onClearDistribution} />
      )}

      {view.distributionErrorMessage && (
        <span className="features screen notification error-text">{view.distributionErrorMessage}</span>
      )}

      <NotificationFeatureLinkChips links={view.featureLinks} onRemove={view.onRemoveFeatureLink} />

      {view.typingNames.length > 0 && (
        <span className="features screen notification typing-text">
          {view.typingNames.join(', ')} {view.typingNames.length > 1 ? 'are' : 'is'} typing...
        </span>
      )}

      {view.replyTarget && (
        <div className="features screen notification reply-target-bar">
          {renderComponentIcon('IconlyReply', 18, 'currentColor')}
          <div className="features screen notification reply-target-body">
            <strong>{`Replying to ${view.replyTarget.author?.name || 'Unknown user'}`}</strong>
            <span>{describeReply(view.replyTarget)}</span>
          </div>
          <button type="button" className="features screen notification icon-button" onClick={view.onCancelReplyTarget}>
            {renderComponentIcon('IconlyClose', 18, 'currentColor')}
          </button>
        </div>
      )}

      <div ref={composerRef}>
        <ReplyComposerBar
          view={view}
          inputRef={replyInputRef}
          hasContent={hasContent}
          isSending={isSending}
          onPressAttach={() => setIsAttachSheetOpen(true)}
          onPressExpand={() => setIsFullTextOpen(true)}
        />
      </div>

      <ComposerAttachmentStrip
        files={view.activeDistribution ? view.distributionAttachments : draft.attachments}
        onRemove={view.onRemoveAttachment}
      />

      <NotificationAttachSheet
        isVisible={isAttachSheetOpen}
        onClose={() => setIsAttachSheetOpen(false)}
        onPickMedia={view.onPickAttachment}
        onPickDocument={view.onPickDocument}
      />

      <NotificationFeatureDocumentPicker
        feature={view.pickerFeature}
        attachedLinks={view.featureLinks}
        onAttach={view.onAttachFeatureLink}
        onClose={view.onCloseFeaturePicker}
      />

      <ComposerFullTextModal
        isVisible={isFullTextOpen}
        text={draft.text}
        ghostLines={view.distributionGhostLines}
        selection={view.distributionSelection}
        onChangeText={view.onChangeText}
        onSelectionChange={view.onChangeDistributionSelection}
        onSelectionApplied={view.onClearDistributionSelection}
        onClose={() => setIsFullTextOpen(false)}
      />
    </div>
  );
};

export default NotificationReplyThread;