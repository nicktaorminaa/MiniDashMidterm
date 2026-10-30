# MiniDash - Scheduled Orders: Tasks

## Slice 1: Baseline REST API

Express server with GET /restaurants, GET /restaurants/{id}/menu, POST /orders, GET /orders/{id} and PATCH /orders/{id}/status. Seed 5 restaurants with 3 menu items each. Store orders in memory and calculate totals on the server.

Test that verifies it (manual, curl):
- GET /restaurants returns 5 restaurants with name, cuisine, opening hours and prep time.
- GET /restaurants/2/menu returns 3 items, and GET /restaurants/99/menu returns 404.
- POST /orders with valid items returns 201 with correct subtotal, delivery fee, tax and total.
- PATCH /orders/1/status with "accepted" returns 200, and with "delivered" returns 409.

## Slice 2: Web frontend

Frontend/public/index.html for browsing restaurants, viewing menus, building a cart, placing an order and tracking it. server.js serves the frontend as static files.

Test that verifies it (manual, browser):
- Open the app, select a restaurant, add items, enter an address and place an order.
- The order appears under Track an Order with the correct totals and status placed.
- Changing the status with the dropdown updates the displayed status.

## Slice 3: Optional scheduled delivery time with validation

POST /orders accepts an optional scheduledFor. Reject times less than 45 minutes or more than 7 days ahead, or outside opening hours. Valid scheduled orders start as scheduled. Frontend adds the Schedule for later picker.

Test that verifies it (automated, added in slice 6):
- rejects a scheduled time less than 45 minutes ahead
- accepts a scheduled time exactly 45 minutes ahead
- rejects a scheduled time more than 7 days ahead
- accepts a scheduled time exactly 7 days ahead

Manual check: scheduling 30 minutes ahead and 8 days ahead shows the errors, and 2 hours ahead creates a scheduled order.

## Slice 4: Release scheduled orders 30 minutes before delivery

When a scheduled order is created, set a per-order timer for 30 minutes before delivery. When it fires, move the order from scheduled to placed exactly once and record releasedAt. Block manual scheduled to placed changes.

Test that verifies it (automated, added in slice 6):
- is held until 30 minutes before delivery, then released exactly once
- a scheduled order cannot be manually moved to placed early

Manual check: with the minimum lead temporarily lowered, a scheduled order moves to placed after the release time, and placed is not offered in the dropdown.

## Slice 5: Customer cancels a scheduled order before release

Add POST /orders/{id}/cancel. Cancel only while the order is scheduled, and stop its release timer. Return 409 if the order is already released or already cancelled. Frontend shows a Cancel Scheduled Order button while scheduled.

Test that verifies it (automated, added in slice 6):
- customer can cancel before release, and it is never released
- customer cannot cancel after release

Manual check: the cancel button changes a scheduled order to cancelled, and cancelling an ASAP order with curl returns the already released error.

## Slice 6: Injected clock and automated tests

Add clock.js with realClock and createFakeClock(). Add app.js with createApp({ clock }). Move the order store into the router so each app instance starts empty. Route all time reads and timers through the clock. Add the test file and the npm test script.

Test that verifies it:
- npm test runs all 8 tests above and they pass in well under a second, without waiting in real time.
- npm run dev still starts the server, and the browser flow from slice 2 still works with the real clock.