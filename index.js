import 'dotenv/config';
import express from 'express';
import cors from 'cors'; // 🔴 Importar CORS

import usuarioRouter from './routes/usuario.route.js';
import bodegaRouter from './routes/bodega.route.js'

const app = express();

// 🔴 Configurar CORS antes de las rutas
app.use(
    cors({
        origin: "http://localhost:5173", // Permitir frontend en desarrollo
        methods: "GET, POST, PUT, DELETE, OPTIONS",
        allowedHeaders: "Content-Type, Authorization",
        credentials: true, // Permitir cookies si las usas
    })
);

// Middleware para responder a preflight requests
app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/v1/usuarios', usuarioRouter);
app.use('/api/v1/bodega', bodegaRouter);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}/`);
});
