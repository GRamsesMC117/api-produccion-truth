import validator from 'validator';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { UsuarioModel } from '../models/usuario.model.js';

// /api/v1/usuarios/register
const register = async (req, res) => {
    try {
        // Sanitizacion de datos
        let { nombre, apellido, username, password } = req.body;
        nombre = validator.trim(validator.escape(nombre));
        apellido = validator.trim(validator.escape(apellido));
        username = validator.trim(validator.escape(username));

        // Validación de nombre y apellido: Alfabéticos, espacios permitidos en medio, y longitud entre 2 y 50 caracteres
        const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑ]+(?:\s[a-zA-ZáéíóúÁÉÍÓÚñÑ]+)*$/;
        if (!nameRegex.test(nombre.trim()) || !nameRegex.test(apellido.trim())) {
            return res.status(400).json({
                ok: false,
                msg: 'Nombre y apellido deben contener solo letras y espacios, y tener entre 2 y 50 caracteres.'
            });
        }

        // Validación de username: Sin espacios ni caracteres especiales
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                ok: false,
                msg: 'El username solo puede contener letras, números y guiones bajos, sin espacios ni caracteres especiales.'
            });
        }

        // Validación de password: Longitud mínima de 8 caracteres, combinación de mayúsculas, minúsculas y números
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                ok: false,
                msg: 'La contraseña debe tener al menos 8 caracteres, incluir mayúsculas, minúsculas y números.'
            });
        }

        // Verificación de usuario existente
        const user = await UsuarioModel.findOneByUsername(username);
        if (user) {
            return res.status(409).json({
                ok: false,
                msg: 'El usuario ya está registrado.'
            });
        }

        // Encriptación de la contraseña
        const salt = await bcryptjs.genSalt(10);
        const hashedPassword = await bcryptjs.hash(password, salt);

        // Creación de nuevo usuario
        const newUser = await UsuarioModel.create({ nombre, apellido, username, password: hashedPassword });

        const token = jwt.sign({
            username: newUser.username,
            role_id: newUser.role_id
        },
            process.env.JWT_SECRET,
            {
                expiresIn: '7d'
            }
        );

        // Respuesta exitosa
        return res.status(201).json({
            ok: true,
            msg: token,
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

// api/v1/usuarios/login
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validar campos requeridos
        if (!username || !password) {
            return res.status(400).json({
                ok: false,
                msg: 'Username y password son obligatorios.'
            });
        }

        // Validar formato de username
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username)) {
            return res.status(400).json({
                ok: false,
                msg: 'El username solo puede contener letras, números y guiones bajos.'
            });
        }

        // Sanitizar datos
        const sanitizedUsername = username.trim();

        // Buscar usuario en la base de datos
        const user = await UsuarioModel.findOneByUsername(sanitizedUsername);
        if (!user) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario o contraseña incorrectos.'
            });
        }

        // Verificar contraseña
        const isMatch = await bcryptjs.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                ok: false,
                msg: 'Usuario o contraseña incorrectos.'
            });
        }

        // Generar token JWT
        const token = jwt.sign(
            { id: user.id, username: user.username, role_id: user.role_id },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        return res.status(200).json({
            ok: true,
            msg: 'Inicio de sesión exitoso.',
            token
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor'
        });
    }
};

// /api/v1/usuarios/get-all
const getAllUsers = async (req, res) => {
    try {
        const users = await UsuarioModel.getAllUsers();

        return res.status(200).json({
            ok: true,
            users
        });
    } catch (error) {
        console.error("Error en getAllUsers:", error);

        return res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor.'
        });
    }
};

// /api/v1/usuarios/assign-role
const assignRoleUser = async (req, res) => {
    try {
        const { role_id, uid } = req.body;

        // Validar campos requeridos
        if (!role_id || !uid) {
            return res.status(400).json({
                ok: false,
                msg: 'role_id y uid son obligatorios.'
            });
        }

        // Buscar usuario por UID
        const user = await UsuarioModel.findOneByUid(uid);
        if (!user) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado.'
            });
        }

        // Asignar rol al usuario
        const updatedUser = await UsuarioModel.assignRole({ role_id, uid });

        // Enviar respuesta exitosa
        return res.status(200).json({
            ok: true,
            msg: 'Rol asignado correctamente.',
            user: updatedUser
        });

    } catch (error) {
        console.error("Error en assignRoleUser:", error);

        // Enviar error interno del servidor
        return res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor.'
        });
    }
};

// /api/v1/usuarios/delete-user
const deleteUser = async (req, res) => {
    try {
        const { uid } = req.body;

        // Validar si se proporciona el `uid`
        if (!uid) {
            return res.status(400).json({
                ok: false,
                msg: 'El uid es obligatorio.',
            });
        }

        // Intenta eliminar al usuario
        const deletedUser = await UsuarioModel.deleteUser(uid);

        // Verifica si el usuario fue encontrado y eliminado
        if (!deletedUser) {
            return res.status(404).json({
                ok: false,
                msg: 'Usuario no encontrado.',
            });
        }

        // Si se elimina, responde con éxito
        return res.status(200).json({
            ok: true,
            msg: `Usuario con UID ${uid} eliminado correctamente.`,
            user: deletedUser, // Opcional: incluye datos del usuario eliminado
        });
    } catch (error) {
        console.error('Error en deleteUser:', error);
        return res.status(500).json({
            ok: false,
            msg: 'Error interno del servidor.',
        });
    }
};

export const UsuarioController = {
    register,
    login,
    getAllUsers,
    assignRoleUser,
    deleteUser
}