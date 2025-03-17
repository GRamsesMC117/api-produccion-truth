import 'dotenv/config';
import express from 'express';

import usuarioRouter from './routes/usuario.route.js';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.use('/api/v1/usuarios', usuarioRouter);


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}/`);
});
