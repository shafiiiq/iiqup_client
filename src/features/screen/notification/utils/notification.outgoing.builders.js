import { buildFilledDistributionText } from './notification.distribution.fields';
import { createOutgoingState, toOutgoingAttachments } from './notification.outgoing.utils';
import { describeReply } from './notification.reply.describe';

export const buildOutgoingReply = ({ pendingId, payload, parent, author }) => ({
  _id: pendingId,
  notificationId: payload.notificationId,
  author,
  text: payload.text,
  mentions: payload.mentionCodes,
  attachments: toOutgoingAttachments(payload.files),
  parentReplyId: payload.parentReplyId,
  parentPreview: parent
    ? { replyId: parent._id, authorName: parent.author?.name || '', text: describeReply(parent) }
    : null,
  featureLinks: payload.featureLinks,
  likeCount: 0,
  likedByMe: false,
  mentionsMe: false,
  isViewedByMe: true,
  createdAt: new Date().toISOString(),
  outgoing: createOutgoingState(payload.files.length > 0),
});

export const buildOutgoingNotification = ({ pendingId, payload, author }) => {
  const authorName = author?.name || 'You';
  const now = new Date().toISOString();
  return {
    _id: pendingId,
    kind: 'event',
    title: payload.distribution
      ? payload.distribution.definition.label
      : payload.categoryLabel
        ? `${authorName} posted in ${payload.categoryLabel}`
        : `${authorName} sent a message`,
    body: payload.distribution
      ? buildFilledDistributionText(payload.distribution.definition.fields, payload.distribution.text)
      : payload.text || payload.featureLinks.map((link) => link.title).join(', '),
    priority: 'medium',
    actor: author,
    source: null,
    actions: [],
    mentions: payload.mentionCodes,
    likeCount: 0,
    likedByMe: false,
    replyCount: 0,
    unseenReplyCount: 0,
    isRead: true,
    mentionsMe: false,
    createdAt: now,
    lastActivityAt: now,
    categoryKey: null,
    categoryLabel: payload.categoryLabel,
    featureLinks: payload.featureLinks,
    sourceAttachments: toOutgoingAttachments(payload.files),
    outgoing: createOutgoingState(payload.files.length > 0),
  };
};