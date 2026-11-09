import { NextResponse } from "next/server";
import { sqlConnection } from "@/lib/server/store";

/** Controllo per il monitoraggio: dice solo se l'app e il database rispondono. */
export async function GET() {
  try {
    sqlConnection().prepare("SELECT 1").get();
    return NextResponse.json({ stato: "ok" });
  } catch {
    return NextResponse.json({ stato: "errore" }, { status: 503 });
  }
}
