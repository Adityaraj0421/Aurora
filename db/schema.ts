import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const requests = sqliteTable("requests", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  reference: text("reference").notNull().unique(),
  title: text("title").notNull(),
  status: text("status").notNull().default("requested"),
  owner: text("owner").notNull().default("Aurora London team"),
  guests: text("guests").notNull().default("Aditya + Maya"),
  planJson: text("plan_json").notNull(),
  note: text("note").notNull().default(""),
  submittedAt: text("submitted_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
