const { test, beforeEach, afterEach } = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");
const { createFakeClock } = require("../src/clock");

const MINUTE = 60 * 1000;
let clock, server, baseUrl;

beforeEach(async () => {
  // Fixed start time: Oct 30 2026, 12:00 local (Bella Napoli is open 11:00–22:00)
  clock = createFakeClock(new Date(2026, 9, 30, 12, 0).getTime());
  server = createApp({ clock }).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

afterEach(async () => {
  server.closeAllConnections?.();
  await new Promise((resolve) => server.close(resolve));
});

async function api(method, path, body) {
  const res = await fetch(baseUrl + path, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, body: await res.json() };
}

const inMinutes = (m) => new Date(clock.now() + m * MINUTE).toISOString();

const scheduleOrder = (minutesAhead) =>
  api("POST", "/orders", {
    restaurantId: 1,
    deliveryAddress: "123 Main St",
    items: [{ menuItemId: 101, quantity: 1 }],
    scheduledFor: inMinutes(minutesAhead),
  });

const countStatus = (order, status) =>
  order.statusHistory.filter((h) => h.status === status).length;

// ---------- Validation ----------

test("rejects a scheduled time less than 45 minutes ahead", async () => {
  const res = await scheduleOrder(44);
  assert.equal(res.status, 400);
  assert.match(res.body.error, /at least 45 minutes/);
});

test("accepts a scheduled time exactly 45 minutes ahead", async () => {
  const res = await scheduleOrder(45);
  assert.equal(res.status, 201);
  assert.equal(res.body.status, "scheduled");
});

test("rejects a scheduled time more than 7 days ahead", async () => {
  const res = await scheduleOrder(7 * 24 * 60 + 1);
  assert.equal(res.status, 400);
  assert.match(res.body.error, /up to 7 days/);
});

test("accepts a scheduled time exactly 7 days ahead", async () => {
  const res = await scheduleOrder(7 * 24 * 60);
  assert.equal(res.status, 201);
});

// ---------- Release ----------

test("is held until 30 minutes before delivery, then released exactly once", async () => {
  const { body: order } = await scheduleOrder(60); // deliver 13:00, release 12:30

  clock.advance(29 * MINUTE);
  let res = await api("GET", `/orders/${order.id}`);
  assert.equal(res.body.status, "scheduled");

  clock.advance(1 * MINUTE);
  res = await api("GET", `/orders/${order.id}`);
  assert.equal(res.body.status, "placed");
  assert.equal(res.body.releasedAt, inMinutes(0));
  assert.equal(countStatus(res.body, "placed"), 1);

  clock.advance(120 * MINUTE);
  res = await api("GET", `/orders/${order.id}`);
  assert.equal(countStatus(res.body, "placed"), 1);
});

test("a scheduled order cannot be manually moved to placed early", async () => {
  const { body: order } = await scheduleOrder(60);
  const res = await api("PATCH", `/orders/${order.id}/status`, { status: "placed" });
  assert.equal(res.status, 409);
});

// ---------- Cancellation ----------

test("customer can cancel before release, and it is never released", async () => {
  const { body: order } = await scheduleOrder(60);

  let res = await api("POST", `/orders/${order.id}/cancel`);
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "cancelled");

  clock.advance(60 * MINUTE);
  res = await api("GET", `/orders/${order.id}`);
  assert.equal(res.body.status, "cancelled");
  assert.equal(countStatus(res.body, "placed"), 0);
});

test("customer cannot cancel after release", async () => {
  const { body: order } = await scheduleOrder(60);
  clock.advance(30 * MINUTE);

  const res = await api("POST", `/orders/${order.id}/cancel`);
  assert.equal(res.status, 409);
  assert.match(res.body.error, /already been released/);
});