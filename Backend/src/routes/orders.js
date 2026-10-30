const express = require("express");
const { restaurants, orders, getNextOrderId } = require("../data");

const router = express.Router();

const DELIVERY_FEE_CENTS = 299;
const TAX_RATE = 0.08;

// Allowed status transitions
const TRANSITIONS = {
  placed: ["accepted", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready_for_pickup", "cancelled"],
  ready_for_pickup: ["picked_up"],
  picked_up: ["delivered"],
  delivered: [],
  cancelled: [],
};

const toDollars = (cents) => Number((cents / 100).toFixed(2));

// Shape an order for API output
function serialize(order) {
  return {
    id: order.id,
    restaurantId: order.restaurantId,
    restaurantName: order.restaurantName,
    deliveryAddress: order.deliveryAddress,
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
  const { restaurantId, items, deliveryAddress } = req.body || {};

  const restaurant = restaurants.find((r) => r.id === Number(restaurantId));
  if (!restaurant) return res.status(400).json({ error: "Invalid restaurantId" });

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items must be a non-empty array" });
  }
  if (typeof deliveryAddress !== "string" || deliveryAddress.trim() === "") {
    return res.status(400).json({ error: "deliveryAddress is required" });
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

  const order = {
    id: getNextOrderId(),
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    deliveryAddress: deliveryAddress.trim(),
    items: lineItems,
    subtotalCents,
    deliveryFeeCents: DELIVERY_FEE_CENTS,
    taxCents,
    totalCents: subtotalCents + DELIVERY_FEE_CENTS + taxCents,
    status: "placed",
    statusHistory: [{ status: "placed", at: now }],
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