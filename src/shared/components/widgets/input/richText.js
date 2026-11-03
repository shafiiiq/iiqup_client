const COLOR_RE = /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]+)$/i;

const escapeHtml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const cleanStyle = (style) => {
  const out = [];
  style.split(';').forEach((decl) => {
    const idx = decl.indexOf(':');
    if (idx < 0) return;
    const prop = decl.slice(0, idx).trim().toLowerCase();
    const val = decl.slice(idx + 1).trim();
    if (prop === 'font-weight' && /^(bold|bolder|[5-9]00|normal)$/i.test(val)) out.push(`font-weight:${val}`);
    else if (prop === 'font-style' && /^(italic|oblique|normal)$/i.test(val)) out.push(`font-style:${val}`);
    else if ((prop === 'background-color' || prop === 'background') && COLOR_RE.test(val) && val.toLowerCase() !== 'transparent') {
      out.push(`background-color:${val}`);
    }
  });
  return out.join(';');
};

const walk = (node) => {
  let out = '';
  node.childNodes.forEach((child) => {
    if (child.nodeType === 3) {
      out += escapeHtml(child.nodeValue);
      return;
    }
    if (child.nodeType !== 1) return;
    const tag = child.tagName.toLowerCase();
    if (tag === 'br') {
      out += '<br>';
      return;
    }
    const inner = walk(child);
    if (tag === 'b' || tag === 'strong') out += `<b>${inner}</b>`;
    else if (tag === 'i' || tag === 'em') out += `<i>${inner}</i>`;
    else if (tag === 'span' || tag === 'font') {
      const style = cleanStyle(child.getAttribute('style') || '');
      out += style ? `<span style="${style}">${inner}</span>` : inner;
    } else if (tag === 'div' || tag === 'p') out += child.nextSibling ? `${inner}<br>` : inner;
    else out += inner;
  });
  return out;
};

export const sanitizeRichHtml = (html) => {
  if (!html) return '';
  const tpl = document.createElement('template');
  tpl.innerHTML = String(html);
  return walk(tpl.content);
};

export const richHtml = (value) => ({ __html: sanitizeRichHtml(String(value ?? '')) });

export const stripHtml = (value) => {
  if (!value) return '';
  const tpl = document.createElement('template');
  tpl.innerHTML = String(value);
  return tpl.content.textContent || '';
};