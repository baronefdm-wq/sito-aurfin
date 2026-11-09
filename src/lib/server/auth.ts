import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Role } from "@/lib/domain";
import { getSessionSecret } from "@/lib/server/env";
import { SESSION_COOKIES, readSessionToken, spaceForRole, type Space } from "@/lib/server/session";
import { getUser, type User } from "@/lib/server/store";

export type Viewer = User;

export class AuthorizationError extends Error {
  constructor(message = "Operazione non consentita per il tuo profilo.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Utente corrente dello spazio indicato, verificato lato server a ogni richiesta.
 * Il ruolo deve appartenere allo spazio del cookie: un token cliente non vale
 * nello spazio team e viceversa.
 */
export async function getViewer(space: Space): Promise<Viewer | null> {
  const jar = await cookies();
  const session = readSessionToken(jar.get(SESSION_COOKIES[space])?.value, getSessionSecret());
  if (!session || spaceForRole(session.role) !== space) return null;
  const user = getUser(session.uid);
  if (!user || user.role !== session.role || user.active === false) return null;
  if ((user.sessionVersion ?? 0) !== (session.v ?? 0)) return null;
  return user;
}

export const STAFF_ROLES: Role[] = ["consulente", "amministratore"];

export function homeFor(role: Role) {
  return role === "cliente" ? "/area-clienti" : "/team";
}

const spaceOf = (roles: Role[]): Space => (roles.includes("cliente") ? "cliente" : "team");

/** Per pagine e layout: senza sessione porta all'accesso, con ruolo non sufficiente alla home dello spazio. */
export async function requireRole(roles: Role[], loginPath: string): Promise<Viewer> {
  const viewer = await getViewer(spaceOf(roles));
  if (!viewer) redirect(loginPath);
  if (!roles.includes(viewer.role)) redirect(homeFor(viewer.role));
  return viewer;
}

/** Per server action e route handler: interrompe con un errore esplicito. */
export async function assertRole(roles: Role[]): Promise<Viewer> {
  const viewer = await getViewer(spaceOf(roles));
  if (!viewer || !roles.includes(viewer.role)) throw new AuthorizationError();
  return viewer;
}
