import { Router, type IRouter } from "express";
import { and, eq, ilike, or, desc } from "drizzle-orm";
import { db, priceItemsTable } from "@workspace/db";
import {
  ListPriceItemsQueryParams,
  CreatePriceItemBody,
  UpdatePriceItemParams,
  UpdatePriceItemBody,
  DeletePriceItemParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/price-items", async (req, res): Promise<void> => {
  const query = ListPriceItemsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { priceListId, q, limit } = query.data;

  const conditions = [];
  if (priceListId !== undefined) {
    conditions.push(eq(priceItemsTable.priceListId, priceListId));
  }
  if (q) {
    const pattern = `%${q}%`;
    conditions.push(
      or(
        ilike(priceItemsTable.pozNo, pattern),
        ilike(priceItemsTable.description, pattern),
      ),
    );
  }

  const rows = await db
    .select()
    .from(priceItemsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(priceItemsTable.createdAt))
    .limit(limit);

  res.json(rows);
});

router.post("/price-items", async (req, res): Promise<void> => {
  const parsed = CreatePriceItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(priceItemsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(row);
});

router.patch("/price-items/:id", async (req, res): Promise<void> => {
  const params = UpdatePriceItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePriceItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .update(priceItemsTable)
    .set(parsed.data)
    .where(eq(priceItemsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Poz kalemi bulunamadı" });
    return;
  }

  res.json(row);
});

router.delete("/price-items/:id", async (req, res): Promise<void> => {
  const params = DeletePriceItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(priceItemsTable)
    .where(eq(priceItemsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Poz kalemi bulunamadı" });
    return;
  }

  res.sendStatus(204);
});

export default router;
