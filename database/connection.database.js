import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

export const db = new Pool({
    allowExitOnIdle: true,
    connectionString,
    ssl: {
        rejectUnauthorized: false, // Ignora la verificación del certificado (solo para desarrollo)
    },
});

// Prueba la conexión a la base de datos
try {
    await db.query('SELECT NOW()');
    console.log('Conexión exitosa');
} catch (error) {
    console.log('Error al conectar a la base de datos:', error);
}