import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

type D1Binding = Parameters<typeof drizzle>[0];

export async function getDb() {
  // Keep the Cloudflare-only module specifier out of native Next.js bundling.
  // Sites supplies this module at runtime; Vercel uses the explicit preview
  // store in the requests route until a durable database is connected there.
  const importRuntimeModule = new Function(
    "specifier",
    "return import(specifier)",
  ) as (specifier: string) => Promise<{ env: { DB?: D1Binding } }>;
  const { env } = await importRuntimeModule("cloudflare:workers");
  if (!env.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}
