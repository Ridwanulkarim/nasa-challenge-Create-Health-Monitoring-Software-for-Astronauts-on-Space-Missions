/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Alerts Controller: backend/src/controllers/alertController.js
 */

const { pool } = require('../config/db');

/**
 * Returns list of alerts for an astronaut.
 * GET /api/alerts/:astronautId?status=all|unread
 */
async function getAlertsForAstronaut(req, res, next) {
  try {
    const { astronautId } = req.params;
    const { status = 'all' } = req.query;

    let query = `
      SELECT 
        a.alert_id,
        a.astronaut_id,
        a.record_id,
        a.indicator_id,
        hi.name AS indicator_name,
        hi.unit AS indicator_unit,
        a.current_value,
        a.reason,
        a.severity,
        a.recommended_action,
        a.is_read,
        a.read_at,
        a.created_at
      FROM alerts a
      LEFT JOIN health_indicators hi ON a.indicator_id = hi.indicator_id
      WHERE a.astronaut_id = ?
    `;

    const params = [astronautId];

    if (status === 'unread') {
      query += ' AND a.is_read = FALSE ';
    }

    query += ' ORDER BY a.is_read ASC, a.severity DESC, a.created_at DESC;';

    const [alerts] = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: alerts.length,
      alerts
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Marks an alert as read / acknowledged onboard.
 * PATCH /api/alerts/:id/read
 */
async function markAlertRead(req, res, next) {
  try {
    const { id } = req.params;

    // Check alert existence
    const [existing] = await pool.query(`SELECT * FROM alerts WHERE alert_id = ?;`, [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: `Alert "${id}" not found.` });
    }

    // If user is astronaut, ensure it belongs to them
    if (req.user.role === 'ASTRONAUT' && existing[0].astronaut_id !== req.user.astronautId) {
      return res.status(403).json({ success: false, error: 'Forbidden. You can only acknowledge your own alerts.' });
    }

    await pool.query(`
      UPDATE alerts 
      SET is_read = TRUE, read_at = CURRENT_TIMESTAMP 
      WHERE alert_id = ?;
    `, [id]);

    res.status(200).json({
      success: true,
      message: `Alert "${id}" marked as acknowledged.`
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAlertsForAstronaut,
  markAlertRead
};
