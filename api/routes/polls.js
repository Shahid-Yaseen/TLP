const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');
const pool = getPool();
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

// GET /api/polls/:id - Get poll by ID with results
router.get('/:id', asyncHandler(async (req, res) => {
    const { id } = req.params;

    // Get poll details
    const { rows: pollRows } = await pool.query(
        'SELECT * FROM polls WHERE id = $1',
        [id]
    );

    if (pollRows.length === 0) {
        return res.status(404).json({ error: 'Poll not found' });
    }

    const poll = pollRows[0];

    // Get poll options with vote counts
    const { rows: optionRows } = await pool.query(`
    SELECT 
      id,
      option_text,
      votes_count,
      display_order
    FROM poll_options
    WHERE poll_id = $1
    ORDER BY display_order ASC
  `, [id]);

    // Calculate total votes
    const totalVotes = optionRows.reduce((sum, option) => sum + option.votes_count, 0);

    // Add percentage to each option
    const optionsWithPercentage = optionRows.map(option => ({
        ...option,
        percentage: totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0
    }));

    res.json({
        ...poll,
        options: optionsWithPercentage,
        total_votes: totalVotes
    });
}));

// GET /api/polls/article/:article_id - Get poll for specific article
router.get('/article/:article_id', asyncHandler(async (req, res) => {
    const { article_id } = req.params;

    const { rows: pollRows } = await pool.query(
        'SELECT * FROM polls WHERE article_id = $1 AND is_active = true',
        [article_id]
    );

    if (pollRows.length === 0) {
        return res.status(404).json({ error: 'No active poll found for this article' });
    }

    const poll = pollRows[0];

    // Get poll options
    const { rows: optionRows } = await pool.query(`
    SELECT 
      id,
      option_text,
      votes_count,
      display_order
    FROM poll_options
    WHERE poll_id = $1
    ORDER BY display_order ASC
  `, [poll.id]);

    const totalVotes = optionRows.reduce((sum, option) => sum + option.votes_count, 0);

    const optionsWithPercentage = optionRows.map(option => ({
        ...option,
        percentage: totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0
    }));

    res.json({
        ...poll,
        options: optionsWithPercentage,
        total_votes: totalVotes
    });
}));

// POST /api/polls/:id/vote - Vote on a poll
router.post('/:id/vote', asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { option_id } = req.body;
    const user_id = req.user?.id || null;
    const ip_address = req.ip || req.connection.remoteAddress;
    const user_agent = req.headers['user-agent'];

    if (!option_id) {
        return res.status(400).json({ error: 'option_id is required' });
    }

    // Check if poll exists and is active
    const { rows: pollRows } = await pool.query(
        'SELECT * FROM polls WHERE id = $1',
        [id]
    );

    if (pollRows.length === 0) {
        return res.status(404).json({ error: 'Poll not found' });
    }

    const poll = pollRows[0];

    if (!poll.is_active) {
        return res.status(400).json({ error: 'Poll is not active' });
    }

    // Check if poll has ended
    if (poll.end_date && new Date(poll.end_date) < new Date()) {
        return res.status(400).json({ error: 'Poll has ended' });
    }

    // Check if option belongs to this poll
    const { rows: optionRows } = await pool.query(
        'SELECT * FROM poll_options WHERE id = $1 AND poll_id = $2',
        [option_id, id]
    );

    if (optionRows.length === 0) {
        return res.status(400).json({ error: 'Invalid option for this poll' });
    }

    // Check if user/IP has already voted
    const { rows: existingVotes } = await pool.query(
        'SELECT * FROM poll_votes WHERE poll_id = $1 AND (user_id = $2 OR ip_address = $3)',
        [id, user_id, ip_address]
    );

    if (existingVotes.length > 0) {
        return res.status(400).json({ error: 'You have already voted on this poll' });
    }

    // Record the vote
    await pool.query(`
    INSERT INTO poll_votes (poll_id, option_id, user_id, ip_address, user_agent)
    VALUES ($1, $2, $3, $4, $5)
  `, [id, option_id, user_id, ip_address, user_agent]);

    // Increment vote count
    await pool.query(
        'UPDATE poll_options SET votes_count = votes_count + 1 WHERE id = $1',
        [option_id]
    );

    // Get updated poll results
    const { rows: updatedOptions } = await pool.query(`
    SELECT 
      id,
      option_text,
      votes_count,
      display_order
    FROM poll_options
    WHERE poll_id = $1
    ORDER BY display_order ASC
  `, [id]);

    const totalVotes = updatedOptions.reduce((sum, option) => sum + option.votes_count, 0);

    const optionsWithPercentage = updatedOptions.map(option => ({
        ...option,
        percentage: totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0
    }));

    res.json({
        message: 'Vote recorded successfully',
        poll: {
            ...poll,
            options: optionsWithPercentage,
            total_votes: totalVotes
        }
    });
}));

// POST /api/polls - Create a new poll (admin only)
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const { question, article_id, options, is_multiple_choice, end_date } = req.body;

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
        return res.status(400).json({
            error: 'question and at least 2 options are required'
        });
    }

    // Create poll
    const { rows: pollRows } = await pool.query(`
    INSERT INTO polls (question, article_id, is_multiple_choice, end_date)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `, [question, article_id || null, is_multiple_choice || false, end_date || null]);

    const poll = pollRows[0];

    // Create poll options
    const optionPromises = options.map((optionText, index) =>
        pool.query(`
      INSERT INTO poll_options (poll_id, option_text, display_order)
      VALUES ($1, $2, $3)
      RETURNING *
    `, [poll.id, optionText, index])
    );

    const optionResults = await Promise.all(optionPromises);
    const createdOptions = optionResults.map(result => result.rows[0]);

    res.status(201).json({
        ...poll,
        options: createdOptions
    });
}));

// PATCH /api/polls/:id - Update poll (admin only)
router.patch('/:id', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { question, is_active, is_multiple_choice, end_date } = req.body;

    const updates = [];
    const values = [];
    let paramCount = 1;

    if (question !== undefined) {
        updates.push(`question = $${paramCount++}`);
        values.push(question);
    }

    if (is_active !== undefined) {
        updates.push(`is_active = $${paramCount++}`);
        values.push(is_active);
    }

    if (is_multiple_choice !== undefined) {
        updates.push(`is_multiple_choice = $${paramCount++}`);
        values.push(is_multiple_choice);
    }

    if (end_date !== undefined) {
        updates.push(`end_date = $${paramCount++}`);
        values.push(end_date);
    }

    if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(`
    UPDATE polls
    SET ${updates.join(', ')}
    WHERE id = $${paramCount}
    RETURNING *
  `, values);

    if (rows.length === 0) {
        return res.status(404).json({ error: 'Poll not found' });
    }

    res.json(rows[0]);
}));

// DELETE /api/polls/:id - Delete poll (admin only)
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const { rows } = await pool.query(
        'DELETE FROM polls WHERE id = $1 RETURNING *',
        [id]
    );

    if (rows.length === 0) {
        return res.status(404).json({ error: 'Poll not found' });
    }

    res.json({ message: 'Poll deleted successfully' });
}));

module.exports = router;
