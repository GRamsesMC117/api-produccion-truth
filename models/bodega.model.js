import {db} from '../database/connection.database.js';

// FUNCION PARA AGREGAR ZAPATOS
const create = async ({ codigo, tipo, marca, modelo, material, color, talla, bodega, tienda1, tienda2, precio, imagen }) => {
    const query = {
        text: `
        INSERT INTO bodega (codigo, tipo, marca, modelo, material, color, talla, bodega, tienda1, tienda2, precio, imagen )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING codigo, tipo, marca, modelo, material, color, talla, imagen
        `,
        values: [codigo, tipo, marca, modelo, material, color, talla, bodega, tienda1, tienda2, precio, imagen]
    }
    const { rows } = await db.query(query);
    return rows[0];
}

// FUNCION PARA OBTENER ZAPATOS POR TIPO
const getZapatosPorTipo = async (tipo) => {
    const query = {
        text: `
        SELECT 
            marca,
            modelo,
            material,
            color,
            imagen,
            json_agg(
                json_build_object(
                    'talla', talla, 
                    'bodega', bodega, 
                    'tienda1', CASE WHEN tienda1 >= 1 THEN tienda1 ELSE NULL END, 
                    'tienda2', CASE WHEN tienda2 >= 1 THEN tienda2 ELSE NULL END
                )
            ) AS tallas_disponibles
        FROM BODEGA
        WHERE tipo = $1
        GROUP BY marca, modelo, material, color, imagen
        ORDER BY marca, modelo, material, color, imagen;
        `,
        values: [tipo]
    };

    try {
        const { rows } = await db.query(query);
        return rows;
    } catch (error) {
        console.error('Error en getZapatosPorTipo:', error);
        throw error;
    }
};

// FUNCION PARA OBTENER ZAPATOS POR MEDIO DE UNA BUSQUEDA CON UNA FUNCION ALMACENDAD
const getZapatosBySearch = async ({marca, modelo, material, color}) => {
    const query = {
        text: `
        SELECT * FROM buscar_bodega($1, $2, $3, $4)
        `,
        values: [marca, modelo, material, color]
    }
    try {
        const {rows} = await db.query(query);
        return rows;
    } catch (error) {
        console.error('Error en getZapatosBySearch:', error)
        throw error
    }
}

// FUNCION PARA BUSCAR UN ZAPATO POR SU CID
const findByCID = async (cid) => {
    const query = {
        text: `SELECT 
        cid, tipo, marca, modelo, material, color, talla, bodega, tienda1, tienda2, precio
        FROM BODEGA 
        WHERE CID = $1`,
        values: [cid],
    };

    try {
        const { rows } = await db.query(query);
        return rows[0];
    }
    catch (error) {
        console.error("Error en findByCID:", error);
        throw error;
    }
}

// FUNCION PARA ACTUALIZAR UN ZAPATO POR SU CID
const updateZapatoByCID = async (cid, updates) => {
    const fields = [];
    const values = [];
    let index = 1;

    // Recorrer los campos a actualizar
    for (const key in updates) {
        if (updates[key] !== undefined && updates[key] !== null) {
            fields.push(`${key} = $${index}`);
            values.push(updates[key]);
            index++;
        }
    }

    // Si no hay campos a actualizar, no ejecutar la consulta
    if (fields.length === 0) {
        throw new Error("No hay datos para actualizar");
    }

    values.push(cid); // Agregar el CID al final para el WHERE

    const query = {
        text: `UPDATE BODEGA SET ${fields.join(", ")} WHERE CID = $${index} RETURNING *`,
        values,
    };

    try {
        const { rows } = await db.query(query);
        return rows[0]; // Devolver el zapato actualizado
    } catch (error) {
        console.error("Error en updateZapatoByCID:", error);
        throw error;
    }
};

export const BodegaModel = {
    create,
    getZapatosPorTipo,
    getZapatosBySearch,
    findByCID,
    updateZapatoByCID
}