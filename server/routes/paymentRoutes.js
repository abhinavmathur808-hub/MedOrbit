import express from "express";
import { checkout, paymentVerification, getKey } from "../controllers/paymentController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

router.get("/getkey", getKey);

router.post("/checkout", authMiddleware, checkout);

router.post("/paymentVerification", authMiddleware, paymentVerification);

export default router;
