# AGENTS.md

## Project

MiniDash is a small food-ordering API with a web frontend. The backend is in Backend/ and the frontend is in Frontend/public/index.html. These rules cover the scheduled orders feature: scheduling, release and cancellation.

## Language and stack

- JavaScript 
- Express 4 for the API
- Plain HTML, CSS and JavaScript for the frontend

## Tests

- Framework: Node's built-in test runner (node:test) with node:assert/strict
- Tests live in Backend/test/ and use createFakeClock() from src/clock.js
- Run from the Backend folder with: npm test
- Start the server with: npm run dev

## Conventions

1. Scheduling code gets time only from the injected clock. Never call Date.now(), new Date() with no argument, setTimeout or clearTimeout directly. Use clock.now(), clock.setTimeout and clock.clearTimeout, so tests can control time with the fake clock.

2. Scheduling limits use the named constants in orders.js (MIN_LEAD_MINUTES, MAX_DAYS_AHEAD, RELEASE_LEAD_MINUTES). Do not hardcode 45, 7 or 30 anywhere else, and keep error messages built from these constants so they always match requirements.md.

3. Only releaseScheduledOrder() may move an order from scheduled to placed, and it must check that the order is still scheduled before changing it, so the release happens exactly once. Any code that cancels a scheduled order must also stop its release timer.