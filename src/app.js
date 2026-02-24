require("dotenv").config();
const express = require("express");
const path = require("path");
const { authRouter } = require("./routes/auth");
const { ticketsRouter } = require("./routes/tickets");
const { analyticsRouter } = require("./routes/analytics");
const { authRequired } = require("./middleware/auth");
const { requireRoles } = require("./middleware/rbac");

require("./events/handlers");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "..", "public")));

app.get("/health", (_req, res) => res.json({ ok: true }));
app.use("/auth", authRouter);
app.use("/tickets", authRequired, ticketsRouter);
app.use("/analytics", authRequired, analyticsRouter);

const port = Number(process.env.PORT || 3000);
app.listen(port, () => console.log(`✅ API running on http://localhost:${port}`));
