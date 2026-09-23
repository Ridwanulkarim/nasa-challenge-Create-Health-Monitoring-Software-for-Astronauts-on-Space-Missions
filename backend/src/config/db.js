/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Resilient Database & Autonomous Fallback Layer: backend/src/config/db.js
 * 
 * Automatically failsofts to the in-memory autonomous telemetry engine
 * if MySQL connection is refused (ECONNREFUSED) or running in cloud serverless.
 */

const mysql = require('mysql2/promise');
const path = require('path');
const inMemoryStore = require('../services/inMemoryStore');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const connectionUri = process.env.DATABASE_URL || process.env.MYSQL_URL;

let rawPool = null;
let isDbAvailable = false;

try {
  rawPool = connectionUri
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
        connectTimeout: 2000,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
      });
} catch (e) {
  console.warn('[DB WARNING] Could not create raw pool:', e.message);
}

// Transparent Pool Proxy with Autonomous Deep-Space Failover
const pool = {
  async query(sql, params = []) {
    if (isDbAvailable && rawPool) {
      try {
        return await rawPool.query(sql, params);
      } catch (err) {
        if (
          err.code === 'ECONNREFUSED' ||
          err.code === 'ETIMEDOUT' ||
          err.code === 'ER_ACCESS_DENIED_ERROR' ||
          (err.message && err.message.includes('ECONNREFUSED'))
        ) {
          isDbAvailable = false;
          console.warn(`[DB FAILOVER] ${err.code || err.message} -> Switched to Autonomous In-Memory Engine.`);
          return inMemoryStore.query(sql, params);
        }
        throw err;
      }
    }
    // Autonomous Mode
    return inMemoryStore.query(sql, params);
  },

  async execute(sql, params = []) {
    return this.query(sql, params);
  },

  async getConnection() {
    if (isDbAvailable && rawPool) {
      try {
        return await rawPool.getConnection();
      } catch (err) {
        isDbAvailable = false;
        console.warn(`[DB FAILOVER] ${err.code || err.message} -> Switched to Autonomous Connection Engine.`);
        return inMemoryStore.getConnection();
      }
    }
    return inMemoryStore.getConnection();
  }
};

// Helper function to test database connectivity on boot
async function testConnection() {
  if (!rawPool) {
    isDbAvailable = false;
    console.log('[DB] Spacecraft running in autonomous simulation mode.');
    return false;
  }

  try {
    const connection = await rawPool.getConnection();
    const dbName = process.env.DB_NAME || 'astronaut_health_db';
    console.log(`[DB] Successfully connected to MySQL database: ${dbName}`);
    connection.release();
    isDbAvailable = true;
    return true;
  } catch (error) {
    isDbAvailable = false;
    console.log(`[DB] MySQL offline (${error.code || error.message}) -> Autonomous Deep-Space Simulation Active.`);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  inMemoryStore
};
