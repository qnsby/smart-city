require("dotenv").config();
const express = require("express");
const path = require("path");
const { authRouter } = require("./routes/auth");
const { ticketsRouter } = require("./routes/tickets");
const { analyticsRouter } = require("./routes/analytics");
const { authRequired } = require("./middleware/auth");

require("./events/handlers");

const app = express();

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = new Set(["http://localhost:5173"]);

  if (origin && allowedOrigins.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));
app.use((req, res, next) => {
  const startedAt = Date.now();
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);

  res.on("finish", () => {
    console.log(`[RES] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - startedAt}ms)`);
  });

  next();
});

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/tickets", authRequired, ticketsRouter);
app.use("/analytics", authRequired, analyticsRouter);
app.use((req, res) => {
  console.warn(`[WARN] Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: "Route not found" });
});
app.use((err, req, res, _next) => {
  console.error(`[ERROR] ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`✅ API running on http://localhost:${port}`));
