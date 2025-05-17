import express from "express";
import { compileCode, saveCode, getCode } from "../controllers/compileController.js";
import { isAuthorized } from '../middlewares/auth.js';
const router = express.Router();
router.use(isAuthorized);

// POST /api/v1/compile - Endpoint to compile and run code
router.post("/", compileCode);

// POST /api/v1/saveCode - Endpoint to save code draft
router.post("/saveCode", saveCode);

// GET /api/v1/getCode - Endpoint to get saved code draft
router.get("/getCode", getCode);

export default router;
