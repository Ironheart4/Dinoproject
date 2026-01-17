// test-server.ts — minimal Express server for quick local sanity checks
// Use this when you want a lightweight server to confirm routing and Express installation
// Run: `node dist/test-server.js` (or use ts-node during development)
import "dotenv/config";
import express from "express";

const app = express();
const PORT = 5000;

// Root returns a quick JSON confirming the server runs
app.get("/", (_req, res) => {
  res.json({ message: "Test server works!" });
});

// Health endpoint used by deploy platforms and smoke tests
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

console.log("Starting test server...");

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

console.log("After listen call");
