// Builds the page shown in an example's preview from its HTML, CSS and JavaScript.
// Pure functions with no DOM, so they can be unit-tested.

export interface Sources {
  html: string;
  css: string;
  js: string;
}

/** Runs inside the preview. Reports console messages, errors and form submissions to the chapter page. */
export function bridgeScript(frameId: string): string {
  return `(function () {
  var id = ${JSON.stringify(frameId)};
  function show(v) {
    if (typeof v === 'string') return v;
    if (v instanceof Element) return '<' + v.tagName.toLowerCase() + (v.id ? ' id="' + v.id + '"' : '') + '>';
    try { var s = JSON.stringify(v); return s === undefined ? String(v) : s; } catch (e) { return String(v); }
  }
  function send(level, parts) {
    parent.postMessage({ zte: 'playground', id: id, level: level, text: Array.prototype.map.call(parts, show).join(' ') }, '*');
  }
  ['log', 'info', 'warn', 'error'].forEach(function (level) {
    var original = console[level];
    console[level] = function () { send(level, arguments); return original.apply(console, arguments); };
  });
  window.addEventListener('error', function (e) {
    send('error', [e.message + (e.lineno ? ' (line ' + e.lineno + ')' : '')]);
  });
  // Tell the page how tall the example is, so the frame can fit it.
  function size() {
    parent.postMessage({ zte: 'playground', id: id, level: 'size', text: String(document.documentElement.scrollHeight) }, '*');
  }
  window.addEventListener('load', size);
  if (window.ResizeObserver) new ResizeObserver(size).observe(document.documentElement);
  document.addEventListener('submit', function (e) {
    e.preventDefault();
    var pairs = [];
    new FormData(e.target).forEach(function (value, name) { pairs.push(name + ' = ' + JSON.stringify(String(value))); });
    send('form', ['The form would send: ' + (pairs.length ? pairs.join(', ') : '(nothing: no field has a name)')]);
  });
})();`;
}

const isFullDocument = (html: string) => /<!doctype|<html[\s>]/i.test(html);

/** Removes links to separate .css and .js files when their contents are supplied in the example instead. */
export function dropLocalLinks(html: string, s: Pick<Sources, 'css' | 'js'>): string {
  let out = html;
  if (s.css.trim()) out = out.replace(/<link\b[^>]*\brel=["']?stylesheet["']?[^>]*\bhref=["'](?!https?:|\/\/)[^"']+\.css["'][^>]*>\s*/gi, '');
  if (s.js.trim()) out = out.replace(/<script\b[^>]*\bsrc=["'](?!https?:|\/\/)[^"']+\.js["'][^>]*>\s*<\/script>\s*/gi, '');
  return out;
}

/** The complete document for the preview frame. */
export function buildDocument(s: Sources, frameId: string): string {
  const style = s.css.trim() ? `<style>\n${s.css}\n</style>\n` : '';
  // A </script> inside the learner's own JavaScript would end the script early.
  const userScript = s.js.trim() ? `<script>\n${s.js.replace(/<\/script/gi, '<\\/script')}\n</script>\n` : '';
  const bridge = `<script>${bridgeScript(frameId)}</script>\n`;
  const html = dropLocalLinks(s.html, s);

  if (!isFullDocument(html)) {
    return `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1">\n${bridge}${style}</head>\n<body>\n${html}\n${userScript}</body>\n</html>\n`;
  }
  let doc = html;
  // The bridge goes first in <head>, so it is listening before any of the page's own scripts run.
  if (/<head[^>]*>/i.test(doc)) doc = doc.replace(/<head[^>]*>/i, (m) => `${m}\n${bridge}`);
  else doc = doc.replace(/<html[^>]*>/i, (m) => `${m}\n<head>\n${bridge}</head>`);
  // The example's CSS goes last in <head>, so it wins over anything earlier, as a linked style.css would.
  if (style) doc = /<\/head>/i.test(doc) ? doc.replace(/<\/head>/i, `${style}</head>`) : style + doc;
  if (userScript) doc = /<\/body>/i.test(doc) ? doc.replace(/<\/body>(?![\s\S]*<\/body>)/i, `${userScript}</body>`) : doc + userScript;
  return doc;
}

/** What to insert when Enter is pressed in an HTML, CSS or JavaScript editor. */
export function webNewline(textBeforeCursor: string): string {
  const line = textBeforeCursor.slice(textBeforeCursor.lastIndexOf('\n') + 1);
  const indent = /^[ \t]*/.exec(line)![0];
  return '\n' + indent + (/[{([]\s*$/.test(line) ? '  ' : '');
}
