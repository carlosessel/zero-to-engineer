// Runs SQL for the `postgres` check kind (see harness.py) in PGlite, which is
// PostgreSQL compiled to WebAssembly, and prints results the way psql does.
//
// One process holds one database for one chapter. It reads JSON lines on stdin,
// {"setup": "...", "sql": "..."}, runs `setup` silently, then runs `sql` one
// statement at a time, printing each result. Like psql, it reports an error and
// carries on with the next statement. After each request it prints END_MARKER.
import { createInterface } from "node:readline";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
import { pg_trgm } from "@electric-sql/pglite/contrib/pg_trgm";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { tablefunc } from "@electric-sql/pglite/contrib/tablefunc";
import { citext } from "@electric-sql/pglite/contrib/citext";
import { vector } from "@electric-sql/pglite-pgvector";

const END_MARKER = "\u0000END";

// Return every value as PostgreSQL's own text, as psql shows it.
const raw = (value) => value;
const TEXT_TYPES = [16, 17, 18, 19, 20, 21, 23, 25, 26, 114, 142, 700, 701, 790, 1042, 1043, 1082, 1083, 1114, 1184, 1186, 1266, 1700, 2950, 3802,
  1000, 1001, 1005, 1007, 1009, 1015, 1016, 1021, 1022, 1028, 1115, 1182, 1183, 1185, 1187, 1231, 1270, 2951, 199, 3807, 3614, 3615, 3734, 3769, 869, 650, 829];
const parsers = Object.fromEntries(TEXT_TYPES.map((oid) => [oid, raw]));
const NUMERIC = new Set([20, 21, 23, 26, 700, 701, 790, 1700]);

// Extensions the chapters use; each still needs CREATE EXTENSION, as on a real server.
const db = new PGlite({ parsers, extensions: { btree_gist, pg_trgm, pgcrypto, tablefunc, citext, vector } });
await db.exec("SET TimeZone = 'UTC'; SET DateStyle = 'ISO, YMD'; SET IntervalStyle = 'postgres';");

// Split a script into statements, respecting quotes, dollar quotes and comments.
function split(sql) {
  const out = [];
  let current = "";
  let i = 0;
  while (i < sql.length) {
    const c = sql[i];
    const rest = sql.slice(i);
    if (rest.startsWith("--")) {
      const end = sql.indexOf("\n", i);
      i = end === -1 ? sql.length : end + 1;
      current += "\n";
      continue;
    }
    if (rest.startsWith("/*")) {
      const end = sql.indexOf("*/", i + 2);
      i = end === -1 ? sql.length : end + 2;
      continue;
    }
    if (c === "'" || c === '"') {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === c && sql[j + 1] === c) j += 2;
        else if (sql[j] === c) break;
        else j++;
      }
      current += sql.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    const dollar = /^\$[A-Za-z_]*\$/.exec(rest);
    if (dollar) {
      const tag = dollar[0];
      const end = sql.indexOf(tag, i + tag.length);
      const stop = end === -1 ? sql.length : end + tag.length;
      current += sql.slice(i, stop);
      i = stop;
      continue;
    }
    if (c === ";") {
      if (current.trim()) out.push(current.trim());
      current = "";
      i++;
      continue;
    }
    current += c;
    i++;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

const width = (s) => [...s].length;

// Arrays come back already parsed; print them as PostgreSQL's array literals, as psql does.
function arrayText(value) {
  if (value === null || value === undefined) return "NULL";
  if (Array.isArray(value)) return "{" + value.map(arrayText).join(",") + "}";
  const text = String(value);
  return text === "" || /[\s,{}"\\]/.test(text) || text.toUpperCase() === "NULL" ? '"' + text.replace(/["\\]/g, "\\$&") + '"' : text;
}
const cellText = (v) => (v === null || v === undefined ? "" : Array.isArray(v) ? arrayText(v) : String(v));

function table(result) {
  const names = result.fields.map((f) => f.name);
  const numeric = result.fields.map((f) => NUMERIC.has(f.dataTypeID));
  const cells = result.rows.map((row) => names.map((n) => cellText(row[n])));
  const widths = names.map((n, k) => Math.max(width(n), ...cells.map((r) => Math.max(...r[k].split("\n").map(width)))));
  const centre = (s, w) => {
    const left = Math.floor((w - width(s)) / 2);
    return " ".repeat(left) + s + " ".repeat(w - width(s) - left);
  };
  const header = " " + names.map((n, k) => centre(n, widths[k])).join(" | ") + " ";
  const rule = widths.map((w) => "-".repeat(w + 2)).join("+");
  const rows = cells.map((r) => (" " + r.map((v, k) => (numeric[k] ? " ".repeat(widths[k] - width(v)) + v : v + " ".repeat(widths[k] - width(v)))).join(" | ")).trimEnd());
  return [header, rule, ...rows, `(${result.rows.length} ${result.rows.length === 1 ? "row" : "rows"})`].join("\n");
}

async function run(sql, print) {
  const out = [];
  for (const statement of split(sql)) {
    try {
      const results = await db.exec(statement);
      if (!print) continue;
      for (const result of results) {
        if (result.fields.length > 0) out.push(table(result) + "\n");
      }
    } catch (error) {
      if (!print) throw error;
      out.push(`ERROR:  ${error.message}`);
      if (error.detail) out.push(`DETAIL:  ${error.detail}`);
      if (error.hint) out.push(`HINT:  ${error.hint}`);
      if (error.where) out.push(`CONTEXT:  ${error.where}`);
    }
  }
  return out.join("\n");
}

const input = createInterface({ input: process.stdin });
for await (const line of input) {
  if (!line.trim()) continue;
  const request = JSON.parse(line);
  let text;
  try {
    if (request.setup) await run(request.setup, false);
    text = await run(request.sql ?? "", true);
  } catch (error) {
    text = `SETUP FAILED: ${error.message}`;
  }
  process.stdout.write(text.replace(/\n+$/, "") + "\n" + END_MARKER + "\n");
}
