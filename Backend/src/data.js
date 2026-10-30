// Prices are stored in cents to avoid floating-point rounding issues.
const restaurants = [
  {
    id: 1,
    name: "Bella Napoli",
    cuisine: "Italian",
    openingHours: { open: "11:00", close: "22:00" },
    avgPrepMinutes: 20,
    menu: [
      { id: 101, name: "Margherita Pizza", priceCents: 1400 },
      { id: 102, name: "Spaghetti Carbonara", priceCents: 1650 },
      { id: 103, name: "Tiramisu", priceCents: 750 },
    ],
  },
  {
    id: 2,
    name: "Tokyo Bites",
    cuisine: "Japanese",
    openingHours: { open: "12:00", close: "23:00" },
    avgPrepMinutes: 15,
    menu: [
      { id: 201, name: "Salmon Sushi Roll", priceCents: 1200 },
      { id: 202, name: "Chicken Ramen", priceCents: 1500 },
      { id: 203, name: "Edamame", priceCents: 550 },
    ],
  },
  {
    id: 3,
    name: "Taco Loco",
    cuisine: "Mexican",
    openingHours: { open: "10:00", close: "21:00" },
    avgPrepMinutes: 10,
    menu: [
      { id: 301, name: "Carne Asada Tacos", priceCents: 1100 },
      { id: 302, name: "Chicken Burrito", priceCents: 1250 },
      { id: 303, name: "Chips & Guacamole", priceCents: 650 },
    ],
  },
  {
    id: 4,
    name: "Curry House",
    cuisine: "Indian",
    openingHours: { open: "11:30", close: "22:30" },
    avgPrepMinutes: 25,
    menu: [
      { id: 401, name: "Butter Chicken", priceCents: 1700 },
      { id: 402, name: "Vegetable Biryani", priceCents: 1450 },
      { id: 403, name: "Garlic Naan", priceCents: 400 },
    ],
  },
  {
    id: 5,
    name: "Burger Barn",
    cuisine: "American",
    openingHours: { open: "10:30", close: "23:30" },
    avgPrepMinutes: 12,
    menu: [
      { id: 501, name: "Classic Cheeseburger", priceCents: 1300 },
      { id: 502, name: "Crispy Chicken Sandwich", priceCents: 1250 },
      { id: 503, name: "Loaded Fries", priceCents: 700 },
    ],
  },
];

// In-memory order store
const orders = new Map();
let nextOrderId = 1;
const getNextOrderId = () => nextOrderId++;

module.exports = { restaurants, orders, getNextOrderId };