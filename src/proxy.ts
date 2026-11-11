import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";

// Stessi nomi di src/lib/server/session.ts (il proxy non importa moduli server-only).
const SESSION_COOKIES = { cliente: "aurfin_cliente", team: "aurfin_team" } as const;
const ACCESS_COOKIE = "aurfin_accesso";
const ACCESS_PARAM = "accesso";
const ACCESS_TTL_SECONDS = 60 * 60 * 24 * 30;
const PUBLIC_AREA_PATHS = [
  "/area-clienti/accesso",
  "/area-clienti/recupero",
  "/area-clienti/entra",
  "/team/accesso",
  "/team/recupero",
  "/team/imposta-password",
];

/**
 * 1. Accesso riservato all'intero sito (versione di presentazione online).
 *    Se SITE_ACCESS_KEY è impostata, si entra solo con il link che contiene
 *    ?accesso=<chiave>: la chiave viene scambiata con un cookie httpOnly
 *    (30 giorni) e rimossa dall'indirizzo. Senza chiave: pagina "Accesso riservato".
 *    In locale, senza la variabile, il sito resta aperto come prima.
 *
 * 2. Area clienti e spazio team: controllo ottimistico del cookie della sessione
 *    del proprio spazio; la verifica vera (firma, scadenza, ruolo) avviene sul
 *    server in layout, pagine, server action e route handler.
 */

const digest = (value: string) => createHash("sha256").update(`aurfin-accesso:${value}`).digest("hex");

function sameSecret(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

const DENIED_PAGE = `<!doctype html><html lang="it"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Accesso riservato · AURFIN</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#F7F5F0;color:#142D40;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;padding:24px}main{max-width:28rem}p.k{letter-spacing:.14em;text-transform:uppercase;font-size:13px;font-weight:600;color:#7a6236}h1{font-family:Georgia,serif;font-weight:500;font-size:32px;line-height:1.2;margin:.4em 0}p{color:#475569;line-height:1.6}</style></head>
<body><main><p class="k">AURFIN</p><h1>Accesso riservato</h1><p>Questa è una versione di presentazione non pubblica. Per entrare serve il link di accesso fornito da AURFIN.</p></main></body></html>`;

export function proxy(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  const accessKey = process.env.SITE_ACCESS_KEY?.trim();

  if (accessKey && accessKey.length >= 16) {
    const expected = digest(accessKey);
    // Un "+" della chiave non codificato nel link arriva come spazio: lo si ripristina.
    const fromLink = searchParams.get(ACCESS_PARAM)?.replace(/ /g, "+") ?? null;

    if (fromLink !== null) {
      // Link di accesso: imposta il cookie e ripulisce l'indirizzo dalla chiave.
      if (!sameSecret(digest(fromLink), expected)) {
        return new NextResponse(DENIED_PAGE, { status: 401, headers: { "Content-Type": "text/html; charset=utf-8" } });
      }
      const clean = request.nextUrl.clone();
      clean.searchParams.delete(ACCESS_PARAM);
      const response = NextResponse.redirect(clean);
      response.cookies.set(ACCESS_COOKIE, expected, {
        httpOnly: true,
        secure: request.nextUrl.protocol === "https:",
        sameSite: "lax",
        path: "/",
        maxAge: ACCESS_TTL_SECONDS,
      });
      return response;
    }

    const cookie = request.cookies.get(ACCESS_COOKIE)?.value ?? "";
    if (!sameSecret(cookie, expected)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Accesso riservato." }, { status: 401 });
      }
      return new NextResponse(DENIED_PAGE, {
        status: 401,
        headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" },
      });
    }
  }

  const isTeam = pathname === "/team" || pathname.startsWith("/team/") || pathname.startsWith("/api/team/");

  // 3. Indirizzo dedicato al team (facoltativo, es. team.aurfin.it): lo spazio team
  //    risponde solo lì e su quell'indirizzo non si vede il sito dei clienti.
  const teamHost = process.env.TEAM_HOST?.trim().toLowerCase();
  if (teamHost) {
    const host = (request.headers.get("host") ?? "").split(":")[0].toLowerCase();
    if (host === teamHost) {
      if (!isTeam && !pathname.startsWith("/api/")) return NextResponse.redirect(new URL("/team", request.url));
    } else if (isTeam) {
      return new NextResponse("Pagina non trovata", { status: 404, headers: { "X-Robots-Tag": "noindex, nofollow" } });
    }
  }

  const isClientArea = pathname.startsWith("/area-clienti");
  const isPublicLogin = PUBLIC_AREA_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if ((isClientArea || (isTeam && !pathname.startsWith("/api/"))) && !isPublicLogin) {
    const cookie = isTeam ? SESSION_COOKIES.team : SESSION_COOKIES.cliente;
    if (!request.cookies.has(cookie)) {
      return NextResponse.redirect(new URL(isTeam ? "/team/accesso" : "/area-clienti/accesso", request.url));
    }
  }

  const response = NextResponse.next();
  // Sito riservato, area clienti, spazio team e link di prenotazione non vengono indicizzati.
  if (accessKey || isClientArea || isTeam || pathname.startsWith("/appuntamento/")) response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}

export const config = {
  // Tutte le pagine e le API, esclusi i file statici generati da Next.js.
  matcher: ["/((?!_next/static|_next/image|icon.svg).*)"],
};
