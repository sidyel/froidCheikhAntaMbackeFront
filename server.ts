import { APP_BASE_HREF } from '@angular/common';
import { CommonEngine } from '@angular/ssr';
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
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
];

const API_URL = process.env['API_URL'] || 'http://localhost:8080';

export function app(): express.Express {
  const server = express();
  const serverDistFolder = dirname(fileURLToPath(import.meta.url));
  const browserDistFolder = resolve(serverDistFolder, '../browser');
  const indexHtml = join(serverDistFolder, 'index.server.html');

  const commonEngine = new CommonEngine();

  server.set('view engine', 'html');
  server.set('views', browserDistFolder);

  // ── Proxy sitemap.xml + robots.txt vers le backend Spring Boot ──────────────
  const proxyOptions = {
    target: API_URL,
    changeOrigin: true,
    // Supprime le préfixe /api car ces endpoints sont à la racine Spring Boot
    pathRewrite: { '^': '' },
  };
  server.use('/sitemap.xml', createProxyMiddleware({ ...proxyOptions, pathRewrite: { '^/sitemap.xml': '/sitemap.xml' } }));
  server.use('/robots.txt', createProxyMiddleware({ ...proxyOptions, pathRewrite: { '^/robots.txt': '/robots.txt' } }));

  // ── Fichiers statiques du bundle browser ───────────────────────────────────
  server.get('*.*', express.static(browserDistFolder, { maxAge: '1y' }));

  // ── Routes client-only : servir index.html sans SSR ────────────────────────
  for (const route of CLIENT_ONLY_ROUTES) {
    server.get(`${route}`, serveClientOnly(browserDistFolder));
    server.get(`${route}/**`, serveClientOnly(browserDistFolder));
  }

  // ── Toutes les autres routes : rendu SSR Angular avec timeout Neon (4s) ───
  server.get('*', (req, res, next) => {
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
          // Timeout dépassé : le navigateur prend le relais
          res.sendFile(join(browserDistFolder, 'index.html'));
        } else {
          res.send(result);
        }
      })
      .catch((err) => next(err));
  });

  return server;
}

function serveClientOnly(browserDistFolder: string): express.RequestHandler {
  return (_req, res) => {
    res.sendFile(join(browserDistFolder, 'index.html'));
  };
}

function run(): void {
  const port = process.env['PORT'] || 4000;
  const server = app();
  server.listen(port, () => {
    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

run();
