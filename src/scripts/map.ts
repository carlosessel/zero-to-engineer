// The home page's transit map: pointing at a line picks it out and shows
// where it goes; pointing at a stop names that part of the course; clicking
// a line opens its course. The course list below is the keyboard and screen
// reader way in, so focusing a course there picks out its line too.
export function initMap(): void {
  const map = document.getElementById('map');
  if (!map) return;
  const tip = map.querySelector<HTMLElement>('.map-tip')!;
  const routes = Array.from(map.querySelectorAll<SVGGElement>('.route'));
  const items = Array.from(document.querySelectorAll<HTMLElement>('.lines li[data-line]'));

  const pick = (line: string | null) => {
    map.classList.toggle('focus', !!line);
    for (const r of routes) r.classList.toggle('on', r.dataset.line === line);
    for (const li of items) li.classList.toggle('on', li.dataset.line === line);
  };

  for (const r of routes) {
    r.addEventListener('pointerenter', () => pick(r.dataset.line!));
    r.addEventListener('pointerleave', () => {
      pick(null);
      tip.hidden = true;
    });
    r.addEventListener('click', () => {
      location.href = r.dataset.href!;
    });
  }
  map.addEventListener('pointermove', (e) => {
    const stop = (e.target as Element).closest<SVGCircleElement>('.stop');
    if (!stop) {
      tip.hidden = true;
      return;
    }
    const box = map.getBoundingClientRect();
    const s = stop.getBoundingClientRect();
    const b = document.createElement('b');
    b.textContent = stop.dataset.tip!;
    tip.replaceChildren(b, stop.dataset.sub!);
    tip.style.left = `${s.left + s.width / 2 - box.left}px`;
    tip.style.top = `${s.top - box.top}px`;
    tip.hidden = false;
  });
  for (const li of items) {
    const a = li.querySelector('a')!;
    li.addEventListener('pointerenter', () => pick(li.dataset.line!));
    li.addEventListener('pointerleave', () => pick(null));
    a.addEventListener('focus', () => pick(li.dataset.line!));
    a.addEventListener('blur', () => pick(null));
  }
}
