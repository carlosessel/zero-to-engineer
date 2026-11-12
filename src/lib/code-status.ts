// Turns a chapter's examples.yaml into one plain sentence for the chapter page.

export function codeStatus(checks: { check: string }[]): string | null {
  if (!checks.length) return null;
  const n = (kinds: string[]) => checks.filter((c) => kinds.includes(c.check)).length;
  const tested = n(['python', 'shell', 'sql', 'vitest', 'pip', 'docker', 'web', 'js']);
  const rendered = n(['browser']);
  const fake = n(['python-fake-api']);
  const heavy = n(['heavy']);
  const shown = n(['illustration']);
  const notRun = n(['not-run']);
  const plural = (k: number, one: string, many = one + 's') => `${k} ${k === 1 ? one : many}`;
  const parts: string[] = [];
  if (tested) parts.push(`${plural(tested, 'example')} run under automatic tests`);
  if (rendered) parts.push(`${plural(rendered, 'example')} rendered in a real browser and checked against what the chapter says`);
  if (fake) parts.push(`${plural(fake, 'model API example')} run against a stand-in server, not the live API`);
  if (heavy) parts.push(`${plural(heavy, 'example')} needing PyTorch or a model download, checked in a separate heavy run`);
  if (shown) parts.push(`${plural(shown, 'worked example or sample output', 'worked examples or sample outputs')} checked by hand-written assertions`);
  if (notRun) parts.push(`${plural(notRun, 'example')} that cannot be run automatically`);
  return `Code: ${parts.join('; ')}.`;
}
