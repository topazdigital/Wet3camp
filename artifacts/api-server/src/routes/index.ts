import { Router, type IRouter } from "express";
import healthRouter    from "./health.js";
import escortsRouter   from "./escorts.js";
import authRouter      from "./auth.js";
import messagesRouter  from "./messages.js";
import bookingsRouter  from "./bookings.js";
import favoritesRouter from "./favorites.js";
import reviewsRouter   from "./reviews.js";
import adminRouter     from "./admin.js";
import profileRouter   from "./profile.js";
import sseRouter       from "./sse.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(escortsRouter);
router.use(authRouter);
router.use(messagesRouter);
router.use(bookingsRouter);
router.use(favoritesRouter);
router.use(reviewsRouter);
router.use(adminRouter);
router.use(profileRouter);
router.use(sseRouter);

export default router;
