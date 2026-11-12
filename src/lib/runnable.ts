// Decides whether a Python example can run in the browser, and helps the editor.

const NEEDS_INSTALL = /^\s*(?:from|import)\s+(torch|torchvision|anthropic|sentence_transformers|transformers|peft|fastapi|uvicorn|argon2|dotenv|pytest|cart|mcp)\b/m;
const NEEDS_KEY = /\bclient\.messages\.|\bMODEL\b/;
const NEEDS_FILE = /read_csv\("sales\.csv"\)|open\("docs\.json"\)/;

/** null when the example can run here; otherwise a sentence saying why not. */
export function whyNotRunnable(code: string): string | null {
  const m = NEEDS_INSTALL.exec(code);
  if (m) return `This example uses ${m[1]}, which cannot run in the browser. Run it on your own computer.`;
  if (NEEDS_KEY.test(code)) return 'This example calls a model provider with an API key, so it cannot run in the browser. Run it on your own computer.';
  if (NEEDS_FILE.test(code)) return 'This example reads a file you have to supply, so it cannot run in the browser as written.';
  return null;
}

/** What to insert when Enter is pressed: keep the indentation, and add one level after a colon. */
export function newlineIndent(textBeforeCursor: string): string {
  const line = textBeforeCursor.slice(textBeforeCursor.lastIndexOf('\n') + 1);
  const indent = /^[ \t]*/.exec(line)![0];
  return '\n' + indent + (/:\s*(#.*)?$/.test(line) ? '    ' : '');
}

export function hintFor(kind: string | undefined): string {
  if (kind === 'NameError') return 'Hint: a NameError often means a name is misspelt. On this page it can also mean this example uses something made in an earlier example: run that one first.';
  if (kind === 'ModuleNotFoundError') return 'Hint: this library is not available in the browser version of Python. Run the example on your own computer.';
  if (kind === 'FileNotFoundError') return 'Hint: files written by an earlier example on this page are kept until you reload. Run the example that creates the file first.';
  return '';
}
