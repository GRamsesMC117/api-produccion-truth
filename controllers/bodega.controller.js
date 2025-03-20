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

        // Extraer los datos del zapato desde form-data
        const { codigo, tipo, marca, modelo, material, color, talla, bodega, tienda1, tienda2, precio} = req.body;

        // Validar que todos los campos obligatorios están presentes
        if (!codigo || !tipo || !marca || !modelo || !material || !color || !talla || !bodega || !tienda1 || !tienda2 || !precio) {
            return res.status(400).json({ ok: false, msg: "Todos los campos son obligatorios" });
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

            // Guardar zapato en la base de datos
            const nuevoZapato = await BodegaModel.create({
                codigo, tipo, marca, modelo, material, color, talla, bodega, tienda1, tienda2, precio, imagen: publicUrl
            });

            return res.status(201).json({
                ok: true,
                msg: "Zapato registrado exitosamente",
                data: nuevoZapato,
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