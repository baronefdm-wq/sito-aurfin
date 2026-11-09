"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { Notice } from "@/components/ui/primitives";
import {
  credentialsLogin,
  requestClientLink,
  requestPasswordReset,
  setStaffPassword,
  verifyLoginCode,
  type AuthFormState,
} from "@/lib/server/auth-actions";

function Feedback({ state }: { state: AuthFormState }) {
  return (
    <>
      {state.error ? (
        <Notice tone="warning" role="alert">
          {state.error}
        </Notice>
      ) : null}
      {state.info ? (
        <Notice tone="success" role="status">
          {state.info}
        </Notice>
      ) : null}
    </>
  );
}

/** Accesso del personale: password, poi codice ricevuto via email. */
export function CredentialsForm({ recoveryHref }: { recoveryHref: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(credentialsLogin, {});
  const [codeState, codeAction, codePending] = useActionState<AuthFormState, FormData>(verifyLoginCode, {});

  if (state.step === "codice") {
    return (
      <form action={codeAction} className="space-y-5" noValidate>
        <Field id="login-code" label="Codice ricevuto via email" hint="Il codice ha 6 cifre ed è valido per 10 minuti.">
          {(a) => <Input {...a} name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required autoFocus />}
        </Field>
        <Feedback state={codeState.error ? codeState : state} />
        <Button type="submit" size="lg" disabled={codePending}>
          {codePending ? <Loader2 aria-hidden className="animate-spin" /> : null}
          Conferma e accedi
        </Button>
      </form>
    );
  }

  return (
    <form action={action} className="space-y-5" noValidate>
      <Field id="login-email" label="Email">
        {(a) => <Input {...a} name="email" type="email" autoComplete="username" required />}
      </Field>
      <Field id="login-password" label="Password">
        {(a) => <Input {...a} name="password" type="password" autoComplete="current-password" required />}
      </Field>
      <Feedback state={state} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Button type="submit" size="lg" disabled={pending}>
          {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
          Accedi
        </Button>
        <Link href={recoveryHref} className="text-sm font-medium text-teal-700 underline underline-offset-2">
          Primo accesso o password dimenticata?
        </Link>
      </div>
    </form>
  );
}

export function RecoveryForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(requestPasswordReset, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <Field id="recovery-email" label="Email aziendale">
        {(a) => <Input {...a} name="email" type="email" autoComplete="email" required />}
      </Field>
      <Feedback state={state} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
        Invia il link
      </Button>
    </form>
  );
}

/** Accesso del cliente: nessuna password, un link monouso via email. */
export function ClientLinkForm() {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(requestClientLink, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <Field id="client-email" label="Email usata per la richiesta">
        {(a) => <Input {...a} name="email" type="email" autoComplete="email" required />}
      </Field>
      <Feedback state={state} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
        Inviami il link di accesso
      </Button>
    </form>
  );
}

export function SetPasswordForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState<AuthFormState, FormData>(setStaffPassword, {});
  return (
    <form action={action} className="space-y-5" noValidate>
      <input type="hidden" name="token" value={token} />
      <Field id="new-password" label="Nuova password" hint="Almeno 12 caratteri.">
        {(a) => <Input {...a} name="password" type="password" autoComplete="new-password" minLength={12} required />}
      </Field>
      <Field id="confirm-password" label="Ripeti la password">
        {(a) => <Input {...a} name="confirm" type="password" autoComplete="new-password" minLength={12} required />}
      </Field>
      <Feedback state={state} />
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? <Loader2 aria-hidden className="animate-spin" /> : null}
        Imposta la password
      </Button>
    </form>
  );
}
