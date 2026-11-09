import type { MetadataRoute } from "next";
import { legalNav, mainNav, solutions } from "@/config/navigation";
import { site } from "@/config/site";
import { guides } from "@/content/guides";

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    ...solutions.map((s) => s.href),
    ...mainNav.map((n) => n.href),
    "/richiesta-preventivo",
    ...legalNav.map((l) => l.href),
    // Solo guide pubblicate: le bozze sono escluse.
    ...guides.filter((g) => g.status === "pubblicata").map((g) => `/guide/${g.slug}`),
  ];
  return paths.map((p) => ({
    url: new URL(p, site.url).toString(),
    changeFrequency: "monthly",
    priority: p === "/" ? 1 : 0.7,
  }));
}
