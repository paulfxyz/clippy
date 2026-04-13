import type { Express } from "express";
import type { Server } from "http";

// No server-side routes needed — this app is purely client-side.
// All analysis happens via direct OpenRouter API calls from the browser.
export async function registerRoutes(httpServer: Server, app: Express) {
  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, service: "clippy" });
  });
}
