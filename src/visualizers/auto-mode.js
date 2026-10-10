export function createAutoMode(packs, random = Math.random) {
  const ids = packs.map((pack) => pack.id);
  let recent = [];
  let dueAt = Infinity;

  function schedule(now) {
    dueAt = now + 12000 + Math.max(0, Math.min(1, random())) * 8000;
  }

  function start(now, currentId) {
    recent = [currentId];
    schedule(now);
  }

  function maybeNext(now, beat, currentId) {
    if (now < dueAt || (beat <= 0.72 && now < dueAt + 6000)) return null;
    const fresh = ids.filter((id) => id !== currentId && !recent.includes(id));
    const choices = fresh.length ? fresh : ids.filter((id) => id !== currentId);
    if (!choices.length) return null;
    const choice = choices[Math.min(choices.length - 1, Math.floor(Math.max(0, random()) * choices.length))];
    recent = [...recent, choice].slice(-3);
    schedule(now);
    return choice;
  }

  return { start, maybeNext };
}
