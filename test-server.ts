// Simple test server to verify Express works
import "dotenv/config";
import express from "express";

const app = express();
const PORT = 5000;

app.get("/", (_req, res) => {
  res.json({ message: "Test server works!" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

console.log("Starting test server...");

app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
});

console.log("After listen call");
