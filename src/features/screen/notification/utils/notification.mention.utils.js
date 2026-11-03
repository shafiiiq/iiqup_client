const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const extractMentionedCodes = (text, mentions) =>
  mentions
    .filter((mention) => new RegExp(`(^|\\s)@${escapeRegex(mention.name)}(?=$|[\\s.,!?;:])`).test(text))
    .map((mention) => mention.uniqueCode);

export const replaceTrailingMention = (text, name) => text.replace(/@[^\s@]*$/, `@${name} `);