// Turns a lecture written in Markdown into HTML (TEMPO_PLAN.md section 9). Only the parts
// lessons need: headings, paragraphs, lists, quotes (shown as tip boxes), rules, bold,
// italic, code and links. Raw HTML in the text is escaped, never run.
// Lessons can also embed a fretboard with one line:
//   ::neck strings=E,A notes=C,D,E,F,G,A,B frets=0-12 caption="Natural notes on the low strings"

import { escapeHtml } from '../utils/html.js';

// ─── Blocks ───

// Renders a whole Markdown document. `embed(name, options)` returns HTML for "::name" lines.
export function renderMarkdown(text, { embed = () => '' } = {}) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const html = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index++;
    } else if (line.startsWith('::')) {
      html.push(embed(...parseEmbed(line)));
      index++;
    } else if (/^#{1,3} /.test(line)) {
      const level = line.match(/^#+/)[0].length + 1;
      html.push(`<h${level} class="lesson__h${level}">${renderInline(line.replace(/^#+ /, ''))}</h${level}>`);
      index++;
    } else if (/^---+$/.test(line.trim())) {
      html.push('<hr class="lesson__rule">');
      index++;
    } else if (line.startsWith('>')) {
      const quote = collect(lines, index, (candidate) => candidate.startsWith('>'));
      html.push(`<aside class="lesson__tip">${renderInline(quote.lines.map((part) => part.replace(/^>\s?/, '')).join(' '))}</aside>`);
      index = quote.next;
    } else if (/^[-*] /.test(line)) {
      const list = collect(lines, index, (candidate) => /^[-*] /.test(candidate));
      html.push(`<ul class="lesson__list">${list.lines.map((item) => `<li>${renderInline(item.replace(/^[-*] /, ''))}</li>`).join('')}</ul>`);
      index = list.next;
    } else if (/^\d+\. /.test(line)) {
      const list = collect(lines, index, (candidate) => /^\d+\. /.test(candidate));
      html.push(`<ol class="lesson__list">${list.lines.map((item) => `<li>${renderInline(item.replace(/^\d+\. /, ''))}</li>`).join('')}</ol>`);
      index = list.next;
    } else {
      const paragraph = collect(lines, index, (candidate) => candidate.trim() && !/^(#{1,3} |[-*] |\d+\. |>|::|---)/.test(candidate));
      html.push(`<p>${renderInline(paragraph.lines.join(' '))}</p>`);
      index = paragraph.next;
    }
  }
  return html.join('\n');
}

// Collects consecutive lines that pass `test`, starting at `start`. Returns { lines, next }.
function collect(lines, start, test) {
  const found = [];
  let next = start;
  while (next < lines.length && test(lines[next])) {
    found.push(lines[next]);
    next++;
  }
  return { lines: found, next };
}

// Splits an embed line into its name and options:
// '::neck strings=E,A caption="Low strings"' → ['neck', { strings: 'E,A', caption: 'Low strings' }].
export function parseEmbed(line) {
  const [, name, rest = ''] = line.match(/^::(\w+)\s*(.*)$/) || [];
  const options = {};
  for (const [, key, quoted, plain] of rest.matchAll(/(\w+)=(?:"([^"]*)"|(\S+))/g)) {
    options[key] = quoted !== undefined ? quoted : plain;
  }
  return [name, options];
}

// ─── Inline ───

// Renders bold, italic, code and links inside one line of text (after escaping it).
export function renderInline(text) {
  const codeParts = [];
  let html = escapeHtml(text).replace(/`([^`]+)`/g, (whole, code) => {
    codeParts.push(`<code>${code}</code>`);
    return `\u0000${codeParts.length - 1}\u0000`;
  });
  html = html
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  return html.replace(/\u0000(\d+)\u0000/g, (whole, number) => codeParts[Number(number)]);
}
