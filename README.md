# MiniDash

MiniDash is a small food-delivery app modelled on DoorDash. Customers can browse restaurants, view menus, place orders for immediate or scheduled delivery, track them, and cancel scheduled orders before they are sent to the restaurant. Restaurant and driver tools update an order's status through the API.

All data is kept in memory.

## Tech stack

- Backend: Node.js 18 or later, Express 4 (JavaScript, CommonJS)
- Frontend: a single HTML page with plain JavaScript, served by the backend
- Tests: Node's built-in test runner (node:test)

## Project structure

```
MiniDashMidterm/
├── Backend/
│   ├── package.json
│   ├── src/
│   │   ├── server.js          starts the app
│   │   ├── app.js             builds the Express app (accepts a clock)
│   │   ├── clock.js           real clock and fake clock for tests
│   │   ├── data.js            seed data: 5 restaurants, 3 menu items each
│   │   └── routes/
│   │       ├── restaurants.js
│   │       └── orders.js
│   └── test/
│       └── orders.test.js
├── Frontend/
│   └── public/
│       └── index.html
├── requirements.md
├── design.md
├── tasks.md
├── AI_LOG.md
└── AGENTS.md
```

## Getting started

1. Install dependencies (once):

   ```
   cd Backend
   npm install
   ```

2. Start the server:

   ```
   npm run dev
   ```

   You should see: MiniDash API running on http://localhost:3000

3. Open http://localhost:3000 in your browser.

   In GitHub Codespaces, click Open in Browser when the popup appears, or open the Ports tab and click the globe icon next to port 3000.

npm run dev restarts the server whenever a file is saved. Use npm start to run it without watching for changes.

## Running the tests

From the Backend folder:

```
npm test
```

The 8 tests use a fake clock, so they check behaviour that spans minutes or days without waiting in real time.

## API

Base URL: http://localhost:3000

Restaurants:
- GET /restaurants lists every restaurant with name, cuisine, opening hours and average prep time.
- GET /restaurants/{id}/menu lists a restaurant's menu items (id, name, price).

Orders:
- POST /orders places an order and returns it.
- GET /orders/{id} returns an order with its items, totals and status.
- PATCH /orders/{id}/status updates the status (used by restaurant and driver tools).
- POST /orders/{id}/cancel cancels a scheduled order before it is released.

Example: place an immediate order

```
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"restaurantId":2,"deliveryAddress":"123 Main St","items":[{"menuItemId":201,"quantity":2}]}'
```

Example: schedule an order (scheduledFor must be 45 minutes to 7 days ahead)

```
curl -X POST http://localhost:3000/orders \
  -H "Content-Type: application/json" \
  -d '{"restaurantId":2,"deliveryAddress":"123 Main St","items":[{"menuItemId":201,"quantity":1}],"scheduledFor":"2026-11-02T17:00:00.000Z"}'
```

Example: update status

```
curl -X PATCH http://localhost:3000/orders/1/status \
  -H "Content-Type: application/json" \
  -d '{"status":"accepted"}'
```

Errors are returned as JSON in the form {"error": "message"} with status 400 for invalid input, 404 when something is not found, and 409 when an action is not allowed.

## Order statuses

- scheduled: waiting for its release time (scheduled orders only)
- placed: sent to the restaurant
- accepted, preparing, ready_for_pickup, picked_up, delivered: normal progress
- cancelled: cancelled by the customer (scheduled orders) or by restaurant tools

Totals include a $2.99 delivery fee and 8% tax.

## Scheduled orders

- A scheduled delivery time is optional. Without one, the order is placed immediately.
- It must be at least 45 minutes and at most 7 days ahead, and within the restaurant's opening hours.
- A scheduled order is held and automatically released to the restaurant (moved to placed) 30 minutes before its delivery time, exactly once.
- The customer can cancel a scheduled order until it is released.

See requirements.md for the full acceptance criteria and design.md for how it works.

## Limitations

- Data is stored in memory, so orders, including scheduled ones, are lost when the server restarts. Saving a file while npm run dev is running causes a restart.
- Opening hours are checked in the server's time zone. Codespaces uses UTC.
- There is no login, so anyone with an order id can update or cancel it.

## Documentation

- requirements.md: user stories and EARS acceptance criteria for scheduled orders
- design.md: components, interfaces, diagrams and the design decision record
- tasks.md: the six slices and the tests that verify each one
- AI_LOG.md: how AI was used during development
- AGENTS.md: stack, test framework and conventions for AI coding tools