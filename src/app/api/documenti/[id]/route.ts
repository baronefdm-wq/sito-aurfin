import { serveAttachment } from "@/lib/server/download";

/** Documenti dell'area clienti: solo con la sessione cliente, solo i propri file. */
export async function GET(_request: Request, ctx: RouteContext<"/api/documenti/[id]">) {
  const { id } = await ctx.params;
  return serveAttachment("cliente", id);
}
