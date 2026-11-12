// Draws a badge's medal as a small SVG. Used by the achievements page (at build
// time) and by the "new badge" message (in the browser), so both look the same.
import type { Badge } from './game';

const TONES: Record<Badge['tone'], [string, string]> = {
  sun: ['#FFB547', '#F0457A'],
  sea: ['#38BDF8', '#5B3DF5'],
  leaf: ['#4ADE80', '#0E9F94'],
  rose: ['#FF8FB1', '#E5336B'],
  violet: ['#C4B5FD', '#7C4DFF'],
  gold: ['#FDE68A', '#D97706'],
};

let n = 0;

export function medalSvg(badge: Pick<Badge, 'icon' | 'tone' | 'name'>, cls = 'medal'): string {
  const [a, b] = TONES[badge.tone];
  const id = `m${++n}${badge.tone}`;
  const size = badge.icon.length > 1 ? 22 : 28;
  // A twelve-pointed rosette behind a round face.
  const points = Array.from({ length: 24 }, (_, i) => {
    const r = i % 2 ? 27 : 31;
    const t = (Math.PI * i) / 12;
    return `${(32 + r * Math.sin(t)).toFixed(1)},${(32 - r * Math.cos(t)).toFixed(1)}`;
  }).join(' ');
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  return `<svg class="${cls}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><polygon points="${points}" fill="url(#${id})"/><circle cx="32" cy="32" r="21" fill="#fff" fill-opacity=".22"/><circle cx="32" cy="32" r="21" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/><text x="32" y="33" text-anchor="middle" dominant-baseline="central" font-family="Bricolage Grotesque, sans-serif" font-weight="800" font-size="${size}" fill="#fff">${esc(badge.icon)}</text></svg>`;
}
