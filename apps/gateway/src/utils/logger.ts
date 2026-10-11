import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            ignore: "pid,hostname",
            translateTime: "SYS:standard",
          },
        }
      : undefined,
});

// Create a logger for Baileys internal socket chatter with configurable level
export const baileysLogger = pino({
  level: process.env.BAILEYS_LOG_LEVEL || "warn",
});
