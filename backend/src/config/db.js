/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Database Configuration & Connection Pool: backend/src/config/db.js
 * 
 * Creates a resilient MySQL connection pool using mysql2/promise.
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

// Create the connection pool (supports local MySQL or cloud connection string)
const pool = connectionUri
  ? mysql.createPool(connectionUri)
  : mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'astronaut_health_db',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      connectTimeout: 4000,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
    });

// Helper function to test database connectivity
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    const dbName = process.env.DB_NAME || 'astronaut_health_db';
    console.log(`[DB] Successfully connected to MySQL database: ${dbName}`);
    connection.release();
    return true;
  } catch (error) {
    console.warn(`[DB WARNING] Could not connect to MySQL: ${error.message}`);
    console.warn('[DB WARNING] Spacecraft running in autonomous simulation mode.');
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
