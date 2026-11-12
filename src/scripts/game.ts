// Points, levels, streaks, badges and celebrations in the browser.
// The rules are in src/lib/game.ts; this file shows them and makes things sparkle.
import * as G from '../lib/game';
import { medalSvg } from '../lib/medal';
import { $, $$, save, state, today } from './store';

const shape: G.CourseShape[] = (() => {
  try {
    return JSON.parse(document.getElementById('zte-shape')?.textContent || '[]');
  } catch {
    return [];
  }
})();
const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const base = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;

// ---------- messages ----------
let region: HTMLElement | null = null;
function toastRegion(): HTMLElement {
  if (!region) {
    region = document.createElement('div');
    region.className = 'toasts';
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    document.body.appendChild(region);
  }
  return region;
}

export function toast(html: string, cls = '', ms = 4200): void {
  const t = document.createElement('div');
  t.className = `toast ${cls}`;
  t.innerHTML = html;
  toastRegion().appendChild(t);
  setTimeout(() => {
    t.classList.add('leaving');
    setTimeout(() => t.remove(), 320);
  }, ms);
}

/** A "+20" that floats up from where something was earned. */
function floater(text: string, from?: Element | null): void {
  if (reduced()) return;
  const r = from?.getBoundingClientRect();
  const f = document.createElement('div');
  f.className = 'floater';
  f.textContent = text;
  f.setAttribute('aria-hidden', 'true');
  f.style.left = `${r ? Math.min(r.right - 30, window.innerWidth - 70) : window.innerWidth / 2}px`;
  f.style.top = `${r ? r.top : window.innerHeight / 2}px`;
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 1200);
}

// ---------- confetti ----------
const COLOURS = ['#5B3DF5', '#B23CF0', '#F0457A', '#FF9F1C', '#14B8A6', '#FDE047'];
export function confetti(amount = 1): void {
  if (reduced()) return;
  const canvas = document.createElement('canvas');
  canvas.id = 'confetti';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const dpr = window.devicePixelRatio || 1;
  canvas.width = innerWidth * dpr;
  canvas.height = innerHeight * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.remove();
  ctx.scale(dpr, dpr);
  const parts = Array.from({ length: Math.round(140 * amount) }, (_, i) => {
    const fromLeft = i % 2 === 0;
    return {
      x: fromLeft ? -10 : innerWidth + 10,
      y: innerHeight * (0.55 + Math.random() * 0.3),
      vx: (fromLeft ? 1 : -1) * (6 + Math.random() * 9),
      vy: -(11 + Math.random() * 10),
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 8,
      a: Math.random() * Math.PI,
      va: (Math.random() - 0.5) * 0.4,
      c: COLOURS[i % COLOURS.length],
    };
  });
  const start = performance.now();
  const tick = (now: number) => {
    const t = now - start;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of parts) {
      p.vy += 0.38;
      p.vx *= 0.985;
      p.x += p.vx;
      p.y += p.vy;
      p.a += p.va;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - t / 2600);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.fillStyle = p.c;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h * Math.abs(Math.cos(p.a * 2)));
      ctx.restore();
    }
    if (t < 2600) requestAnimationFrame(tick);
    else canvas.remove();
  };
  requestAnimationFrame(tick);
}

// ---------- level up ----------
function levelUp(info: ReturnType<typeof G.levelInfo>, then?: () => void): void {
  const d = document.createElement('dialog');
  d.className = 'levelup';
  d.setAttribute('aria-labelledby', 'levelup-title');
  d.innerHTML = `<div class="top"><span class="n">${info.level}</span><h2 id="levelup-title">Level ${info.level}: ${info.title}</h2></div>
    <div class="body"><p>You levelled up. ${info.needed} points to the next level, and every chapter, exercise and right answer counts.</p>
    <p><button class="btn glow big" type="button">${then ? 'Keep going' : 'Brilliant'}</button></p></div>`;
  document.body.appendChild(d);
  const close = () => {
    d.close();
    d.remove();
    then?.();
  };
  d.querySelector('button')!.addEventListener('click', close);
  d.addEventListener('cancel', (e) => {
    e.preventDefault();
    close();
  });
  d.showModal();
  confetti(1.6);
}

// ---------- earning ----------
export interface Award {
  points: number;
  leveledUp: boolean;
}

/**
 * Earns the points for one thing (if not earned before), saves, and celebrates.
 * `then` runs after any level-up message is closed (or straight away if there is none).
 */
export function award(key: string, from?: Element | null, then?: () => void): Award {
  const p = state.progress;
  const day = today();
  const before = G.totalPoints(p);
  const goalBefore = G.pointsOn(p, day) >= p.goal;
  const streakBefore = G.streak(p, day);
  const points = G.earn(p, key, day);
  if (!points) {
    then?.();
    return { points: 0, leveledUp: false };
  }
  const fresh = G.unlockBadges(p, G.stats(p, day, shape), day);
  save();
  paintGame();
  floater(`+${points}`, from);

  const after = G.totalPoints(p);
  const lvBefore = G.levelInfo(before);
  const lvAfter = G.levelInfo(after);
  if (!streakBefore.activeToday) {
    const s = G.streak(p, day).current;
    if (s >= 2) toast(`<span class="big" aria-hidden="true">🔥</span><span><b>${s}-day streak!</b><small>You came back. That is how it sticks.</small></span>`);
  }
  if (!goalBefore && G.pointsOn(p, day) >= p.goal) {
    toast(`<span class="big" aria-hidden="true">🎯</span><span><b>Daily goal reached</b><small>${p.goal} points today. Anything more is a bonus.</small></span>`, 'pts');
    confetti(0.7);
  }
  for (const b of fresh) {
    toast(`${medalSvg(b)}<span><b>Badge earned: ${b.name}</b><small>${b.how}.</small></span>`, '', 5200);
    confetti(0.8);
  }
  if (lvAfter.level > lvBefore.level) {
    levelUp(lvAfter, then);
    return { points, leveledUp: true };
  }
  then?.();
  return { points, leveledUp: false };
}

// ---------- painting ----------
const set = (sel: string, text: string) => $$(sel).forEach((el) => (el.textContent = text));

export function paintGame(): void {
  const p = state.progress;
  const day = today();
  const pts = G.totalPoints(p);
  const lv = G.levelInfo(pts);
  const st = G.streak(p, day);
  const todayPts = G.pointsOn(p, day);

  set('[data-g="level"]', String(lv.level));
  set('[data-g="title"]', lv.title);
  set('[data-g="points"]', pts.toLocaleString('en-GB'));
  set('[data-g="into"]', `${lv.into} / ${lv.needed}`);
  set('[data-g="tonext"]', String(lv.needed - lv.into));
  set('[data-g="streak"]', String(st.current));
  set('[data-g="best"]', String(st.best));
  set('[data-g="today"]', String(todayPts));
  set('[data-g="goal"]', String(p.goal));
  set('[data-g="badges"]', `${Object.keys(p.badges).length} / ${G.BADGES.length}`);
  set('[data-g="chapters"]', String(Object.keys(p.done).length));
  set('[data-g="streakword"]', st.current === 1 ? 'day' : 'days');
  for (const bar of $$('[data-g="bar"]')) bar.style.width = `${Math.round(lv.fraction * 100)}%`;
  for (const chip of $$('.chip.streak')) chip.classList.toggle('live', st.current > 0);
  for (const ring of $$('[data-g="goalring"]')) {
    ring.style.setProperty('--p', String(Math.min(1, todayPts / p.goal)));
    ring.classList.toggle('met', todayPts >= p.goal);
  }
  for (const ring of $$('[data-g="levelring"]')) ring.style.setProperty('--p', String(lv.fraction));

  // The achievements page
  for (const b of $$('[data-badge]')) {
    const when = p.badges[b.dataset.badge!];
    b.classList.toggle('locked', !when);
    const date = $('[data-when]', b);
    if (date) date.textContent = when ? `Earned ${new Date(`${when}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}` : 'Not yet';
  }
  for (const g of $$<HTMLButtonElement>('[data-goal]')) g.setAttribute('aria-pressed', String(Number(g.dataset.goal) === p.goal));
  const heat = $('[data-heat]');
  if (heat) paintHeat(heat, day);
}

function paintHeat(el: HTMLElement, day: string): void {
  const byDay = G.pointsByDay(state.progress);
  const weeks = Number(el.dataset.heat) || 18;
  // Start on the Monday of the week (weeks - 1) weeks ago, so each column is a week.
  const now = new Date(`${day}T12:00:00Z`);
  const monday = G.addDays(day, -((now.getUTCDay() + 6) % 7));
  const first = G.addDays(monday, -7 * (weeks - 1));
  const cells: string[] = [];
  let active = 0;
  for (let i = 0; i < weeks * 7; i++) {
    const d = G.addDays(first, i);
    if (d > day) {
      cells.push('<i style="visibility:hidden"></i>');
      continue;
    }
    const pts = byDay.get(d) ?? 0;
    if (pts) active++;
    const level = pts === 0 ? 0 : pts < 30 ? 1 : pts < 80 ? 2 : pts < 200 ? 3 : 4;
    cells.push(`<i data-l="${level}" class="${d === day ? 'today' : ''}" title="${d}: ${pts} points"></i>`);
  }
  el.innerHTML = cells.join('');
  el.setAttribute('aria-label', `Activity over the last ${weeks} weeks: points earned on ${active} ${active === 1 ? 'day' : 'days'}.`);
}

// ---------- examples tried ----------
// The previews and the Python runner announce when an example is run or shown.
document.addEventListener('zte:tried', (e) => {
  const pre = (e as CustomEvent<{ pre: Element }>).detail?.pre;
  const article = pre?.closest<HTMLElement>('[data-chapter]');
  if (!pre || !article) return;
  // Only the chapter's own code blocks have data-language; output boxes do not.
  const n = $$('pre[data-language]', article).indexOf(pre as HTMLElement);
  if (n >= 0) award(`tried:${article.dataset.chapter}#${n}`, pre.closest('.codewrap') ?? pre);
});

// ---------- daily goal buttons ----------
for (const g of $$<HTMLButtonElement>('[data-goal]')) {
  g.addEventListener('click', () => {
    state.progress.goal = Number(g.dataset.goal);
    save();
    paintGame();
  });
}

// ---------- start ----------
// Things done before points existed count towards the total; badges already
// deserved are recorded quietly (no fanfare for old news).
{
  const p = state.progress;
  const changed = G.backfill(p);
  const fresh = G.unlockBadges(p, G.stats(p, today(), shape), today());
  if (changed || fresh.length) save();
  document.addEventListener('zte:progress', () => paintGame());
  paintGame();
}

export const achievementsHref = `${base}achievements/`;
