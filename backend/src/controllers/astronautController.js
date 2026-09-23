/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Astronaut Controller: backend/src/controllers/astronautController.js
 */

const { pool } = require('../config/db');

/**
 * Returns current authenticated astronaut's profile and mission.
 * GET /api/astronauts/me
 */
async function getMyProfile(req, res, next) {
  try {
    if (!req.user.astronautId) {
      return res.status(400).json({
        success: false,
        error: 'Current authenticated account is not assigned to an astronaut crew profile.'
      });
    }

    const [rows] = await pool.query(`
      SELECT 
        a.astronaut_id,
        a.first_name,
        a.last_name,
        a.role_title,
        a.date_of_birth,
        m.mission_id,
        m.name AS mission_name,
        m.spacecraft,
        m.launch_date,
        m.status AS mission_status,
        DATEDIFF(CURRENT_DATE(), m.launch_date) + 1 AS current_mission_day
      FROM astronauts a
      JOIN missions m ON a.mission_id = m.mission_id
      WHERE a.astronaut_id = ?
      LIMIT 1;
    `, [req.user.astronautId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Astronaut profile not found in spacecraft telemetry registry.'
      });
    }

    res.status(200).json({
      success: true,
      astronaut: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns profile for a specific astronaut ID.
 * Astronaut ownership or Mission Control role required.
 * GET /api/astronauts/:id
 */
async function getAstronautById(req, res, next) {
  try {
    const { id } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        a.astronaut_id,
        a.first_name,
        a.last_name,
        a.role_title,
        a.date_of_birth,
        m.mission_id,
        m.name AS mission_name,
        m.spacecraft,
        m.launch_date,
        m.status AS mission_status,
        DATEDIFF(CURRENT_DATE(), m.launch_date) + 1 AS current_mission_day
      FROM astronauts a
      JOIN missions m ON a.mission_id = m.mission_id
      WHERE a.astronaut_id = ?
      LIMIT 1;
    `, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Astronaut "${id}" not found.`
      });
    }

    res.status(200).json({
      success: true,
      astronaut: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Updates current authenticated astronaut's profile and flight credentials.
 * PATCH /api/astronauts/me
 */
async function updateMyProfile(req, res, next) {
  try {
    const astronautId = req.user ? req.user.astronautId : 'AST-001';
    const { first_name, last_name, role_title } = req.body;

    if (first_name !== undefined || last_name !== undefined || role_title !== undefined) {
      await pool.query(
        `UPDATE astronauts SET 
          first_name = COALESCE(?, first_name),
          last_name = ?,
          role_title = COALESCE(?, role_title),
          updated_at = CURRENT_TIMESTAMP
         WHERE astronaut_id = ?;`,
        [first_name || null, last_name !== undefined ? last_name : '', role_title || null, astronautId]
      );
    }

    const [rows] = await pool.query(`
      SELECT 
        a.astronaut_id,
        a.first_name,
        a.last_name,
        a.role_title,
        a.date_of_birth,
        m.mission_id,
        m.name AS mission_name,
        m.spacecraft,
        m.launch_date,
        m.status AS mission_status,
        DATEDIFF(CURRENT_DATE(), m.launch_date) + 1 AS current_mission_day
      FROM astronauts a
      JOIN missions m ON a.mission_id = m.mission_id
      WHERE a.astronaut_id = ?
      LIMIT 1;
    `, [astronautId]);

    res.status(200).json({
      success: true,
      message: 'Astronaut profile updated successfully.',
      astronaut: rows[0]
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMyProfile,
  getAstronautById,
  updateMyProfile
};

