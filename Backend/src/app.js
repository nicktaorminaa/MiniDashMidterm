const express = require("express");
const path = require("path");
const restaurantRoutes = require("./routes/restaurants");
const { createOrdersRouter } = require("./routes/orders");
const { realClock } = require("./clock");

function createApp({ clock = realClock } = {}) {
  const app = express();
  app.use(express.json());

  // Serve the frontend
  app.use(express.static(path.join(__dirname, "../../Frontend/public")));

  app.use("/restaurants", restaurantRoutes);
  app.use("/orders", createOrdersRouter({ clock }));

  // 404 for unknown routes
  app.use((req, res) => res.status(404).json({ error: "Route not found" }));

  // Malformed JSON and other errors
  app.use((err, req, res, next) => {
    if (err.type === "entity.parse.failed") {
      return res.status(400).json({ error: "Invalid JSON body" });
    }
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

module.exports = { createApp };