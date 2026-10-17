import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

const url = process.env.DATABASE_URL;

if (!url) {
  throw new Error(
    "DATABASE_URL est introuvable. Définissez-la dans .env (local) ou dans les variables d’environnement (production).",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  dbCredentials: { url },
});
