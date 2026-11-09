import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Documenti e database non devono mai finire nell'output di build.
  outputFileTracingExcludes: { "*": ["./storage/**", "./data/**", "./backup/**"] },
  turbopack: {
    // L'accesso dinamico al disco in storage.ts è voluto (chiavi validate): avviso di tracing non rilevante.
    ignoreIssue: [{ path: "**/src/lib/server/storage.ts", title: /Dynamic filesystem access/ }],
    // La radice è la cartella del progetto (evita lockfile esterni, es. nella cartella utente).
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      { source: "/(area-clienti|pannello)/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
      // Il link personale non deve finire nella cache né essere passato ad altri siti.
      {
        source: "/appuntamento/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
          { key: "Referrer-Policy", value: "no-referrer" },
        ],
      },
    ];
  },
};

export default nextConfig;
