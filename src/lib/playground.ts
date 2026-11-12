// Builds the page shown in an example's preview from its HTML, CSS and JavaScript.
// Pure functions with no DOM, so they can be unit-tested.
import { formatArgs, showValue } from './show-value';
import { reactScripts } from './react-preview';

export interface Sources {
  html: string;
  css: string;
  js: string;
}

/** A React example, already compiled (see react-preview.ts), and where the React libraries are. */
export interface ReactPart {
  compiled: string;
  runtimeUrl: string;
  /** The libraries' code itself, to put inline instead of loading runtimeUrl (used in development). */
  runtimeCode?: string;
}

/** Runs inside the preview. Reports console messages, errors and form submissions to the chapter page. */
export function bridgeScript(frameId: string): string {
  return `(function () {
  var id = ${JSON.stringify(frameId)};
  var show = ${showValue.toString()};
  var format = ${formatArgs.toString()};
  function send(level, parts) {
    parent.postMessage({ zte: 'playground', id: id, level: level, text: format(parts, show) }, '*');
  }
  ['log', 'info', 'warn', 'error'].forEach(function (level) {
    var original = console[level];
    console[level] = function () { send(level, arguments); return original.apply(console, arguments); };
  });
  // An error nobody caught stops the script. Browsers word the message differently
  // (Chrome starts it with "Uncaught "), so it is tidied to one form.
  window.addEventListener('error', function (e) {
    var m = String(e.message).replace(/^Uncaught /, '');
    // The example's scripts are named with sourceURL (example.js, App.jsx), so the error's
    // stack says which line of the example it came from. Without that, say no line:
    // the event's own line number counts from the top of this hidden page.
    var at = e.error && e.error.stack && /(?:example\\.js|App\\.jsx):(\\d+)/.exec(String(e.error.stack));
    send('uncaught', ['The code stopped with an error: ' + m + (at ? ' (line ' + at[1] + ')' : '')]);
  });
  window.addEventListener('unhandledrejection', function (e) {
    send('uncaught', ['The code stopped with an error: ' + show(e.reason)]);
  });
  // Tell the page how tall the example is, so the frame can fit it.
  // The body is measured (not the whole document, which is at least as tall as the
  // frame), and again whenever its size changes, because the first measurement can
  // come before layout has finished.
  function size() {
    var b = document.body;
    if (!b) return;
    var cs = getComputedStyle(b);
    var h = b.getBoundingClientRect().height + parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);
    parent.postMessage({ zte: 'playground', id: id, level: 'size', text: String(Math.ceil(h)) }, '*');
  }
  window.addEventListener('load', function () {
    size();
    setTimeout(size, 250);
    if (window.ResizeObserver) new ResizeObserver(size).observe(document.body);
    parent.postMessage({ zte: 'playground', id: id, level: 'loaded', text: '' }, '*');
  });
  // The sandbox has no real storage (that is what keeps the site's own data private),
  // so examples that save with localStorage get a stand-in that lasts until reload.
  try { window.localStorage.length; } catch (err) {
    var mem = {};
    var stand = {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : null; },
      setItem: function (k, v) { mem[k] = String(v); },
      removeItem: function (k) { delete mem[k]; },
      clear: function () { mem = {}; },
      key: function (i) { return Object.keys(mem)[i] || null; },
    };
    Object.defineProperty(stand, 'length', { get: function () { return Object.keys(mem).length; } });
    Object.defineProperty(window, 'localStorage', { value: stand, configurable: true });
  }
  document.addEventListener('submit', function (e) {
    // If the example's own code handled the submission, leave it alone.
    if (e.defaultPrevented) return;
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
export function buildDocument(s: Sources, frameId: string, react?: ReactPart): string {
  const style = s.css.trim() ? `<style>\n${s.css}\n</style>\n` : '';
  // A </script> inside the learner's own JavaScript would end the script early.
  // sourceURL names the script, so browsers count error line numbers from its first
  // line (the example's line 1) instead of from the top of this whole page.
  let userScript = s.js.trim() ? `<script>${s.js.replace(/<\/script/gi, '<\\/script')}\n//# sourceURL=example.js\n</script>\n` : '';
  if (react) userScript += reactScripts(react.compiled, react.runtimeUrl, frameId, react.runtimeCode) + '\n';
  const bridge = `<script>${bridgeScript(frameId)}</script>\n`;
  let html = dropLocalLinks(s.html, s);
  // React examples show themselves in an element with id="root", as in a Vite project.
  if (react && !/\bid=["']?root\b/.test(html)) html += (html ? '\n' : '') + '<div id="root"></div>';

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
