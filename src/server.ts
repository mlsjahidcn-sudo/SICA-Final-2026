import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer } from 'ws';
import type { IncomingMessage } from 'http';
import type { Duplex } from 'stream';

const dev = process.env.COZE_PROJECT_ENV !== 'PROD';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.DEPLOY_RUN_PORT || process.env.PORT || '5000', 10);

// Create Next.js app
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ─── WebSocket Route Registry ─────────────────────────────────────────────────
const wssMap = new Map<string, WebSocketServer>();

function registerWsEndpoint(path: string): WebSocketServer {
  const wss = new WebSocketServer({ noServer: true });
  wssMap.set(path, wss);
  return wss;
}

function handleUpgrade(req: IncomingMessage, socket: Duplex, head: Buffer) {
  const { pathname } = new URL(req.url!, `http://${req.headers.host}`);
  const wss = wssMap.get(pathname);
  
  if (wss) {
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  } else if (!dev) {
    // Production: destroy unregistered upgrade requests to prevent connection leaks
    socket.destroy();
  }
  // Development: don't destroy - Next.js HMR needs /_next/webpack-hmr
}

// ─── Import and Setup WebSocket Handlers ──────────────────────────────────────
import { setupNotificationsHandler } from './ws-handlers/notifications';

// Register notification endpoint
setupNotificationsHandler(registerWsEndpoint('/ws/notifications'));

// ─── Start Server ─────────────────────────────────────────────────────────────
app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal server error');
    }
  });

  server.once('error', (err) => {
    console.error(err);
    process.exit(1);
  });

  // Handle WebSocket upgrade requests
  server.on('upgrade', handleUpgrade);

  server.listen(port, () => {
    console.log(
      `> Server listening at http://${hostname}:${port} as ${
        dev ? 'development' : process.env.COZE_PROJECT_ENV
      }`,
    );
    console.log(`> WebSocket endpoints: /ws/notifications`);
  });
});

// Export for use in API routes
export { sendNotificationToUser, sendNotificationToUsers, broadcastNotification } from './ws-handlers/notifications';
