import {
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

import { priceListsTable } from "./price-lists";

// A single "poz" (item code) + unit price entry belonging to a price list.
export const priceItemsTable = pgTable("price_items", {
  id: serial("id").primaryKey(),
  priceListId: integer("price_list_id")
    .notNull()
    .references(() => priceListsTable.id, { onDelete: "cascade" }),
  pozNo: text("poz_no").notNull(),
  description: text("description").notNull(),
  unit: text("unit"),
  unitPrice: numeric("unit_price", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertPriceItemSchema = createInsertSchema(priceItemsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPriceItem = z.infer<typeof insertPriceItemSchema>;
export type PriceItemRow = typeof priceItemsTable.$inferSelect;
