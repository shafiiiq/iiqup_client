const toFragment = (value) => {
  const template = document.createElement('template');
  template.innerHTML = String(value ?? '').replace(/\r?\n/g, '<br>');
  return template.content;
};

export const countRichLines = (value) => toFragment(value).querySelectorAll('br').length + 1;

export const splitRichHtmlByLines = (value, headLineCount) => {
  const fragment = toFragment(value);
  const lineBreaks = fragment.querySelectorAll('br');
  if (headLineCount < 1 || headLineCount > lineBreaks.length) return null;

  const range = document.createRange();
  range.setStartBefore(fragment.firstChild);
  range.setEndAfter(lineBreaks[headLineCount - 1]);

  const headContainer = document.createElement('div');
  headContainer.appendChild(range.extractContents());
  const tailContainer = document.createElement('div');
  tailContainer.appendChild(fragment);

  const hasTailContent = tailContainer.textContent.trim() || tailContainer.querySelector('br');
  if (!hasTailContent) return null;

  return { head: headContainer.innerHTML, tail: tailContainer.innerHTML };
};