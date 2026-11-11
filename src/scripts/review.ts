import { dueKeys, parseKey, prune, recordReviewAnswer, summary } from '../lib/review';
import { $, save, state, today } from './store';

interface Question { question: string; options: string[]; answer: number; explanation: string }
interface SiteData { chapters: Record<string, { title: string; href: string; course: string }>; quiz: Record<string, Question[]> }

const root = $('#review')!;
const status = $('#reviewStatus')!;
const card = $('#reviewCard')!;
const from = $('#reviewFrom')!;
const qText = $('#reviewQ')!;
const options = $('#reviewOptions')!;
const why = $('#reviewWhy')!;
const next = $<HTMLButtonElement>('#reviewNext')!;

const nice = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
let data: SiteData;
let queue: string[] = [];
let answered = 0;

function finish() {
  card.hidden = true;
  const s = summary(state.progress, today());
  const done = answered ? `You reviewed ${answered} ${answered === 1 ? 'question' : 'questions'}. ` : '';
  if (s.later) status.textContent = `${done}Nothing more is due today. ${s.later} ${s.later === 1 ? 'question is' : 'questions are'} waiting; the next comes back on ${nice(s.next!)}.`;
  else status.textContent = `${done}Nothing is waiting for review. Questions appear here after you get one wrong in a chapter quiz.`;
}

function show() {
  const key = queue.shift();
  if (!key) return finish();
  const { chapter, question } = parseKey(key);
  const q = data.quiz[chapter][question];
  const info = data.chapters[chapter];
  status.textContent = `${queue.length + 1} due today.`;
  card.hidden = false;
  from.textContent = 'From ';
  const link = document.createElement('a');
  link.href = info.href;
  link.textContent = info.title;
  from.appendChild(link);
  qText.textContent = q.question;
  why.hidden = true;
  next.hidden = true;
  options.textContent = '';
  q.options.forEach((text, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = text;
    b.addEventListener('click', () => {
      if (!next.hidden) return; // already answered
      const correct = i === q.answer;
      const buttons = Array.from(options.querySelectorAll('button'));
      buttons[i].classList.add(correct ? 'right' : 'wrong');
      buttons[q.answer].classList.add('right');
      buttons.forEach((x) => (x.disabled = true));
      const result = recordReviewAnswer(state.progress, key, correct, today());
      save();
      answered++;
      const when = result === 'retired' ? 'You have now got this right five times in a row, so it leaves your review list.' : `It comes back on ${nice(state.progress.review[key].due)}.`;
      why.hidden = false;
      why.textContent = `${correct ? 'Correct.' : 'Not quite.'} ${q.explanation} ${when}`;
      next.hidden = false;
      next.textContent = queue.length ? 'Next question' : 'Finish';
      next.focus();
    });
    options.appendChild(b);
  });
}

next.addEventListener('click', show);

fetch(root.dataset.src!)
  .then((r) => r.json())
  .then((d: SiteData) => {
    data = d;
    // Drop questions that no longer exist, for example after a chapter was rewritten.
    const removed = prune(state.progress, (k) => {
      const { chapter, question } = parseKey(k);
      return !!data.quiz[chapter]?.[question];
    });
    if (removed) save();
    queue = dueKeys(state.progress, today());
    show();
  })
  .catch(() => {
    status.textContent = 'The questions could not be loaded. Check your connection and reload the page.';
  });
