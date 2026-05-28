/**
 * VedaAI API Server
 * Main entry point for the Express application and Socket.io integration.
 * Authored and Maintained by Jaideep Raj Dutta.
 */
import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import { createServer } from "node:http";
import { env } from "./config/env";
import { connectMongo } from "./db/mongo";
import { isAllowedOrigin } from "./config/cors";
import { initIo } from "./ws/io";
import { startGenerationBridge } from "./ws/bridge";
import { getJobState } from "./queue/jobState";
import assignmentsRouter from "./routes/assignments";
import uploadRouter from "./routes/upload";

async function main(): Promise<void> {
  await connectMongo();

  const app = express();
  app.use(cors({ origin: (o, cb) => cb(null, isAllowedOrigin(o)) }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/assignments", assignmentsRouter);
  app.use("/api/upload", uploadRouter);

  // WS fallback: poll a job's state over HTTP.
  app.get("/api/jobs/:id", async (req, res, next) => {
    try {
      const state = await getJobState(req.params.id);
      if (!state) return res.status(404).json({ error: "Not found" });
      return res.json(state);
    } catch (err) {
      return next(err);
    }
  });

  // Centralized error handler.
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    console.error("[api] error:", err);
    res.status(500).json({ error: "Internal server error" });
  });

  const httpServer = createServer(app);
  initIo(httpServer);
  startGenerationBridge();

  httpServer.listen(env.port, () => {
    console.log(`[api] listening on http://localhost:${env.port}`);
    console.log(`[api] CORS origin: ${env.webOrigin}`);
  });
}

main().catch((err) => {
  console.error("[api] fatal:", err);
  process.exit(1);
});
