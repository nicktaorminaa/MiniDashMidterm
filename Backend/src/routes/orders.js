const express = require("express");
const { restaurants, orders, getNextOrderId } = require("../data");

const router = express.Router();

const DELIVERY_FEE_CENTS = 299;
const TAX_RATE = 0.08;
const MIN_LEAD_MINUTES = 45; // scheduled orders must be at least 45 min out
const MAX_DAYS_AHEAD = 7;    // and no more than 7 days out
const MINUTE = 60 * 1000;

// Allowed status transitions
const TRANSITIONS = {
  scheduled: ["placed", "cancelled"],
  placed: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "cancelled"],
  ready_for_pickup: ["picked_up"],
  picked_up: ["delivered"],
  delivered: [],
  cancelled: [],
};

const toDollars = (cents) => Number((cents / 100).toFixed(2));

function isWithinOpeningHours(date, openingHours) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  const [openH, openM] = openingHours.open.split(":").map(Number);
  const [closeH, closeM] = openingHours.close.split(":").map(Number);
  return minutes >= openH * 60 + openM && minutes <= closeH * 60 + closeM;
}

// Shape an order for API output
function serialize(order) {
  return {
    id: order.id,
    restaurantId: order.restaurantId,
    restaurantName: order.restaurantName,
    deliveryAddress: order.deliveryAddress,
    scheduledFor: order.scheduledFor,
    items: order.items.map((i) => ({
      menuItemId: i.menuItemId,
      name: i.name,
      quantity: i.quantity,
      unitPrice: toDollars(i.unitPriceCents),
      lineTotal: toDollars(i.lineTotalCents),
    })),
    totals: {
      subtotal: toDollars(order.subtotalCents),
      deliveryFee: toDollars(order.deliveryFeeCents),
      tax: toDollars(order.taxCents),
      total: toDollars(order.totalCents),
    },
    status: order.status,
    statusHistory: order.statusHistory,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
}

// POST /orders
router.post("/", (req, res) => {
  const { restaurantId, items, deliveryAddress, scheduledFor } = req.body || {};

  const restaurant = restaurants.find((r) => r.id === Number(restaurantId));
  if (!restaurant) return res.status(400).json({ error: "Invalid restaurantId" });

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items must be a non-empty array" });
  }
  if (typeof deliveryAddress !== "string" || deliveryAddress.trim() === "") {
    return res.status(400).json({ error: "deliveryAddress is required" });
  }

  // Optional scheduled delivery time
  let scheduledDate = null;
  if (scheduledFor) {
    scheduledDate = new Date(scheduledFor);
    if (isNaN(scheduledDate)) {
      return res.status(400).json({ error: "scheduledFor must be a valid date/time" });
    }
    const minutesAhead = (scheduledDate.getTime() - Date.now()) / MINUTE;
    if (minutesAhead < MIN_LEAD_MINUTES) {
      return res.status(400).json({
        error: `Scheduled orders must be at least ${MIN_LEAD_MINUTES} minutes from now`,
      });
    }
    if (minutesAhead > MAX_DAYS_AHEAD * 24 * 60) {
      return res.status(400).json({
        error: `Orders can only be scheduled up to ${MAX_DAYS_AHEAD} days ahead`,
      });
    }
    if (!isWithinOpeningHours(scheduledDate, restaurant.openingHours)) {
      return res.status(400).json({
        error: `${restaurant.name} is only open ${restaurant.openingHours.open}–${restaurant.openingHours.close}`,
      });
    }
  }

  const lineItems = [];
  for (const { menuItemId, quantity } of items) {
    const menuItem = restaurant.menu.find((m) => m.id === Number(menuItemId));
    if (!menuItem) {
      return res.status(400).json({ error: `Menu item ${menuItemId} not found at this restaurant` });
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      return res.status(400).json({ error: `Invalid quantity for item ${menuItemId}` });
    }
    lineItems.push({
      menuItemId: menuItem.id,
      name: menuItem.name,
      quantity,
      unitPriceCents: menuItem.priceCents, // price comes from server, not client
      lineTotalCents: menuItem.priceCents * quantity,
    });
  }

  const subtotalCents = lineItems.reduce((sum, i) => sum + i.lineTotalCents, 0);
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const now = new Date().toISOString();
  const initialStatus = scheduledDate ? "scheduled" : "placed";

  const order = {
    id: getNextOrderId(),
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    deliveryAddress: deliveryAddress.trim(),
    scheduledFor: scheduledDate ? scheduledDate.toISOString() : null,
    items: lineItems,
    subtotalCents,
    deliveryFeeCents: DELIVERY_FEE_CENTS,
    taxCents,
    totalCents: subtotalCents + DELIVERY_FEE_CENTS + taxCents,
    status: initialStatus,
    statusHistory: [{ status: initialStatus, at: now }],
    createdAt: now,
    updatedAt: now,
  };

  orders.set(order.id, order);
  res.status(201).location(`/orders/${order.id}`).json(serialize(order));
});

// GET /orders/:id
router.get("/:id", (req, res) => {
  const order = orders.get(Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });
  res.json(serialize(order));
});

// PATCH /orders/:id/status
router.patch("/:id/status", (req, res) => {
  const order = orders.get(Number(req.params.id));
  if (!order) return res.status(404).json({ error: "Order not found" });

  const { status } = req.body || {};
  if (!(status in TRANSITIONS)) {
    return res.status(400).json({
      error: "Unknown status",
      validStatuses: Object.keys(TRANSITIONS),
    });
  }

  const allowed = TRANSITIONS[order.status];
  if (!allowed.includes(status)) {
    return res.status(409).json({
      error: `Cannot change status from '${order.status}' to '${status}'`,
      allowedNext: allowed,
    });
  }

  const now = new Date().toISOString();
  order.status = status;
  order.statusHistory.push({ status, at: now });
  order.updatedAt = now;

  res.json(serialize(order));
});

module.exports = router;