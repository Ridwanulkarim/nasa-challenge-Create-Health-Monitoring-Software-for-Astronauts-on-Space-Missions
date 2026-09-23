/**
 * NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
 * Role-Based Access Control Middleware: backend/src/middleware/roleMiddleware.js
 * 
 * Enforces role authorization and astronaut data isolation.
 */

/**
 * Restricts route access to specified roles.
 * @param {string[]} allowedRoles Array of permitted roles, e.g. ['MISSION_CONTROL']
 */
function roleMiddleware(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required prior to role verification.'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Forbidden. Role "${req.user.role}" does not have permission to access this resource.`
      });
    }

    next();
  };
}

/**
 * Ensures astronauts can only access their own health records and profile.
 * Mission Control personnel bypass this constraint to view the fleet.
 */
function astronautOwnershipGuard(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required.'
    });
  }

  // Mission Control has fleet-wide authorization
  if (req.user.role === 'MISSION_CONTROL') {
    return next();
  }

  // Astronauts can only access their own astronautId
  const targetId = req.params.astronautId || req.params.id || req.body.astronaut_id;
  if (targetId && targetId !== req.user.astronautId) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden. Astronauts are strictly restricted to accessing their own health telemetry.'
    });
  }

  next();
}

module.exports = {
  roleMiddleware,
  astronautOwnershipGuard
};
