/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Mission Control Controller: backend/src/controllers/missionControlController.js
 */

const { pool } = require('../config/db');

/**
 * Returns fleet-wide astronaut status cards for Mission Control.
 * GET /api/mission-control/astronauts
 */
async function getFleetOverview(req, res, next) {
  try {
    const [rows] = await pool.query(`
      SELECT 
        a.astronaut_id,
        a.first_name,
        a.last_name,
        a.role_title,
        m.mission_id,
        m.name AS mission_name,
        m.spacecraft,
        COALESCE(latest_rec.overall_status, 'UNKNOWN') AS overall_status,
        latest_rec.record_date AS last_checkin_date,
        latest_rec.mission_day,
        latest_rec.evaluation_summary,
        latest_rec.updated_at AS last_updated_at,
        COUNT(alt.alert_id) AS active_alerts_count,
        SUM(CASE WHEN alt.severity = 'CRITICAL' THEN 1 ELSE 0 END) AS critical_alerts_count,
        SUM(CASE WHEN alt.severity = 'WARNING' THEN 1 ELSE 0 END) AS warning_alerts_count
      FROM astronauts a
      JOIN missions m ON a.mission_id = m.mission_id
      LEFT JOIN (
        SELECT r1.*
        FROM health_records r1
        JOIN (
          SELECT astronaut_id, MAX(record_date) AS max_date
          FROM health_records
          GROUP BY astronaut_id
        ) r2 ON r1.astronaut_id = r2.astronaut_id AND r1.record_date = r2.max_date
      ) latest_rec ON a.astronaut_id = latest_rec.astronaut_id
      LEFT JOIN alerts alt ON a.astronaut_id = alt.astronaut_id AND alt.is_read = FALSE
      GROUP BY a.astronaut_id, a.first_name, a.last_name, a.role_title, m.mission_id, m.name, m.spacecraft, latest_rec.overall_status, latest_rec.record_date, latest_rec.mission_day, latest_rec.evaluation_summary, latest_rec.updated_at
      ORDER BY 
        CASE latest_rec.overall_status 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'WARNING' THEN 2 
          WHEN 'NORMAL' THEN 3 
          ELSE 4 
        END,
        a.astronaut_id ASC;
    `);

    res.status(200).json({
      success: true,
      fleetCount: rows.length,
      fleet: rows
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns detailed health telemetry and history for a specific astronaut.
 * GET /api/mission-control/astronauts/:id/health
 */
async function getAstronautHealthDetail(req, res, next) {
  try {
    const { id } = req.params;

    // 1. Fetch astronaut metadata
    const [astroRows] = await pool.query(`
      SELECT 
        a.astronaut_id,
        a.first_name,
        a.last_name,
        a.role_title,
        m.name AS mission_name,
        m.spacecraft,
        m.launch_date,
        DATEDIFF(CURRENT_DATE(), m.launch_date) + 1 AS current_mission_day
      FROM astronauts a
      JOIN missions m ON a.mission_id = m.mission_id
      WHERE a.astronaut_id = ?;
    `, [id]);

    if (astroRows.length === 0) {
      return res.status(404).json({ success: false, error: `Astronaut "${id}" not found.` });
    }

    const astronaut = astroRows[0];

    // 2. Fetch latest telemetry
    const [latestRows] = await pool.query(`
      SELECT r.*, b.mood, b.stress_level, b.loneliness_level, rad.simulated_daily_dose_msv, rad.simulated_cumulative_dose_msv
      FROM health_records r
      LEFT JOIN behavioral_checkins b ON r.record_id = b.record_id
      LEFT JOIN radiation_records rad ON r.record_id = rad.record_id
      WHERE r.astronaut_id = ?
      ORDER BY r.record_date DESC LIMIT 1;
    `, [id]);

    let latest = latestRows[0] || null;
    let values = [];
    if (latest) {
      const [valRows] = await pool.query(`
        SELECT rv.*, hi.name, hi.unit 
        FROM health_record_values rv
        JOIN health_indicators hi ON rv.indicator_id = hi.indicator_id
        WHERE rv.record_id = ?;
      `, [latest.record_id]);
      values = valRows;
    }

    // 3. Fetch active alerts
    const [alerts] = await pool.query(`
      SELECT * FROM alerts 
      WHERE astronaut_id = ? AND is_read = FALSE 
      ORDER BY severity DESC, created_at DESC;
    `, [id]);

    res.status(200).json({
      success: true,
      astronaut,
      latestRecord: latest,
      indicators: values,
      activeAlerts: alerts
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Returns fleet-wide active alerts for Mission Control.
 * GET /api/mission-control/alerts
 */
async function getFleetAlerts(req, res, next) {
  try {
    const [alerts] = await pool.query(`
      SELECT 
        alt.alert_id,
        alt.astronaut_id,
        CONCAT(a.first_name, ' ', a.last_name) AS astronaut_name,
        a.role_title,
        alt.indicator_id,
        hi.name AS indicator_name,
        alt.current_value,
        alt.reason,
        alt.severity,
        alt.recommended_action,
        alt.is_read,
        alt.created_at
      FROM alerts alt
      JOIN astronauts a ON alt.astronaut_id = a.astronaut_id
      LEFT JOIN health_indicators hi ON alt.indicator_id = hi.indicator_id
      WHERE alt.is_read = FALSE
      ORDER BY 
        CASE alt.severity 
          WHEN 'CRITICAL' THEN 1 
          WHEN 'WARNING' THEN 2 
          ELSE 3 
        END,
        alt.created_at DESC;
    `);

    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getFleetOverview,
  getAstronautHealthDetail,
  getFleetAlerts
};
