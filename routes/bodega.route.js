import { Router } from "express";
import multer from 'multer';
import { BodegaController } from "../controllers/bodega.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/create-zapatos', upload.single('file') ,BodegaController.createZapatos);

export default router;