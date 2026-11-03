import { useCallback, useEffect, useRef, useState } from 'react';
import { notificationFeed } from '@/features/core/messaging/notification/feed/notification.feed';
import {
  notifyNotificationTyping,
  stopNotificationTyping,
  useNotificationTypingNames,
} from '@/features/core/messaging/notification/typing/notification.typing';
import { OUTGOING_SENT_VISIBLE_MS } from '../constants/notification.outgoing';
import { setReplyLike } from '../services/notification.reaction.service';
import {
  createNotificationReply,
  fetchReplies,
  fetchReplySummary,
  markRepliesViewed,
} from '../services/notification.reply.service';
import { uploadAttachmentsWithProgress } from '../services/notification.upload.service';
import { readCurrentUserActor } from '../utils/notification.current.actor';
import { buildFileKey, pickFiles } from '../utils/notification.file.picker';
import { extractMentionedCodes, replaceTrailingMention } from '../utils/notification.mention.utils';
import { buildOutgoingReply } from '../utils/notification.outgoing.builders';
import { createOutgoingId } from '../utils/notification.outgoing.utils';
import { stripFeatureTrigger, useFeatureAttachment } from './useFeatureAttachment';
import { useMentionSearch } from './useMentionSearch';
import { useReplyDistribution } from './useReplyDistribution';
import { useVoiceRecorder } from './useVoiceRecorder';

const INITIAL_REPLY_COUNT = 3;
const MORE_REPLIES_COUNT = 10;
const MAX_REPLY_PAGE_SIZE = 50;
const REPLY_HIGHLIGHT_DURATION_MS = 2000;

const EMPTY_THREAD = {
  replies: [],
  nextCursor: null,
  hasMore: false,
  isLoading: false,
  totalCount: 0,
  unseenRemaining: 0,
};
const EMPTY_DRAFT = { text: '', mentions: [], attachments: [], parent: null, isSubmitting: false };

const compareRepliesOldestFirst = (first, second) => {
  const timeDifference = Date.parse(first.createdAt) - Date.parse(second.createdAt);
  if (timeDifference !== 0) return timeDifference;
  if (first._id < second._id) return -1;
  return first._id > second._id ? 1 : 0;
};

const mergeReplies = (existingReplies, incomingReplies) => {
  const repliesById = new Map(existingReplies.map((reply) => [reply._id, reply]));
  incomingReplies.forEach((reply) => {
    const previousReply = repliesById.get(reply._id);
    repliesById.set(reply._id, previousReply ? { ...reply, isViewedByMe: previousReply.isViewedByMe } : reply);
  });
  return [...repliesById.values()].sort(compareRepliesOldestFirst);
};

export const useNotificationReplies = ({ onReplyCreated, onRepliesViewed, onOpenFeatureLink }) => {
  const [openThreadId, setOpenThreadId] = useState(null);
  const [highlightedReplyId, setHighlightedReplyId] = useState(null);
  const [threads, setThreads] = useState({});
  const [drafts, setDrafts] = useState({});
  const [recordingThreadId, setRecordingThreadId] = useState(null);
  const {
    suggestions: mentionSuggestions,
    search: searchMentions,
    cancel: cancelMentionSearch,
  } = useMentionSearch();
  const highlightTimerRef = useRef(null);
  const openThreadIdRef = useRef(null);
  const threadsRef = useRef({});
  const outgoingPayloadsRef = useRef({});
  const sentTimersRef = useRef(new Set());
  const voice = useVoiceRecorder();
  const typingNames = useNotificationTypingNames(openThreadId);
  const feature = useFeatureAttachment(openThreadId ? drafts[openThreadId]?.text ?? '' : '');
  openThreadIdRef.current = openThreadId;
  threadsRef.current = threads;

  useEffect(() => {
    const sentTimers = sentTimersRef.current;
    return () => {
      sentTimers.forEach(clearTimeout);
      sentTimers.clear();
    };
  }, []);

  const patchThread = useCallback((notificationId, patch) => {
    setThreads((previousThreads) => ({
      ...previousThreads,
      [notificationId]: patch(previousThreads[notificationId] ?? EMPTY_THREAD),
    }));
  }, []);

  const patchDraft = useCallback((notificationId, patch) => {
    setDrafts((previousDrafts) => ({
      ...previousDrafts,
      [notificationId]: { ...(previousDrafts[notificationId] ?? EMPTY_DRAFT), ...patch },
    }));
  }, []);

  const replaceOpenThreadText = useCallback(
    (text) => {
      const notificationId = openThreadIdRef.current;
      if (notificationId) patchDraft(notificationId, { text });
    },
    [patchDraft]
  );

  const distribution = useReplyDistribution({
    text: openThreadId ? drafts[openThreadId]?.text ?? '' : '',
    setText: replaceOpenThreadText,
    notificationId: openThreadId,
  });

  const loadReplies = useCallback(
    async (notificationId, options) => {
      patchThread(notificationId, (thread) => ({ ...thread, isLoading: true }));
      try {
        const page = await fetchReplies(notificationId, options);
        const keepsExistingReplies = Boolean(options.after || options.aroundReplyId || options.keepExisting);
        patchThread(notificationId, (thread) => ({
          ...thread,
          replies: mergeReplies(keepsExistingReplies ? thread.replies : [], page.items),
          nextCursor: page.nextCursor,
          hasMore: page.hasMore,
          isLoading: false,
        }));

        const unviewedReplyIds = page.items.filter((reply) => !reply.isViewedByMe).map((reply) => reply._id);
        const syncSummary = async () => {
          try {
            if (unviewedReplyIds.length > 0) await markRepliesViewed(notificationId, unviewedReplyIds);
            const summary = await fetchReplySummary(notificationId);
            patchThread(notificationId, (thread) => ({
              ...thread,
              totalCount: summary.total,
              unseenRemaining: summary.unseen,
            }));
            onRepliesViewed(notificationId, summary);
          } catch (error) {
            console.error('syncReplySummary:', error);
          }
        };
        syncSummary();
      } catch (error) {
        console.error('loadReplies:', error);
        patchThread(notificationId, (thread) => ({ ...thread, isLoading: false }));
      }
    },
    [patchThread, onRepliesViewed]
  );

  useEffect(
    () =>
      notificationFeed.subscribe((event) => {
        const openId = openThreadIdRef.current;
        if (!openId || (event.notificationId && event.notificationId !== openId)) return;
        const thread = threadsRef.current[openId];
        if (!thread) return;
        const loadedCount = Math.max(thread.replies.length, 1);
        const limit = Math.min(thread.hasMore ? loadedCount : loadedCount + MORE_REPLIES_COUNT, MAX_REPLY_PAGE_SIZE);
        loadReplies(openId, { after: null, limit, keepExisting: true });
      }),
    [loadReplies]
  );

  const toggleThread = useCallback(
    (notificationId) => {
      cancelMentionSearch();
      feature.reset();
      distribution.discard();
      if (openThreadId === notificationId) {
        stopNotificationTyping();
        patchThread(notificationId, (thread) => ({
          ...thread,
          replies: thread.replies.map((reply) => (reply.isViewedByMe ? reply : { ...reply, isViewedByMe: true })),
        }));
        setOpenThreadId(null);
        return;
      }
      setOpenThreadId(notificationId);
      if (!threads[notificationId]) loadReplies(notificationId, { after: null, limit: INITIAL_REPLY_COUNT });
    },
    [openThreadId, threads, loadReplies, patchThread, feature.reset, cancelMentionSearch, distribution.discard]
  );

  const openThreadAtReply = useCallback(
    async (notificationId, replyId) => {
      cancelMentionSearch();
      distribution.discard();
      setOpenThreadId(notificationId);
      await loadReplies(notificationId, { after: null, limit: INITIAL_REPLY_COUNT, aroundReplyId: replyId });
      setHighlightedReplyId(replyId);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = setTimeout(() => setHighlightedReplyId(null), REPLY_HIGHLIGHT_DURATION_MS);
    },
    [loadReplies, cancelMentionSearch, distribution.discard]
  );

  const appendDraftAttachments = useCallback((notificationId, files) => {
    if (files.length === 0) return;
    setDrafts((previousDrafts) => {
      const draft = previousDrafts[notificationId] ?? EMPTY_DRAFT;
      return { ...previousDrafts, [notificationId]: { ...draft, attachments: [...draft.attachments, ...files] } };
    });
  }, []);

  const pickAttachment = useCallback(
    async (notificationId) => {
      appendDraftAttachments(notificationId, await pickFiles({ accept: 'image/*,video/*', multiple: true }));
    },
    [appendDraftAttachments]
  );

  const pickDocument = useCallback(
    async (notificationId) => {
      appendDraftAttachments(notificationId, await pickFiles({ multiple: true }));
    },
    [appendDraftAttachments]
  );

  const startRecording = useCallback(
    async (notificationId) => {
      if (recordingThreadId) return;
      try {
        if (await voice.startRecording()) setRecordingThreadId(notificationId);
      } catch (error) {
        console.error('startRecording:', error);
        setRecordingThreadId(null);
      }
    },
    [recordingThreadId, voice]
  );

  const cancelRecording = useCallback(async () => {
    try {
      await voice.cancelRecording();
    } catch (error) {
      console.error('cancelRecording:', error);
    }
    setRecordingThreadId(null);
  }, [voice]);

  const selectMention = useCallback(
    (notificationId, candidate) => {
      setDrafts((previousDrafts) => {
        const draft = previousDrafts[notificationId] ?? EMPTY_DRAFT;
        const hasMention = draft.mentions.some((mention) => mention.uniqueCode === candidate.uniqueCode);
        return {
          ...previousDrafts,
          [notificationId]: {
            ...draft,
            text: replaceTrailingMention(draft.text, candidate.name),
            mentions: hasMention ? draft.mentions : [...draft.mentions, candidate],
          },
        };
      });
      cancelMentionSearch();
    },
    [cancelMentionSearch]
  );

  const updateOutgoingReply = useCallback(
    (notificationId, pendingId, patch) => {
      patchThread(notificationId, (thread) => ({
        ...thread,
        replies: thread.replies.map((reply) =>
          reply._id === pendingId && reply.outgoing ? { ...reply, outgoing: { ...reply.outgoing, ...patch } } : reply
        ),
      }));
    },
    [patchThread]
  );

  const deliverReply = useCallback(
    async (pendingId) => {
      const payload = outgoingPayloadsRef.current[pendingId];
      if (!payload) return;
      const { notificationId } = payload;
      updateOutgoingReply(notificationId, pendingId, {
        status: 'sending',
        progress: 0,
        errorMessage: null,
        startedAt: Date.now(),
      });

      try {
        const attachments = await uploadAttachmentsWithProgress({
          files: payload.files,
          target: { context: 'reply', entityId: notificationId, keyPrefix: 'notifications/replies' },
          onProgress: (progress) => updateOutgoingReply(notificationId, pendingId, { progress }),
        });

        const createdReply = await createNotificationReply({
          notificationId,
          text: payload.text,
          mentions: payload.mentionCodes,
          attachments,
          parentReplyId: payload.parentReplyId,
          featureLinks: payload.featureLinks.map((link) => ({
            featureKey: link.featureKey,
            identifier: link.identifier,
          })),
        });
        const author = createdReply.author?.name ? createdReply.author : readCurrentUserActor();
        const sentReply = {
          ...createdReply,
          author,
          outgoing: {
            status: 'sent',
            progress: 1,
            hasFiles: payload.files.length > 0,
            startedAt: Date.now(),
            errorMessage: null,
          },
        };

        delete outgoingPayloadsRef.current[pendingId];
        patchThread(notificationId, (thread) => ({
          ...thread,
          replies: mergeReplies(
            thread.replies.filter((entry) => entry._id !== pendingId),
            [sentReply]
          ),
          totalCount: thread.totalCount + 1,
        }));
        onReplyCreated(notificationId);

        const timerId = setTimeout(() => {
          sentTimersRef.current.delete(timerId);
          patchThread(notificationId, (thread) => ({
            ...thread,
            replies: thread.replies.map((entry) => (entry._id === sentReply._id ? { ...entry, outgoing: null } : entry)),
          }));
        }, OUTGOING_SENT_VISIBLE_MS);
        sentTimersRef.current.add(timerId);
      } catch (error) {
        console.error('deliverReply:', error);
        updateOutgoingReply(notificationId, pendingId, {
          status: 'failed',
          errorMessage: error instanceof Error ? error.message : 'Failed to send',
        });
      }
    },
    [patchThread, updateOutgoingReply, onReplyCreated]
  );

  const submitReply = useCallback(
    async (notificationId, recordedAttachment) => {
      const baseDraft = drafts[notificationId] ?? EMPTY_DRAFT;
      const draft = recordedAttachment
        ? { ...baseDraft, attachments: [...baseDraft.attachments, recordedAttachment] }
        : baseDraft;
      const text = draft.text.trim();
      if (!text && draft.attachments.length === 0 && feature.links.length === 0) return;
      stopNotificationTyping();

      const pendingId = createOutgoingId();
      const payload = {
        notificationId,
        text,
        mentionCodes: extractMentionedCodes(text, draft.mentions),
        files: draft.attachments,
        parentReplyId: draft.parent?._id ?? null,
        featureLinks: feature.links,
      };
      outgoingPayloadsRef.current[pendingId] = payload;
      setDrafts((previousDrafts) => ({ ...previousDrafts, [notificationId]: EMPTY_DRAFT }));
      cancelMentionSearch();
      feature.reset();

      const author = readCurrentUserActor();
      patchThread(notificationId, (thread) => ({
        ...thread,
        replies: mergeReplies(thread.replies, [buildOutgoingReply({ pendingId, payload, parent: draft.parent, author })]),
      }));
      await deliverReply(pendingId);
    },
    [drafts, patchThread, deliverReply, feature, cancelMentionSearch]
  );

  const retryOutgoingReply = useCallback(
    (reply) => {
      deliverReply(reply._id);
    },
    [deliverReply]
  );

  const discardOutgoingReply = useCallback(
    (reply) => {
      delete outgoingPayloadsRef.current[reply._id];
      patchThread(reply.notificationId, (thread) => ({
        ...thread,
        replies: thread.replies.filter((entry) => entry._id !== reply._id),
      }));
    },
    [patchThread]
  );

  const sendRecording = useCallback(
    async (notificationId) => {
      try {
        const recordedFile = await voice.stopRecording();
        setRecordingThreadId(null);
        if (recordedFile) await submitReply(notificationId, recordedFile);
      } catch (error) {
        console.error('sendRecording:', error);
        setRecordingThreadId(null);
      }
    },
    [voice, submitReply]
  );

  const toggleReplyLike = useCallback(
    async (notificationId, reply) => {
      const nextLiked = !reply.likedByMe;
      const applyLike = (likeCount, likedByMe) =>
        patchThread(notificationId, (thread) => ({
          ...thread,
          replies: thread.replies.map((entry) =>
            entry._id === reply._id ? { ...entry, likeCount, likedByMe } : entry
          ),
        }));
      applyLike(Math.max(0, reply.likeCount + (nextLiked ? 1 : -1)), nextLiked);
      try {
        const summary = await setReplyLike(reply._id, nextLiked);
        applyLike(summary.likeCount, summary.likedByMe);
      } catch (error) {
        console.error('toggleReplyLike:', error);
        applyLike(reply.likeCount, reply.likedByMe);
      }
    },
    [patchThread]
  );

  const buildThreadView = (notificationId) => {
    if (openThreadId !== notificationId) return null;
    const thread = threads[notificationId] ?? EMPTY_THREAD;
    const isRecordingHere = recordingThreadId === notificationId;
    return {
      highlightedReplyId,
      replies: thread.replies,
      hasMoreReplies: thread.hasMore,
      isLoadingReplies: thread.isLoading,
      draft: drafts[notificationId] ?? EMPTY_DRAFT,
      mentionSuggestions,
      distributionSuggestions: distribution.suggestions,
      activeDistribution: distribution.active,
      distributionGhostLines: distribution.ghostLines,
      distributionSelection: distribution.selection,
      onChangeDistributionSelection: distribution.changeSelection,
      onClearDistributionSelection: distribution.clearSelection,
      distributionFieldSuggestions: distribution.fieldSuggestions,
      onSelectDistributionFieldSuggestion: distribution.selectFieldSuggestion,
      distributionAttachments: distribution.attachments,
      distributionErrorMessage: distribution.errorMessage,
      isSubmittingDistribution: distribution.isSubmitting,
      onSelectDistribution: distribution.select,
      onClearDistribution: distribution.discard,
      typingNames,
      remainingReplies: Math.max(0, thread.totalCount - thread.replies.length),
      remainingUnseen: thread.unseenRemaining,
      replyTarget: drafts[notificationId]?.parent ?? null,
      onReplyToReply: (reply) => {
        if (!reply.outgoing) patchDraft(notificationId, { parent: reply });
      },
      onRetryOutgoing: retryOutgoingReply,
      onDiscardOutgoing: discardOutgoingReply,
      onCancelReplyTarget: () => patchDraft(notificationId, { parent: null }),
      onJumpToReply: (replyId) => openThreadAtReply(notificationId, replyId),
      featureSuggestions: feature.suggestions,
      pickerFeature: feature.pickerFeature,
      featureLinks: feature.links,
      onSelectFeature: (selectedFeature) => {
        patchDraft(notificationId, { text: stripFeatureTrigger(drafts[notificationId]?.text ?? '') });
        feature.select(selectedFeature);
      },
      onAttachFeatureLink: feature.attachLink,
      onCloseFeaturePicker: feature.closePicker,
      onRemoveFeatureLink: feature.removeLink,
      onPressFeatureLink: onOpenFeatureLink,
      isRecording: isRecordingHere,
      isRecordingPaused: isRecordingHere && voice.isPaused,
      recordingDurationMillis: isRecordingHere ? voice.durationMillis : 0,
      onStartRecording: () => startRecording(notificationId),
      onSendRecording: () => sendRecording(notificationId),
      onPauseRecording: voice.pauseRecording,
      onResumeRecording: voice.resumeRecording,
      onCancelRecording: cancelRecording,
      onLoadMoreReplies: () => {
        if (thread.hasMore && !thread.isLoading) {
          loadReplies(notificationId, { after: thread.nextCursor, limit: MORE_REPLIES_COUNT });
        }
      },
      onChangeText: (text) => {
        if (distribution.active) {
          patchDraft(notificationId, { text: distribution.transformText(text) });
          return;
        }
        if (text.length > 0) notifyNotificationTyping(notificationId);
        patchDraft(notificationId, { text });
        searchMentions(text);
      },
      onPickAttachment: () => {
        if (distribution.active) distribution.pickGallery();
        else pickAttachment(notificationId);
      },
      onPickDocument: () => {
        if (distribution.active) distribution.pickDocument();
        else pickDocument(notificationId);
      },
      onRemoveAttachment: (fileKey) => {
        if (distribution.active) {
          distribution.removeAttachment(fileKey);
          return;
        }
        patchDraft(notificationId, {
          attachments: (drafts[notificationId]?.attachments ?? []).filter((file) => buildFileKey(file) !== fileKey),
        });
      },
      onSelectMention: (candidate) => selectMention(notificationId, candidate),
      onSubmit: () => {
        if (distribution.active) distribution.submit();
        else submitReply(notificationId);
      },
      onToggleReplyLike: (reply) => toggleReplyLike(notificationId, reply),
    };
  };

  return { openThreadId, highlightedReplyId, toggleThread, openThreadAtReply, buildThreadView };
};