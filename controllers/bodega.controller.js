import { v4 as uuidv4 } from "uuid";
import { bucket } from "../firebase.config.js";
import axios from "axios";
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

// /api/v1/bodega/get-zapato-by-funcion
const getZapatosBySearch = async (req, res) => {
    try {
        const { marca, modelo, material, color } = req.body;

        // Verificamos que estamos recibiendo
        console.log('Datos recibidos:', req.body);

        // Validar si al menos uno de los parametros tiene valor
        if (!(marca || modelo || material || color)) {
            return res.status(400).json({
                ok: false,
                msg: "Se requiere al menos un parametro de busqueda"
            });
        }

        const zapatos = await BodegaModel.getZapatosBySearch({ marca, modelo, material, color });

        return res.status(200).json({
            ok: true,
            data: zapatos,
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({
            ok: false,
            msg: "Error interno del servidor"
        });
    }
};

// /api/v1/bodega/generar-etiqueta/
const generarEtiqueta = async (req, res) => {
    try {
        const { cid } = req.body;

        // Validar que el CID sea un número válido
        if (!cid || isNaN(cid)) {
            return res.status(400).json({ ok: false, msg: "CID inválido o no proporcionado" });
        }

        // Buscar el zapato por su CID
        const zapato = await BodegaModel.findByCID(cid);

        // Verificar si el zapato existe
        if (!zapato) {
            return res.status(404).json({ ok: false, msg: "Zapato no encontrado" });
        }

        // Generar el código ZPL
        const zpl = `
            ^XA
            ^FO30,80^A0N,80,80^FD${zapato.marca}^FS
            ^FO50,190^A0N,90,90^FDModelo: ${zapato.modelo}^FS
            ^FO50,300^A0N,90,90^FD${zapato.material} ${zapato.color}^FS
            ^FO550,50^A0N,100,100^FD${zapato.talla}^FS
            ^FO30,420^A0N,60,60^FD${zapato.tipo}^FS
            ^FO200,500^BCN,100,Y,N,N^FD${zapato.codigo}^FS

            ^FO30,650^A0N,80,80^FD${zapato.marca}^FS
            ^FO50,750^A0N,90,90^FDModelo: ${zapato.modelo}^FS
            ^FO50,850^A0N,90,90^FD${zapato.material} ${zapato.color}^FS
            ^FO550,650^A0N,100,100^FD${zapato.talla}^FS
            ^FO30,950^A0N,60,60^FD${zapato.tipo}^FS
            ^FO200,1050^BCN,100,Y,N,N^FD${zapato.codigo}^FS
            ^XZ
        `;

        // Enviar el código ZPL a Labelary para obtener la imagen de la etiqueta
        const response = await axios.post(
            'http://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/',
            zpl,
            {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                responseType: 'arraybuffer',
            }
        );

        // Configurar las cabeceras para devolver la imagen
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'inline; filename=etiqueta.png');

        // Enviar la imagen como respuesta
        res.send(response.data);

    } catch (error) {
        console.error("Error al generar la etiqueta:", error);
        return res.status(500).json({ ok: false, msg: "Error interno del servidor" });
    }
};

// /api/v1/bodega/getZapato-CID/
const getZapatoCID = async (req, res) => {
    try {
        const { cid } = req.body;

        // Validar que el CID sea un número válido
        if (!cid || isNaN(cid)) {
            return res.status(400).json({ ok: false, msg: "CID inválido o no proporcionado" });
        }

        // Buscar el zapato por su CID
        const zapato = await BodegaModel.findByCID(cid);

        // Verificar si el zapato existe
        if (!zapato) {
            return res.status(404).json({ ok: false, msg: "Zapato no encontrado" });
        }

        // Enviar zapato como respuesta
        return res.status(200).json({ ok: true, data: zapato });

    } catch (error) {
        console.error("Error al obtener zapato:", error);
        return res.status(500).json({ ok: false, msg: "Error del servidor" });
    }
};

export const BodegaController = {
    createZapatos,
    getZapatosPorTipo,
    getZapatosBySearch,
    generarEtiqueta,
    getZapatoCID
}