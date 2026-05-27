import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

/* -----------------------------------------------------------------------------
 * Talk Again — Vite config
 *
 * - PWA: autoUpdate so the Service Worker silently updates between visits.
 * - Listens on all interfaces so the iPad on the same LAN can hit dev server.
 * - Dev API proxy: bridges `/api/tts` to the Vercel Edge function file at
 *   `api/tts.ts` so `npm run dev` works without installing Vercel CLI. The
 *   plugin only mounts in dev — production runs on the real Vercel runtime.
 * ---------------------------------------------------------------------------*/

/** Mounts Edge-style `Request → Response` handlers from `/api/*.ts` files at
 *  the matching URL during `vite dev`. Keeps the function code identical to
 *  what Vercel ships, so what we test locally is what gets deployed. */
function devApiPlugin(): Plugin {
  return {
    name: "talk-again:dev-api",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // Only intercept POST /api/* — let Vite handle everything else.
        if (!req.url || !req.url.startsWith("/api/")) return next();

        const url = new URL(req.url, "http://localhost");
        const filename = url.pathname.slice("/api/".length);
        if (!/^[\w-]+$/.test(filename)) return next();

        const modulePath = path.resolve(__dirname, "api", `${filename}.ts`);

        try {
          // Buffer the request body so we can hand it to the Edge handler as
          // a standard Web Request object.
          const body = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            req.on("data", (c: Buffer) => chunks.push(c));
            req.on("end", () => resolve(Buffer.concat(chunks)));
            req.on("error", reject);
          });

          const headers = new Headers();
          for (const [k, v] of Object.entries(req.headers)) {
            if (typeof v === "string") headers.set(k, v);
            else if (Array.isArray(v)) headers.set(k, v.join(", "));
          }

          const method = req.method ?? "GET";
          const webReq = new Request(
            `http://localhost${req.url}`,
            method === "GET" || method === "HEAD"
              ? { method, headers }
              : { method, headers, body: body.length ? body : undefined },
          );

          // Use Vite's SSR loader so we get TS transpilation + HMR.
          const mod = await server.ssrLoadModule(modulePath);
          const handler = mod.default as (
            r: Request,
          ) => Promise<Response> | Response;
          if (typeof handler !== "function") {
            res.statusCode = 500;
            res.end(`No default export from api/${filename}.ts`);
            return;
          }

          const webRes = await handler(webReq);

          res.statusCode = webRes.status;
          webRes.headers.forEach((value, key) => res.setHeader(key, value));

          if (webRes.body) {
            // Stream the response chunk-by-chunk to mimic Edge behaviour.
            const reader = webRes.body.getReader();
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(Buffer.from(value));
            }
          }
          res.end();
        } catch (err) {
          // Surface the stack into the browser network panel — easier debugging.
          server.config.logger.error(
            `[dev-api] /api/${filename} threw: ${(err as Error).stack ?? err}`,
          );
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(
            JSON.stringify({
              error: "dev_api_handler_threw",
              detail: (err as Error).message,
            }),
          );
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // Load every env var (no prefix filter) so the dev API handler can read
  // ELEVENLABS_* from .env.local exactly the way the Vercel Edge runtime
  // would. We never expose these to the client bundle — Vite only inlines
  // `VITE_*` variables, and we deliberately don't prefix our secrets.
  const env = loadEnv(mode, process.cwd(), "");
  for (const [k, v] of Object.entries(env)) {
    if (process.env[k] === undefined) process.env[k] = v;
  }

  return {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    server: {
      host: true,
      port: 5173,
    },
    plugins: [
      react(),
      devApiPlugin(),
      VitePWA({
        registerType: "autoUpdate",
        includeAssets: [
          "favicon.ico",
          "apple-touch-icon.png",
          "icon-192.png",
          "icon-512.png",
        ],
        manifest: {
          name: "Talk Again",
          short_name: "Talk Again",
          description:
            "혀 절제술 후 발화가 어려운 분을 위한 의사소통 보조 (iPad PWA).",
          lang: "ko-KR",
          dir: "ltr",
          start_url: "/",
          scope: "/",
          display: "standalone",
          orientation: "landscape",
          background_color: "#F5F3EF",
          theme_color: "#F5F3EF",
          icons: [
            {
              src: "icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable",
            },
            {
              src: "icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable",
            },
          ],
        },
        workbox: {
          // Don't let the SW intercept TTS requests — we want them to hit the
          // server every time (the Blob cache is in IndexedDB, not the SW).
          navigateFallbackDenylist: [/^\/api\//],
          globPatterns: ["**/*.{js,css,html,ico,png,svg,webp,woff2}"],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/.*pretendard.*/,
              handler: "CacheFirst",
              options: {
                cacheName: "pretendard-fonts",
                expiration: {
                  maxEntries: 30,
                  maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
                },
              },
            },
          ],
        },
      }),
    ],
  };
});
