import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// A tender the user is preparing a priced bill-of-quantities (bid) for.
export const tenderProjectsTable = pgTable("tender_projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  fileName: text("file_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const insertTenderProjectSchema = createInsertSchema(
  tenderProjectsTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertTenderProject = z.infer<typeof insertTenderProjectSchema>;
export type TenderProjectRow = typeof tenderProjectsTable.$inferSelect;
