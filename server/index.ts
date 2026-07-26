import { createServer } from 'http';
import { getRequestListener } from '@hono/node-server';
import { createApp } from '../electron/backend/routes';
import { ensureBootstrapped } from '../electron/backend/bootstrap';
import { setDataDir, loadServiceConfig } from '../electron/backend/config';
import { closeDb } from '../electron/backend/db';
import { syncUsage } from '../electron/backend/usage-sync';
import * as db from '../electron/backend/db';
import { Hono } from 'hono';
import path from 'path';
import fs from 'fs';

// ─── Config ───────────────────────────────────────────────────────────────────

const DATA_DIR = process.env['68BACKEND_DATA'] || path.resolve(__dirname, '../data');
const LISTEN_HOST = process.env['68BACKEND_LISTEN_HOST'] || '0.0.0.0';
const LISTEN_PORT = parseInt(process.env['68BACKEND_LISTEN_PORT'] || '8788', 10);
const DIST_DIR = path.resolve(__dirname, '../dist');

// MIME types for static file serving
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.map': 'application/json',
};

function serveStaticFile(c: any, filePath: string) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME[ext] || 'application/octet-stream';
  try {
    const content = fs.readFileSync(filePath);
    return c.body(content, 200, {
      'Content-Type': contentType,
      'Cache-Control': ext === '.html' ? 'no-cache' : 'max-age=86400',
    });
  } catch {
    return c.notFound();
  }
}

// ─── Sync task ────────────────────────────────────────────────────────────────

let syncTimer: ReturnType<typeof setTimeout> | null = null;
let syncRunning = false;
let stopped = false;

function clearSyncTimer() {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }
}

async function runAutoSyncOnce() {
  if (syncRunning || stopped) return;
  syncRunning = true;
  try {
    const service = loadServiceConfig();
    if (!service.usage_sync.auto_sync) return;
    const accounts = db.listOpencodeAccounts(true);
    for (const account of accounts) {
      if (stopped) break;
      try {
        await syncUsage(account, 5);
      } catch {
        // ignore per-account errors
      }
    }
  } finally {
    syncRunning = false;
  }
}

function scheduleAutoSync() {
  clearSyncTimer();
  if (stopped) return;
  const service = loadServiceConfig();
  if (!service.usage_sync.auto_sync) {
    syncTimer = setTimeout(() => scheduleAutoSync(), 30_000);
    return;
  }
  const intervalMs = Math.max(15, service.usage_sync.interval_sec) * 1000;
  syncTimer = setTimeout(async () => {
    await runAutoSyncOnce();
    scheduleAutoSync();
  }, intervalMs);
}

function restartUsageSyncTask() {
  clearSyncTimer();
  if (stopped) return;
  const service = loadServiceConfig();
  if (service.usage_sync.auto_sync) {
    syncTimer = setTimeout(async () => {
      await runAutoSyncOnce();
      scheduleAutoSync();
    }, 1000);
  } else {
    scheduleAutoSync();
  }
}

// ─── App ──────────────────────────────────────────────────────────────────────

setDataDir(DATA_DIR);
ensureBootstrapped();

const apiApp = createApp({ onConfigUpdated: restartUsageSyncTask });

const app = new Hono();

// API routes
app.route('/', apiApp);

// Serve static files from dist/
app.get('/*', (c) => {
  const url = new URL(c.req.url, 'http://localhost');
  let requestPath = url.pathname;

  // Strip leading slash
  if (requestPath.startsWith('/')) requestPath = requestPath.slice(1);

  // Try exact file
  let filePath = path.join(DIST_DIR, requestPath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveStaticFile(c, filePath);
  }

  // Try index.html in directory
  if (requestPath === '' || requestPath.endsWith('/')) {
    filePath = path.join(DIST_DIR, requestPath, 'index.html');
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return serveStaticFile(c, filePath);
    }
  }

  // SPA fallback: serve index.html for non-API, non-file routes
  const indexPath = path.join(DIST_DIR, 'index.html');
  if (fs.existsSync(indexPath)) {
    return serveStaticFile(c, indexPath);
  }

  return c.json({ error: 'Frontend not built. Run: pnpm build' }, 501);
});

// ─── Start ────────────────────────────────────────────────────────────────────

const listener = getRequestListener(app.fetch);
const server = createServer(listener);

server.listen(LISTEN_PORT, LISTEN_HOST, () => {
  console.log(`\n  🚀 68HUB Web Server`);
  console.log(`  ─────────────────────`);
  console.log(`  📊 API:      http://${LISTEN_HOST === '0.0.0.0' ? 'localhost' : LISTEN_HOST}:${LISTEN_PORT}/api`);
  console.log(`  🖥️  Dashboard: http://${LISTEN_HOST === '0.0.0.0' ? 'localhost' : LISTEN_HOST}:${LISTEN_PORT}`);
  console.log(`  📁 Data:     ${DATA_DIR}`);
  console.log();
});

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down...');
  stopped = true;
  clearSyncTimer();
  closeDb();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 3000);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
