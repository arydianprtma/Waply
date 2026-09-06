import { Router, Request, Response } from "express";
import { SessionManager } from "../services/session.manager.js";
import { logger } from "../utils/logger.js";
import { parseSpintax } from "../utils/spintax.js";

export const messageRouter = Router();
const sessionManager = SessionManager.getInstance();

// POST /api/sessions/:id/send - Send text message
messageRouter.post("/:id/send", async (req: Request, res: Response) => {
  try {
    const id = String(req.params.id);
    const { to, message, variables } = req.body;

    if (!to || !message) {
      res.status(400).json({
        success: false,
        error: "Parameters 'to' (recipient number) and 'message' are required",
      });
      return;
    }

    const session = sessionManager.getSession(id);
    if (!session) {
      res.status(404).json({
        success: false,
        error: `Device session '${id}' is not initialized or found`,
      });
      return;
    }

    if (session.status !== "CONNECTED") {
      res.status(400).json({
        success: false,
        error: `Device session '${id}' is not CONNECTED (Current status: ${session.status})`,
      });
      return;
    }

    // Parse spintax & dynamic variables
    const finalMessage = parseSpintax(message, variables || {});

    const result = await session.sendTextMessage(to, finalMessage);

    res.json({
      success: true,
      data: {
        messageId: result.messageId,
        status: result.status,
        recipient: to,
        sentContent: finalMessage,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error({ error }, "Error sending message via Gateway");
    res.status(500).json({
      success: false,
      error: (error as Error).message,
    });
  }
});
