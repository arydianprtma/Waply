import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { sessionRouter } from "./routes/session.routes.js";
import { messageRouter } from "./routes/message.routes.js";
import { SessionManager } from "./services/session.manager.js";
import { logger } from "./utils/logger.js";

dotenv.config();

const app = express();
const PORT = process.env.GATEWAY_PORT || 3002;

app.use(cors());
app.use(express.json());

// Health Check Endpoint
app.get("/health", (req, res) => {
  const sessionManager = SessionManager.getInstance();
  const sessions = sessionManager.getAllSessions();

  res.json({
    status: "ok",
    service: "Sendora WhatsApp Gateway",
    activeSessions: sessions.length,
    timestamp: new Date().toISOString(),
  });
});

import { gatewayAuthMiddleware } from "./middleware/auth.js";

// Mount Routes with security middleware
app.use("/api/sessions", gatewayAuthMiddleware, sessionRouter);
app.use("/api/sessions", gatewayAuthMiddleware, messageRouter);

// Start Server and restore saved sessions
app.listen(PORT, async () => {
  logger.info(`🚀 Sendora Gateway Service running on http://localhost:${PORT}`);

  const sessionManager = SessionManager.getInstance();
  await sessionManager.restoreSessions();
});
