import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    let token = req.headers.authorization;

    if (!token) {
        return res.status(401).json({
            ok: false,
            msg: 'No se proporcionó un token.'
        });
    }

    token = token.split(' ')[1];

    try {
        const { username, role_id } = jwt.verify(token, process.env.JWT_SECRET);
        req.username = username;
        req.role_id = role_id;

        //console.log("Role ID en el token:", req.role_id); // Depuración

        next();
    } catch (error) {
        console.error(error);
        return res.status(401).json({
            ok: false,
            msg: 'Token inválido.'
        });
    }
};


export const verifyAdmin = (req, res, next) => {
    //console.log("Role ID recibido en verifyAdmin:", req.role_id);

    if (req.role_id === 1) {
        return next();
    }

    return res.status(403).json({
        error: 'No autorizado solo administradores'
    });
};


export const verifyBodega = (req, res, next) => {
    if (req.role_id ===2) { 
        next();
    }

    return res.status(403).json({
        error: 'No autorizado solo bodega'
    });
};

export const verifyTienda = (req, res, next) => {
    if (req.role_id ===3) {
        next();
    }

    return res.status(403).json({
        error: 'No autorizado solo tienda'
    });
};