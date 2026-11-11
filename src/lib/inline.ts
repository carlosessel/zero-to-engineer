// A very small inline Markdown renderer for text that lives in YAML files
// (exercise items). Supports: `code`, **bold**, *italic*, [text](https://…),
// backslash escapes, and chapter references:
//   [[ref:chapter-id]]        -> "chapter 12" as a link
//   [[n:chapter-id]]          -> "12" as a link
//   [[ref:chapter-id|label]]  -> label as a link

export interface RefTarget {
  href: string;
  number: number;
}

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const TOKEN =
  /\\([\\`*_{}\[\]<])|(`+)(.+?)\2|\*\*(.+?)\*\*|\*(.+?)\*|\[\[(ref|n):([\w-]+)(?:\|(.+?))?\]\]|\[([^\]]+)\]\((https?:[^)\s]+)\)/g;

export function renderInline(src: string, ref: (id: string) => RefTarget): string {
  let out = '';
  let last = 0;
  for (const m of src.matchAll(TOKEN)) {
    out += escapeHtml(src.slice(last, m.index));
    last = m.index + m[0].length;
    if (m[1] !== undefined) out += escapeHtml(m[1]);
    else if (m[2] !== undefined) out += `<code>${escapeHtml(m[3].replace(/^ (.*) $/, '$1'))}</code>`;
    else if (m[4] !== undefined) out += `<strong>${renderInline(m[4], ref)}</strong>`;
    else if (m[5] !== undefined) out += `<em>${renderInline(m[5], ref)}</em>`;
    else if (m[6] !== undefined) {
      const t = ref(m[7]);
      const label = m[8] !== undefined ? renderInline(m[8], ref) : m[6] === 'n' ? String(t.number) : `chapter ${t.number}`;
      out += `<a href="${escapeHtml(t.href)}">${label}</a>`;
    } else out += `<a href="${escapeHtml(m[10])}">${renderInline(m[9], ref)}</a>`;
  }
  return out + escapeHtml(src.slice(last));
}
