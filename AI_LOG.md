# MiniDash - AI Use Log
Entry #: 1
Date: Oct 29, 5:50 pm
Tool, model, mode: Claude Opus 5.5
Slice: Slice 1, baseline REST API
Prompt: Create a small food-delivery REST API called MiniDash in Python with FastAPI and SQLite. Tables: restaurants (id, name, cuisine, opens_at, closes_at, avg_prep_minutes), menu_items (id, restaurant_id, name, price_cents), orders (id, restaurant_id, status, total_cents, address, created_at) and order_items. Endpoints: GET /restaurants, GET /restaurants/{id}/menu, POST /orders, GET /orders/{id}, PATCH /orders/{id}/status. Use a layered structure (routes, services, repository). Seed 5 restaurants. Add pytest tests for each endpoint and a README with run instructions. Do not add authentication or any dependency beyond fastapi, uvicorn, and pytest.
What the AI produced: A FastAPI project split into routes, services and repository layers, with SQLite tables and seed data for the four tables, pytest tests for each endpoint, and a README.
What I verified: Read through the output and compared it with what my assignment needed: the five endpoints and a working baseline to build the scheduling features on.
What I changed and why: Rejected it as too complex for a starting point. The database setup and three layers meant many files to understand and change for every feature, which would make it hard to build and test in small slices. I started a new chat and asked for the same five endpoints in Node.js with Express and in-memory data.
Outcome: Rejected. Nothing from this output was used or committed.

Entry #: 2
Date: Oct 29, 6:20 pm
Tool, model, mode: Claude Opus 5.5
Slice: Slice 1, baseline REST API
Prompt: Listed the five endpoints (GET /restaurants, GET /restaurants/{id}/menu, POST /orders, GET /orders/{id}, PATCH /orders/{id}/status) and asked for 5 restaurants with 3 menu items each and an outline of how to build it in Node.
What the AI produced: An outline and Express code for data.js, routes/restaurants.js, routes/orders.js and server.js. It started by writing files into its own workspace instead of showing the code.
What I verified: Read all four files. Ran the server and called each endpoint with curl, including a 404 for an unknown restaurant and a 409 for an invalid status change.
What I changed and why: Stopped it from writing files and asked for all code in chat, so I could see and copy each file myself.
Outcome: Modified, then accepted. Committed as "Baseline: MiniDash REST API with seed data".

Entry #: 3
Date: Oct 29, 6:29 pm
Tool, model, mode: Claude Opus 5.5
Slice: Slice 1, baseline REST API
Prompt: Follow-up on the Node baseline (entry 2).
What the AI produced: A list of next steps added to the end of the baseline: move the data into SQLite or Postgres because in-memory orders are lost on restart, add login so only restaurants and drivers can change order status, reject orders outside opening hours, and add Jest and Supertest tests.
What I verified: Checked each suggestion against my assignment. None of them were required, and the database was the same kind of complexity I had already rejected in entry 1.
What I changed and why: Rejected all of them and told the AI "no need, this is only for a school project". Keeping the data in memory makes the project easy to run and test, and losing orders on restart is acceptable for this project.
Outcome: Rejected. Nothing from this output was used.

Entry #: 4
Date: Oct 29, 6:38 pm
Tool, model, mode: Claude Opus 5.5
Slice: Slice 2, web frontend
Prompt: Create me a frontend for this.
What the AI produced: A single index.html with restaurants, menu, cart, place order, order tracking and a status dropdown, plus a static-file line for server.js that pointed to a public folder inside Backend.
What I verified: Opened the app and got "Route not found". After the fix, placed and tracked an order in the browser.
What I changed and why: My frontend is in Frontend/public, not Backend/public, so the path was wrong. I corrected the path to ../../Frontend/public.
Outcome: Modified, then accepted. Committed as "Add web frontend for browsing, ordering and tracking".

Entry #: 5
Date: Oct 29, 6:50 pm
Tool, model, mode: Claude Opus 5.5
Slice: Slice 3, scheduled delivery time validation
Prompt: Asked to be able to schedule an order, then gave the rule: an optional scheduled delivery time that must be at least 45 minutes and at most 7 days ahead, otherwise a clear validation error.
What the AI produced: An optional scheduledFor field with validation and a date picker. The first version used a 30-minute minimum and added an opening-hours check I had not asked for. It read the time with Date.now() directly.
What I verified: Read the validation code. Tried 30 minutes ahead and 8 days ahead (both rejected) and 2 hours ahead (created a scheduled order).
What I changed and why: Changed the minimum from 30 to 45 minutes to match my requirement. Reviewed the extra opening-hours check and decided to keep it.
Outcome: Modified, then accepted. Committed as "Add optional scheduled delivery time with validation".

Entry #: 6
Date: Oct 29, 6:58 pm
Tool, model, mode: Claude Opus 5.5
Slice: Slice 4, release 30 minutes before delivery
Prompt: A scheduled order is held and released to the restaurant 30 minutes before its delivery time, moving from SCHEDULED to PLACED exactly once.
What the AI produced: The first draft released orders at delivery time minus each restaurant's prep time, using a loop that checked every 30 seconds. It also let restaurant tools move a scheduled order to placed by hand.
What I verified: Compared the draft with my requirement. The release time was variable instead of fixed at 30 minutes, it could be up to 30 seconds late, and the manual option allowed an early release.
What I changed and why: Had it rewritten with a fixed 30-minute lead, one timer per order, a guard so the release happens only once, and no manual scheduled to placed change. Tested by temporarily lowering the minimum lead time and confirming the order moved to placed once. 
Outcome: Rewritten, then accepted. Committed as "Hold scheduled orders and release them 30 min before delivery".

Entry #: 7
Date: Oct 29, 7:06 pm
Tool, model, mode: Claude Opus 5.5
Slice: Slice 5, customer cancels a scheduled order
Prompt: A customer can cancel a scheduled order before it is released.
What the AI produced: POST /orders/{id}/cancel, which stops the release timer and returns 409 if the order is already released or already cancelled, plus a Cancel Scheduled Order button.
What I verified: Cancelled a scheduled order in the browser and checked that the button disappeared. Cancelling an ASAP order with curl returned the "already released" error.
What I changed and why: Nothing. It matched the requirement.
Outcome: Accepted. Committed as "Let customers cancel scheduled orders before release".

Entry #: 8
Date: Oct 29, 7:14 pm
Tool, model, mode: Claude Opus 5.5
Slice: Slice 6, injected clock and automated tests
Prompt: All time-dependent logic uses an injected clock so tests do not depend on the real time.
What the AI produced: clock.js (real and fake clock), app.js (createApp with a clock option), orders.js refactored to use the clock with the order store inside the router, and 8 tests using Node's built-in test runner.
What I verified: Checked with grep that orders.js no longer calls Date.now() or setTimeout directly. Ran npm test and all 8 tests passed. Mutation check: changed MIN_LEAD_MINUTES from 45 to 44 and the test "rejects a scheduled time less than 45 minutes ahead" failed, as expected. Restored the value and all 8 tests passed again.
What I changed and why: Nothing in the code.
Outcome: Accepted. Committed as "Inject clock for time-based logic and add tests".

