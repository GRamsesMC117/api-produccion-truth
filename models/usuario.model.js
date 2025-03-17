import {db} from '../database/connection.database.js';

// Crear un nuevo usuario
const create = async ({nombre, apellido, username, password}) => {
    const query = {
        text: `
        INSERT INTO USUARIOS (nombre, apellido, username, password) 
        VALUES ($1, $2, $3, $4) 
        RETURNING nombre, apellido, username, uid, role_id`,
        values: [nombre, apellido, username, password]
    }

    const {rows} = await db.query(query);
    return rows[0];
};

// Asignar un rol a un usuario
const assignRole = async ({role_id, uid}) => {
    const query = {
        text: `UPDATE usuarios
        SET role_id = $1
        WHERE uid = $2
        RETURNING nombre, apellido, username, uid, role_id
        `,
        values: [role_id, uid]
    }
    const {rows} = await db.query(query);
    return rows[0];
};

// Eliminar un usuario
const deleteUser = async (uid) => {
    const query = {
        text: `DELETE FROM usuarios WHERE uid = $1 RETURNING *`,
        values: [uid],
    };

    const { rows } = await db.query(query);

    // Devuelve el usuario eliminado o `undefined` si no se encuentra
    return rows[0];
};

// Buscar un usuario por su uid
const findOneByUid = async (uid) => {
    const query = {
        text: `
        SELECT * FROM usuarios
        WHERE uid = $1
        `,
        values: [uid]
    }
    const {rows} = await db.query(query);
    return rows[0];
}

// Buscar un usuario por su username
const findOneByUsername = async (username) => {
    const query = {
        text: `
        SELECT * FROM usuarios
        WHERE username = $1
        `,
        values: [username]
    }
    const {rows} = await db.query(query);
    return rows[0];
}

const getAllUsers = async () => {
    const query = {
        text: `SELECT uid, nombre, apellido, username, role_id FROM usuarios`
    }
    const {rows} = await db.query(query);
    return rows;
}


export const UsuarioModel = {
    create,
    assignRole,
    deleteUser,
    findOneByUid,
    findOneByUsername,
    getAllUsers
}