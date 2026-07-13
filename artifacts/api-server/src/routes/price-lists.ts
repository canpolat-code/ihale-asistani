import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { db, priceListsTable, priceItemsTable } from "@workspace/db";
import {
  CreatePriceListBody,
  GetPriceListParams,
  DeletePriceListParams,
  UploadPriceListFileParams,
} from "@workspace/api-zod";
import { upload } from "../lib/upload";
import { parsePriceListExcel, parsePriceListPdfText } from "../lib/parse-price-list";

const router: IRouter = Router();

async function withItemCount(rows: (typeof priceListsTable.$inferSelect)[]) {
  if (rows.length === 0) return [];

  const counts = await db
    .select({
      priceListId: priceItemsTable.priceListId,
      count: sql<number>`count(*)::int`,
    })
    .from(priceItemsTable)
    .groupBy(priceItemsTable.priceListId);

  const countByList = new Map(counts.map((c) => [c.priceListId, c.count]));

  return rows.map((row) => ({
    ...row,
    itemCount: countByList.get(row.id) ?? 0,
  }));
}

router.get("/price-lists", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(priceListsTable)
    .orderBy(priceListsTable.createdAt);

  res.json(await withItemCount(rows));
});

router.post("/price-lists", async (req, res): Promise<void> => {
  const parsed = CreatePriceListBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(priceListsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json({ ...row, itemCount: 0 });
});

router.get("/price-lists/:id", async (req, res): Promise<void> => {
  const params = GetPriceListParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(priceListsTable)
    .where(eq(priceListsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "Birim fiyat listesi bulunamadı" });
    return;
  }

  const [withCount] = await withItemCount([row]);
  res.json(withCount);
});

router.delete("/price-lists/:id", async (req, res): Promise<void> => {
  const params = DeletePriceListParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(priceListsTable)
    .where(eq(priceListsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "Birim fiyat listesi bulunamadı" });
    return;
  }

  res.sendStatus(204);
});

router.post(
  "/price-lists/:id/upload",
  upload.single("file"),
  async (req, res): Promise<void> => {
    const params = UploadPriceListFileParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [priceList] = await db
      .select()
      .from(priceListsTable)
      .where(eq(priceListsTable.id, params.data.id));

    if (!priceList) {
      res.status(404).json({ error: "Birim fiyat listesi bulunamadı" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Dosya yüklenmedi" });
      return;
    }

    let parseResult;
    const isPdf =
      file.mimetype === "application/pdf" ||
      file.originalname.toLowerCase().endsWith(".pdf");

    try {
      if (isPdf) {
        const { PDFParse } = await import("pdf-parse");
        const parser = new PDFParse({ data: file.buffer });
        const textResult = await parser.getText();
        parseResult = parsePriceListPdfText(textResult.text);
      } else {
        parseResult = parsePriceListExcel(file.buffer);
      }
    } catch (err) {
      req.log.error({ err }, "Failed to parse price list upload");
      res.status(400).json({ error: "Dosya ayrıştırılamadı" });
      return;
    }

    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const row of parseResult.rows) {
      const [existing] = await db
        .select()
        .from(priceItemsTable)
        .where(
          sql`${priceItemsTable.priceListId} = ${params.data.id} and lower(${priceItemsTable.pozNo}) = lower(${row.pozNo})`,
        );

      if (existing) {
        await db
          .update(priceItemsTable)
          .set({
            description: row.description,
            unit: row.unit,
            unitPrice: row.unitPrice,
          })
          .where(eq(priceItemsTable.id, existing.id));
        updated++;
      } else {
        await db.insert(priceItemsTable).values({
          priceListId: params.data.id,
          pozNo: row.pozNo,
          description: row.description,
          unit: row.unit,
          unitPrice: row.unitPrice,
        });
        added++;
      }
    }

    skipped = 0;

    const [withCount] = await withItemCount([priceList]);
    res.json({
      priceList: withCount,
      added,
      updated,
      skipped,
      warnings: parseResult.warnings,
    });
  },
);

export default router;
