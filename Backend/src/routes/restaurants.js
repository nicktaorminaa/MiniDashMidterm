const express = require("express");
const { restaurants } = require("../data");

const router = express.Router();

// GET /restaurants
router.get("/", (req, res) => {
  const list = restaurants.map(({ id, name, cuisine, openingHours, avgPrepMinutes }) => ({
    id, name, cuisine, openingHours, avgPrepMinutes,
  }));
  res.json(list);
});

// GET /restaurants/:id/menu
router.get("/:id/menu", (req, res) => {
  const restaurant = restaurants.find((r) => r.id === Number(req.params.id));
  if (!restaurant) return res.status(404).json({ error: "Restaurant not found" });

  res.json({
    restaurantId: restaurant.id,
    restaurantName: restaurant.name,
    items: restaurant.menu.map(({ id, name, priceCents }) => ({
      id,
      name,
      price: priceCents / 100,
    })),
  });
});

module.exports = router;