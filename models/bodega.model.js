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
            json_agg(json_build_object('talla', talla, 'bodega', bodega, 'tienda1', tienda1,'tienda2', tienda2)) AS tallas_disponibles
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

export const BodegaModel = {
    create,
    getZapatosPorTipo
}