// Builds the text that the "Ask a tutor" box copies to the clipboard.
// There is no built-in tutor and no API key anywhere: the learner pastes this
// into whichever AI assistant they already use.

export const MAX_CHAPTER_CHARS = 12000;
export const MAX_QUESTION_CHARS = 4000;

export const SUGGESTIONS = [
  { label: 'Explain it more simply', ask: 'Explain the main idea of this chapter again, more simply, with a fresh everyday analogy.' },
  { label: 'Quiz me harder', ask: 'Ask me three harder questions about this chapter, one at a time. Wait for my answer to each before telling me whether I was right.' },
  { label: 'Give me another exercise', ask: 'Give me one extra hands-on exercise for this chapter with clear steps and a way to check my result.' },
];

export function buildTutorPrompt(courseTitle: string, chapterTitle: string, chapterText: string, question: string): string {
  const text = chapterText.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const cut = text.length > MAX_CHAPTER_CHARS;
  const q = question.trim().slice(0, MAX_QUESTION_CHARS);
  return [
    `You are a patient tutor for someone working through a course called "${courseTitle}".`,
    'Assume the learner is a complete beginner with no programming or maths background: use plain words and explain any jargon the first time you use it.',
    'Answer the learner\'s message about the chapter below. Be accurate and concrete and use short paragraphs.',
    'If they paste code or an answer, say what is right, what is wrong, and how to fix it. Do not simply do their exercise for them: give a hint first.',
    'If you are unsure of a fact, say so.',
    '',
    `<chapter title="${chapterTitle.replace(/"/g, "'")}">`,
    cut ? text.slice(0, MAX_CHAPTER_CHARS) + '\n[The chapter continues; the rest was left out to keep this short.]' : text,
    '</chapter>',
    '',
    '<learner_message>',
    q,
    '</learner_message>',
  ].join('\n');
}
