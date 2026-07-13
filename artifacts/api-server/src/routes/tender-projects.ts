import { Router, type IRouter } from "express";
import { eq, sql, inArray } from "drizzle-orm";
import {
  db,
  tenderProjectsTable,
  tenderItemsTable,
  priceItemsTable,
  priceListsTable,
} from "@workspace/db";
import {
  CreateTenderProjectBody,
  GetTenderProjectParams,
  DeleteTenderProjectParams,
  ListTenderItemsParams,
  UploadTenderFileParams,
  MatchTenderProjectParams,
  MatchTenderProjectBody,
} from "@workspace/api-zod";
import { upload } from "../lib/upload";
import { parseTenderExcel } from "../lib/parse-tender";
import { buildTenderExportWorkbook } from "../lib/export-tender";
import { matchItem, type MatchCandidate } from "../lib/matching";

const router: IRouter = Router();

type TenderProjectRow = typeof tenderProjectsTable.$inferSelect;

async function withStats(rows: TenderProjectRow[]) {
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const items = await db
    .select({
      tenderProjectId: tenderItemsTable.tenderProjectId,
      matchStatus: tenderItemsTable.matchStatus,
      totalPrice: tenderItemsTable.totalPrice,
    })
    .from(tenderItemsTable)
    .where(inArray(tenderItemsTable.tenderProjectId, ids));

  const statsByProject = new Map<
    number,
    {
      itemCount: number;
      matchedCount: number;
      fuzzyCount: number;
      unmatchedCount: number;
      totalAmount: number | null;
    }
  >();

  for (const item of items) {
    const stats = statsByProject.get(item.tenderProjectId) ?? {
      itemCount: 0,
      matchedCount: 0,
      fuzzyCount: 0,
      unmatchedCount: 0,
      totalAmount: null,
    };

    stats.itemCount++;
    if (item.matchStatus === "matched" || item.matchStatus === "manual") {
      stats.matchedCount++;
    } else if (item.matchStatus === "fuzzy") {
      stats.fuzzyCount++;
    } else {
      stats.unmatchedCount++;
    }

    if (item.totalPrice != null) {
      stats.totalAmount = (stats.totalAmount ?? 0) + item.totalPrice;
    }

    statsByProject.set(item.tenderProjectId, stats);
  }

  return rows.map((row) => {
    const stats = statsByProject.get(row.id) ?? {
      itemCount: 0,
      matchedCount: 0,
      fuzzyCount: 0,
      unmatchedCount: 0,
      totalAmount: null,
    };
    return { ...row, ...stats };
  });
}

router.get("/tender-projects", async (_req, res): Promise<void> => {
  const rows = await db
    .select()
    .from(tenderProjectsTable)
    .orderBy(tenderProjectsTable.createdAt);

  res.json(await withStats(rows));
});

router.post("/tender-projects", async (req, res): Promise<void> => {
  const parsed = CreateTenderProjectBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [row] = await db
    .insert(tenderProjectsTable)
    .values(parsed.data)
    .returning();

  const [withStat] = await withStats([row]);
  res.status(201).json(withStat);
});

router.get("/tender-projects/:id", async (req, res): Promise<void> => {
  const params = GetTenderProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .select()
    .from(tenderProjectsTable)
    .where(eq(tenderProjectsTable.id, params.data.id));

  if (!row) {
    res.status(404).json({ error: "İhale projesi bulunamadı" });
    return;
  }

  const [withStat] = await withStats([row]);
  res.json(withStat);
});

router.delete("/tender-projects/:id", async (req, res): Promise<void> => {
  const params = DeleteTenderProjectParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [row] = await db
    .delete(tenderProjectsTable)
    .where(eq(tenderProjectsTable.id, params.data.id))
    .returning();

  if (!row) {
    res.status(404).json({ error: "İhale projesi bulunamadı" });
    return;
  }

  res.sendStatus(204);
});

router.get("/tender-projects/:id/items", async (req, res): Promise<void> => {
  const params = ListTenderItemsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [project] = await db
    .select()
    .from(tenderProjectsTable)
    .where(eq(tenderProjectsTable.id, params.data.id));

  if (!project) {
    res.status(404).json({ error: "İhale projesi bulunamadı" });
    return;
  }

  const rows = await db
    .select()
    .from(tenderItemsTable)
    .where(eq(tenderItemsTable.tenderProjectId, params.data.id))
    .orderBy(tenderItemsTable.rowOrder);

  res.json(rows);
});

router.post(
  "/tender-projects/:id/upload",
  upload.single("file"),
  async (req, res): Promise<void> => {
    const params = UploadTenderFileParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [project] = await db
      .select()
      .from(tenderProjectsTable)
      .where(eq(tenderProjectsTable.id, params.data.id));

    if (!project) {
      res.status(404).json({ error: "İhale projesi bulunamadı" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ error: "Dosya yüklenmedi" });
      return;
    }

    let parseResult;
    try {
      parseResult = parseTenderExcel(file.buffer);
    } catch (err) {
      req.log.error({ err }, "Failed to parse tender upload");
      res.status(400).json({ error: "Dosya ayrıştırılamadı" });
      return;
    }

    await db
      .delete(tenderItemsTable)
      .where(eq(tenderItemsTable.tenderProjectId, params.data.id));

    let items: (typeof tenderItemsTable.$inferSelect)[] = [];
    if (parseResult.rows.length > 0) {
      items = await db
        .insert(tenderItemsTable)
        .values(
          parseResult.rows.map((row) => ({
            tenderProjectId: params.data.id,
            rowOrder: row.rowOrder,
            pozNo: row.pozNo,
            description: row.description,
            unit: row.unit,
            quantity: row.quantity,
          })),
        )
        .returning();
    }

    const [updatedProject] = await db
      .update(tenderProjectsTable)
      .set({ fileName: file.originalname })
      .where(eq(tenderProjectsTable.id, params.data.id))
      .returning();

    const [withStat] = await withStats([updatedProject]);

    res.json({
      project: withStat,
      items: items.sort((a, b) => a.rowOrder - b.rowOrder),
      warnings: parseResult.warnings,
    });
  },
);

router.post(
  "/tender-projects/:id/match",
  async (req, res): Promise<void> => {
    const params = MatchTenderProjectParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const parsedBody = MatchTenderProjectBody.safeParse(req.body ?? {});
    if (!parsedBody.success) {
      res.status(400).json({ error: parsedBody.error.message });
      return;
    }

    const [project] = await db
      .select()
      .from(tenderProjectsTable)
      .where(eq(tenderProjectsTable.id, params.data.id));

    if (!project) {
      res.status(404).json({ error: "İhale projesi bulunamadı" });
      return;
    }

    const { priceListIds } = parsedBody.data;

    const priceItemRows = await db
      .select({
        id: priceItemsTable.id,
        priceListId: priceItemsTable.priceListId,
        pozNo: priceItemsTable.pozNo,
        description: priceItemsTable.description,
        unit: priceItemsTable.unit,
        unitPrice: priceItemsTable.unitPrice,
        sourceName: priceListsTable.name,
      })
      .from(priceItemsTable)
      .innerJoin(
        priceListsTable,
        eq(priceItemsTable.priceListId, priceListsTable.id),
      )
      .where(
        priceListIds && priceListIds.length > 0
          ? inArray(priceItemsTable.priceListId, priceListIds)
          : undefined,
      );

    const candidates: MatchCandidate[] = priceItemRows;

    const tenderItems = await db
      .select()
      .from(tenderItemsTable)
      .where(eq(tenderItemsTable.tenderProjectId, params.data.id))
      .orderBy(tenderItemsTable.rowOrder);

    const updated: (typeof tenderItemsTable.$inferSelect)[] = [];

    for (const item of tenderItems) {
      // Manual overrides are never touched by re-matching.
      if (item.matchStatus === "manual") {
        updated.push(item);
        continue;
      }

      const result = matchItem(item.pozNo, item.description, candidates);

      const unitPrice = result.candidate?.unitPrice ?? null;
      const totalPrice = unitPrice != null ? unitPrice * item.quantity : null;

      const [row] = await db
        .update(tenderItemsTable)
        .set({
          matchStatus: result.status,
          matchScore: result.score,
          matchedPriceItemId: result.candidate?.id ?? null,
          matchedPozNo: result.candidate?.pozNo ?? null,
          matchedDescription: result.candidate?.description ?? null,
          matchedSourceName: result.candidate?.sourceName ?? null,
          unitPrice,
          totalPrice,
        })
        .where(eq(tenderItemsTable.id, item.id))
        .returning();

      updated.push(row);
    }

    res.json(updated.sort((a, b) => a.rowOrder - b.rowOrder));
  },
);

router.get(
  "/tender-projects/:id/export",
  async (req, res): Promise<void> => {
    const params = GetTenderProjectParams.safeParse(req.params);
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    const [project] = await db
      .select()
      .from(tenderProjectsTable)
      .where(eq(tenderProjectsTable.id, params.data.id));

    if (!project) {
      res.status(404).json({ error: "İhale projesi bulunamadı" });
      return;
    }

    const items = await db
      .select()
      .from(tenderItemsTable)
      .where(eq(tenderItemsTable.tenderProjectId, params.data.id));

    const buffer = buildTenderExportWorkbook(project.name, items);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${project.name.replace(/[^\w\- ]+/g, "_")}.xlsx"`,
    );
    res.send(buffer);
  },
);

export default router;
