// Runs a JavaScript example from a chapter and records what it prints, the
// way the site's Run button shows it (same formatter: src/lib/show-value.ts).
// Used by tests/js-blocks.test.ts and by scripts/js_output.ts (for drafting).
import vm from 'node:vm';
import { showAll } from '../src/lib/show-value.ts';

export interface RunOptions {
  /** Hidden code run first, in the same context (for example, values from an earlier block). */
  before?: string;
  /** Responses for fetch(): address -> JSON body. Any other address gives a 404. */
  fetch_json?: Record<string, unknown>;
  /** How long to wait for timers and promises to finish, in milliseconds. */
  wait_ms?: number;
}

export interface RunResult {
  output: string;
  error: { name: string; message: string; stack: string } | null;
  context: vm.Context;
}

export async function runExample(code: string, opts: RunOptions = {}): Promise<RunResult> {
  const lines: string[] = [];
  const record = (...args: unknown[]) => lines.push(showAll(args));
  let error: RunResult['error'] = null;
  const fail = (e: unknown) => {
    if (!error) error = { name: (e as Error)?.name ?? 'Error', message: String((e as Error)?.message ?? e), stack: String((e as Error)?.stack ?? '') };
  };

  const fakeFetch = async (url: string) => {
    const known = opts.fetch_json && Object.prototype.hasOwnProperty.call(opts.fetch_json, url);
    return {
      ok: !!known,
      status: known ? 200 : 404,
      json: async () => (known ? structuredClone(opts.fetch_json![url]) : { message: 'Not Found' }),
      text: async () => (known ? JSON.stringify(opts.fetch_json![url]) : 'Not Found'),
    };
  };

  const context = vm.createContext({
    console: { log: record, info: record, warn: record, error: record, table: record },
    setTimeout,
    clearTimeout,
    setInterval,
    clearInterval,
    queueMicrotask,
    structuredClone,
    performance,
    TextEncoder,
    TextDecoder,
    btoa,
    atob,
    Intl,
    fetch: fakeFetch,
    URL,
    URLSearchParams,
  });

  // A promise rejected and never handled would otherwise go unnoticed.
  const onUnhandled = (reason: unknown) => fail(reason);
  process.on('unhandledRejection', onUnhandled);
  try {
    if (opts.before) vm.runInContext(opts.before, context, { filename: 'before.js' });
    try {
      vm.runInContext(code, context, { filename: 'example.js', timeout: 5000 });
    } catch (e) {
      fail(e);
    }
    await new Promise((r) => setTimeout(r, opts.wait_ms ?? 20));
  } finally {
    process.off('unhandledRejection', onUnhandled);
  }
  // Errors from another realm are not instances of this realm's Error, so use their names.
  return { output: lines.join('\n'), error, context };
}
