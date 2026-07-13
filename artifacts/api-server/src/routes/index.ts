import { Router, type IRouter } from "express";
import healthRouter from "./health";
import priceListsRouter from "./price-lists";
import priceItemsRouter from "./price-items";
import tenderProjectsRouter from "./tender-projects";
import tenderItemsRouter from "./tender-items";

const router: IRouter = Router();

router.use(healthRouter);
router.use(priceListsRouter);
router.use(priceItemsRouter);
router.use(tenderProjectsRouter);
router.use(tenderItemsRouter);

export default router;
