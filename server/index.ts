import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();

// Behind Render/Proxies so secure cookies & IPs behave correctly
app.set("trust proxy", 1);

// ---- CORS (minimal + safe) -----------------------------------------------
// Comma-separated hosts in REPLIT_DOMAINS (no protocol), e.g.:
// "tms-magnoos.onrender.com, 404elie.github.io, localhost"
const allowedHosts = (process.env.REPLIT_DOMAINS || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

// Convert an Origin like "https://foo.bar" to "foo.bar"
function extractHost(origin?: string | null) {
  if (!origin) return "";
  try {
    const u = new URL(origin);
    return u.host; // host = hostname[:port]
  } catch {
    // if it's already a bare host
    return origin.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser/health checks (no Origin)
      if (!origin) return cb(null, true);

      const reqHost = extractHost(origin);
      const ok = allowedHosts.some(h => reqHost === h || reqHost.endsWith(`.${h}`));

      return cb(null, ok);
    },
    credentials: true, // allow cookies/credentials cross-site
  })
);
// --------------------------------------------------------------------------

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    }
  );
})();
