/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Database Configuration & Connection Pool: backend/src/config/db.js
 * 
 * Creates a resilient MySQL connection pool using mysql2/promise.
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'astronaut_health_db',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create the connection pool
const pool = mysql.createPool(dbConfig);

// Helper function to test database connectivity
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(`[DB] Successfully connected to MySQL database: ${dbConfig.database}`);
    connection.release();
    return true;
  } catch (error) {
    console.warn(`[DB WARNING] Could not connect to MySQL: ${error.message}`);
    console.warn('[DB WARNING] Ensure MySQL is running and credentials in .env are correct.');
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
