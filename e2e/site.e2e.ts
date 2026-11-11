import fs from 'node:fs';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const stored = (page: import('@playwright/test').Page) => page.evaluate(() => JSON.parse(localStorage.getItem('zte-progress') ?? 'null'));

test('marking a chapter done survives a reload and counts in both courses', async ({ page }) => {
  await page.goto('/ai/terminal-files/');
  await page.getByRole('button', { name: 'Mark done and continue' }).click();
  await expect(page).toHaveURL(/\/ai\/setup\/$/);
  await page.reload();
  await expect(page.locator('.side .meter span')).toHaveText('1 of 41 chapters done');
  await expect(page.locator('.nav a.done')).toHaveCount(1);
  // The terminal chapter is shared, so the other course shows it done too.
  await page.goto('/se/');
  await expect(page.locator('.side .meter span')).toHaveText('1 of 36 chapters done');
  await page.goto('/se/terminal-files/');
  await page.getByRole('button', { name: 'Mark as not done' }).click();
  await expect(page.locator('.side .meter span')).toHaveText('0 of 36 chapters done');
});

test('ticked exercises and quiz answers are restored', async ({ page }) => {
  await page.goto('/ai/math-vectors/');
  const box = page.locator('input[data-check]').first();
  await box.check();
  const q = page.locator('.quiz .q').first();
  const answer = Number(await q.getAttribute('data-answer'));
  await q.locator('button').nth(answer).click();
  await expect(q.locator('.why')).toContainText('Correct.');
  await page.reload();
  await expect(box).toBeChecked();
  await expect(q.locator('.why')).toContainText('Correct.');
  await expect(q.locator('button').nth(answer)).toHaveClass(/right/);
});

test('a wrong quiz answer comes back on the review page and moves up a box when answered correctly', async ({ page }) => {
  await page.goto('/se/sql/');
  const q = page.locator('.quiz .q').first();
  const answer = Number(await q.getAttribute('data-answer'));
  await q.locator('button').nth(answer === 0 ? 1 : 0).click();
  await expect(q.locator('.why')).toContainText('Not quite.');
  expect((await stored(page)).review['sql#0'].box).toBe(1);

  await page.goto('/review/');
  await expect(page.locator('#reviewStatus')).toContainText('Nothing more is due today. 1 question is waiting');

  // Pretend a day has passed.
  await page.evaluate(() => {
    const p = JSON.parse(localStorage.getItem('zte-progress')!);
    p.review['sql#0'].due = '2020-01-01';
    localStorage.setItem('zte-progress', JSON.stringify(p));
  });
  await page.reload();
  await expect(page.locator('#reviewStatus')).toHaveText('1 due today.');
  await page.locator('#reviewOptions button').nth(answer).click();
  await expect(page.locator('#reviewWhy')).toContainText('Correct.');
  expect((await stored(page)).review['sql#0'].box).toBe(2);
  await page.getByRole('button', { name: 'Finish' }).click();
  await expect(page.locator('#reviewStatus')).toContainText('You reviewed 1 question.');
});

test('progress can be downloaded, erased and restored from the file', async ({ page }, info) => {
  await page.goto('/ai/the-map/');
  await page.getByRole('button', { name: 'Mark done and continue' }).click();
  await page.goto('/progress/');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download my progress' }).click()]);
  const file = info.outputPath('progress.json');
  await download.saveAs(file);
  const saved = JSON.parse(fs.readFileSync(file, 'utf8'));
  expect(saved.app).toBe('zero-to-engineer');
  expect(saved.done).toEqual({ 'ai-the-map': true });

  const erase = page.locator('#resetBtn');
  await erase.click();
  await erase.click();
  await expect(page.locator('#progressMsg')).toHaveText('Your progress has been erased.');
  expect(await stored(page)).toBeNull();

  await page.locator('#importFile').setInputFiles(file);
  await page.getByRole('button', { name: 'Replace my progress with this file' }).click();
  await expect(page.locator('#progressMsg')).toContainText('Restored: 1 finished chapter');
  expect((await stored(page)).done).toEqual({ 'ai-the-map': true });

  // A file that is not a progress file changes nothing.
  const junk = info.outputPath('junk.json');
  fs.writeFileSync(junk, '{"hello": 1}');
  await page.locator('#importFile').setInputFiles(junk);
  await page.getByRole('button', { name: 'Replace my progress with this file' }).click();
  await expect(page.locator('#progressMsg')).toContainText('Nothing was changed.');
  expect((await stored(page)).done).toEqual({ 'ai-the-map': true });
});

test('search finds a chapter', async ({ page }) => {
  await page.goto('/search/');
  await page.getByRole('searchbox').fill('gradient descent');
  await expect(page.locator('#searchResults li a').first()).toHaveAttribute('href', '/ai/gradient-descent/');
  await page.getByRole('searchbox').fill('qqqzzzxxx');
  await expect(page.locator('#searchStatus')).toContainText('Nothing found');
});

test('the planner makes a schedule and refuses nonsense', async ({ page }) => {
  await page.goto('/planner/');
  await expect(page.locator('#plSummary')).toContainText('41 of 41 chapters left');
  const weeksAt8 = await page.locator('.planweek').count();
  await page.locator('#plHours').fill('16');
  await expect(page.locator('.planweek')).not.toHaveCount(weeksAt8);
  expect(await page.locator('.planweek').count()).toBeLessThan(weeksAt8);
  await page.locator('#plHours').fill('0');
  await expect(page.locator('#plError')).toHaveText('Enter at least 0.5 hours a week.');
  await expect(page.locator('.planweek')).toHaveCount(0);
  await page.locator('#plHours').fill('16');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download as a calendar file' }).click()]);
  expect(download.suggestedFilename()).toBe('ai-study-plan.ics');
  await page.reload();
  await expect(page.locator('#plHours')).toHaveValue('16');
});

test('a glossary term in a chapter links to its entry', async ({ page }) => {
  await page.goto('/se/sql/');
  await page.locator('a.term', { hasText: 'SQL' }).first().click();
  await expect(page).toHaveURL(/\/glossary\/#term-sql$/);
  await expect(page.locator('#term-sql')).toBeInViewport();
});

test('the tutor box copies a prompt containing the chapter and the question', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/ai/tokens-embeddings/');
  await page.getByRole('button', { name: 'Copy the prompt' }).click();
  await expect(page.locator('#tutorOut')).toContainText('Type a question first');
  await page.locator('#tutorQ').fill('Why is a token not a word?');
  await page.getByRole('button', { name: 'Copy the prompt' }).click();
  await expect(page.locator('#tutorOut')).toContainText('Copied.');
  const text = await page.evaluate(() => navigator.clipboard.readText());
  expect(text).toContain('<chapter title="Tokens and embeddings">');
  expect(text).toContain('A tokenizer splits text into pieces');
  expect(text).toContain('Why is a token not a word?');
  expect(text).toContain('complete beginner');
});

test('demos respond to their controls', async ({ page }) => {
  await page.goto('/ai/math-vectors/');
  await page.locator('#vcA').fill('90');
  await expect(page.locator('#vcRead')).toContainText('dot product = 0.00');
  await page.goto('/se/algorithms/');
  await page.getByRole('button', { name: 'Step' }).click();
  await expect(page.locator('#bsRead')).toContainText(/Checked 34|Found in 1 step/);
});

test('keyboard: the skip link is first and moves focus to the content', async ({ page }) => {
  await page.goto('/ai/attention/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#main')).toBeFocused();
});

test('keyboard: a quiz can be answered without a mouse', async ({ page }) => {
  await page.goto('/ai/attention/');
  const first = page.locator('.quiz .q').first().locator('button').first();
  await first.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.quiz .q').first().locator('.why')).toBeVisible();
  await expect(first).toHaveAttribute('aria-pressed', 'true');
});

test('the theme switch is remembered', async ({ page }) => {
  await page.goto('/');
  const toggle = page.locator('[data-theme-toggle]').first();
  await toggle.click();
  await expect(toggle).toHaveText('Theme: light');
  await toggle.click();
  await expect(toggle).toHaveText('Theme: dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('@phone the chapter menu opens and closes, and nothing overflows sideways', async ({ page }) => {
  await page.goto('/se/sql/');
  await expect(page.locator('#side')).toBeHidden();
  await page.getByRole('button', { name: 'Chapters' }).click();
  await expect(page.locator('#side')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#side')).toBeHidden();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

const AXE_PAGES = ['/', '/ai/', '/ai/the-map/', '/ai/math-numbers/', '/ai/python-basics/', '/ai/sampling/', '/ai/library/', '/se/algorithms/', '/se/html-css/', '/se/glossary/', '/review/', '/planner/', '/search/', '/glossary/', '/progress/'];
for (const theme of ['light', 'dark'] as const) {
  test(`accessibility checks pass in ${theme} mode`, async ({ page }) => {
    test.slow();
    await page.emulateMedia({ colorScheme: theme });
    for (const path of AXE_PAGES) {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice']).analyze();
      expect(results.violations.map((v) => `${path}: ${v.id} (${v.nodes.length}) ${v.nodes[0].html.slice(0, 100)}`)).toEqual([]);
    }
  });
}

// Needs the internet: Python is downloaded from the jsDelivr CDN.
test('Python runs in the browser, including input() and errors @network', async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto('/ai/python-basics/');
  const arithmetic = page.locator('.runner').nth(2);
  await arithmetic.getByRole('button', { name: 'Run' }).click();
  await expect(arithmetic.locator('.runner-out')).toHaveText('9\n5\n14\n3.5\n3\n1\n49\n', { timeout: 90_000 });

  const asking = page.locator('.runner').nth(4);
  await asking.getByRole('button', { name: 'Run' }).click();
  await asking.getByLabel('What is your name?').fill('Ama');
  await asking.getByRole('button', { name: 'Enter' }).click();
  await asking.getByLabel('What year were you born?').fill('not a year');
  await asking.getByRole('button', { name: 'Enter' }).click();
  await expect(asking.locator('.runner-out')).toContainText("ValueError: invalid literal for int() with base 10: 'not a year'");

  // Edit an example, break it, and read the error.
  const first = page.locator('.runner').first();
  await first.getByRole('button', { name: 'Edit' }).click();
  await page.locator('.runner-editor').fill('total = 2 * 21\nprint("The answer is", total)');
  await first.getByRole('button', { name: 'Run' }).click();
  await expect(first.locator('.runner-out')).toHaveText('The answer is 42\n');
});
