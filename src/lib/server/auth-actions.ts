"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { z } from "zod";
import { site } from "@/config/site";
import { homeFor } from "@/lib/server/auth";
import { getSessionSecret, isDemo } from "@/lib/server/env";
import { isDeliverable, isMailReady, sendAccessEmail, teamUrl } from "@/lib/server/notifications";
import { clientIp, rateLimit } from "@/lib/server/rate-limit";
import { SESSION_COOKIES, SESSION_TTL_SECONDS, createSessionToken, spaceForRole } from "@/lib/server/session";
import { db, findUserByEmail, getUser, saveUser, type User } from "@/lib/server/store";
import {
  consumeToken,
  createLoginChallenge,
  createToken,
  hashPassword,
  verifyLoginChallenge,
  verifyPassword,
} from "@/lib/server/tokens";

export type AuthFormState = { error?: string; info?: string; step?: "codice" };

const CHALLENGE_COOKIE = "aurfin_team_sfida";
const validEmail = (v: string) => z.email().safeParse(v).success;

async function setSession(user: User) {
  const jar = await cookies();
  jar.set(
    SESSION_COOKIES[spaceForRole(user.role)],
    createSessionToken({ uid: user.id, role: user.role, v: user.sessionVersion ?? 0 }, getSessionSecret()),
    { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: SESSION_TTL_SECONDS },
  );
}

async function limited(key: string, limit: number) {
  const ip = clientIp(await headers());
  return !rateLimit(`${key}:${ip}`, { limit, windowMs: 15 * 60 * 1000 }).ok;
}

/** Accesso con profilo dimostrativo: disponibile solo con DATA_MODE=demo. */
export async function demoLogin(formData: FormData) {
  if (!isDemo) throw new Error("Accesso dimostrativo non disponibile.");
  const uid = String(formData.get("uid") ?? "");
  const allowed = String(formData.get("area") ?? "");
  const user = db.users.find((u) => u.id === uid);
  if (!user) throw new Error("Profilo non valido.");
  if (allowed === "cliente" && user.role !== "cliente") throw new Error("Profilo non valido.");
  if (allowed === "staff" && user.role === "cliente") throw new Error("Profilo non valido.");
  await setSession(user);
  redirect(homeFor(user.role));
}

// ---------- Personale: password + codice via email ----------

export async function credentialsLogin(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (await limited("login", 8)) return { error: "Troppi tentativi. Riprova tra qualche minuto." };
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Inserisci email e password." };
  if (!rateLimit(`login-email:${email.toLowerCase()}`, { limit: 8, windowMs: 15 * 60 * 1000 }).ok) {
    return { error: "Troppi tentativi. Riprova tra qualche minuto." };
  }

  const user = findUserByEmail(email, "team");
  const ok = await verifyPassword(password, user?.passwordHash);
  if (!user || !ok || user.active === false) return { error: "Email o password non corretti." };

  if (!isMailReady() || !isDeliverable(user.email)) {
    return { error: "Il codice di verifica non può essere inviato: l'invio email non è configurato." };
  }
  const { challenge, code } = createLoginChallenge(user.id);
  try {
    await sendAccessEmail(
      user.email,
      `Codice di accesso AURFIN Team: ${code}`,
      `Il tuo codice di accesso allo spazio team è ${code}.\nÈ valido per 10 minuti. Se non hai richiesto tu l'accesso, cambia la password e avvisa l'amministratore.`,
      "Codice di accesso al personale",
    );
  } catch {
    return { error: "Non è stato possibile inviare il codice di verifica. Riprova." };
  }
  const jar = await cookies();
  jar.set(CHALLENGE_COOKIE, challenge, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/team",
    maxAge: 10 * 60,
  });
  return { step: "codice", info: "Ti abbiamo inviato un codice via email." };
}

export async function verifyLoginCode(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (await limited("login-codice", 15)) return { step: "codice", error: "Troppi tentativi. Riprova tra qualche minuto." };
  const jar = await cookies();
  const challenge = jar.get(CHALLENGE_COOKIE)?.value;
  const code = String(formData.get("code") ?? "");
  if (!challenge) return { error: "Il codice è scaduto: accedi di nuovo." };
  const userId = verifyLoginChallenge(challenge, code);
  const user = userId ? getUser(userId) : null;
  if (!user || user.role === "cliente" || user.active === false) {
    return { step: "codice", error: "Codice non corretto o scaduto." };
  }
  user.lastLoginAt = new Date().toISOString();
  saveUser(user);
  jar.delete({ name: CHALLENGE_COOKIE, path: "/team" });
  await setSession(user);
  redirect("/team");
}

/** Recupero o primo accesso del personale: stessa risposta che l'utente esista o no. */
export async function requestPasswordReset(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (await limited("reset", 5)) return { error: "Troppi tentativi. Riprova tra qualche minuto." };
  const email = String(formData.get("email") ?? "").trim();
  if (!validEmail(email)) return { error: "Inserisci un indirizzo email valido." };
  if (!isMailReady()) return { error: "Il recupero delle credenziali non è attivo: l'invio email non è configurato." };
  const user = findUserByEmail(email, "team");
  if (user && user.active !== false && isDeliverable(user.email)) {
    const link = teamUrl(`/team/imposta-password?token=${createToken("password", user.id, 60 * 60)}`);
    const to = user.email;
    after(() =>
      sendAccessEmail(
        to,
        "Imposta la password dello spazio team AURFIN",
        `Per impostare la password apri questo link, valido per un'ora:\n${link}\n\nSe non hai richiesto tu questa operazione, ignora il messaggio.`,
        "Impostazione password del personale",
      ).catch(() => {}),
    );
  }
  return { info: "Se l'indirizzo appartiene a un account del team, riceverai a breve un link." };
}

const passwordRules = z
  .string()
  .min(12, "La password deve avere almeno 12 caratteri.")
  .max(200, "La password è troppo lunga.");

export async function setStaffPassword(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (await limited("set-password", 10)) return { error: "Troppi tentativi. Riprova tra qualche minuto." };
  const password = passwordRules.safeParse(String(formData.get("password") ?? ""));
  if (!password.success) return { error: password.error.issues[0].message };
  if (password.data !== String(formData.get("confirm") ?? "")) return { error: "Le due password non coincidono." };
  const userId = consumeToken(String(formData.get("token") ?? ""), "password");
  const user = userId ? getUser(userId) : null;
  if (!user || user.role === "cliente") return { error: "Il link non è più valido: richiedine uno nuovo." };
  user.passwordHash = await hashPassword(password.data);
  // Le sessioni aperte con la vecchia password decadono.
  user.sessionVersion = (user.sessionVersion ?? 0) + 1;
  saveUser(user);
  redirect("/team/accesso?password=impostata");
}

// ---------- Clienti: link di accesso via email ----------

export async function requestClientLink(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  if (await limited("link-cliente", 5)) return { error: "Troppi tentativi. Riprova tra qualche minuto." };
  const email = String(formData.get("email") ?? "").trim();
  if (!validEmail(email)) return { error: "Inserisci un indirizzo email valido." };
  if (!isMailReady()) return { error: "L'accesso via email non è attivo: l'invio email non è configurato." };
  const user = findUserByEmail(email, "cliente");
  if (user && user.active !== false && isDeliverable(user.email)) {
    const link = new URL(`/area-clienti/entra?token=${createToken("accesso-cliente", user.id, 30 * 60)}`, site.url).toString();
    const to = user.email;
    after(() =>
      sendAccessEmail(
        to,
        "Il tuo link di accesso all'area clienti AURFIN",
        `Per entrare nell'area clienti apri questo link, valido per 30 minuti e utilizzabile una sola volta:\n${link}\n\nSe non hai richiesto tu l'accesso, ignora il messaggio.`,
        "Link di accesso al cliente",
      ).catch(() => {}),
    );
  }
  return { info: "Se l'indirizzo è collegato a una richiesta, riceverai a breve il link di accesso. Controlla anche lo spam." };
}

export async function enterClientArea(formData: FormData) {
  const userId = consumeToken(String(formData.get("token") ?? ""), "accesso-cliente");
  const user = userId ? getUser(userId) : null;
  if (!user || user.role !== "cliente" || user.active === false) redirect("/area-clienti/accesso?link=scaduto");
  user.lastLoginAt = new Date().toISOString();
  saveUser(user);
  await setSession(user);
  redirect("/area-clienti");
}

// ---------- Uscita ----------

/** Uscita dall'area clienti: chiude solo la sessione cliente. */
export async function logoutClient() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIES.cliente);
  redirect("/");
}

/** Uscita dallo spazio team: chiude solo la sessione del team. */
export async function logoutTeam() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIES.team);
  redirect("/team/accesso");
}
