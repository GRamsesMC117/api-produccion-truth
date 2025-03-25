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

// /api/v1/bodega/zapatos-filtrados
const getZapatosPorTipo = async (req, res) => {
    try {
        const { tipo } = req.body;

        if (!tipo) {
            return res.status(400).json({ ok: false, msg: "El tipo de zapato es obligatorio" });
        }

        const zapatos = await BodegaModel.getZapatosPorTipo(tipo);

        return res.status(200).json({
            ok: true,
            data: zapatos,
        });

    } catch (error) {
        console.error("Error en getZapatosPorTipo:", error);
        return res.status(500).json({ ok: false, msg: "Error interno del servidor" });
    }
};

// /api/v1/bodega/zapato-filtro
const getZapatoFiltroController = async (req, res) => {
    try {
        // Extraer filtros desde query params
        const { marca, modelo, material, color, talla } = req.query;

        // Construir objeto de filtros (solo los que tienen valor)
        const filtros = {};
        if (marca) filtros.marca = marca;
        if (modelo) filtros.modelo = modelo;
        if (material) filtros.material = material;
        if (color) filtros.color = color;
        if (talla) filtros.talla = talla;

        // Obtener los zapatos filtrados desde el modelo
        const zapatos = await getZapatoFiltro(filtros);

        // Responder con los datos obtenidos
        return res.status(200).json({
            ok: true,
            msg: zapatos.length ? 'Zapatos encontrados' : 'No se encontraron zapatos',
            data: zapatos
        });

    } catch (error) {
        console.error('Error en getZapatoFiltroController:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error en el servidor'
        });
    }
};


export const BodegaController = {
    createZapatos,
    getZapatosPorTipo,
    getZapatoFiltroController
}