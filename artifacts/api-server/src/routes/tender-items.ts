import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, tenderItemsTable, priceItemsTable, priceListsTable } from "@workspace/db";
import { UpdateTenderItemParams, UpdateTenderItemBody } from "@workspace/api-zod";

const router: IRouter = Router();

router.patch("/tender-items/:id", async (req, res): Promise<void> => {
  const params = UpdateTenderItemParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTenderItemBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(tenderItemsTable)
    .where(eq(tenderItemsTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "İhale kalemi bulunamadı" });
    return;
  }

  const { unitPrice, matchedPriceItemId } = parsed.data;

  let update: Partial<typeof tenderItemsTable.$inferInsert> = {
    matchStatus: "manual",
  };

  if (matchedPriceItemId !== undefined && matchedPriceItemId !== null) {
    const [priceItem] = await db
      .select({
        priceItem: priceItemsTable,
        sourceName: priceListsTable.name,
      })
      .from(priceItemsTable)
      .innerJoin(
        priceListsTable,
        eq(priceItemsTable.priceListId, priceListsTable.id),
      )
      .where(eq(priceItemsTable.id, matchedPriceItemId));

    if (!priceItem) {
      res.status(400).json({ error: "Seçilen poz kalemi bulunamadı" });
      return;
    }

    update = {
      ...update,
      matchedPriceItemId: priceItem.priceItem.id,
      matchedPozNo: priceItem.priceItem.pozNo,
      matchedDescription: priceItem.priceItem.description,
      matchedSourceName: priceItem.sourceName,
      unitPrice: priceItem.priceItem.unitPrice,
      totalPrice: priceItem.priceItem.unitPrice * existing.quantity,
      matchScore: 1,
    };
  } else if (unitPrice !== undefined) {
    update = {
      ...update,
      unitPrice,
      totalPrice: unitPrice != null ? unitPrice * existing.quantity : null,
    };

    if (unitPrice == null) {
      update.matchedPriceItemId = null;
      update.matchedPozNo = null;
      update.matchedDescription = null;
      update.matchedSourceName = null;
      update.matchScore = null;
    }
  }

  const [row] = await db
    .update(tenderItemsTable)
    .set(update)
    .where(eq(tenderItemsTable.id, params.data.id))
    .returning();

  res.json(row);
});

export default router;
