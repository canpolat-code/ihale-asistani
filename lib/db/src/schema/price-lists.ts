import { integer, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// A "price list" is a source of officially published unit prices (e.g. an
// annual "Serbest Birim Fiyat" list published by a Turkish public
// institution such as Çevre ve Şehircilik Bakanlığı) that tender items are
// matched against.
export const priceListsTable = pgTable("price_lists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  organization: text("organization"),
  year: integer("year"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertPriceListSchema = createInsertSchema(priceListsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertPriceList = z.infer<typeof insertPriceListSchema>;
export type PriceListRow = typeof priceListsTable.$inferSelect;
