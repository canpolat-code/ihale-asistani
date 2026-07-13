import {
  integer,
  numeric,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { priceItemsTable } from "./price-items";
import { tenderProjectsTable } from "./tender-projects";

export const matchStatusEnum = pgEnum("match_status", [
  "matched",
  "fuzzy",
  "unmatched",
  "manual",
]);

// A single line item ("poz") from a tender's bill-of-quantities
// ("Birim Fiyat Teklif Cetveli"), enriched with a matched unit price once
// the matching algorithm (or a manual override) has run.
export const tenderItemsTable = pgTable("tender_items", {
  id: serial("id").primaryKey(),
  tenderProjectId: integer("tender_project_id")
    .notNull()
    .references(() => tenderProjectsTable.id, { onDelete: "cascade" }),
  rowOrder: integer("row_order").notNull(),
  pozNo: text("poz_no").notNull(),
  description: text("description").notNull(),
  unit: text("unit"),
  quantity: numeric("quantity", { mode: "number" }).notNull(),
  unitPrice: numeric("unit_price", { mode: "number" }),
  totalPrice: numeric("total_price", { mode: "number" }),
  matchStatus: matchStatusEnum("match_status").notNull().default("unmatched"),
  matchScore: numeric("match_score", { mode: "number" }),
  matchedPriceItemId: integer("matched_price_item_id").references(
    () => priceItemsTable.id,
    { onDelete: "set null" },
  ),
  matchedPozNo: text("matched_poz_no"),
  matchedDescription: text("matched_description"),
  matchedSourceName: text("matched_source_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertTenderItemSchema = createInsertSchema(
  tenderItemsTable,
).omit({
  id: true,
  createdAt: true,
});
export type InsertTenderItem = z.infer<typeof insertTenderItemSchema>;
export type TenderItemRow = typeof tenderItemsTable.$inferSelect;
