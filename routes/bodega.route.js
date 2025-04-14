import { Router } from "express";
import multer from 'multer';
import { BodegaController } from "../controllers/bodega.controller.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/create-zapatos', upload.single('file') ,BodegaController.createZapatos);

router.post('/zapatos-por-tipo', BodegaController.getZapatosPorTipo);

router.post('/get-zapato-by-funcion', BodegaController.getZapatosBySearch);

router.post('/getZapatoCID', BodegaController.getZapatoCID);

router.post('/generar-etiqueta', BodegaController.generarEtiqueta);

export default router;