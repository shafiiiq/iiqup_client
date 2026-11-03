export const describeReply = (reply) => {
  if (reply.text) return reply.text;
  if ((reply.attachments ?? []).some((attachment) => attachment.mimeType.startsWith('audio/'))) return 'Voice message';
  if ((reply.featureLinks ?? []).length > 0) return reply.featureLinks[0].label;
  return 'Attachment';
};