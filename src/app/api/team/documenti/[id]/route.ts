import { serveAttachment } from "@/lib/server/download";

/** Documenti per lo spazio team: solo con la sessione del team, secondo i permessi del ruolo. */
export async function GET(_request: Request, ctx: RouteContext<"/api/team/documenti/[id]">) {
  const { id } = await ctx.params;
  return serveAttachment("team", id);
}
