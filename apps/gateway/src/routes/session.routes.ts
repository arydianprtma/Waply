import { Router, Request, Response } from "express";
import { SessionManager } from "../services/session.manager.js";
import { logger } from "../utils/logger.js";

export const sessionRouter = Router();
const sessionManager = SessionManager.getInstance();

// GET /api/sessions - List all sessions
sessionRouter.get("/", (req: Request, res: Response) => {
  const sessions = sessionManager.getAllSessions();
  res.json({
    success: true,
    data: sessions,
  });
});

// POST /api/sessions/create - Create / Init a new session
sessionRouter.post("/create", async (req: Request, res: Response) => {
  try {
    const { id, name } = req.body;

    if (!id) {
      res.status(400).json({ success: false, error: "Session ID is required" });
      return;
    }

    const session = await sessionManager.createSession(String(id), name || "WhatsApp Device");
    res.json({
      success: true,
      data: session.getInfo(),
    });
  } catch (error) {
    logger.error({ error }, "Failed to create session");
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// GET /api/sessions/:id - Get session info
sessionRouter.get("/:id", (req: Request, res: Response) => {
  const id = String(req.params.id);
  const session = sessionManager.getSession(id);

  if (!session) {
    res.status(404).json({ success: false, error: "Session not found" });
    return;
  }

  res.json({
    success: true,
    data: session.getInfo(),
  });
});

// GET /api/sessions/:id/qr - Get QR code string & data URL
sessionRouter.get("/:id/qr", (req: Request, res: Response) => {
  const id = String(req.params.id);
  const session = sessionManager.getSession(id);

  if (!session) {
    res.status(404).json({ success: false, error: "Session not found" });
    return;
  }

  res.json({
    success: true,
    data: {
      status: session.status,
      qrCode: session.qrCode,
      qrDataUrl: session.qrDataUrl,
    },
  });
});

// DELETE /api/sessions/:id - Delete / Disconnect session
sessionRouter.delete("/:id", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const deleted = await sessionManager.deleteSession(id);

    if (!deleted) {
      res.status(404).json({ success: false, error: "Session not found" });
      return;
    }

    res.json({
      success: true,
      message: `Session ${id} successfully disconnected and removed.`,
    });
  } catch (error) {
    logger.error({ error }, "Failed to delete session");
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});
