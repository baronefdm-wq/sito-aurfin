// Copia di sicurezza di database e documenti: npm run backup
// Crea backup/<data-ora>/ con una copia coerente del database (anche ad app accesa) e dei file.
// La cartella contiene dati personali: va conservata cifrata e con accesso limitato.
import { cpSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const target = path.join(root, "backup", stamp);
mkdirSync(target, { recursive: true });

const dataDir = path.join(root, "data");
const databases = process.env.DATABASE_PATH
  ? [path.resolve(process.env.DATABASE_PATH)]
  : existsSync(dataDir)
    ? readdirSync(dataDir).filter((f) => f.endsWith(".db")).map((f) => path.join(dataDir, f))
    : [];

for (const file of databases) {
  const db = new DatabaseSync(file);
  const destination = path.join(target, path.basename(file)).replace(/'/g, "''");
  db.exec(`VACUUM INTO '${destination}'`);
  db.close();
  console.log(`Database copiato: ${path.basename(file)}`);
}

const storage = path.resolve(process.env.STORAGE_LOCAL_DIR ?? path.join(root, "storage", "private"));
if (existsSync(storage)) {
  cpSync(storage, path.join(target, "documenti"), { recursive: true });
  console.log("Documenti copiati.");
}
console.log(`Copia completata in backup/${stamp}`);
