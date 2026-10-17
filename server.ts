import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express, { Request, Response, NextFunction } from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import * as http from 'node:http';
import * as https from 'node:https';
import AppServerModule from './src/main.server';
import { SSR_RESPONSE, SSR_REQUEST } from './src/app/utils/ssr.tokens';

/** Routes servies uniquement côté navigateur — jamais rendues côté serveur. */
const CLIENT_ONLY_ROUTES = [
  '/admin',
  '/panier',
  '/commande',
  '/connexion',
  '/inscription',
  '/profil',
  '/mes-commandes',
  '/wishlist',
  '/telecharger',
  '/gestion-admins',
];

const API_URL = process.env['API_URL'] || 'http://localhost:8080';

/** Proxy vers le backend (sitemap.xml / robots.txt). Utilise uniquement les modules Node.js natifs. */
function proxyToBackend(req: Request, res: Response, backendPath: string): void {
  const parsed = new URL(API_URL + backendPath);
  const isHttps = parsed.protocol === 'https:';
  const transport = isHttps ? https : http;
  const port = parsed.port ? parseInt(parsed.port) : (isHttps ? 443 : 80);

  const proxyReq = transport.request(
    { hostname: parsed.hostname, port, path: parsed.pathname + parsed.search, method: 'GET', headers: { host: parsed.host } },
    (proxyRes) => {
      res.status(proxyRes.statusCode || 200);
      for (const [k, v] of Object.entries(proxyRes.headers)) {
        if (v) res.setHeader(k, v as string | string[]);
      }
      proxyRes.pipe(res, { end: true });
    }
  );
  proxyReq.on('error', () => { if (!res.headersSent) res.status(502).end(); });
  proxyReq.end();
}

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // ── Proxy sitemap.xml + robots.txt + flux catalogue vers le backend Spring Boot ──
  server.get('/sitemap.xml', (req, res) => proxyToBackend(req, res, '/sitemap.xml'));
  server.get('/robots.txt', (req, res) => proxyToBackend(req, res, '/robots.txt'));
  server.get('/feeds/meta.xml', (req, res) => proxyToBackend(req, res, '/feeds/meta.xml'));
  server.get('/feeds/google.xml', (req, res) => proxyToBackend(req, res, '/feeds/google.xml'));

  // ── Fichiers statiques du bundle browser ───────────────────────────────────
  server.get('*.*', express.static(browserDistFolder, { maxAge: '1y' }));

  // ── Routes client-only : servir index.html sans SSR ────────────────────────
  for (const route of CLIENT_ONLY_ROUTES) {
    server.get(route, serveClientOnly(browserDistFolder));
    server.get(`${route}/*`, serveClientOnly(browserDistFolder));
  }

  // ── Toutes les autres routes : rendu SSR Angular avec timeout Neon (4s) ────
  server.get('*', (req: Request, res: Response, next: NextFunction) => {
    const { protocol, originalUrl, baseUrl, headers } = req;

    const renderPromise = commonEngine.render({
      bootstrap: AppServerModule,
      documentFilePath: indexHtml,
      url: `${protocol}://${headers.host}${originalUrl}`,
      publicPath: browserDistFolder,
      providers: [
        { provide: APP_BASE_HREF, useValue: baseUrl },
        { provide: SSR_RESPONSE, useValue: res },
        { provide: SSR_REQUEST, useValue: req },
      ],
    });

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 4000)
    );

    Promise.race([renderPromise, timeoutPromise])
      .then((result) => {
        if (res.headersSent) return;
        if (result === null) {
          res.sendFile(join(browserDistFolder, 'index.html'));
        } else {
          res.send(result);
        }
      })
      .catch((err: unknown) => next(err));
  });

  return server;
}

function serveClientOnly(browserDistFolder: string): express.RequestHandler {
  return (_req: Request, res: Response) => {
    res.sendFile(join(browserDistFolder, 'index.html'));
  };
}

function run(): void {
  const port = process.env['PORT'] || 4000;
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express SSR server listening on http://localhost:${port}`);
  });
}

run();
