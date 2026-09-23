-- ==============================================================================
-- NASA Space Apps Challenge 2026: Astronaut Health Monitoring System
-- Database Schema: astronaut_health_db
-- 
-- IMPORTANT NOTICE:
-- All numerical threshold values, monitoring rules, and physiological ranges
-- configured in this schema are illustrative demonstration values for software
-- prototyping. They are NOT official NASA medical limits or diagnostic standards.
-- Monitored indicators are informed by NASA Human Research Program literature.
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `astronaut_health_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `astronaut_health_db`;

-- ------------------------------------------------------------------------------
-- 1. Missions Table
-- Tracks spaceflight missions and launch dates to calculate elapsed mission days.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `missions` (
  `mission_id` VARCHAR(32) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `spacecraft` VARCHAR(100) NOT NULL,
  `launch_date` DATE NOT NULL,
  `status` ENUM('ACTIVE', 'COMPLETED', 'PLANNED') NOT NULL DEFAULT 'ACTIVE',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`mission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 2. Astronauts Table
-- Crew member profiles assigned to specific space missions.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `astronauts` (
  `astronaut_id` VARCHAR(32) NOT NULL,
  `mission_id` VARCHAR(32) NOT NULL,
  `first_name` VARCHAR(64) NOT NULL,
  `last_name` VARCHAR(64) NOT NULL,
  `role_title` VARCHAR(64) NOT NULL,
  `date_of_birth` DATE NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`astronaut_id`),
  KEY `fk_astronauts_mission` (`mission_id`),
  CONSTRAINT `fk_astronauts_mission` FOREIGN KEY (`mission_id`) REFERENCES `missions` (`mission_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 3. Users Table
-- Authentication credentials and Role-Based Access Control (RBAC).
-- Passwords stored exclusively as bcrypt hashes (never plain text).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `user_id` VARCHAR(36) NOT NULL,
  `username` VARCHAR(64) NOT NULL,
  `email` VARCHAR(128) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('ASTRONAUT', 'MISSION_CONTROL') NOT NULL,
  `astronaut_id` VARCHAR(32) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `uq_users_username` (`username`),
  UNIQUE KEY `uq_users_email` (`email`),
  KEY `fk_users_astronaut` (`astronaut_id`),
  CONSTRAINT `fk_users_astronaut` FOREIGN KEY (`astronaut_id`) REFERENCES `astronauts` (`astronaut_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 4. Health Indicators Catalog Table
-- Definitive catalog of monitored health metrics with physical plausibility ranges.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `health_indicators` (
  `indicator_id` VARCHAR(32) NOT NULL,
  `code` VARCHAR(32) NOT NULL,
  `name` VARCHAR(64) NOT NULL,
  `category` ENUM('PHYSIOLOGICAL', 'LIFESTYLE', 'BEHAVIORAL', 'ENVIRONMENTAL') NOT NULL,
  `unit` VARCHAR(16) NOT NULL,
  `valid_min` DECIMAL(8,2) NOT NULL COMMENT 'Physical lower bound for input validation',
  `valid_max` DECIMAL(8,2) NOT NULL COMMENT 'Physical upper bound for input validation',
  `description` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`indicator_id`),
  UNIQUE KEY `uq_indicators_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 5. Master Daily Health Records Table
-- Exactly one health record per astronaut per calendar date (UTC).
-- Subsequent check-in submissions on the same date update this record.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `health_records` (
  `record_id` VARCHAR(64) NOT NULL,
  `astronaut_id` VARCHAR(32) NOT NULL,
  `record_date` DATE NOT NULL,
  `mission_day` INT NOT NULL,
  `overall_status` ENUM('NORMAL', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'NORMAL',
  `evaluation_summary` TEXT DEFAULT NULL,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`record_id`),
  UNIQUE KEY `uq_astronaut_record_date` (`astronaut_id`, `record_date`),
  KEY `idx_records_astronaut_date` (`astronaut_id`, `record_date`),
  CONSTRAINT `fk_records_astronaut` FOREIGN KEY (`astronaut_id`) REFERENCES `astronauts` (`astronaut_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 6. Health Record Values Table
-- Normalized measurements for each indicator per daily health record.
-- Stores evaluated baseline comparison, percentage deviation, and status.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `health_record_values` (
  `value_id` VARCHAR(64) NOT NULL,
  `record_id` VARCHAR(64) NOT NULL,
  `indicator_id` VARCHAR(32) NOT NULL,
  `value_numeric` DECIMAL(8,2) NOT NULL,
  `status` ENUM('NORMAL', 'WARNING', 'CRITICAL') NOT NULL DEFAULT 'NORMAL',
  `baseline_value` DECIMAL(8,2) DEFAULT NULL COMMENT 'Personal 14-day rolling average',
  `deviation_pct` DECIMAL(6,2) DEFAULT NULL COMMENT 'Percentage deviation from personal baseline',
  `rule_triggered_id` VARCHAR(36) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`value_id`),
  UNIQUE KEY `uq_record_indicator` (`record_id`, `indicator_id`),
  KEY `fk_values_indicator` (`indicator_id`),
  CONSTRAINT `fk_values_record` FOREIGN KEY (`record_id`) REFERENCES `health_records` (`record_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_values_indicator` FOREIGN KEY (`indicator_id`) REFERENCES `health_indicators` (`indicator_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 7. Health Rules Table
-- Centralized repository of configurable health evaluation rules.
-- NOTE: Thresholds are demonstration parameters, not official NASA medical limits.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `health_rules` (
  `rule_id` VARCHAR(36) NOT NULL,
  `indicator_id` VARCHAR(32) NOT NULL,
  `rule_type` ENUM('FIXED_THRESHOLD', 'BASELINE_DEVIATION', 'CONSECUTIVE_TREND') NOT NULL,
  `comparison` ENUM('<', '<=', '>', '>=', 'BETWEEN', 'OUTSIDE') NOT NULL,
  `threshold_min` DECIMAL(8,2) DEFAULT NULL,
  `threshold_max` DECIMAL(8,2) DEFAULT NULL,
  `deviation_percentage` DECIMAL(6,2) DEFAULT NULL,
  `consecutive_days` INT NOT NULL DEFAULT 1,
  `severity` ENUM('WARNING', 'CRITICAL') NOT NULL,
  `recommended_action` TEXT NOT NULL,
  `enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `description` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`rule_id`),
  KEY `fk_rules_indicator` (`indicator_id`),
  CONSTRAINT `fk_rules_indicator` FOREIGN KEY (`indicator_id`) REFERENCES `health_indicators` (`indicator_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 8. Alerts Table
-- Actionable onboard telemetry alerts generated when health rules trigger.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `alerts` (
  `alert_id` VARCHAR(64) NOT NULL,
  `astronaut_id` VARCHAR(32) NOT NULL,
  `record_id` VARCHAR(64) NOT NULL,
  `indicator_id` VARCHAR(32) DEFAULT NULL,
  `current_value` VARCHAR(64) NOT NULL,
  `reason` TEXT NOT NULL,
  `severity` ENUM('INFO', 'WARNING', 'CRITICAL') NOT NULL,
  `recommended_action` TEXT NOT NULL,
  `is_read` BOOLEAN NOT NULL DEFAULT FALSE,
  `read_at` DATETIME DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`alert_id`),
  KEY `fk_alerts_astronaut` (`astronaut_id`),
  KEY `fk_alerts_record` (`record_id`),
  KEY `fk_alerts_indicator` (`indicator_id`),
  CONSTRAINT `fk_alerts_astronaut` FOREIGN KEY (`astronaut_id`) REFERENCES `astronauts` (`astronaut_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_alerts_record` FOREIGN KEY (`record_id`) REFERENCES `health_records` (`record_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_alerts_indicator` FOREIGN KEY (`indicator_id`) REFERENCES `health_indicators` (`indicator_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 9. Symptoms Catalog Table
-- Standard catalog of astronaut-reported symptoms during spaceflight.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `symptoms_catalog` (
  `symptom_id` VARCHAR(32) NOT NULL,
  `code` VARCHAR(32) NOT NULL,
  `name` VARCHAR(64) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`symptom_id`),
  UNIQUE KEY `uq_symptoms_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 10. Record Symptoms Junction Table
-- Links user-reported symptoms to specific daily health records.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `record_symptoms` (
  `id` VARCHAR(64) NOT NULL,
  `record_id` VARCHAR(64) NOT NULL,
  `symptom_id` VARCHAR(32) NOT NULL,
  `severity_level` ENUM('MILD', 'MODERATE', 'SEVERE') NOT NULL,
  `notes` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_record_symptom` (`record_id`, `symptom_id`),
  KEY `fk_record_symptoms_catalog` (`symptom_id`),
  CONSTRAINT `fk_record_symptoms_record` FOREIGN KEY (`record_id`) REFERENCES `health_records` (`record_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_record_symptoms_catalog` FOREIGN KEY (`symptom_id`) REFERENCES `symptoms_catalog` (`symptom_id`) ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 11. Behavioral Check-ins Table
-- Tracks psychological, behavioral, and cognitive health indicators.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `behavioral_checkins` (
  `checkin_id` VARCHAR(64) NOT NULL,
  `record_id` VARCHAR(64) NOT NULL,
  `mood` ENUM('VERY_GOOD', 'GOOD', 'NEUTRAL', 'LOW', 'VERY_LOW') NOT NULL,
  `stress_level` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
  `loneliness_level` ENUM('NOT_AT_ALL', 'SLIGHTLY', 'MODERATE', 'HIGH') NOT NULL,
  `crew_connection` ENUM('STRONG', 'MODERATE', 'WEAK', 'DISCONNECTED') NOT NULL,
  `concentration_difficulty` BOOLEAN NOT NULL DEFAULT FALSE,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`checkin_id`),
  UNIQUE KEY `uq_behavioral_record` (`record_id`),
  CONSTRAINT `fk_behavioral_record` FOREIGN KEY (`record_id`) REFERENCES `health_records` (`record_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 12. Radiation Records Table
-- Simulated dosimeter readings tracking cosmic and solar particle radiation.
-- Explicitly labeled as simulated demonstration data.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `radiation_records` (
  `radiation_id` VARCHAR(64) NOT NULL,
  `record_id` VARCHAR(64) NOT NULL,
  `simulated_daily_dose_msv` DECIMAL(6,3) NOT NULL,
  `simulated_cumulative_dose_msv` DECIMAL(8,3) NOT NULL,
  `is_simulated` BOOLEAN NOT NULL DEFAULT TRUE,
  `notes` VARCHAR(255) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`radiation_id`),
  UNIQUE KEY `uq_radiation_record` (`record_id`),
  CONSTRAINT `fk_radiation_record` FOREIGN KEY (`record_id`) REFERENCES `health_records` (`record_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------------------------
-- 13. Audit Logs Table
-- System integrity and access logging.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `log_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) DEFAULT NULL,
  `action` VARCHAR(64) NOT NULL,
  `resource` VARCHAR(64) NOT NULL,
  `details` JSON DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `fk_audit_user` (`user_id`),
  CONSTRAINT `fk_audit_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
