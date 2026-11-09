import { redirect } from "next/navigation";

/** I clienti accedono con un link via email: non ci sono password da recuperare. */
export default function ClientRecoveryPage() {
  redirect("/area-clienti/accesso");
}
