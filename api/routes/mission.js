/**
 * Mission Page Routes
 * 
 * Handles mission page content management
 */

const express = require('express');
const router = express.Router();
const { asyncHandler } = require('../middleware/errorHandler');
const { authenticate } = require('../middleware/auth');
const { role } = require('../middleware/authorize');
const { getPool } = require('../config/database');

const pool = getPool();

/**
 * GET /api/mission
 * Get mission page content (public)
 */
router.get('/', asyncHandler(async (req, res) => {
  // Get main mission content (singleton - always id = 1)
  const { rows: contentRows } = await pool.query(
    'SELECT * FROM mission_content WHERE id = 1'
  );
  
  // Get mission updates ordered by display_order
  const { rows: updateRows } = await pool.query(
    'SELECT * FROM mission_updates ORDER BY display_order ASC, date DESC NULLS LAST'
  );
  
  const content = contentRows[0] || {};
  const updates = updateRows || [];
  
  res.json({
    ...content,
    updates
  });
}));

/**
 * GET /api/mission/content
 * Get mission content only (admin)
 */
router.get('/content', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM mission_content WHERE id = 1'
  );
  
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Mission content not found' });
  }
  
  res.json(rows[0]);
}));

/**
 * PUT /api/mission/content
 * Update mission content (admin only)
 */
router.put('/content', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const {
    hero_title,
    hero_subtitle,
    hero_mission_statement,
    hero_background_image_url,
    button1_text,
    button1_status_text,
    button2_text,
    button2_status_text,
    button3_text,
    button3_status_text,
    lift_off_time,
    launch_facility,
    launch_pad,
    launch_provider,
    rocket,
    lander_provider,
    lunar_lander,
    lander_image_url
  } = req.body;
  
  // Check if content exists
  const { rows: existing } = await pool.query(
    'SELECT id FROM mission_content WHERE id = 1'
  );
  
  if (existing.length === 0) {
    // Create if doesn't exist
    const { rows } = await pool.query(
      `INSERT INTO mission_content (
        id, hero_title, hero_subtitle, hero_mission_statement, hero_background_image_url,
        button1_text, button1_status_text, button2_text, button2_status_text,
        button3_text, button3_status_text, lift_off_time, launch_facility,
        launch_pad, launch_provider, rocket, lander_provider, lunar_lander, lander_image_url,
        updated_at
      ) VALUES (
        1, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, NOW()
      ) RETURNING *`,
      [
        hero_title, hero_subtitle, hero_mission_statement, hero_background_image_url,
        button1_text, button1_status_text, button2_text, button2_status_text,
        button3_text, button3_status_text, lift_off_time, launch_facility,
        launch_pad, launch_provider, rocket, lander_provider, lunar_lander, lander_image_url
      ]
    );
    return res.json(rows[0]);
  }
  
  // Update existing
  const { rows } = await pool.query(
    `UPDATE mission_content SET
      hero_title = COALESCE($1, hero_title),
      hero_subtitle = COALESCE($2, hero_subtitle),
      hero_mission_statement = COALESCE($3, hero_mission_statement),
      hero_background_image_url = COALESCE($4, hero_background_image_url),
      button1_text = COALESCE($5, button1_text),
      button1_status_text = COALESCE($6, button1_status_text),
      button2_text = COALESCE($7, button2_text),
      button2_status_text = COALESCE($8, button2_status_text),
      button3_text = COALESCE($9, button3_text),
      button3_status_text = COALESCE($10, button3_status_text),
      lift_off_time = COALESCE($11, lift_off_time),
      launch_facility = COALESCE($12, launch_facility),
      launch_pad = COALESCE($13, launch_pad),
      launch_provider = COALESCE($14, launch_provider),
      rocket = COALESCE($15, rocket),
      lander_provider = COALESCE($16, lander_provider),
      lunar_lander = COALESCE($17, lunar_lander),
      lander_image_url = COALESCE($18, lander_image_url),
      updated_at = NOW()
    WHERE id = 1
    RETURNING *`,
    [
      hero_title, hero_subtitle, hero_mission_statement, hero_background_image_url,
      button1_text, button1_status_text, button2_text, button2_status_text,
      button3_text, button3_status_text, lift_off_time, launch_facility,
      launch_pad, launch_provider, rocket, lander_provider, lunar_lander, lander_image_url
    ]
  );
  
  res.json(rows[0]);
}));

/**
 * GET /api/mission/updates
 * Get all mission updates (admin)
 */
router.get('/updates', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM mission_updates ORDER BY display_order ASC, date DESC NULLS LAST'
  );
  
  res.json(rows);
}));

/**
 * POST /api/mission/updates
 * Create a new mission update (admin only)
 */
router.post('/updates', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { title, date, description, display_order } = req.body;
  
  const { rows } = await pool.query(
    `INSERT INTO mission_updates (title, date, description, display_order, updated_at)
     VALUES ($1, $2, $3, COALESCE($4, (SELECT COALESCE(MAX(display_order), 0) + 1 FROM mission_updates)), NOW())
     RETURNING *`,
    [title, date || null, description || null, display_order || null]
  );
  
  res.status(201).json(rows[0]);
}));

/**
 * PUT /api/mission/updates/:id
 * Update a mission update (admin only)
 */
router.put('/updates/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, date, description, display_order } = req.body;
  
  const { rows } = await pool.query(
    `UPDATE mission_updates SET
      title = COALESCE($1, title),
      date = $2,
      description = COALESCE($3, description),
      display_order = COALESCE($4, display_order),
      updated_at = NOW()
    WHERE id = $5
    RETURNING *`,
    [title, date || null, description || null, display_order || null, id]
  );
  
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Mission update not found' });
  }
  
  res.json(rows[0]);
}));

/**
 * DELETE /api/mission/updates/:id
 * Delete a mission update (admin only)
 */
router.delete('/updates/:id', authenticate, role('admin'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const { rows } = await pool.query(
    'DELETE FROM mission_updates WHERE id = $1 RETURNING *',
    [id]
  );
  
  if (rows.length === 0) {
    return res.status(404).json({ error: 'Mission update not found' });
  }
  
  res.json({ message: 'Mission update deleted', data: rows[0] });
}));

module.exports = router;

