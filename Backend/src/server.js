const { createApp } = require("./app");

const PORT = process.env.PORT || 3000;
createApp().listen(PORT, () => console.log(`MiniDash API running on http://localhost:${PORT}`));