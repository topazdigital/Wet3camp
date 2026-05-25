import { Router, type IRouter } from "express";
import healthRouter    from "./health.js";
import escortsRouter   from "./escorts.js";
import authRouter      from "./auth.js";
import messagesRouter  from "./messages.js";
import bookingsRouter  from "./bookings.js";
import favoritesRouter from "./favorites.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(escortsRouter);
router.use(authRouter);
router.use(messagesRouter);
router.use(bookingsRouter);
router.use(favoritesRouter);

export default router;
