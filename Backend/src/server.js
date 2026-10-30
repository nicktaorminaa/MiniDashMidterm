const express = require("express");
const restaurantRoutes = require("./routes/restaurants");
const orderRoutes = require("./routes/orders");

const app = express();
app.use(express.json());

app.use("/restaurants", restaurantRoutes);
app.use("/orders", orderRoutes);

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`MiniDash API running on http://localhost:${PORT}`));