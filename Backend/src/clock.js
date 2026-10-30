// The real clock, used when the server runs normally.
const realClock = {
  now: () => Date.now(),
  setTimeout: (fn, ms) => setTimeout(fn, ms),
  clearTimeout: (id) => clearTimeout(id),
};

// A fake clock for tests. Time only moves when you call advance(ms).
function createFakeClock(startMs) {
  let current = startMs;
  let nextId = 1;
  const timers = new Map(); // id -> { at, fn }

  return {
    now: () => current,

    setTimeout(fn, ms) {
      const id = nextId++;
      timers.set(id, { at: current + Math.max(0, ms), fn });
      return id;
    },

    clearTimeout(id) {
      timers.delete(id);
    },

    // Move time forward, running any timers that come due, in order.
    advance(ms) {
      const target = current + ms;
      while (true) {
        let dueId = null;
        let due = null;
        for (const [id, t] of timers) {
          if (t.at <= target && (!due || t.at < due.at)) {
            dueId = id;
            due = t;
          }
        }
        if (!due) break;
        timers.delete(dueId);
        current = due.at;
        due.fn();
      }
      current = target;
    },
  };
}

module.exports = { realClock, createFakeClock };