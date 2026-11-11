import { checkHours, formatMinutes, makePlan, toIcs, type Plan, type PlanChapter } from '../lib/planner';
import { $, download, save, state, today } from './store';

interface SiteData { courses: { id: string; title: string; chapters: (PlanChapter & { href: string })[] }[] }

const form = $<HTMLFormElement>('#plannerForm')!;
const course = $<HTMLSelectElement>('#plCourse')!;
const hours = $<HTMLInputElement>('#plHours')!;
const start = $<HTMLInputElement>('#plStart')!;
const error = $('#plError')!;
const summary = $('#plSummary')!;
const weeks = $('#plWeeks')!;
const ics = $<HTMLButtonElement>('#plIcs')!;

const nice = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
const short = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
let data: SiteData;
let plan: Plan | null = null;

const saved = state.progress.planner;
if (saved) {
  course.value = saved.course;
  hours.value = String(saved.hoursPerWeek);
}
start.value = saved && saved.start > today() ? saved.start : today();

function el<K extends keyof HTMLElementTagNameMap>(tag: K, text?: string): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  return e;
}

function draw(remember: boolean) {
  const c = data.courses.find((x) => x.id === course.value) ?? data.courses[0];
  const h = Number(hours.value);
  const problem = checkHours(h) ?? (/^\d{4}-\d{2}-\d{2}$/.test(start.value) ? null : 'Choose a start date.');
  error.hidden = !problem;
  hours.setAttribute('aria-invalid', String(!!checkHours(h)));
  weeks.textContent = '';
  ics.hidden = true;
  plan = null;
  if (problem) {
    error.textContent = problem;
    summary.textContent = '';
    return;
  }
  if (remember) {
    state.progress.planner = { course: c.id, hoursPerWeek: h, start: start.value };
    save();
  }
  plan = makePlan(c.chapters, (id) => !!state.progress.done[id], h, start.value);
  const left = c.chapters.filter((x) => !state.progress.done[x.id]).length;
  if (!plan.weeks.length) {
    summary.textContent = `You have finished every chapter of ${c.title}.`;
    return;
  }
  summary.textContent = `${left} of ${c.chapters.length} chapters left, about ${formatMinutes(plan.totalMinutes)} of study. At ${h} ${h === 1 ? 'hour' : 'hours'} a week that is ${plan.weeks.length} ${plan.weeks.length === 1 ? 'week' : 'weeks'}, finishing in the week ending ${nice(plan.finish!)}.`;
  ics.hidden = false;
  const href = new Map(c.chapters.map((x) => [x.id, x.href]));
  for (const w of plan.weeks) {
    const section = el('section');
    section.className = 'planweek';
    section.appendChild(el('h2', `Week ${w.index}: ${short(w.start)} to ${short(w.end)}`));
    const list = el('ul');
    for (const item of w.items) {
      const li = el('li');
      const a = el('a', `${item.number}. ${item.title}`);
      a.href = href.get(item.id)!;
      li.appendChild(a);
      const note = item.continued ? (item.finishes ? ', finish it' : ', continue') : item.finishes ? '' : ', start it';
      li.appendChild(document.createTextNode(` (${formatMinutes(item.minutes)}${note})`));
      list.appendChild(li);
    }
    section.appendChild(list);
    weeks.appendChild(section);
  }
}

form.addEventListener('submit', (e) => e.preventDefault());
for (const input of [course, hours, start]) input.addEventListener('input', () => data && draw(true));
ics.addEventListener('click', () => {
  if (!plan) return;
  const c = data.courses.find((x) => x.id === course.value)!;
  download(`${c.id}-study-plan.ics`, toIcs(plan, c.title, new Date()), 'text/calendar');
});

fetch(form.dataset.src!)
  .then((r) => r.json())
  .then((d: SiteData) => {
    data = d;
    draw(false);
  })
  .catch(() => {
    summary.textContent = 'The course list could not be loaded. Check your connection and reload the page.';
  });
