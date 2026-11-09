import type { MetadataRoute } from "next";
import { site } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    // Lo spazio team non è elencato per non renderne pubblico il percorso:
    // è comunque escluso dall'indicizzazione con l'intestazione X-Robots-Tag (vedi proxy.ts).
    rules: [{ userAgent: "*", allow: "/", disallow: ["/area-clienti", "/api"] }],
    sitemap: new URL("/sitemap.xml", site.url).toString(),
  };
}
