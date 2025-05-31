import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import * as pathModule from "path";
import { promises as fs } from "fs";
import { scheduleCleanupTask } from './cleanup.js';
import { testCloudinaryConnection } from './cloudinary.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize express app
const app = express();

// Configure CORS
const allowedOrigins = [
  'https://qzonme-frontend-new.vercel.app',
  'https://www.qzonme.com',
  'https://qzonme.com',
  'http://localhost:3000',
  'http://localhost:5173' // Vite dev server
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Parse JSON and URL encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const reqPath = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Capture JSON responses for logging
  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  // Log after response is sent
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (reqPath.startsWith("/api")) {
      let logLine = `${req.method} ${reqPath} ${res.statusCode} in ${duration}ms`;
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

// Special route for sitemap.xml
app.get('/sitemap.xml', async (req, res) => {
  try {
    const sitemapPath = pathModule.join(process.cwd(), 'dist', 'server', 'public', 'sitemap.xml');
    const data = await fs.readFile(sitemapPath);
    res.header('Content-Type', 'application/xml');
    res.send(data);
  } catch (err) {
    console.warn('Warning: Could not find sitemap.xml');
    res.status(404).send('Sitemap not found');
  }
});

// Initialize server
(async () => {
  try {
    // Test Cloudinary connection
    const cloudinaryConnected = await testCloudinaryConnection();
    if (!cloudinaryConnected) {
      console.error('Failed to connect to Cloudinary');
      process.exit(1);
    }

    // Schedule cleanup task
    scheduleCleanupTask();

    // Register routes
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Setup Vite or serve static files
    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
      
      // History API fallback for client-side routing
      app.get('*', (req, res, next) => {
        if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path.startsWith('/assets')) {
          return next();
        }
        
        const distPath = pathModule.resolve(process.cwd(), 'dist', 'server', 'public');
        res.sendFile(pathModule.resolve(distPath, "index.html"));
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Serve static files from the public directory
app.use(express.static(pathModule.join(__dirname, 'public')));
app.use('/static', express.static(pathModule.join(__dirname, 'public')));
