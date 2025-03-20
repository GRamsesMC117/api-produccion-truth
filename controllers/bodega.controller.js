import { v4 as uuidv4 } from "uuid";
import { bucket } from "../firebase.config.js";
import { BodegaModel } from "../models/bodega.model.js";


// /api/v1/bodega/create-zapatos
const createZapatos = async (req, res) => {
    try {
        // Obtener el archivo (imagen)
        const file = req.file;
        if (!file) {
            return res.status(400).json({ ok: false, msg: "Se requiere una imagen para el zapato" });
        }

        // 🚨 Asegurar que req.body.zapatos existe y convertirlo en JSON
        if (!req.body.zapatos) {
            return res.status(400).json({ ok: false, msg: "Datos de zapatos no recibidos" });
        }

        const zapatos = JSON.parse(req.body.zapatos);

        // Validar que los datos estén completos
        for (const zapato of zapatos) {
            if (!zapato.codigo || !zapato.tipo || !zapato.marca || !zapato.modelo ||
                !zapato.material || !zapato.color || !zapato.talla || !zapato.bodega ||
                !zapato.tienda1 || !zapato.tienda2 || !zapato.precio) {
                return res.status(400).json({ ok: false, msg: "Todos los campos son obligatorios" });
            }
        }

        // Subir imagen a Firebase Storage
        const uniqueFileName = `images/${uuidv4()}_${file.originalname}`;
        const blob = bucket.file(uniqueFileName);
        const blobStream = blob.createWriteStream({
            metadata: { contentType: file.mimetype },
        });

        blobStream.on("error", (err) => {
            console.error(err);
            return res.status(500).json({ ok: false, msg: "Error al subir la imagen" });
        });

        blobStream.on("finish", async () => {
            await blob.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

            // Insertar todos los zapatos en la base de datos
            const nuevosZapatos = [];
            for (const zapato of zapatos) {
                const nuevoZapato = await BodegaModel.create({
                    ...zapato,
                    imagen: publicUrl,
                });
                nuevosZapatos.push(nuevoZapato);
            }

            return res.status(201).json({
                ok: true,
                msg: "Zapatos registrados exitosamente",
                data: nuevosZapatos,
            });
        });

        blobStream.end(file.buffer);

    } catch (error) {
        console.error(error);
        return res.status(500).json({ ok: false, msg: "Error interno del servidor" });
    }
};

export const BodegaController = {
    createZapatos
}