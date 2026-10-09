const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ESCAPE_MAP[char]);

class SafeHtml {
  constructor(value) {
    this.value = value;
  }
}

function renderValue(value) {
  if (value instanceof SafeHtml) return value.value;
  if (Array.isArray(value)) return value.map(renderValue).join('');
  if (value === null || value === undefined || value === false) return '';
  return escapeHtml(value);
}

/**
 * Tagged template that escapes every interpolated value, so file names,
 * skills and AI text can never inject markup. Nested html`` results and
 * arrays of them are inserted as-is.
 */
export function html(strings, ...values) {
  let output = '';
  strings.forEach((chunk, index) => {
    output += chunk;
    if (index < values.length) output += renderValue(values[index]);
  });
  return new SafeHtml(output);
}

export function render(container, content) {
  container.innerHTML = content instanceof SafeHtml ? content.value : escapeHtml(content);
}

export const $ = (selector, root = document) => root.querySelector(selector);

export function badges(items, className, emptyMessage) {
  if (!items || items.length === 0) return html`<p class="muted">${emptyMessage}</p>`;
  return html`<div class="badge-list">${items.map((item) => html`<span class="${className}">${item}</span>`)}</div>`;
}
